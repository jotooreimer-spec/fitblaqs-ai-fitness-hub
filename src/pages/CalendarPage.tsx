import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target, Calendar as CalendarIcon, TrendingDown, ChevronLeft, ChevronRight, Dumbbell, Image, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { CalendarSkeleton } from "@/components/AnalysisSkeleton";
import { useLiveData } from "@/contexts/LiveDataContext";
import { ExerciseImageDialog } from "@/components/ExerciseImageDialog";
import { allExercises } from "@/data/exerciseImages";
import performanceBg from "@/assets/performance-bg.png";
import bodyworkoutplan1 from "@/assets/bodyworkoutplan-1.png";
import bodyworkoutplan2 from "@/assets/bodyworkoutplan-2.png";
import bodyworkoutplan3 from "@/assets/bodyworkoutplan-3.png";
import bodyworkoutplan4 from "@/assets/bodyworkoutplan-4.png";
import bodyworkoutplan5 from "@/assets/bodyworkoutplan-5.png";

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

  // Calculate monthly chart data from live data - LIVE from all training logs
  const monthlyChartData = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const selectedYear = date?.getFullYear() || currentYear;
    
    const monthNames = isGerman 
      ? ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return monthNames.map((month, index) => {
      // Calculate hours from ALL workout logs for this month
      const monthWorkouts = workoutLogs.filter(w => {
        const d = new Date(w.completed_at);
        return d.getMonth() === index && d.getFullYear() === selectedYear;
      });
      const monthJogging = joggingLogs.filter(j => {
        const d = new Date(j.completed_at);
        return d.getMonth() === index && d.getFullYear() === selectedYear;
      });
      
      // Calculate hours from jogging (duration in seconds or minutes)
      const joggingHours = monthJogging.reduce((sum, j) => {
        const duration = j.duration || 0;
        // If > 100, assume seconds
        return sum + (duration > 100 ? duration / 3600 : duration / 60);
      }, 0);
      
      // Calculate hours from workouts (estimate 3 min per set)
      const workoutHours = monthWorkouts.reduce((sum, w) => sum + ((w.sets || 1) * 3 / 60), 0);

      return { month, hours: Math.min(Math.round((joggingHours + workoutHours) * 10) / 10, 100) };
    });
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

  // Calculate total training duration for selected day - LIVE
  const totalDuration = useMemo(() => {
    const joggingMins = selectedDayData.jogging.reduce((sum, j) => {
      const duration = j.duration || 0;
      // If > 100, assume seconds
      return sum + (duration > 100 ? duration / 60 : duration);
    }, 0);
    const workoutMins = selectedDayData.workouts.length * 30; // Estimate 30 min per workout
    return Math.round(joggingMins + workoutMins);
  }, [selectedDayData]);

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

  // Calculate nutrition data for selected day - LIVE for pie chart
  const selectedDayNutrition = useMemo(() => {
    const totals = { calories: 0, protein: 0, carbs: 0, fats: 0 };
    selectedDayData.nutrition.forEach(n => {
      totals.calories += n.calories || 0;
      totals.protein += n.protein || 0;
      totals.carbs += n.carbs || 0;
      totals.fats += n.fats || 0;
    });
    return totals;
  }, [selectedDayData.nutrition]);

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

      <div className="relative z-10 max-w-screen-xl mx-auto p-4 md:p-6">
        {/* Header with Back Navigation */}
        <div className="mb-4 flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/dashboard")}
            className="text-white hover:bg-white/10 flex-shrink-0"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">Performance</h1>
            <p className="text-white/60 text-xs">{isGerman ? "Dein Tag und Trainingsdauer" : "Your day and training duration"}</p>
          </div>
        </div>

        {/* Main Grid - 3 columns on desktop */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Column 1: Calendar */}
          <div className="space-y-4">
            {/* Calendar - Compact */}
            <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-3">
              <Calendar 
                mode="single" 
                selected={date} 
                onSelect={setDate} 
                className="rounded-md text-sm [&_.rdp-day]:h-8 [&_.rdp-day]:w-8 [&_.rdp-head_th]:w-8" 
              />
            </Card>
          </div>

          {/* Column 2: Dailyplaner */}
          <div>
            <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-4 h-full max-h-[500px] flex flex-col">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-white">Dailyplaner</h3>
                <div className="text-right">
                  <span className="text-xs text-white/60">{date ? format(date, "dd.MM.yyyy") : ""}</span>
                  {totalDuration > 0 && (
                    <div className="text-[10px] text-primary">
                      {isGerman ? "Dauer:" : "Duration:"} {totalDuration} min
                    </div>
                  )}
                </div>
              </div>

              {dataLoading ? (
                <CalendarSkeleton />
              ) : !hasData ? (
                <p className="text-white/60 text-center py-8 text-sm">{isGerman ? "Keine Einträge für diesen Tag" : "No entries for this day"}</p>
              ) : (
                <div className="space-y-2 flex-1 overflow-y-auto">
                  {/* Workouts */}
                  {selectedDayData.workouts.map((w) => {
                    const exerciseName = w.notes?.split(" (")[0] || (isGerman ? w.exercises?.name_de : w.exercises?.name_en) || "Training";
                    const exerciseImage = findExerciseImage(exerciseName);
                    
                    return (
                      <div 
                        key={w.id} 
                        className={`p-2 bg-white/5 rounded-lg flex gap-2 items-start ${exerciseImage ? 'cursor-pointer hover:bg-white/10' : ''}`}
                        onClick={() => {
                          if (exerciseImage) {
                            setSelectedExerciseName(exerciseName);
                            setExerciseImageOpen(true);
                          }
                        }}
                      >
                        {exerciseImage && (
                          <div className="flex-shrink-0 w-10 h-10 rounded overflow-hidden bg-black/30 border border-white/10">
                            <img src={exerciseImage} alt={exerciseName} className="w-full h-full object-contain p-0.5" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-blue-400 text-xs flex items-center gap-1">
                            {isGerman ? "Training" : "Workout"}
                            {exerciseImage && <Image className="w-2.5 h-2.5 text-white/40" />}
                          </div>
                          <div className="text-xs text-white truncate">{w.notes || (isGerman ? w.exercises?.name_de : w.exercises?.name_en)}</div>
                          <div className="text-[10px] text-white/60">
                            {w.sets}×{w.reps} | {w.weight || 0}{w.unit || 'kg'}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Nutrition */}
                  {selectedDayData.nutrition.map((n) => (
                    <div key={n.id} className="p-2 bg-white/5 rounded-lg">
                      <div className="font-semibold text-green-400 text-xs">{isGerman ? "Ernährung" : "Nutrition"}</div>
                      <div className="text-xs text-white">{n.food_name}</div>
                      <div className="text-[10px] text-white/60">{n.calories} kcal | P: {n.protein || 0}g</div>
                    </div>
                  ))}

                  {/* Jogging */}
                  {selectedDayData.jogging.map((j) => (
                    <div key={j.id} className="p-2 bg-white/5 rounded-lg">
                      <div className="font-semibold text-purple-400 text-xs">Jogging</div>
                      <div className="text-xs text-white">{j.distance} km | {formatJoggingDuration(j.duration)}</div>
                      <div className="text-[10px] text-white/60">{j.calories || 0} kcal</div>
                    </div>
                  ))}

                  {/* Weight */}
                  {selectedDayData.weight.map((w) => (
                    <div key={w.id} className="p-2 bg-white/5 rounded-lg">
                      <div className="font-semibold text-orange-400 text-xs">{isGerman ? "Gewicht" : "Weight"}</div>
                      <div className="text-xs text-white">{w.weight} kg</div>
                    </div>
                  ))}

                  {/* Body Analysis */}
                  {selectedDayData.bodyAnalysis.map((ba) => (
                    <div key={ba.id} className="p-2 bg-white/5 rounded-lg">
                      <div className="font-semibold text-cyan-400 text-xs">{isGerman ? "Körperanalyse" : "Body Analysis"}</div>
                      {ba.image_url && <img src={ba.image_url} alt="" className="w-10 h-10 rounded object-cover mt-1" />}
                    </div>
                  ))}

                  {/* Food Analysis */}
                  {selectedDayData.foodAnalysis.map((fa) => (
                    <div key={fa.id} className="p-2 bg-white/5 rounded-lg">
                      <div className="font-semibold text-amber-400 text-xs">{isGerman ? "Essensanalyse" : "Food Analysis"}</div>
                      {fa.total_calories && <div className="text-[10px] text-white/60">{fa.total_calories} kcal</div>}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Column 3: Performance + Nutrition Pie - SMALLER */}
          <div className="space-y-3">
            {/* Performance Bar Chart - Smaller */}
            <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-2">
              <h3 className="text-xs font-bold mb-1 text-white">Performance</h3>
              <div className="h-20">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChartData}>
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={8} tickLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" domain={[0, 100]} fontSize={8} width={20} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: '10px' }} formatter={(value: number) => [`${value.toFixed(1)}h`, isGerman ? 'Std' : 'Hrs']} />
                    <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center text-[8px] text-white/50">{isGerman ? "Std/Monat" : "Hrs/Month"}</div>
            </Card>

            {/* Nutrition Pie Chart - Smaller */}
            <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-2">
              <h3 className="text-xs font-bold mb-1 text-white">{isGerman ? "Ernährung" : "Nutrition"}</h3>
              {nutritionPieData.length > 0 ? (
                <div className="flex items-center gap-2">
                  <div className="w-16 h-16 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={nutritionPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={15}
                          outerRadius={28}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {nutritionPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="text-sm font-bold text-white">{selectedDayNutrition.calories} kcal</div>
                    {nutritionPieData.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1 text-[10px]">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-white/70">{item.name}: {item.value}g</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center text-white/50 py-2 text-[10px]">
                  {isGerman ? "Keine Daten" : "No data"}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

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