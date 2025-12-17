import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target, Calendar as CalendarIcon, TrendingDown, ChevronLeft, ChevronRight, Dumbbell } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { CalendarSkeleton } from "@/components/AnalysisSkeleton";
import { useLiveData } from "@/contexts/LiveDataContext";
import performanceBg from "@/assets/performance-bg.png";
import bodyworkoutplan1 from "@/assets/bodyworkoutplan-1.png";
import bodyworkoutplan2 from "@/assets/bodyworkoutplan-2.png";
import bodyworkoutplan3 from "@/assets/bodyworkoutplan-3.png";
import bodyworkoutplan4 from "@/assets/bodyworkoutplan-4.png";
import bodyworkoutplan5 from "@/assets/bodyworkoutplan-5.png";

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

        {/* Challenges Box - Renamed labels: Weight, Weight Goal, Tage verbleibend */}
        <Card 
          className="bg-black/40 backdrop-blur-sm border-white/10 p-6 mb-6 cursor-pointer hover:scale-[1.02] transition-all"
          onClick={() => setIsChallengeDialogOpen(true)}
        >
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-white">Challenges</h3>
          </div>

          {savedGoal ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xs text-white/60 mb-1">Weight</div>
                  <div className="text-2xl font-bold text-white">{userWeight} kg</div>
                </div>
                <div>
                  <div className="text-xs text-white/60 mb-1">Weight Goal</div>
                  <div className="text-2xl font-bold text-green-400">{savedGoal.goal} kg</div>
                </div>
                <div>
                  <div className="text-xs text-white/60 mb-1">{isGerman ? "Tage verbleibend" : "Days remaining"}</div>
                  <div className="text-2xl font-bold text-primary flex items-center justify-center gap-1">
                    <CalendarIcon className="w-4 h-4" />
                    {daysRemaining}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">{isGerman ? "Fortschritt" : "Progress"}</span>
                  <span className="font-bold text-white">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>

              {userWeight < savedGoal.startWeight && (
                <div className="flex items-center justify-center gap-2 text-green-400 text-sm">
                  <TrendingDown className="w-4 h-4" />
                  <span>{(savedGoal.startWeight - userWeight).toFixed(1)} kg {isGerman ? "verloren" : "lost"}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-white/60 py-4">
              {isGerman ? "Klicken um Challenge zu starten" : "Click to start a challenge"}
            </div>
          )}
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Side */}
          <div className="space-y-6">
            <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-6">
              <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md" />
            </Card>

            {/* Performance Bar Chart - Monthly - LIVE from all training logs */}
            <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-4">
              <h3 className="text-lg font-bold mb-4 text-white">Performance</h3>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChartData}>
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" domain={[0, 100]} fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} formatter={(value: number) => [`${value.toFixed(1)}h`, isGerman ? 'Stunden' : 'Hours']} />
                    <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center text-xs text-white/60 mt-2">{isGerman ? "Trainingsdauer pro Monat (Stunden) - Live" : "Training Duration per Month (Hours) - Live"}</div>
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

              {dataLoading ? (
                <CalendarSkeleton />
              ) : !hasData ? (
                <p className="text-white/60 text-center py-8">{isGerman ? "Keine Einträge für diesen Tag" : "No entries for this day"}</p>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {/* Workouts - Category, Sets, Reps, KG/LBS, Kcal */}
                  {selectedDayData.workouts.map((w) => (
                    <div key={w.id} className="p-3 bg-white/5 rounded-lg">
                      <div className="font-semibold text-blue-400">{isGerman ? "Training" : "Workout"}</div>
                      <div className="text-sm text-white">{w.notes || (isGerman ? w.exercises?.name_de : w.exercises?.name_en)}</div>
                      <div className="text-xs text-white/60 mt-1">
                        Sets: {w.sets} | Reps: {w.reps} | {w.weight || 0} {w.unit || 'kg'} | {(w.sets * w.reps * 2)} kcal
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

                  {/* Jogging - with HH:MM:SS format */}
                  {selectedDayData.jogging.map((j) => (
                    <div key={j.id} className="p-3 bg-white/5 rounded-lg">
                      <div className="font-semibold text-purple-400">Jogging</div>
                      <div className="text-sm text-white">{j.distance} km | {formatJoggingDuration(j.duration)}</div>
                      <div className="text-xs text-white/60 mt-1">{j.calories || 0} kcal | {(j.distance / (j.duration > 100 ? j.duration / 3600 : j.duration / 60)).toFixed(1)} km/h</div>
                    </div>
                  ))}

                  {/* Weight */}
                  {selectedDayData.weight.map((w) => (
                    <div key={w.id} className="p-3 bg-white/5 rounded-lg">
                      <div className="font-semibold text-orange-400">{isGerman ? "Gewicht" : "Weight"}</div>
                      <div className="text-sm text-white">{w.weight} kg</div>
                    </div>
                  ))}

                  {/* Body Analysis */}
                  {selectedDayData.bodyAnalysis.map((ba) => {
                    const healthNotes = ba.health_notes ? (typeof ba.health_notes === 'string' ? JSON.parse(ba.health_notes) : ba.health_notes) : null;
                    return (
                      <div key={ba.id} className="p-3 bg-white/5 rounded-lg">
                        <div className="font-semibold text-cyan-400">Pro Athlete</div>
                        {ba.image_url && <img src={ba.image_url} alt="" className="w-12 h-12 rounded object-cover mt-1" />}
                        {healthNotes?.weight && <div className="text-xs text-white/60 mt-1">{healthNotes.weight}{healthNotes.weight_unit || 'kg'}</div>}
                        {healthNotes?.training_time && <div className="text-xs text-white/60">{healthNotes.training_time}h Training</div>}
                      </div>
                    );
                  })}

                  {/* Food Analysis */}
                  {selectedDayData.foodAnalysis.map((fa) => {
                    const notes = fa.notes ? (typeof fa.notes === 'string' ? JSON.parse(fa.notes) : fa.notes) : null;
                    return (
                      <div key={fa.id} className="p-3 bg-white/5 rounded-lg">
                        <div className="font-semibold text-amber-400">Pro Nutrition</div>
                        {fa.image_url && <img src={fa.image_url} alt="" className="w-12 h-12 rounded object-cover mt-1" />}
                        {fa.total_calories && <div className="text-xs text-white/60 mt-1">{fa.total_calories} kcal</div>}
                        {notes?.upload_name && <div className="text-xs text-white/60">{notes.upload_name}</div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Bodyworkoutplan Button */}
            <Button 
              onClick={() => setBodyworkoutDialogOpen(true)}
              className="w-full"
              variant="outline"
            >
              <Dumbbell className="w-4 h-4 mr-2" />
              Bodyworkoutplan
            </Button>
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

      <BottomNav />
    </div>
  );
};

export default CalendarPage;