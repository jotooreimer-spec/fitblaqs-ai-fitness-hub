import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Activity, Flame, MapPin, Droplets } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

interface Props {
  isGerman: boolean;
  userId: string;
}

const DashboardStats = ({ isGerman, userId }: Props) => {
  const [workoutStats, setWorkoutStats] = useState<any[]>([]);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [todayCalories, setTodayCalories] = useState(0);
  const [todayProtein, setTodayProtein] = useState(0);
  const [todayWater, setTodayWater] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [userWeight, setUserWeight] = useState(70);

  useEffect(() => {
    if (userId) {
      loadStats();
    }
  }, [userId]);

  const loadStats = async () => {
    const last7Days = subDays(new Date(), 7);
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    // Get user weight
    const { data: profile } = await supabase
      .from("profiles")
      .select("weight")
      .eq("user_id", userId)
      .single();

    if (profile?.weight) {
      setUserWeight(profile.weight);
    }

    // Load workout logs for bar chart
    const { data: workouts } = await supabase
      .from("workout_logs")
      .select("*")
      .eq("user_id", userId)
      .gte("completed_at", last7Days.toISOString())
      .order("completed_at", { ascending: true });

    if (workouts) {
      const grouped = workouts.reduce((acc: any, log: any) => {
        const day = format(new Date(log.completed_at), "dd.MM");
        if (!acc[day]) {
          acc[day] = { day, count: 0 };
        }
        acc[day].count += log.sets * log.reps;
        return acc;
      }, {});

      setWorkoutStats(Object.values(grouped));
      setTotalWorkouts(workouts.length);
    }

    // Load today's nutrition for pie chart calculation
    const { data: todayNutrition } = await supabase
      .from("nutrition_logs")
      .select("*")
      .eq("user_id", userId)
      .gte("completed_at", todayStart.toISOString())
      .lte("completed_at", todayEnd.toISOString());

    if (todayNutrition && todayNutrition.length > 0) {
      const totalCals = todayNutrition.reduce((sum, log) => sum + (log.calories || 0), 0);
      const totalProt = todayNutrition.reduce((sum, log) => sum + (log.protein || 0), 0);
      // Water is calculated from carbs field for now (used as water in supplements)
      const totalWat = todayNutrition.reduce((sum, log) => sum + (log.carbs || 0), 0);
      
      setTodayCalories(totalCals);
      setTodayProtein(totalProt);
      setTodayWater(totalWat);
    } else {
      // Calculate based on weight if no nutrition logs
      // Base calories: 25-30 kcal per kg body weight
      setTodayCalories(Math.round(userWeight * 28));
      setTodayProtein(Math.round(userWeight * 1.6)); // 1.6g protein per kg
      setTodayWater(Math.round(userWeight * 35)); // 35ml per kg
    }

    // Load jogging logs
    const { data: jogging } = await supabase
      .from("jogging_logs")
      .select("distance")
      .eq("user_id", userId);

    if (jogging) {
      const total = jogging.reduce((sum: number, log: any) => sum + parseFloat(log.distance), 0);
      setTotalDistance(total);
    }
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'];

  const pieData = [
    { name: isGerman ? 'Kalorien' : 'Calories', value: todayCalories, unit: 'kcal' },
    { name: 'Protein', value: todayProtein, unit: 'g' },
    { name: isGerman ? 'Wasser' : 'Water', value: todayWater, unit: 'ml' },
  ];

  return (
    <div className="space-y-6 mb-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="gradient-card card-shadow border-white/10 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">
              {isGerman ? "Workouts" : "Workouts"}
            </span>
          </div>
          <div className="text-3xl font-bold">{totalWorkouts}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {isGerman ? "Letzte 7 Tage" : "Last 7 days"}
          </div>
        </Card>

        <Card className="gradient-card card-shadow border-white/10 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Flame className="w-5 h-5 text-orange-400" />
            <span className="text-sm text-muted-foreground">
              {isGerman ? "Kalorien" : "Calories"}
            </span>
          </div>
          <div className="text-3xl font-bold">{todayCalories.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {isGerman ? "Heute" : "Today"}
          </div>
        </Card>

        <Card className="gradient-card card-shadow border-white/10 p-6">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-muted-foreground">
              {isGerman ? "Distanz" : "Distance"}
            </span>
          </div>
          <div className="text-3xl font-bold">{totalDistance.toFixed(1)} km</div>
          <div className="text-xs text-muted-foreground mt-1">
            {isGerman ? "Total" : "Total"}
          </div>
        </Card>

        <Card className="gradient-card card-shadow border-white/10 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Droplets className="w-5 h-5 text-cyan-400" />
            <span className="text-sm text-muted-foreground">
              {isGerman ? "Wasser" : "Water"}
            </span>
          </div>
          <div className="text-3xl font-bold">{todayWater} ml</div>
          <div className="text-xs text-muted-foreground mt-1">
            {isGerman ? "Heute" : "Today"}
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Calories & Protein Pie Chart */}
        <Card className="gradient-card card-shadow border-white/10 p-6">
          <h3 className="text-lg font-bold mb-4">
            {isGerman ? "Kalorien & Protein" : "Calories & Protein"}
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({ name, value, unit }) => `${value}${unit}`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px"
                }}
                formatter={(value: number, name: string, props: any) => [`${value} ${props.payload.unit}`, name]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Workout Activity Bar Chart */}
        <Card className="gradient-card card-shadow border-white/10 p-6">
          <h3 className="text-lg font-bold mb-4">
            {isGerman ? "Workout Aktivität" : "Workout Activity"}
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={workoutStats.length > 0 ? workoutStats : [{ day: format(new Date(), "dd.MM"), count: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="day" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px"
                }}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};

export default DashboardStats;