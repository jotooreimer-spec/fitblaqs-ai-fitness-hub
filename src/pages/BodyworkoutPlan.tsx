import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dumbbell, ChevronLeft, Target, Calendar as CalendarIcon, History, Image } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { ExerciseImageDialog } from "@/components/ExerciseImageDialog";
import { allExercises } from "@/data/exerciseImages";
import { useLiveData } from "@/contexts/LiveDataContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import bodyworkoutBg from "@/assets/bodyworkout-bg.png";
import upperbodyImg from "@/assets/upperbody-bg.png";
import middlebodyImg from "@/assets/middlebody.png";
import lowerbodyImg from "@/assets/lowerbody.png";
import dashboardBg from "@/assets/dashboard-bg.png";

interface Exercise {
  name: string;
  name_de: string;
  image: string;
  description_en?: string;
  description_de?: string;
}

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

const BodyworkoutPlan = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, setUserId, workoutLogs } = useLiveData();
  const [isGerman, setIsGerman] = useState(true);
  const [userId, setLocalUserId] = useState<string>("");
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false);
  const [selectedExerciseName, setSelectedExerciseName] = useState("");
  const [activeTab, setActiveTab] = useState("modules");
  
  // Challenges state
  const [isChallengeDialogOpen, setIsChallengeDialogOpen] = useState(false);
  const [goalWeight, setGoalWeight] = useState("");
  const [months, setMonths] = useState("");
  const [bodyWeight, setBodyWeight] = useState("");
  const [savedGoal, setSavedGoal] = useState<{ goal: number; months: number; startWeight: number; startDate: string } | null>(null);
  const [userWeight, setUserWeight] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
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
  }, [navigate, setUserId]);

  // Update user weight from profile
  useEffect(() => {
    if (profile?.weight) {
      setUserWeight(profile.weight);
      setBodyWeight(profile.weight.toString());
    }
  }, [profile]);

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

  const calculateProgress = () => {
    if (!savedGoal || !userWeight) return 0;
    const totalToLose = savedGoal.startWeight - savedGoal.goal;
    const lost = savedGoal.startWeight - userWeight;
    if (totalToLose <= 0) return 100;
    return Math.min(100, Math.max(0, (lost / totalToLose) * 100));
  };

  const daysRemaining = calculateDaysRemaining();
  const progress = calculateProgress();

  const trainingModules = [
    { 
      id: "upper_body",
      image: upperbodyImg,
      title: "Upper Body",
      title_de: "Oberkörper",
      description: "Chest, Back, Shoulders, Arms",
      description_de: "Brust, Rücken, Schultern, Arme",
      categories: ["brust", "ruecken", "schulter", "bizeps", "trizeps"]
    },
    { 
      id: "core",
      image: middlebodyImg,
      title: "Core",
      title_de: "Core",
      description: "Core, Abs",
      description_de: "Core, Bauch",
      categories: ["core", "bauch"]
    },
    { 
      id: "lower_body",
      image: lowerbodyImg,
      title: "Lower Body",
      title_de: "Unterkörper",
      description: "Legs, Glutes, Calves",
      description_de: "Beine, Po, Waden",
      categories: ["beine", "po", "waden", "squats"]
    },
    { 
      id: "fullbody",
      image: dashboardBg,
      title: "Fullbody",
      title_de: "Ganzkörper",
      description: "Full Body Workout",
      description_de: "Ganzkörper Training",
      categories: ["brust", "ruecken", "beine", "core", "schulter", "bizeps", "trizeps", "po", "waden", "squats", "bauch"]
    }
  ];

  // Get saved workouts for a specific module based on categories
  const getWorkoutsForModule = (moduleId: string) => {
    const module = trainingModules.find(m => m.id === moduleId);
    if (!module) return [];

    return workoutLogs.filter(log => {
      const exerciseName = log.notes?.split(" (")[0] || "";
      const exercise = allExercises.find(
        ex => ex.name.toLowerCase() === exerciseName.toLowerCase() || 
              ex.name_de.toLowerCase() === exerciseName.toLowerCase() ||
              exerciseName.toLowerCase().includes(ex.name.toLowerCase()) ||
              exerciseName.toLowerCase().includes(ex.name_de.toLowerCase())
      );
      
      if (!exercise) return false;
      
      const category = (exercise as any).category?.toLowerCase() || "";
      return module.categories.some(cat => category.includes(cat));
    });
  };

  // Get all workouts for history view
  const allWorkoutsGroupedByDate = useMemo(() => {
    const grouped: { [key: string]: typeof workoutLogs } = {};
    workoutLogs.forEach(log => {
      const dateKey = format(new Date(log.completed_at), "yyyy-MM-dd");
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(log);
    });
    return Object.entries(grouped)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .slice(0, 30);
  }, [workoutLogs]);

  const handleExerciseClick = (exerciseName: string) => {
    setSelectedExerciseName(exerciseName);
    setExerciseDialogOpen(true);
  };

  const selectedModuleData = trainingModules.find(m => m.id === selectedModule);
  const moduleWorkouts = selectedModule ? getWorkoutsForModule(selectedModule) : [];

  return (
    <div className="min-h-screen pb-24 relative">
      {/* Background */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bodyworkoutBg})` }}
      />
      <div className="fixed inset-0 bg-black/70" />

      <div className="relative z-10 max-w-screen-xl mx-auto p-4 md:p-6">
        {/* Header */}
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
            <h1 className="text-2xl font-bold text-white">Bodyworkout Plan</h1>
            <p className="text-white/60 text-xs">
              {isGerman ? "Wähle dein Trainingsmodul" : "Choose your training module"}
            </p>
          </div>
        </div>

        {/* Challenges Box - Compact */}
        <Card 
          className="bg-black/40 backdrop-blur-sm border-white/10 p-3 mb-4 cursor-pointer hover:scale-[1.01] transition-all"
          onClick={() => setIsChallengeDialogOpen(true)}
        >
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-white">Challenges</h3>
          </div>

          {savedGoal ? (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-[10px] text-white/60">Weight</div>
                  <div className="text-sm font-bold text-white">{userWeight} kg</div>
                </div>
                <div>
                  <div className="text-[10px] text-white/60">Goal</div>
                  <div className="text-sm font-bold text-green-400">{savedGoal.goal} kg</div>
                </div>
                <div>
                  <div className="text-[10px] text-white/60">{isGerman ? "Tage" : "Days"}</div>
                  <div className="text-sm font-bold text-primary flex items-center justify-center gap-0.5">
                    <CalendarIcon className="w-3 h-3" />
                    {daysRemaining}
                  </div>
                </div>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>
          ) : (
            <div className="text-center text-white/60 py-2 text-xs">
              {isGerman ? "Klicken um Challenge zu starten" : "Click to start a challenge"}
            </div>
          )}
        </Card>

        {/* Tabs for Modules and History */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList className="w-full bg-black/40 border border-white/10">
            <TabsTrigger value="modules" className="flex-1 text-xs">
              <Dumbbell className="w-3 h-3 mr-1" />
              {isGerman ? "Module" : "Modules"}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 text-xs">
              <History className="w-3 h-3 mr-1" />
              {isGerman ? "Verlauf" : "History"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="modules" className="mt-4">
            {/* Training Modules Grid */}
            <div className="grid grid-cols-2 gap-3">
              {trainingModules.map((module) => {
                const moduleWorkoutCount = getWorkoutsForModule(module.id).length;
                return (
                  <Card 
                    key={module.id}
                    onClick={() => setSelectedModule(module.id)} 
                    className="relative overflow-hidden border-white/10 hover:scale-105 transition-all duration-300 cursor-pointer hover:border-primary/50 h-32 md:h-40"
                  >
                    <img 
                      src={module.image} 
                      alt={isGerman ? module.title_de : module.title} 
                      className="absolute inset-0 w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Dumbbell className="w-3 h-3 text-primary" />
                        <h3 className="text-sm font-bold">{isGerman ? module.title_de : module.title}</h3>
                      </div>
                      <p className="text-[10px] text-white/80 line-clamp-1">{isGerman ? module.description_de : module.description}</p>
                      {moduleWorkoutCount > 0 && (
                        <div className="text-[10px] text-primary mt-1">
                          {moduleWorkoutCount} {isGerman ? "Übungen gespeichert" : "exercises saved"}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            {/* All Training History */}
            <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-3">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />
                {isGerman ? "Trainingsverlauf" : "Training History"}
              </h3>
              
              <ScrollArea className="h-[400px]">
                {allWorkoutsGroupedByDate.length === 0 ? (
                  <div className="text-center py-8 text-white/60 text-sm">
                    {isGerman ? "Noch keine Trainingseinträge" : "No training entries yet"}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allWorkoutsGroupedByDate.map(([dateKey, logs]) => (
                      <div key={dateKey}>
                        <div className="text-xs text-primary mb-1.5 font-medium">
                          {format(new Date(dateKey), "dd.MM.yyyy")}
                        </div>
                        <div className="space-y-1.5">
                          {logs.map((log) => {
                            const exerciseName = log.notes?.split(" (")[0] || "Training";
                            const exerciseImage = findExerciseImage(exerciseName);
                            
                            return (
                              <div 
                                key={log.id} 
                                className="p-2 bg-white/5 rounded-lg flex gap-2 items-center cursor-pointer hover:bg-white/10"
                                onClick={() => exerciseImage && handleExerciseClick(exerciseName)}
                              >
                                {exerciseImage && (
                                  <div className="flex-shrink-0 w-10 h-10 rounded overflow-hidden bg-black/30 border border-white/10">
                                    <img src={exerciseImage} alt={exerciseName} className="w-full h-full object-contain p-0.5" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-medium text-white truncate">{exerciseName}</div>
                                  <div className="text-[10px] text-white/60">
                                    {log.sets}×{log.reps} | {log.weight || 0}{log.unit || 'kg'}
                                  </div>
                                </div>
                                {exerciseImage && <Image className="w-3 h-3 text-white/40" />}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Module Exercises Dialog - Shows saved workouts from this module */}
      <Dialog open={!!selectedModule} onOpenChange={(open) => !open && setSelectedModule(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col bg-background/95 backdrop-blur">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Dumbbell className="w-5 h-5 text-primary" />
              {selectedModuleData && (isGerman ? selectedModuleData.title_de : selectedModuleData.title)}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="flex-1">
            {moduleWorkouts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Dumbbell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {isGerman 
                    ? "Noch keine Übungen in diesem Modul gespeichert" 
                    : "No exercises saved in this module yet"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isGerman 
                    ? "Speichere Trainings im Dashboard um sie hier zu sehen" 
                    : "Save workouts in the Dashboard to see them here"}
                </p>
              </div>
            ) : (
              <div className="space-y-2 p-2">
                {moduleWorkouts.map((log) => {
                  const exerciseName = log.notes?.split(" (")[0] || "Training";
                  const exerciseImage = findExerciseImage(exerciseName);
                  
                  return (
                    <Card 
                      key={log.id}
                      onClick={() => exerciseImage && handleExerciseClick(exerciseName)}
                      className="p-3 cursor-pointer hover:bg-accent/50 transition-colors border-border/50"
                    >
                      <div className="flex gap-3 items-center">
                        {exerciseImage && (
                          <div className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-black/20 border border-border">
                            <img src={exerciseImage} alt={exerciseName} className="w-full h-full object-contain p-1" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{exerciseName}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {log.sets} {isGerman ? "Sätze" : "Sets"} × {log.reps} {isGerman ? "Wdh" : "Reps"}
                            {log.weight && log.weight > 0 && ` | ${log.weight} ${log.unit || 'kg'}`}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {format(new Date(log.completed_at), "dd.MM.yyyy HH:mm")}
                          </div>
                        </div>
                        {exerciseImage && <Image className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Challenge Dialog */}
      <Dialog open={isChallengeDialogOpen} onOpenChange={setIsChallengeDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">{isGerman ? "Challenge einstellen" : "Set Challenge"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">{isGerman ? "Aktuelles Gewicht (kg)" : "Current Weight (kg)"}</Label>
              <Input type="number" value={bodyWeight} onChange={(e) => setBodyWeight(e.target.value)} placeholder="70" className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Weight Goal (kg)</Label>
              <Input type="number" value={goalWeight} onChange={(e) => setGoalWeight(e.target.value)} placeholder="65" className="h-9" />
            </div>
            <div>
              <Label className="text-xs">{isGerman ? "Zeitraum (Monate)" : "Duration (Months)"}</Label>
              <Input type="number" min="1" max="24" value={months} onChange={(e) => setMonths(e.target.value)} placeholder="3" className="h-9" />
            </div>
            <Button onClick={handleSaveChallenge} className="w-full" size="sm">
              {isGerman ? "Challenge starten" : "Start Challenge"}
            </Button>
            {savedGoal && (
              <Button 
                variant="outline" 
                className="w-full"
                size="sm"
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

      {/* Exercise Image Dialog */}
      <ExerciseImageDialog
        open={exerciseDialogOpen}
        onOpenChange={setExerciseDialogOpen}
        exerciseName={selectedExerciseName}
        isGerman={isGerman}
      />

      <BottomNav />
    </div>
  );
};

export default BodyworkoutPlan;