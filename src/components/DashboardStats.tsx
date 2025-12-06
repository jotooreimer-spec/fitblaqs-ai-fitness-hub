import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Activity, Flame, MapPin, Droplets } from "lucide-react";
import { format, subDays, startOfDay, endOfDay, startOfMonth, getDaysInMonth } from "date-fns";

interface Props {
  isGerman: boolean;
  userId: string;
}

const DashboardStats = ({ isGerman, userId }: Props) => {
  const [monthlyWorkoutData, setMonthlyWorkoutData] = useState<any[]>([]);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [todayCalories, setTodayCalories] = useState(0);
  const [todayProtein, setTodayProtein] = useState(0);
  const [todayWater, setTodayWater] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [userWeight, setUserWeight] = useState(70);
  const [nutritionBreakdown, setNutritionBreakdown] = useState({
    calories: 0,
    protein: 0,
    vitamin: 0,
    supplements: 0,
    fats: 0,
    water: 0
  });

  useEffect(() => {
    if (userId) {
      loadStats();
    }
  }, [userId]);

  const loadStats = async () => {
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    const monthStart = startOfMonth(today);

    // Get user weight
    const { data: profile } = await supabase
      .from("profiles")
      .select("weight")
      .eq("user_id", userId)
      .single();

    if (profile?.weight) {
      setUserWeight(profile.weight);
    }

    // Load workout logs for monthly bar chart
    const { data: workouts } = await supabase
      .from("workout_logs")
      .select("*")
      .eq("user_id", userId)
      .gte("completed_at", monthStart.toISOString())
      .order("completed_at", { ascending: true });

    // Load jogging logs for monthly chart
    const { data: joggingLogs } = await supabase
      .from("jogging_logs")
      .select("*")
      .eq("user_id", userId)
      .gte("completed_at", monthStart.toISOString());

    // Build monthly chart data (Days 0-30)
    const daysInMonth = getDaysInMonth(today);
    const dayLabels = [0, 5, 10, 15, 20, 25, 30];
    const monthNames = isGerman ? 
      ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'] :
      ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const chartData = dayLabels.map(day => {
      const dayWorkouts = workouts?.filter(w => {
        const d = new Date(w.completed_at).getDate();
        return d <= day && d > (day - 5);
      }) || [];
      
      const dayJogging = joggingLogs?.filter(j => {
        const d = new Date(j.completed_at).getDate();
        return d <= day && d > (day - 5);
      }) || [];

      const workoutCount = dayWorkouts.length;
      const joggingCount = dayJogging.length;

      return { 
        day: day.toString(), 
        count: workoutCount + joggingCount,
        month: monthNames[today.getMonth()]
      };
    });

    setMonthlyWorkoutData(chartData);
    setTotalWorkouts((workouts?.length || 0) + (joggingLogs?.length || 0));

    // Load today's nutrition
    const { data: todayNutrition } = await supabase
      .from("nutrition_logs")
      .select("*")
      .eq("user_id", userId)
      .gte("completed_at", todayStart.toISOString())
      .lte("completed_at", todayEnd.toISOString());

    if (todayNutrition && todayNutrition.length > 0) {
      let totalCals = 0, totalProt = 0, totalVitamin = 0, totalSupplements = 0, totalFats = 0, totalWater = 0;

      todayNutrition.forEach(log => {
        totalCals += log.calories || 0;
        totalProt += log.protein || 0;
        totalFats += log.fats || 0;
        
        // Parse notes for additional values
        if (log.notes) {
          const vitaminMatch = log.notes.match(/Vitamin: ([\d.]+)/);
          const waterMatch = log.notes.match(/Water: ([\d.]+)/);
          if (vitaminMatch) totalVitamin += parseFloat(vitaminMatch[1]) || 0;
          if (waterMatch) totalWater += parseFloat(waterMatch[1]) || 0;
        }

        // Count supplements
        if (log.meal_type === 'snack') {
          totalSupplements += log.calories || 0;
        }
      });

      setTodayCalories(totalCals);
      setTodayProtein(totalProt);
      setTodayWater(totalWater);
      setNutritionBreakdown({
        calories: totalCals,
        protein: totalProt,
        vitamin: totalVitamin,
        supplements: totalSupplements,
        fats: totalFats,
        water: totalWater
      });
    }

    // Load jogging distance
    const { data: jogging } = await supabase
      .from("jogging_logs")
      .select("distance")
      .eq("user_id", userId);

    if (jogging) {
      const total = jogging.reduce((sum: number, log: any) => sum + parseFloat(log.distance), 0);
      setTotalDistance(total);
    }
  };

  // Nutrition pie chart colors
  const NUTRITION_COLORS = {
    calories: '#F97316', // Orange
    protein: '#EF4444', // Red
    vitamin: '#22C55E', // Green
    supplements: '#A16207', // Brown
    fats: '#D4A574', // Light brown
    water: '#3B82F6' // Blue
  };

  const pieData = [
    { name: isGerman ? 'Kalorien' : 'Calories', value: nutritionBreakdown.calories || 100, color: NUTRITION_COLORS.calories },
    { name: 'Protein', value: nutritionBreakdown.protein || 50, color: NUTRITION_COLORS.protein },
    { name: 'Vitamin', value: nutritionBreakdown.vitamin || 30, color: NUTRITION_COLORS.vitamin },
    { name: 'Supplements', value: nutritionBreakdown.supplements || 20, color: NUTRITION_COLORS.supplements },
    { name: isGerman ? 'Fette' : 'Fats', value: nutritionBreakdown.fats || 25, color: NUTRITION_COLORS.fats },
    { name: isGerman ? 'Wasser' : 'Water', value: nutritionBreakdown.water || 40, color: NUTRITION_COLORS.water },
  ].filter(item => item.value > 0);

  const total = pieData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-6 mb-8">
      {/* Quick Stats - Auto-calculated Water & Calories */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="gradient-card card-shadow border-white/10 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">Workouts</span>
          </div>
          <div className="text-3xl font-bold">{totalWorkouts}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {isGerman ? "Dieser Monat" : "This month"}
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
            {isGerman ? "Auto berechnet" : "Auto calculated"}
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
          <div className="text-xs text-muted-foreground mt-1">Total</div>
        </Card>

        <Card className="gradient-card card-shadow border-white/10 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Droplets className="w-5 h-5 text-cyan-400" />
            <span className="text-sm text-muted-foreground">
              {isGerman ? "Wasser" : "Water"}
            </span>
          </div>
          <div className="text-3xl font-bold">{todayWater > 0 ? todayWater : Math.round(userWeight * 35)} ml</div>
          <div className="text-xs text-muted-foreground mt-1">
            {isGerman ? "Auto berechnet" : "Auto calculated"}
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Weight Watcher Pie Chart - Bigger */}
        <Card className="gradient-card card-shadow border-white/10 p-6">
          <h3 className="text-lg font-bold mb-4">Weight Watcher</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                label={({ name, value }) => `${Math.round((value / total) * 100)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px"
                }}
                formatter={(value: number, name: string) => [`${value}`, name]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Workout Activity Bar Chart - Days 0-30 with Months */}
        <Card className="gradient-card card-shadow border-white/10 p-6">
          <h3 className="text-lg font-bold mb-4">
            {isGerman ? "Workout Aktivität" : "Workout Activity"}
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyWorkoutData.length > 0 ? monthlyWorkoutData : [{ day: '0', count: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="day" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                label={{ value: monthlyWorkoutData[0]?.month || '', position: 'bottom', offset: 0 }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                ticks={[0, 5, 10, 15, 20, 25, 30]}
                domain={[0, 30]}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px"
                }}
                formatter={(value: number) => [value, isGerman ? 'Aktivitäten' : 'Activities']}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="text-center text-xs text-muted-foreground mt-2">
            {isGerman ? "Tage" : "Days"}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardStats;