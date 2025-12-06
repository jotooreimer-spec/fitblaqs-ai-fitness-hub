import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { ChallengesBox } from "@/components/ChallengesBox";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import performanceBg from "@/assets/performance-bg.png";

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
  const [userWeight, setUserWeight] = useState(0);
  const [selectedDayData, setSelectedDayData] = useState<DayData>({ workouts: [], nutrition: [], jogging: [], weight: [] });
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

      // Load user weight for challenges
      const { data: profile } = await supabase
        .from("profiles")
        .select("weight")
        .eq("user_id", session.user.id)
        .single();
      
      if (profile?.weight) {
        setUserWeight(profile.weight);
      }

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

    // Build weekly chart data with hours (0-10 scale)
    const days = isGerman ? ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const chartData = days.map((day, index) => {
      const dayWorkouts = workoutData?.filter(w => {
        const d = new Date(w.completed_at);
        return d.getDay() === (index === 6 ? 0 : index + 1);
      }) || [];
      const dayJogging = joggingData?.filter(j => {
        const d = new Date(j.completed_at);
        return d.getDay() === (index === 6 ? 0 : index + 1);
      }) || [];
      
      const joggingHours = dayJogging.reduce((sum, j) => sum + ((j.duration || 0) / 60), 0);
      const workoutHours = dayWorkouts.length * 0.5;

      return { day, hours: Math.min(joggingHours + workoutHours, 10) };
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
      supabase.from("workout_logs").select("*, exercises(name_de, name_en, category)").eq("user_id", userId).gte("completed_at", dayStart.toISOString()).lte("completed_at", dayEnd.toISOString()),
      supabase.from("nutrition_logs").select("*").eq("user_id", userId).gte("completed_at", dayStart.toISOString()).lte("completed_at", dayEnd.toISOString()),
      supabase.from("jogging_logs").select("*").eq("user_id", userId).gte("completed_at", dayStart.toISOString()).lte("completed_at", dayEnd.toISOString()),
      supabase.from("weight_logs").select("*").eq("user_id", userId).gte("measured_at", dayStart.toISOString()).lte("measured_at", dayEnd.toISOString())
    ]);

    setSelectedDayData({
      workouts: workoutsRes.data || [],
      nutrition: nutritionRes.data || [],
      jogging: joggingRes.data || [],
      weight: weightRes.data || []
    });
  };

  const hasData = selectedDayData.workouts.length > 0 || selectedDayData.nutrition.length > 0 || selectedDayData.jogging.length > 0 || selectedDayData.weight.length > 0;

  // Calculate total training duration for selected day
  const totalDuration = selectedDayData.jogging.reduce((sum, j) => sum + (j.duration || 0), 0) + (selectedDayData.workouts.length * 30);

  return (
    <div className="min-h-screen pb-24 relative">
      {/* Background */}
      <div className="fixed inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${performanceBg})` }} />
      <div className="fixed inset-0 bg-black/60" />

      <div className="relative z-10 max-w-screen-xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-white">Performance</h1>
          <p className="text-white/60">{isGerman ? "Dein Tag und Trainingsdauer" : "Your day and training duration"}</p>
        </div>

        {/* Challenges Box at top */}
        {userId && (
          <div className="mb-6">
            <ChallengesBox isGerman={isGerman} userId={userId} currentWeight={userWeight} />
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Side */}
          <div className="space-y-6">
            <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-6">
              <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md" />
            </Card>

            {/* Performance Bar Chart - 0-10 hours */}
            <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-4">
              <h3 className="text-lg font-bold mb-4 text-white">Performance</h3>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyChartData}>
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} formatter={(value: number) => [`${value.toFixed(1)}h`, isGerman ? 'Stunden' : 'Hours']} />
                    <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center text-xs text-white/60 mt-2">{isGerman ? "Trainingsdauer (Stunden)" : "Training Duration (Hours)"}</div>
            </Card>
          </div>

          {/* Right Side - Dailyplaner (read-only, no delete) */}
          <div className="space-y-6">
            <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">Dailyplaner</h3>
                <div className="text-right">
                  <span className="text-sm text-white/60">{date ? format(date, "dd.MM.yyyy") : ""}</span>
                  {totalDuration > 0 && (
                    <div className="text-xs text-primary mt-1">
                      {isGerman ? "Dauer:" : "Duration:"} {totalDuration} min
                    </div>
                  )}
                </div>
              </div>

              {!hasData ? (
                <p className="text-white/60 text-center py-8">{isGerman ? "Keine Einträge für diesen Tag" : "No entries for this day"}</p>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {/* Workouts - Category, Sets, Reps, KG/LBS, Kcal */}
                  {selectedDayData.workouts.map((w) => (
                    <div key={w.id} className="p-3 bg-white/5 rounded-lg">
                      <div className="font-semibold text-blue-400">{isGerman ? "Training" : "Workout"}</div>
                      <div className="text-sm text-white">{w.notes || (isGerman ? w.exercises?.name_de : w.exercises?.name_en)}</div>
                      <div className="text-xs text-white/60 mt-1">
                        {isGerman ? "Kategorie" : "Category"}: {w.exercises?.category} | Sets: {w.sets} | Reps: {w.reps} | {w.weight || 0} {w.unit || 'kg'} | {(w.sets * w.reps * 2)} kcal
                      </div>
                    </div>
                  ))}

                  {/* Nutrition */}
                  {selectedDayData.nutrition.map((n) => (
                    <div key={n.id} className="p-3 bg-white/5 rounded-lg">
                      <div className="font-semibold text-green-400">{isGerman ? "Ernährung" : "Nutrition"}</div>
                      <div className="text-sm text-white">{n.food_name}</div>
                      <div className="text-xs text-white/60 mt-1">{n.calories} kcal | Protein: {n.protein || 0}g</div>
                    </div>
                  ))}

                  {/* Jogging */}
                  {selectedDayData.jogging.map((j) => (
                    <div key={j.id} className="p-3 bg-white/5 rounded-lg">
                      <div className="font-semibold text-purple-400">Jogging</div>
                      <div className="text-sm text-white">{j.distance} km | {j.duration} min</div>
                      <div className="text-xs text-white/60 mt-1">{j.calories || 0} kcal</div>
                    </div>
                  ))}

                  {/* Weight */}
                  {selectedDayData.weight.map((w) => (
                    <div key={w.id} className="p-3 bg-white/5 rounded-lg">
                      <div className="font-semibold text-orange-400">{isGerman ? "Gewicht" : "Weight"}</div>
                      <div className="text-sm text-white">{w.weight} kg</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default CalendarPage;