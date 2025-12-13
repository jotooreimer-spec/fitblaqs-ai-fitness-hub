import { useEffect, useState } from "react";
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
import { format, startOfMonth, endOfMonth } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { CalendarSkeleton } from "@/components/AnalysisSkeleton";
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
  const [isGerman, setIsGerman] = useState(true);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [userId, setUserId] = useState<string>("");
  const [userWeight, setUserWeight] = useState(0);
  const [selectedDayData, setSelectedDayData] = useState<DayData>({ workouts: [], nutrition: [], jogging: [], weight: [], bodyAnalysis: [], foodAnalysis: [] });
  const [monthlyChartData, setMonthlyChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
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
        setBodyWeight(profile.weight.toString());
      }

      // Load saved challenge
      const saved = localStorage.getItem(`challenge_${session.user.id}`);
      if (saved) {
        setSavedGoal(JSON.parse(saved));
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
    const yearStart = new Date(selectedDate.getFullYear(), 0, 1);
    const yearEnd = new Date(selectedDate.getFullYear(), 11, 31, 23, 59, 59);

    const { data: workoutData } = await supabase
      .from("workout_logs")
      .select("*")
      .eq("user_id", uid)
      .gte("completed_at", yearStart.toISOString())
      .lte("completed_at", yearEnd.toISOString());

    const { data: joggingData } = await supabase
      .from("jogging_logs")
      .select("calories, duration, completed_at")
      .eq("user_id", uid)
      .gte("completed_at", yearStart.toISOString())
      .lte("completed_at", yearEnd.toISOString());

    // Build monthly chart data - only completed months show values
    const monthNames = isGerman 
      ? ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const selectedYear = selectedDate.getFullYear();
    
    const chartData = monthNames.map((month, index) => {
      // Only show values for completed months (past months)
      // Current month shows 0 until month ends
      const isCompletedMonth = selectedYear < currentYear || (selectedYear === currentYear && index < currentMonth);
      
      if (!isCompletedMonth) {
        return { month, hours: 0 };
      }
      
      const monthWorkouts = workoutData?.filter(w => {
        const d = new Date(w.completed_at);
        return d.getMonth() === index && d.getFullYear() === selectedYear;
      }) || [];
      const monthJogging = joggingData?.filter(j => {
        const d = new Date(j.completed_at);
        return d.getMonth() === index && d.getFullYear() === selectedYear;
      }) || [];
      
      // Calculate hours from duration (jogging in minutes, workouts estimate 30min each)
      const joggingHours = monthJogging.reduce((sum, j) => sum + ((j.duration || 0) / 60), 0);
      const workoutHours = monthWorkouts.reduce((sum, w) => sum + ((w.sets || 1) * 3 / 60), 0); // ~3min per set

      return { month, hours: Math.min(Math.round((joggingHours + workoutHours) * 10) / 10, 100) };
    });

    setMonthlyChartData(chartData);
  };

  const loadDayData = async (selectedDate: Date) => {
    if (!userId) return;
    setIsLoading(true);

    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);

    try {
      const [workoutsRes, nutritionRes, joggingRes, weightRes, bodyAnalysisRes, foodAnalysisRes] = await Promise.all([
        supabase.from("workout_logs").select("*, exercises(name_de, name_en, category)").eq("user_id", userId).gte("completed_at", dayStart.toISOString()).lte("completed_at", dayEnd.toISOString()),
        supabase.from("nutrition_logs").select("*").eq("user_id", userId).gte("completed_at", dayStart.toISOString()).lte("completed_at", dayEnd.toISOString()),
        supabase.from("jogging_logs").select("*").eq("user_id", userId).gte("completed_at", dayStart.toISOString()).lte("completed_at", dayEnd.toISOString()),
        supabase.from("weight_logs").select("*").eq("user_id", userId).gte("measured_at", dayStart.toISOString()).lte("measured_at", dayEnd.toISOString()),
        supabase.from("body_analysis").select("*").eq("user_id", userId).gte("created_at", dayStart.toISOString()).lte("created_at", dayEnd.toISOString()),
        supabase.from("food_analysis").select("*").eq("user_id", userId).gte("created_at", dayStart.toISOString()).lte("created_at", dayEnd.toISOString())
      ]);

      setSelectedDayData({
        workouts: workoutsRes.data || [],
        nutrition: nutritionRes.data || [],
        jogging: joggingRes.data || [],
        weight: weightRes.data || [],
        bodyAnalysis: bodyAnalysisRes.data || [],
        foodAnalysis: foodAnalysisRes.data || []
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  // Calculate total training duration for selected day
  const totalDuration = selectedDayData.jogging.reduce((sum, j) => sum + (j.duration || 0), 0) + (selectedDayData.workouts.length * 30);

  const daysRemaining = calculateDaysRemaining();
  const weightRemaining = calculateWeightRemaining();
  const progress = calculateProgress();

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

        {/* Challenges Box - Opens dialog like Fullbody */}
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
                  <div className="text-xs text-white/60 mb-1">{isGerman ? "Zielgewicht" : "Goal Weight"}</div>
                  <div className="text-2xl font-bold text-green-400">{savedGoal.goal} kg</div>
                </div>
                <div>
                  <div className="text-xs text-white/60 mb-1">{isGerman ? "Noch abzunehmen" : "Weight to lose"}</div>
                  <div className="text-2xl font-bold text-orange-400">{weightRemaining.toFixed(1)} kg</div>
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

            {/* Performance Bar Chart - Monthly */}
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
              <div className="text-center text-xs text-white/60 mt-2">{isGerman ? "Trainingsdauer pro Monat (Stunden)" : "Training Duration per Month (Hours)"}</div>
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

              {isLoading ? (
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

                  {/* Body Analysis with small images - clickable */}
                  {selectedDayData.bodyAnalysis.length > 0 && (
                    <div className="mt-4">
                      <div className="text-xs text-white/50 mb-2 font-semibold">{isGerman ? "Pro Athlete Body Upload" : "Pro Athlete Body Upload"}</div>
                      {selectedDayData.bodyAnalysis.map((ba) => {
                        const healthNotes = ba.health_notes ? (typeof ba.health_notes === 'string' ? JSON.parse(ba.health_notes) : ba.health_notes) : null;
                        return (
                          <div 
                            key={ba.id} 
                            className="p-3 bg-white/5 rounded-lg flex gap-3 items-start cursor-pointer hover:bg-white/10 transition-colors mb-2"
                            onClick={() => { setSelectedUpload({ type: 'body', data: ba }); setUploadDetailOpen(true); }}
                          >
                            {ba.image_url && (
                              <img src={ba.image_url} alt="Body" className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <div className="font-semibold text-cyan-400">{healthNotes?.upload_name || 'Body Upload'}</div>
                              <div className="text-sm text-white capitalize">{healthNotes?.upload_category || '-'}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Food Analysis with small images - clickable */}
                  {selectedDayData.foodAnalysis.length > 0 && (
                    <div className="mt-4">
                      <div className="text-xs text-white/50 mb-2 font-semibold">{isGerman ? "Pro Nutrition Food Upload" : "Pro Nutrition Food Upload"}</div>
                      {selectedDayData.foodAnalysis.map((fa) => {
                        const notes = fa.notes ? (typeof fa.notes === 'string' ? JSON.parse(fa.notes) : fa.notes) : null;
                        return (
                          <div 
                            key={fa.id} 
                            className="p-3 bg-white/5 rounded-lg flex gap-3 items-start cursor-pointer hover:bg-white/10 transition-colors mb-2"
                            onClick={() => { setSelectedUpload({ type: 'food', data: fa }); setUploadDetailOpen(true); }}
                          >
                            {fa.image_url && (
                              <img src={fa.image_url} alt="Food" className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <div className="font-semibold text-emerald-400">{notes?.upload_name || 'Food Upload'}</div>
                              <div className="text-sm text-white capitalize">{notes?.upload_category || fa.category || '-'}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              
              {/* Bodyworkoutplan Button */}
              <Button 
                onClick={() => setBodyworkoutDialogOpen(true)} 
                className="w-full mt-4 bg-primary/20 hover:bg-primary/30 text-white border border-primary/50"
              >
                <Dumbbell className="w-4 h-4 mr-2" />
                Bodyworkoutplan
              </Button>
            </Card>
          </div>
        </div>
      </div>

      {/* Challenges Dialog */}
      <Dialog open={isChallengeDialogOpen} onOpenChange={setIsChallengeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isGerman ? "Challenge einstellen" : "Set Challenge"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{isGerman ? "Aktuelles Körpergewicht (kg)" : "Current Body Weight (kg)"}</Label>
              <Input
                type="number"
                step="0.1"
                value={bodyWeight}
                onChange={(e) => setBodyWeight(e.target.value)}
                placeholder="75"
              />
            </div>
            <div>
              <Label>{isGerman ? "Zielgewicht (kg)" : "Goal Weight (kg)"}</Label>
              <Input
                type="number"
                step="0.1"
                value={goalWeight}
                onChange={(e) => setGoalWeight(e.target.value)}
                placeholder="65"
              />
            </div>
            <div>
              <Label>{isGerman ? "Zeitraum (Monate)" : "Duration (Months)"}</Label>
              <Input
                type="number"
                min="1"
                max="24"
                value={months}
                onChange={(e) => setMonths(e.target.value)}
                placeholder="3"
              />
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

      {/* Upload Detail Dialog - Only Name & Category */}
      <Dialog open={uploadDetailOpen} onOpenChange={setUploadDetailOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              {selectedUpload?.type === 'body' 
                ? (isGerman ? "Pro Athlete Body Upload" : "Pro Athlete Body Upload")
                : (isGerman ? "Pro Nutrition Food Upload" : "Pro Nutrition Food Upload")
              }
            </DialogTitle>
          </DialogHeader>
          {selectedUpload && (
            <div className="space-y-4">
              {/* Medium-sized image */}
              {selectedUpload.data.image_url && (
                <img 
                  src={selectedUpload.data.image_url} 
                  alt={selectedUpload.type === 'body' ? "Body" : "Food"} 
                  className="w-48 h-48 object-cover rounded-lg mx-auto"
                />
              )}
              
              {/* Only Name & Category */}
              <div className="space-y-2 text-center">
                {selectedUpload.type === 'body' ? (
                  <>
                    {(() => {
                      const healthNotes = selectedUpload.data.health_notes 
                        ? (typeof selectedUpload.data.health_notes === 'string' 
                          ? JSON.parse(selectedUpload.data.health_notes) 
                          : selectedUpload.data.health_notes) 
                        : null;
                      return (
                        <>
                          <div className="text-white font-semibold text-lg">{healthNotes?.upload_name || 'Body Analysis'}</div>
                          <div className="text-zinc-400">{healthNotes?.upload_category || '-'}</div>
                        </>
                      );
                    })()}
                  </>
                ) : (
                  <>
                    {(() => {
                      const notesData = selectedUpload.data.notes 
                        ? (typeof selectedUpload.data.notes === 'string' 
                          ? JSON.parse(selectedUpload.data.notes) 
                          : selectedUpload.data.notes) 
                        : null;
                      return (
                        <>
                          <div className="text-white font-semibold text-lg">{notesData?.upload_name || 'Food Analysis'}</div>
                          <div className="text-zinc-400">{notesData?.upload_category || selectedUpload.data.category || '-'}</div>
                        </>
                      );
                    })()}
                  </>
                )}
              </div>
              
              <div className="text-xs text-white/40 text-center">
                {format(new Date(selectedUpload.data.created_at), "dd.MM.yyyy HH:mm")}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bodyworkoutplan Dialog */}
      <Dialog open={bodyworkoutDialogOpen} onOpenChange={setBodyworkoutDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] bg-zinc-900 border-zinc-700">
          <DialogHeader>
            <DialogTitle className="text-white">Bodyworkoutplan</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <img 
              src={bodyworkoutImages[currentImageIndex]} 
              alt={`Bodyworkoutplan ${currentImageIndex + 1}`} 
              className="w-full rounded-lg"
            />
            <div className="flex justify-between items-center mt-4">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setCurrentImageIndex(prev => Math.max(0, prev - 1))}
                disabled={currentImageIndex === 0}
                className="bg-zinc-800 border-zinc-600"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-white text-sm">{currentImageIndex + 1} / {bodyworkoutImages.length}</span>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setCurrentImageIndex(prev => Math.min(bodyworkoutImages.length - 1, prev + 1))}
                disabled={currentImageIndex === bodyworkoutImages.length - 1}
                className="bg-zinc-800 border-zinc-600"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default CalendarPage;