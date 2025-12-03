import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, isSameDay } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

interface DayData {
  workouts: any[];
  nutrition: any[];
  jogging: any[];
  weight: any[];
}

const CalendarPage = () => {
  const navigate = useNavigate();
  const [isGerman, setIsGerman] = useState(true);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [userId, setUserId] = useState<string>("");
  const [selectedDayData, setSelectedDayData] = useState<DayData>({ workouts: [], nutrition: [], jogging: [], weight: [] });
  const [monthStats, setMonthStats] = useState({ weight: 0, caloriesBurned: 0 });
  const [weeklyChartData, setWeeklyChartData] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate("/login");
        return;
      }

      const metadata = session.user.user_metadata;
      setIsGerman(metadata.language === "de");
      setUserId(session.user.id);

      loadMonthData(session.user.id, new Date());
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (userId && date) {
      loadDayData(date);
      loadMonthData(userId, date);
    }
  }, [date, userId]);

  const loadMonthData = async (uid: string, selectedDate: Date) => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);

    // Get weight for the month (last measurement)
    const { data: weightData } = await supabase
      .from("weight_logs")
      .select("weight")
      .eq("user_id", uid)
      .gte("measured_at", monthStart.toISOString())
      .lte("measured_at", monthEnd.toISOString())
      .order("measured_at", { ascending: false })
      .limit(1);

    // Get total calories burned (from workouts and jogging)
    const { data: workoutData } = await supabase
      .from("workout_logs")
      .select("*")
      .eq("user_id", uid)
      .gte("completed_at", monthStart.toISOString())
      .lte("completed_at", monthEnd.toISOString());

    const { data: joggingData } = await supabase
      .from("jogging_logs")
      .select("calories, duration, completed_at")
      .eq("user_id", uid)
      .gte("completed_at", monthStart.toISOString())
      .lte("completed_at", monthEnd.toISOString());

    const joggingCalories = joggingData?.reduce((sum, j) => sum + (j.calories || 0), 0) || 0;
    // Estimate workout calories: ~5 cal per minute of exercise
    const workoutCalories = workoutData?.reduce((sum, w) => sum + (w.sets * w.reps * 2), 0) || 0;

    setMonthStats({
      weight: weightData?.[0]?.weight || 0,
      caloriesBurned: joggingCalories + workoutCalories
    });

    // Build weekly chart data
    const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    const chartData = days.map((day, index) => {
      const dayWorkouts = workoutData?.filter(w => {
        const d = new Date(w.completed_at);
        return d.getDay() === (index === 6 ? 0 : index + 1);
      }) || [];
      const dayJogging = joggingData?.filter(j => {
        const d = new Date(j.completed_at);
        return d.getDay() === (index === 6 ? 0 : index + 1);
      }) || [];
      
      const totalMinutes = dayJogging.reduce((sum, j) => sum + (j.duration || 0), 0) + 
                          dayWorkouts.length * 30; // Estimate 30 min per workout

      return { day, minutes: totalMinutes };
    });

    setWeeklyChartData(chartData);
  };

  const loadDayData = async (selectedDate: Date) => {
    if (!userId) return;

    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);

    const [workoutsRes, nutritionRes, joggingRes, weightRes] = await Promise.all([
      supabase.from("workout_logs").select("*, exercises(name_de, name_en, category)")
        .eq("user_id", userId)
        .gte("completed_at", dayStart.toISOString())
        .lte("completed_at", dayEnd.toISOString()),
      supabase.from("nutrition_logs").select("*")
        .eq("user_id", userId)
        .gte("completed_at", dayStart.toISOString())
        .lte("completed_at", dayEnd.toISOString()),
      supabase.from("jogging_logs").select("*")
        .eq("user_id", userId)
        .gte("completed_at", dayStart.toISOString())
        .lte("completed_at", dayEnd.toISOString()),
      supabase.from("weight_logs").select("*")
        .eq("user_id", userId)
        .gte("measured_at", dayStart.toISOString())
        .lte("measured_at", dayEnd.toISOString())
    ]);

    setSelectedDayData({
      workouts: workoutsRes.data || [],
      nutrition: nutritionRes.data || [],
      jogging: joggingRes.data || [],
      weight: weightRes.data || []
    });
  };

  const deleteEntry = async (table: "workout_logs" | "nutrition_logs" | "jogging_logs" | "weight_logs", id: string) => {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (!error && date) {
      loadDayData(date);
      loadMonthData(userId, date);
    }
  };

  const hasData = selectedDayData.workouts.length > 0 || 
                  selectedDayData.nutrition.length > 0 || 
                  selectedDayData.jogging.length > 0 ||
                  selectedDayData.weight.length > 0;

  return (
    <div className="min-h-screen pb-24 gradient-male">
      <div className="max-w-screen-xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {isGerman ? "Trainingskalender" : "Workout Calendar"}
          </h1>
          <p className="text-muted-foreground">
            {isGerman ? "Alle deine Aktivitäten" : "All your activities"}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Side - Calendar + Month Stats */}
          <div className="space-y-6">
            <Card className="gradient-card card-shadow border-white/10 p-6">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md"
              />
            </Card>

            {/* Month Stats */}
            <Card className="gradient-card card-shadow border-white/10 p-6">
              <h3 className="text-lg font-bold mb-4">
                {isGerman ? "Monatsübersicht" : "Monthly Overview"}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">
                    {isGerman ? "Gewicht" : "Weight"}
                  </div>
                  <div className="text-2xl font-bold">
                    {monthStats.weight ? `${monthStats.weight} kg` : "N/A"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    {isGerman ? "Kalorien verbrannt" : "Calories Burned"}
                  </div>
                  <div className="text-2xl font-bold">{monthStats.caloriesBurned}</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Side - Day Data + Performance */}
          <div className="space-y-6">
            {/* Selected Day Data */}
            <Card className="gradient-card card-shadow border-white/10 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">
                  {date ? format(date, "dd.MM.yyyy") : ""}
                </h3>
              </div>

              {!hasData ? (
                <p className="text-muted-foreground text-center py-8">
                  {isGerman ? "Keine Einträge für diesen Tag" : "No entries for this day"}
                </p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {/* Workouts */}
                  {selectedDayData.workouts.map((w) => (
                    <div key={w.id} className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                      <div>
                        <div className="font-semibold text-blue-400">
                          {isGerman ? "Training" : "Workout"}
                        </div>
                        <div className="text-sm">
                          {isGerman ? w.exercises?.name_de : w.exercises?.name_en}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Sets: {w.sets} | Reps: {w.reps} | {w.weight || 0} {w.unit || 'kg'}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteEntry("workout_logs", w.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}

                  {/* Nutrition */}
                  {selectedDayData.nutrition.map((n) => (
                    <div key={n.id} className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                      <div>
                        <div className="font-semibold text-green-400">
                          {isGerman ? "Ernährung" : "Nutrition"}
                        </div>
                        <div className="text-sm">{n.food_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {n.calories} kcal | Protein: {n.protein || 0}g
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteEntry("nutrition_logs", n.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}

                  {/* Jogging */}
                  {selectedDayData.jogging.map((j) => (
                    <div key={j.id} className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                      <div>
                        <div className="font-semibold text-purple-400">Jogging</div>
                        <div className="text-sm">{j.distance} km | {j.duration} min</div>
                        <div className="text-xs text-muted-foreground">
                          {j.calories || 0} kcal
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteEntry("jogging_logs", j.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}

                  {/* Weight */}
                  {selectedDayData.weight.map((w) => (
                    <div key={w.id} className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                      <div>
                        <div className="font-semibold text-orange-400">
                          {isGerman ? "Gewicht" : "Weight"}
                        </div>
                        <div className="text-sm">{w.weight} kg</div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteEntry("weight_logs", w.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Performance Bar Chart */}
            <Card className="gradient-card card-shadow border-white/10 p-6">
              <h3 className="text-lg font-bold mb-4">Performance</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyChartData}>
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center text-sm text-muted-foreground mt-2">
                {isGerman ? "Trainingszeit (Minuten)" : "Training Time (Minutes)"}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default CalendarPage;