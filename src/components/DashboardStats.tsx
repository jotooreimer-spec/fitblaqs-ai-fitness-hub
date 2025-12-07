import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Activity, Flame, MapPin, Droplets } from "lucide-react";
import { format, startOfMonth, startOfYear, eachMonthOfInterval } from "date-fns";

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
  const [nutritionBreakdown, setNutritionBreakdown] = useState({
    calories: 0,
    protein: 0,
    vitamin: 0,
    supplements: 0,
    fats: 0,
    water: 0
  });
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hasNutritionData, setHasNutritionData] = useState(false);

  useEffect(() => {
    if (userId) {
      loadStats();
    }
  }, [userId]);

  const loadStats = async () => {
    const today = new Date();
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    const yearStart = startOfYear(today);

    // Load workout logs for yearly bar chart (by month)
    const { data: workouts } = await supabase
      .from("workout_logs")
      .select("*")
      .eq("user_id", userId)
      .gte("completed_at", yearStart.toISOString())
      .order("completed_at", { ascending: true });

    // Load jogging logs for yearly chart
    const { data: joggingLogs } = await supabase
      .from("jogging_logs")
      .select("*")
      .eq("user_id", userId)
      .gte("completed_at", yearStart.toISOString());

    // Build monthly chart data with months (Jan-Dec)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthNamesDE = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

    const chartData = monthNames.map((month, index) => {
      const monthWorkouts = workouts?.filter(w => {
        const d = new Date(w.completed_at);
        return d.getMonth() === index;
      }) || [];
      
      const monthJogging = joggingLogs?.filter(j => {
        const d = new Date(j.completed_at);
        return d.getMonth() === index;
      }) || [];

      return { 
        month: isGerman ? monthNamesDE[index] : month,
        count: monthWorkouts.length + monthJogging.length
      };
    });

    setMonthlyWorkoutData(chartData);
    setTotalWorkouts((workouts?.length || 0) + (joggingLogs?.length || 0));

    // Load today's nutrition - Start at 0, only count actual entries
    const { data: todayNutrition } = await supabase
      .from("nutrition_logs")
      .select("*")
      .eq("user_id", userId)
      .gte("completed_at", todayStart.toISOString())
      .lte("completed_at", todayEnd.toISOString());

    if (todayNutrition && todayNutrition.length > 0) {
      setHasNutritionData(true);
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
    } else {
      // No data - all zeros
      setHasNutritionData(false);
      setTodayCalories(0);
      setTodayProtein(0);
      setTodayWater(0);
      setNutritionBreakdown({
        calories: 0,
        protein: 0,
        vitamin: 0,
        supplements: 0,
        fats: 0,
        water: 0
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
    calories: '#F97316',
    protein: '#EF4444',
    vitamin: '#22C55E',
    supplements: '#A16207',
    fats: '#D4A574',
    water: '#3B82F6'
  };

  // Only show pie data if we have entries, otherwise show zeros
  const pieData = hasNutritionData ? [
    { name: isGerman ? 'Kalorien' : 'Calories', value: nutritionBreakdown.calories, color: NUTRITION_COLORS.calories, key: 'calories' },
    { name: 'Protein', value: nutritionBreakdown.protein, color: NUTRITION_COLORS.protein, key: 'protein' },
    { name: 'Vitamin', value: nutritionBreakdown.vitamin, color: NUTRITION_COLORS.vitamin, key: 'vitamin' },
    { name: 'Supplements', value: nutritionBreakdown.supplements, color: NUTRITION_COLORS.supplements, key: 'supplements' },
    { name: isGerman ? 'Fette' : 'Fats', value: nutritionBreakdown.fats, color: NUTRITION_COLORS.fats, key: 'fats' },
    { name: isGerman ? 'Wasser' : 'Water', value: nutritionBreakdown.water, color: NUTRITION_COLORS.water, key: 'water' },
  ].filter(item => item.value > 0) : [];

  const total = pieData.reduce((sum, item) => sum + item.value, 0);

  // Zero state pie data for display
  const zeroStatePieData = [
    { name: isGerman ? 'Kalorien' : 'Calories', value: 1, color: '#374151', key: 'calories' },
    { name: 'Protein', value: 1, color: '#374151', key: 'protein' },
    { name: 'Vitamin', value: 1, color: '#374151', key: 'vitamin' },
    { name: 'Supplements', value: 1, color: '#374151', key: 'supplements' },
    { name: isGerman ? 'Fette' : 'Fats', value: 1, color: '#374151', key: 'fats' },
    { name: isGerman ? 'Wasser' : 'Water', value: 1, color: '#374151', key: 'water' },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = total > 0 ? Math.round((data.value / total) * 100) : 0;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold" style={{ color: data.color }}>{data.name}</p>
          <p className="text-sm text-muted-foreground">{percentage}%</p>
          <p className="text-sm">{data.value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 mb-8">
      {/* Quick Stats - Auto-calculated from Today's Meal Plan */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="gradient-card card-shadow border-white/10 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">Workouts</span>
          </div>
          <div className="text-3xl font-bold">{totalWorkouts}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {isGerman ? "Dieses Jahr" : "This year"}
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
            {hasNutritionData ? (isGerman ? "Aus Essensplan" : "From meal plan") : "0"}
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
          <div className="text-3xl font-bold">{todayWater > 0 ? (todayWater / 1000).toFixed(1) : "0"} L</div>
          <div className="text-xs text-muted-foreground mt-1">
            {hasNutritionData ? (isGerman ? "Aus Essensplan" : "From meal plan") : "0"}
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Weight Watcher Pie Chart - Shows 0% when no data */}
        <Card className="gradient-card card-shadow border-white/10 p-6">
          <h3 className="text-lg font-bold mb-4">Weight Watcher</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={hasNutritionData ? pieData : zeroStatePieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                label={({ name }) => hasNutritionData ? `${Math.round((pieData.find(p => p.name === name)?.value || 0) / total * 100)}%` : '0%'}
                labelLine={false}
              >
                {(hasNutritionData ? pieData : zeroStatePieData).map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={hasNutritionData ? entry.color : '#374151'}
                    cursor="pointer"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Legend with clickable items */}
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {(hasNutritionData ? pieData : zeroStatePieData).map((item, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-white/10 transition-colors"
                onMouseEnter={() => setHoveredCategory(item.key)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: hasNutritionData ? item.color : '#374151' }}
                />
                <span className="text-xs text-muted-foreground">{item.name}</span>
                {hoveredCategory === item.key && (
                  <span className="text-xs font-bold">
                    {hasNutritionData ? `${Math.round((item.value / total) * 100)}%` : '0%'}
                  </span>
                )}
              </div>
            ))}
          </div>
          {!hasNutritionData && (
            <p className="text-center text-xs text-muted-foreground mt-2">
              {isGerman ? "Füge Mahlzeiten hinzu um Werte zu sehen" : "Add meals to see values"}
            </p>
          )}
        </Card>

        {/* Workout Activity Bar Chart - Monthly (Jan-Dec) */}
        <Card className="gradient-card card-shadow border-white/10 p-6">
          <h3 className="text-lg font-bold mb-4">
            {isGerman ? "Workout Aktivität" : "Workout Activity"}
          </h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={monthlyWorkoutData} margin={{ bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                domain={[0, 'auto']}
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
          <div className="text-center text-sm text-muted-foreground mt-2">
            {isGerman ? "Monatliche Übersicht" : "Monthly Overview"}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardStats;