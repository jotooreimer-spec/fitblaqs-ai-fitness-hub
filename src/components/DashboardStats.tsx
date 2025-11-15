import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Activity, TrendingUp, TrendingDown, Flame, Utensils, MapPin } from "lucide-react";
import { format, subDays } from "date-fns";

interface Props {
  isGerman: boolean;
  userId: string;
}

const DashboardStats = ({ isGerman, userId }: Props) => {
  const [workoutStats, setWorkoutStats] = useState<any[]>([]);
  const [weightStats, setWeightStats] = useState<any[]>([]);
  const [nutritionStats, setNutritionStats] = useState<any[]>([]);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [totalCalories, setTotalCalories] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [weightChange, setWeightChange] = useState<number | null>(null);

  useEffect(() => {
    if (userId) {
      loadStats();
    }
  }, [userId]);

  const loadStats = async () => {
    const last7Days = subDays(new Date(), 7);

    // Load workout logs
    const { data: workouts } = await supabase
      .from("workout_logs")
      .select("*")
      .eq("user_id", userId)
      .gte("completed_at", last7Days.toISOString())
      .order("completed_at", { ascending: true });

    if (workouts) {
      // Group by day
      const grouped = workouts.reduce((acc: any, log: any) => {
        const day = format(new Date(log.completed_at), "dd.MM");
        if (!acc[day]) {
          acc[day] = { day, count: 0, totalWeight: 0 };
        }
        acc[day].count += log.sets * log.reps;
        acc[day].totalWeight += (log.weight || 0) * log.sets * log.reps;
        return acc;
      }, {});

      setWorkoutStats(Object.values(grouped));
      setTotalWorkouts(workouts.length);
    }

    // Load weight logs
    const { data: weights } = await supabase
      .from("weight_logs")
      .select("*")
      .eq("user_id", userId)
      .order("measured_at", { ascending: true })
      .limit(10);

    if (weights && weights.length > 0) {
      const chartData = weights.map((log: any) => ({
        date: format(new Date(log.measured_at), "dd.MM"),
        weight: parseFloat(log.weight)
      }));
      setWeightStats(chartData);

      if (weights.length >= 2) {
        const latest = parseFloat(weights[weights.length - 1].weight.toString());
        const previous = parseFloat(weights[0].weight.toString());
        setWeightChange(latest - previous);
      }
    }

    // Load nutrition logs
    const { data: nutrition } = await supabase
      .from("nutrition_logs")
      .select("*")
      .eq("user_id", userId)
      .gte("completed_at", last7Days.toISOString());

    if (nutrition) {
      const grouped = nutrition.reduce((acc: any, log: any) => {
        const day = format(new Date(log.completed_at), "dd.MM");
        if (!acc[day]) {
          acc[day] = { day, calories: 0, protein: 0 };
        }
        acc[day].calories += log.calories;
        acc[day].protein += log.protein || 0;
        return acc;
      }, {});

      setNutritionStats(Object.values(grouped));
      
      const total = nutrition.reduce((sum: number, log: any) => sum + log.calories, 0);
      setTotalCalories(total);
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

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

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
          <div className="text-3xl font-bold">{totalCalories.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {isGerman ? "Letzte 7 Tage" : "Last 7 days"}
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
            {weightChange !== null && weightChange < 0 ? (
              <TrendingDown className="w-5 h-5 text-green-400" />
            ) : (
              <TrendingUp className="w-5 h-5 text-red-400" />
            )}
            <span className="text-sm text-muted-foreground">
              {isGerman ? "Gewicht" : "Weight"}
            </span>
          </div>
          <div className="text-3xl font-bold">
            {weightChange !== null ? (
              <>
                {weightChange > 0 ? "+" : ""}
                {weightChange.toFixed(1)} kg
              </>
            ) : (
              "N/A"
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {isGerman ? "Veränderung" : "Change"}
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Workout Activity Chart */}
        {workoutStats.length > 0 && (
          <Card className="gradient-card card-shadow border-white/10 p-6">
            <h3 className="text-lg font-bold mb-4">
              {isGerman ? "Workout-Aktivität" : "Workout Activity"}
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={workoutStats}>
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
        )}

        {/* Weight Progress Chart */}
        {weightStats.length > 0 && (
          <Card className="gradient-card card-shadow border-white/10 p-6">
            <h3 className="text-lg font-bold mb-4">
              {isGerman ? "Gewichtsverlauf" : "Weight Progress"}
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weightStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  domain={['dataMin - 2', 'dataMax + 2']}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--chart-2))", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Nutrition Chart */}
        {nutritionStats.length > 0 && (
          <Card className="gradient-card card-shadow border-white/10 p-6 md:col-span-2">
            <h3 className="text-lg font-bold mb-4">
              {isGerman ? "Kalorien & Protein" : "Calories & Protein"}
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={nutritionStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="day" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  yAxisId="left"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
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
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="calories" 
                  stroke="hsl(var(--chart-3))" 
                  strokeWidth={2}
                  name={isGerman ? "Kalorien" : "Calories"}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="protein" 
                  stroke="hsl(var(--chart-4))" 
                  strokeWidth={2}
                  name="Protein (g)"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DashboardStats;
