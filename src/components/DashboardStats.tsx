import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Activity, Flame, MapPin, Droplets } from "lucide-react";
import { useLiveData } from "@/contexts/LiveDataContext";

interface Props {
  isGerman: boolean;
  userId: string;
}

const DashboardStats = ({ isGerman, userId }: Props) => {
  const { 
    nutritionLogs, 
    workoutLogs, 
    joggingLogs, 
    stats, 
    setUserId,
    isLoading 
  } = useLiveData();

  useEffect(() => {
    if (userId) {
      setUserId(userId);
    }
  }, [userId, setUserId]);

  // Build monthly chart data from live data
  const buildMonthlyChartData = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthNamesDE = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

    return monthNames.map((month, index) => {
      const isCompletedMonth = index < currentMonth;
      
      if (!isCompletedMonth) {
        return { month: isGerman ? monthNamesDE[index] : month, count: 0 };
      }
      
      const monthWorkouts = workoutLogs.filter(w => {
        const d = new Date(w.completed_at);
        return d.getMonth() === index && d.getFullYear() === currentYear;
      });
      
      const workoutHours = monthWorkouts.reduce((total, w) => {
        return total + ((w.sets || 1) * 3 / 60);
      }, 0);

      const monthJogging = joggingLogs.filter(j => {
        const d = new Date(j.completed_at);
        return d.getMonth() === index && d.getFullYear() === currentYear;
      });
      
      const joggingHours = monthJogging.reduce((total, j) => {
        return total + ((j.duration || 0) / 60);
      }, 0);

      return { 
        month: isGerman ? monthNamesDE[index] : month,
        count: Math.round((workoutHours + joggingHours) * 10) / 10
      };
    });
  };

  // Calculate today's nutrition from live data
  const getTodayNutrition = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const todayLogs = nutritionLogs.filter(n => {
      const date = new Date(n.completed_at);
      return date >= today && date <= todayEnd;
    });

    let calories = 0, protein = 0, fats = 0, vitamins = 0, water = 0;

    todayLogs.forEach(log => {
      calories += log.calories || 0;
      protein += log.protein || 0;
      fats += log.fats || 0;

      if (log.notes) {
        try {
          const parsed = JSON.parse(log.notes);
          if (parsed?.water?.value) {
            const value = parseFloat(parsed.water.value) || 0;
            const unit = parsed.water.unit || 'ml';
            if (unit === 'l' || unit === 'liter') water += value * 1000;
            else if (unit === 'dl') water += value * 100;
            else water += value;
          }
          if (parsed?.vitamin?.value) {
            vitamins += parseFloat(parsed.vitamin.value) || 0;
          }
        } catch {}
      }
    });

    return { calories, protein, fats, vitamins, water, hasData: todayLogs.length > 0 };
  };

  const monthlyWorkoutData = buildMonthlyChartData();
  const todayNutrition = getTodayNutrition();
  const hasNutritionData = todayNutrition.hasData;

  const NUTRITION_COLORS = {
    calories: '#F97316',
    protein: '#EF4444',
    vitamin: '#22C55E',
    fats: '#D4A574',
    water: '#3B82F6'
  };

  const pieData = hasNutritionData ? [
    { name: isGerman ? 'Kalorien' : 'Calories', value: todayNutrition.calories, color: NUTRITION_COLORS.calories, key: 'calories' },
    { name: 'Protein', value: todayNutrition.protein, color: NUTRITION_COLORS.protein, key: 'protein' },
    { name: 'Vitamin', value: todayNutrition.vitamins, color: NUTRITION_COLORS.vitamin, key: 'vitamin' },
    { name: isGerman ? 'Fette' : 'Fats', value: todayNutrition.fats, color: NUTRITION_COLORS.fats, key: 'fats' },
    { name: 'Hydration', value: todayNutrition.water, color: NUTRITION_COLORS.water, key: 'water' },
  ].filter(item => item.value > 0) : [];

  const total = pieData.reduce((sum, item) => sum + item.value, 0);

  const zeroStatePieData = [
    { name: isGerman ? 'Kalorien' : 'Calories', value: 1, color: '#374151', key: 'calories' },
    { name: 'Protein', value: 1, color: '#374151', key: 'protein' },
    { name: 'Vitamin', value: 1, color: '#374151', key: 'vitamin' },
    { name: isGerman ? 'Fette' : 'Fats', value: 1, color: '#374151', key: 'fats' },
    { name: 'Hydration', value: 1, color: '#374151', key: 'water' },
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
      {/* Quick Stats - Live from context */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="gradient-card card-shadow border-white/10 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">Workouts</span>
          </div>
          <div className="text-3xl font-bold">{stats.totalWorkouts}</div>
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
          <div className="text-3xl font-bold">{stats.todayCalories.toLocaleString()}</div>
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
          <div className="text-3xl font-bold">{stats.totalDistance.toFixed(1)} km</div>
          <div className="text-xs text-muted-foreground mt-1">Total</div>
        </Card>

        <Card className="gradient-card card-shadow border-white/10 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Droplets className="w-5 h-5 text-cyan-400" />
            <span className="text-sm text-muted-foreground">Hydration</span>
          </div>
          <div className="text-3xl font-bold">{stats.todayWater > 0 ? (stats.todayWater / 1000).toFixed(1) : "0"} L</div>
          <div className="text-xs text-muted-foreground mt-1">
            {hasNutritionData ? (isGerman ? "Aus Essensplan" : "From meal plan") : "0"}
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Weight Watcher Pie Chart */}
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
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {(hasNutritionData ? pieData : zeroStatePieData).map((item, index) => (
              <div key={index} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/10 transition-colors">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: hasNutritionData ? item.color : '#374151' }} />
                <span className="text-xs text-muted-foreground">{item.name}</span>
                <span className="text-xs font-bold">{hasNutritionData ? `${Math.round((item.value / total) * 100)}%` : '0%'}</span>
              </div>
            ))}
          </div>
          {!hasNutritionData && (
            <p className="text-center text-xs text-muted-foreground mt-2">
              {isGerman ? "Füge Mahlzeiten hinzu um Werte zu sehen" : "Add meals to see values"}
            </p>
          )}
        </Card>

        {/* Workout Activity Bar Chart */}
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
                ticks={[0, 5, 10, 25, 50, 75, 100]}
                domain={[0, 100]}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px"
                }}
                formatter={(value: number) => [value.toFixed(1), isGerman ? 'Stunden' : 'Hours']}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="text-center text-xs text-muted-foreground mt-2">
            {isGerman ? "Stunden (Live-Update)" : "Hours (Live Update)"}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardStats;