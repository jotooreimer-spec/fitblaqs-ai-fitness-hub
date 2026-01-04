import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target, Calendar as CalendarIcon, TrendingDown, ChevronLeft, ChevronRight, Dumbbell, Image, Droplets, Flame, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { CalendarSkeleton } from "@/components/AnalysisSkeleton";
import { useLiveData } from "@/contexts/LiveDataContext";
import { ExerciseImageDialog } from "@/components/ExerciseImageDialog";
import { allExercises } from "@/data/exerciseImages";
import {
  calculateDailyNutrition,
  calculateDailyTrainingDuration,
  calculateMonthlyTrainingHours,
  calculateChallengeStats,
  formatMLToLiters,
  generateDonutChartData,
  calculateMonthlyCompletionPercentage
} from "@/lib/calculationUtils";
import performanceBg from "@/assets/performance-bg.png";
import bodyworkoutplan1 from "@/assets/bodyworkoutplan-1.png";
import bodyworkoutplan2 from "@/assets/bodyworkoutplan-2.png";
import bodyworkoutplan3 from "@/assets/bodyworkoutplan-3.png";
import bodyworkoutplan4 from "@/assets/bodyworkoutplan-4.png";
import bodyworkoutplan5 from "@/assets/bodyworkoutplan-5.png";

// Daily targets for nutrition
const DAILY_TARGETS = {
  calories: 2000,
  hydration: 2000, // ml
  protein: 50 // g
};

// Helper to find exercise image
const findExerciseImage = (name: string): string | null => {
  const exercise = allExercises.find(
    ex => ex.name.toLowerCase() === name.toLowerCase() || 
          ex.name_de.toLowerCase() === name.toLowerCase() ||
          name.toLowerCase().includes(ex.name.toLowerCase()) ||
          name.toLowerCase().includes(ex.name_de.toLowerCase())
  );
  return exercise?.image || null;
};

interface DayData {
  workouts: any[];
  nutrition: any[];
  jogging: any[];
  weight: any[];
  bodyAnalysis: any[];
  foodAnalysis: any[];
}

const CalendarPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    workoutLogs, 
    nutritionLogs, 
    joggingLogs, 
    weightLogs, 
    bodyAnalysis, 
    foodAnalysis, 
    profile, 
    setUserId,
    isLoading: dataLoading 
  } = useLiveData();
  
  const [isGerman, setIsGerman] = useState(true);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [userId, setLocalUserId] = useState<string>("");
  const [userWeight, setUserWeight] = useState(0);
  
  // Challenges state
  const [isChallengeDialogOpen, setIsChallengeDialogOpen] = useState(false);
  const [goalWeight, setGoalWeight] = useState("");
  const [months, setMonths] = useState("");
  const [bodyWeight, setBodyWeight] = useState("");
  const [savedGoal, setSavedGoal] = useState<{ goal: number; months: number; startWeight: number; startDate: string } | null>(null);
  const [bodyworkoutDialogOpen, setBodyworkoutDialogOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Upload detail dialog state
  const [uploadDetailOpen, setUploadDetailOpen] = useState(false);
  const [selectedUpload, setSelectedUpload] = useState<{ type: 'body' | 'food'; data: any } | null>(null);
  
  // Exercise image dialog
  const [exerciseImageOpen, setExerciseImageOpen] = useState(false);
  const [selectedExerciseName, setSelectedExerciseName] = useState("");
  
  // Donut chart popup dialogs
  const [caloriesPopupOpen, setCaloriesPopupOpen] = useState(false);
  const [hydrationPopupOpen, setHydrationPopupOpen] = useState(false);
  const [proteinPopupOpen, setProteinPopupOpen] = useState(false);
  const [performancePopupOpen, setPerformancePopupOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  
  const bodyworkoutImages = [bodyworkoutplan1, bodyworkoutplan2, bodyworkoutplan3, bodyworkoutplan4, bodyworkoutplan5];

  // Challenge finished notification
  const [challengeNotified, setChallengeNotified] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate("/login");
        return;
      }

      const metadata = session.user.user_metadata;
      setIsGerman(metadata.language === "de");
      setLocalUserId(session.user.id);
      setUserId(session.user.id);

      // Load saved challenge
      const saved = localStorage.getItem(`challenge_${session.user.id}`);
      if (saved) {
        setSavedGoal(JSON.parse(saved));
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, setUserId]);

  // Update user weight from profile
  useEffect(() => {
    if (profile?.weight) {
      setUserWeight(profile.weight);
      setBodyWeight(profile.weight.toString());
    }
  }, [profile]);

  // Check if challenge is finished and notify
  useEffect(() => {
    if (savedGoal && !challengeNotified) {
      const daysRemaining = calculateDaysRemaining();
      if (daysRemaining === 0) {
        toast({
          title: "🎉 Challenge Finish!",
          description: isGerman ? "Deine Challenge ist beendet!" : "Your challenge has ended!",
        });
        setChallengeNotified(true);
      }
    }
  }, [savedGoal, challengeNotified, isGerman]);

  // Calculate selected day data from live data
  const selectedDayData = useMemo((): DayData => {
    if (!date) return { workouts: [], nutrition: [], jogging: [], weight: [], bodyAnalysis: [], foodAnalysis: [] };
    
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    return {
      workouts: workoutLogs.filter(w => {
        const d = new Date(w.completed_at);
        return d >= dayStart && d <= dayEnd;
      }),
      nutrition: nutritionLogs.filter(n => {
        const d = new Date(n.completed_at);
        return d >= dayStart && d <= dayEnd;
      }),
      jogging: joggingLogs.filter(j => {
        const d = new Date(j.completed_at);
        return d >= dayStart && d <= dayEnd;
      }),
      weight: weightLogs.filter(w => {
        const d = new Date(w.measured_at);
        return d >= dayStart && d <= dayEnd;
      }),
      bodyAnalysis: bodyAnalysis.filter(b => {
        const d = new Date(b.created_at);
        return d >= dayStart && d <= dayEnd;
      }),
      foodAnalysis: foodAnalysis.filter(f => {
        const d = new Date(f.created_at);
        return d >= dayStart && d <= dayEnd;
      }),
    };
  }, [date, workoutLogs, nutritionLogs, joggingLogs, weightLogs, bodyAnalysis, foodAnalysis]);

  // Calculate monthly chart data using centralized calculation
  const monthlyChartData = useMemo(() => {
    const selectedYear = date?.getFullYear() || new Date().getFullYear();
    const monthNames = isGerman 
      ? ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const data = calculateMonthlyTrainingHours(workoutLogs, joggingLogs, selectedYear);
    return data.map((item, index) => ({
      month: monthNames[index],
      hours: item.hours
    }));
  }, [date, workoutLogs, joggingLogs, isGerman]);

  const handleSaveChallenge = () => {
    if (!goalWeight || !months || !bodyWeight) {
      toast({
        title: isGerman ? "Fehler" : "Error",
        description: isGerman ? "Bitte alle Felder ausfüllen" : "Please fill all fields",
        variant: "destructive"
      });
      return;
    }

    const challenge = {
      goal: parseFloat(goalWeight),
      months: parseInt(months),
      startWeight: parseFloat(bodyWeight),
      startDate: new Date().toISOString()
    };

    localStorage.setItem(`challenge_${userId}`, JSON.stringify(challenge));
    setSavedGoal(challenge);
    setIsChallengeDialogOpen(false);
    setChallengeNotified(false);

    toast({
      title: isGerman ? "Challenge gespeichert!" : "Challenge saved!",
      description: isGerman ? "Viel Erfolg!" : "Good luck!"
    });
  };

  const calculateDaysRemaining = () => {
    if (!savedGoal) return 0;
    const startDate = new Date(savedGoal.startDate);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + savedGoal.months);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const calculateWeightRemaining = () => {
    if (!savedGoal) return 0;
    return Math.max(0, userWeight - savedGoal.goal);
  };

  const calculateProgress = () => {
    if (!savedGoal || !userWeight) return 0;
    const totalToLose = savedGoal.startWeight - savedGoal.goal;
    const lost = savedGoal.startWeight - userWeight;
    if (totalToLose <= 0) return 100;
    return Math.min(100, Math.max(0, (lost / totalToLose) * 100));
  };

  const hasData = selectedDayData.workouts.length > 0 || selectedDayData.nutrition.length > 0 || selectedDayData.jogging.length > 0 || selectedDayData.weight.length > 0 || selectedDayData.bodyAnalysis.length > 0 || selectedDayData.foodAnalysis.length > 0;

  // Calculate total training duration for selected day using centralized calculation
  const totalDuration = useMemo(() => {
    if (!date) return 0;
    const duration = calculateDailyTrainingDuration(
      selectedDayData.workouts,
      selectedDayData.jogging,
      date
    );
    return duration.totalMinutes;
  }, [selectedDayData, date]);

  const daysRemaining = calculateDaysRemaining();
  const weightRemaining = calculateWeightRemaining();
  const progress = calculateProgress();

  // Format jogging duration for display
  const formatJoggingDuration = (duration: number) => {
    if (duration > 100) {
      // Duration in seconds
      const hours = Math.floor(duration / 3600);
      const mins = Math.floor((duration % 3600) / 60);
      const secs = duration % 60;
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    // Duration in minutes (legacy)
    return `${Math.floor(duration / 60).toString().padStart(2, '0')}:${(duration % 60).toString().padStart(2, '0')}:00`;
  };

  // Calculate nutrition data for selected day using centralized calculation
  const selectedDayNutrition = useMemo(() => {
    if (!date) return { calories: 0, protein: 0, carbs: 0, fats: 0, hydration: 0, vitamins: 0, hasData: false };
    return calculateDailyNutrition(nutritionLogs, date);
  }, [nutritionLogs, date]);

  // Donut chart data for Weight Watcher style display
  const donutChartData = useMemo(() => {
    return generateDonutChartData(selectedDayNutrition, DAILY_TARGETS);
  }, [selectedDayNutrition]);

  // Calculate percentages for popups
  const caloriesPercentage = Math.min(100, Math.round((selectedDayNutrition.calories / DAILY_TARGETS.calories) * 100));
  const hydrationPercentage = Math.min(100, Math.round((selectedDayNutrition.hydration / DAILY_TARGETS.hydration) * 100));
  const proteinPercentage = Math.min(100, Math.round((selectedDayNutrition.protein / DAILY_TARGETS.protein) * 100));

  // Performance completion percentage
  const performanceCompletionPercentage = useMemo(() => {
    const currentMonth = date?.getMonth() ?? new Date().getMonth();
    const currentYear = date?.getFullYear() ?? new Date().getFullYear();
    return calculateMonthlyCompletionPercentage(workoutLogs, joggingLogs, currentMonth, currentYear);
  }, [date, workoutLogs, joggingLogs]);

  const nutritionPieData = useMemo(() => {
    const { protein, carbs, fats } = selectedDayNutrition;
    const total = protein + carbs + fats;
    if (total === 0) return [];
    return [
      { name: 'Protein', value: protein, color: 'hsl(142, 76%, 36%)' },
      { name: 'Carbs', value: carbs, color: 'hsl(38, 92%, 50%)' },
      { name: 'Fats', value: fats, color: 'hsl(0, 84%, 60%)' },
    ];
  }, [selectedDayNutrition]);

  return (
    <div className="min-h-screen pb-24 relative">
      {/* Background */}
      <div className="fixed inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${performanceBg})` }} />
      <div className="fixed inset-0 bg-black/60" />

      <div className="relative z-10 max-w-screen-xl mx-auto p-3 md:p-4">
        {/* Header with Back Navigation - Compact */}
        <div className="mb-3 flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/dashboard")}
            className="text-white hover:bg-white/10 flex-shrink-0 h-8 w-8"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-white">Performance</h1>
            <p className="text-white/60 text-[10px]">{isGerman ? "Dein Tag und Trainingsdauer" : "Your day and training duration"}</p>
          </div>
        </div>

        {/* Main Grid - Responsive layout */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Column 1: Calendar - Ultra Compact */}
          <div>
            <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-2">
              <Calendar 
                mode="single" 
                selected={date} 
                onSelect={setDate} 
                className="rounded-md text-xs [&_.rdp-day]:h-7 [&_.rdp-day]:w-7 [&_.rdp-day]:text-xs [&_.rdp-head_th]:w-7 [&_.rdp-head_th]:text-xs [&_.rdp-caption]:text-sm [&_.rdp-nav_button]:h-6 [&_.rdp-nav_button]:w-6" 
              />
            </Card>
          </div>

          {/* Column 2: Dailyplaner - Compact */}
          <div>
            <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-3 h-full max-h-[280px] flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold text-white">Dailyplaner</h3>
                <div className="text-right">
                  <span className="text-[10px] text-white/60">{date ? format(date, "dd.MM.yyyy") : ""}</span>
                  {totalDuration > 0 && (
                    <div className="text-[9px] text-primary">
                      {totalDuration} min
                    </div>
                  )}
                </div>
              </div>

              {dataLoading ? (
                <CalendarSkeleton />
              ) : !hasData ? (
                <p className="text-white/60 text-center py-4 text-xs">{isGerman ? "Keine Einträge" : "No entries"}</p>
              ) : (
                <div className="space-y-1.5 flex-1 overflow-y-auto">
                  {/* Workouts - Compact */}
                  {selectedDayData.workouts.map((w) => {
                    const exerciseName = w.notes?.split(" (")[0] || (isGerman ? w.exercises?.name_de : w.exercises?.name_en) || "Training";
                    const exerciseImage = findExerciseImage(exerciseName);
                    
                    return (
                      <div 
                        key={w.id} 
                        className={`p-1.5 bg-white/5 rounded flex gap-1.5 items-center ${exerciseImage ? 'cursor-pointer hover:bg-white/10' : ''}`}
                        onClick={() => {
                          if (exerciseImage) {
                            setSelectedExerciseName(exerciseName);
                            setExerciseImageOpen(true);
                          }
                        }}
                      >
                        {exerciseImage && (
                          <div className="flex-shrink-0 w-8 h-8 rounded overflow-hidden bg-black/30 border border-white/10">
                            <img src={exerciseImage} alt={exerciseName} className="w-full h-full object-contain p-0.5" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] text-white truncate">{w.notes || (isGerman ? w.exercises?.name_de : w.exercises?.name_en)}</div>
                          <div className="text-[9px] text-white/60">
                            {w.sets}×{w.reps} | {w.weight || 0}{w.unit || 'kg'}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Nutrition - Compact */}
                  {selectedDayData.nutrition.map((n) => (
                    <div key={n.id} className="p-1.5 bg-white/5 rounded">
                      <div className="text-[10px] text-white truncate">{n.food_name}</div>
                      <div className="text-[9px] text-white/60">{n.calories} kcal</div>
                    </div>
                  ))}

                  {/* Jogging - Compact */}
                  {selectedDayData.jogging.map((j) => (
                    <div key={j.id} className="p-1.5 bg-white/5 rounded">
                      <div className="text-[10px] text-white">{j.distance} km</div>
                      <div className="text-[9px] text-white/60">{j.calories || 0} kcal</div>
                    </div>
                  ))}

                  {/* Weight - Compact */}
                  {selectedDayData.weight.map((w) => (
                    <div key={w.id} className="p-1.5 bg-white/5 rounded">
                      <div className="text-[10px] text-white">{w.weight} kg</div>
                    </div>
                  ))}

                  {/* Body Analysis - Compact */}
                  {selectedDayData.bodyAnalysis.map((ba) => (
                    <div key={ba.id} className="p-1.5 bg-white/5 rounded flex items-center gap-1">
                      <span className="text-[10px] text-cyan-400">{isGerman ? "Körper" : "Body"}</span>
                      {ba.image_url && <img src={ba.image_url} alt="" className="w-6 h-6 rounded object-cover" />}
                    </div>
                  ))}

                  {/* Food Analysis - Compact */}
                  {selectedDayData.foodAnalysis.map((fa) => (
                    <div key={fa.id} className="p-1.5 bg-white/5 rounded">
                      <span className="text-[10px] text-amber-400">{isGerman ? "Essen" : "Food"}</span>
                      {fa.total_calories && <span className="text-[9px] text-white/60 ml-1">{fa.total_calories} kcal</span>}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Column 3: Performance + Weight Watcher Style - Ultra Compact */}
          <div className="space-y-2 md:col-span-2 lg:col-span-1">
            {/* Performance Bar Chart with Click */}
            <Card 
              className="bg-black/40 backdrop-blur-sm border-white/10 p-2 cursor-pointer hover:bg-black/50 transition-colors"
              onClick={() => setPerformancePopupOpen(true)}
            >
              <h3 className="text-[10px] font-bold mb-1 text-white">Performance</h3>
              <div className="h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChartData}>
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={7} tickLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" domain={[0, 100]} fontSize={7} width={16} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: '9px' }} formatter={(value: number) => [`${value.toFixed(1)}h`, isGerman ? 'Std' : 'Hrs']} />
                    <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center text-[7px] text-white/50">{isGerman ? "Klicken für Details" : "Click for details"}</div>
            </Card>

            {/* Weight Watcher Style - 3 Donut Charts */}
            <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-2">
              <h3 className="text-[10px] font-bold mb-2 text-white">{isGerman ? "Tagesziele" : "Daily Goals"}</h3>
              <div className="grid grid-cols-3 gap-2">
                {/* Calories Donut */}
                <div 
                  className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => setCaloriesPopupOpen(true)}
                >
                  <div className="w-12 h-12 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donutChartData.calories}
                          cx="50%"
                          cy="50%"
                          innerRadius={14}
                          outerRadius={22}
                          paddingAngle={0}
                          dataKey="value"
                          startAngle={90}
                          endAngle={-270}
                        >
                          {donutChartData.calories.map((entry, index) => (
                            <Cell key={`cal-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Flame className="w-3 h-3 text-orange-400" />
                    </div>
                  </div>
                  <div className="text-[9px] font-bold text-white">{selectedDayNutrition.calories}</div>
                  <div className="text-[7px] text-white/50">kcal</div>
                </div>

                {/* Hydration Donut */}
                <div 
                  className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => setHydrationPopupOpen(true)}
                >
                  <div className="w-12 h-12 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donutChartData.hydration}
                          cx="50%"
                          cy="50%"
                          innerRadius={14}
                          outerRadius={22}
                          paddingAngle={0}
                          dataKey="value"
                          startAngle={90}
                          endAngle={-270}
                        >
                          {donutChartData.hydration.map((entry, index) => (
                            <Cell key={`hyd-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Droplets className="w-3 h-3 text-blue-400" />
                    </div>
                  </div>
                  <div className="text-[9px] font-bold text-white">{formatMLToLiters(selectedDayNutrition.hydration)}</div>
                  <div className="text-[7px] text-white/50">{isGerman ? "Wasser" : "Water"}</div>
                </div>

                {/* Protein Donut */}
                <div 
                  className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => setProteinPopupOpen(true)}
                >
                  <div className="w-12 h-12 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donutChartData.protein}
                          cx="50%"
                          cy="50%"
                          innerRadius={14}
                          outerRadius={22}
                          paddingAngle={0}
                          dataKey="value"
                          startAngle={90}
                          endAngle={-270}
                        >
                          {donutChartData.protein.map((entry, index) => (
                            <Cell key={`pro-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[8px] font-bold text-green-400">P</span>
                    </div>
                  </div>
                  <div className="text-[9px] font-bold text-white">{selectedDayNutrition.protein.toFixed(0)}</div>
                  <div className="text-[7px] text-white/50">g</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Calories Popup */}
      <Dialog open={caloriesPopupOpen} onOpenChange={setCaloriesPopupOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400" />
              {isGerman ? "Kalorien" : "Calories"}
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <div className="text-5xl font-bold text-orange-400 mb-2">{caloriesPercentage}%</div>
            <div className="text-lg text-muted-foreground">{isGerman ? "des Tagesziels" : "of daily goal"}</div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isGerman ? "Verbraucht:" : "Consumed:"}</span>
                <span className="font-semibold">{selectedDayNutrition.calories} kcal</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isGerman ? "Tagesziel:" : "Daily goal:"}</span>
                <span className="font-semibold">{DAILY_TARGETS.calories} kcal</span>
              </div>
              <Progress value={caloriesPercentage} className="h-2 mt-2" />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hydration Popup */}
      <Dialog open={hydrationPopupOpen} onOpenChange={setHydrationPopupOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-blue-400" />
              {isGerman ? "Hydration" : "Hydration"}
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <div className="text-5xl font-bold text-blue-400 mb-2">{hydrationPercentage}%</div>
            <div className="text-lg text-muted-foreground">{isGerman ? "des Tagesziels" : "of daily goal"}</div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isGerman ? "Getrunken:" : "Consumed:"}</span>
                <span className="font-semibold">{formatMLToLiters(selectedDayNutrition.hydration)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isGerman ? "Tagesziel:" : "Daily goal:"}</span>
                <span className="font-semibold">{formatMLToLiters(DAILY_TARGETS.hydration)}</span>
              </div>
              <Progress value={hydrationPercentage} className="h-2 mt-2" />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Protein Popup */}
      <Dialog open={proteinPopupOpen} onOpenChange={setProteinPopupOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-green-400 font-bold">P</span>
              Protein
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <div className="text-5xl font-bold text-green-400 mb-2">{proteinPercentage}%</div>
            <div className="text-lg text-muted-foreground">{isGerman ? "des Tagesziels" : "of daily goal"}</div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isGerman ? "Aufgenommen:" : "Consumed:"}</span>
                <span className="font-semibold">{selectedDayNutrition.protein.toFixed(1)} g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isGerman ? "Tagesziel:" : "Daily goal:"}</span>
                <span className="font-semibold">{DAILY_TARGETS.protein} g</span>
              </div>
              <Progress value={proteinPercentage} className="h-2 mt-2" />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Performance Popup */}
      <Dialog open={performancePopupOpen} onOpenChange={setPerformancePopupOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>{isGerman ? "Monatsleistung" : "Monthly Performance"}</DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <div className="text-5xl font-bold text-primary mb-2">{performanceCompletionPercentage}%</div>
            <div className="text-lg text-muted-foreground">{isGerman ? "Trainingseinheiten abgeschlossen" : "Training sessions completed"}</div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isGerman ? "Monat:" : "Month:"}</span>
                <span className="font-semibold">{date ? format(date, 'MMMM yyyy') : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isGerman ? "Stunden:" : "Hours:"}</span>
                <span className="font-semibold">{monthlyChartData[date?.getMonth() ?? new Date().getMonth()]?.hours?.toFixed(1) ?? 0}h</span>
              </div>
              <Progress value={performanceCompletionPercentage} className="h-2 mt-2" />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Challenge Dialog */}
      <Dialog open={isChallengeDialogOpen} onOpenChange={setIsChallengeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isGerman ? "Challenge einstellen" : "Set Challenge"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{isGerman ? "Aktuelles Gewicht (kg)" : "Current Weight (kg)"}</Label>
              <Input type="number" value={bodyWeight} onChange={(e) => setBodyWeight(e.target.value)} placeholder="70" />
            </div>
            <div>
              <Label>Weight Goal (kg)</Label>
              <Input type="number" value={goalWeight} onChange={(e) => setGoalWeight(e.target.value)} placeholder="65" />
            </div>
            <div>
              <Label>{isGerman ? "Zeitraum (Monate)" : "Duration (Months)"}</Label>
              <Input type="number" min="1" max="24" value={months} onChange={(e) => setMonths(e.target.value)} placeholder="3" />
            </div>
            <Button onClick={handleSaveChallenge} className="w-full">
              {isGerman ? "Challenge starten" : "Start Challenge"}
            </Button>
            {savedGoal && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  localStorage.removeItem(`challenge_${userId}`);
                  setSavedGoal(null);
                  setIsChallengeDialogOpen(false);
                }}
              >
                {isGerman ? "Challenge zurücksetzen" : "Reset Challenge"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Bodyworkoutplan Carousel Dialog */}
      <Dialog open={bodyworkoutDialogOpen} onOpenChange={setBodyworkoutDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bodyworkoutplan</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <img 
              src={bodyworkoutImages[currentImageIndex]} 
              alt={`Workout Plan ${currentImageIndex + 1}`} 
              className="w-full rounded-lg"
            />
            <div className="absolute inset-y-0 left-0 flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentImageIndex(prev => prev > 0 ? prev - 1 : bodyworkoutImages.length - 1)}
                className="bg-black/50 hover:bg-black/70"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </Button>
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentImageIndex(prev => prev < bodyworkoutImages.length - 1 ? prev + 1 : 0)}
                className="bg-black/50 hover:bg-black/70"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </Button>
            </div>
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              {bodyworkoutImages.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`w-2 h-2 rounded-full ${idx === currentImageIndex ? 'bg-primary' : 'bg-white/50'}`}
                />
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Exercise Image Dialog */}
      <ExerciseImageDialog
        open={exerciseImageOpen}
        onOpenChange={setExerciseImageOpen}
        exerciseName={selectedExerciseName}
        isGerman={isGerman}
      />

      <BottomNav />
    </div>
  );
};

export default CalendarPage;