import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dumbbell, ChevronLeft, Target, Calendar as CalendarIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { ExerciseImageDialog } from "@/components/ExerciseImageDialog";
import { allExercises } from "@/data/exerciseImages";
import { useLiveData } from "@/contexts/LiveDataContext";
import { useToast } from "@/hooks/use-toast";
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

const BodyworkoutPlan = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, setUserId } = useLiveData();
  const [isGerman, setIsGerman] = useState(true);
  const [userId, setLocalUserId] = useState<string>("");
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false);
  const [selectedExerciseName, setSelectedExerciseName] = useState("");
  
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
      categories: ["brust", "ruecken", "beine", "core"]
    }
  ];

  const getExercisesForModule = (moduleId: string): Exercise[] => {
    const module = trainingModules.find(m => m.id === moduleId);
    if (!module) return [];

    return allExercises.filter(ex => {
      const category = (ex as any).category?.toLowerCase();
      return module.categories.some(cat => category?.includes(cat));
    }).slice(0, 12);
  };

  const handleExerciseClick = (exercise: Exercise) => {
    setSelectedExerciseName(isGerman ? exercise.name_de : exercise.name);
    setExerciseDialogOpen(true);
  };

  const selectedModuleData = trainingModules.find(m => m.id === selectedModule);
  const exercises = selectedModule ? getExercisesForModule(selectedModule) : [];

  return (
    <div className="min-h-screen pb-24 relative">
      {/* Background */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bodyworkoutBg})` }}
      />
      <div className="fixed inset-0 bg-black/70" />

      <div className="relative z-10 max-w-screen-xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/dashboard")}
            className="text-white hover:bg-white/10"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Bodyworkout Plan</h1>
            <p className="text-white/60">
              {isGerman ? "Wähle dein Trainingsmodul" : "Choose your training module"}
            </p>
          </div>
        </div>

        {/* Challenges Box */}
        <Card 
          className="bg-black/40 backdrop-blur-sm border-white/10 p-4 mb-6 cursor-pointer hover:scale-[1.01] transition-all"
          onClick={() => setIsChallengeDialogOpen(true)}
        >
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-white">Challenges</h3>
          </div>

          {savedGoal ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xs text-white/60 mb-1">Weight</div>
                  <div className="text-xl font-bold text-white">{userWeight} kg</div>
                </div>
                <div>
                  <div className="text-xs text-white/60 mb-1">Goal</div>
                  <div className="text-xl font-bold text-green-400">{savedGoal.goal} kg</div>
                </div>
                <div>
                  <div className="text-xs text-white/60 mb-1">{isGerman ? "Tage übrig" : "Days Left"}</div>
                  <div className="text-xl font-bold text-primary flex items-center justify-center gap-1">
                    <CalendarIcon className="w-4 h-4" />
                    {daysRemaining}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">{isGerman ? "Fortschritt" : "Progress"}</span>
                  <span className="font-bold text-white">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </div>
          ) : (
            <div className="text-center text-white/60 py-4">
              {isGerman ? "Klicken um Challenge zu starten" : "Click to start a challenge"}
            </div>
          )}
        </Card>

        {/* Training Modules Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {trainingModules.map((module) => (
            <Card 
              key={module.id}
              onClick={() => setSelectedModule(module.id)} 
              className="relative overflow-hidden border-white/10 hover:scale-105 transition-all duration-300 cursor-pointer hover:border-primary/50 h-48 md:h-56"
            >
              <img 
                src={module.image} 
                alt={isGerman ? module.title_de : module.title} 
                className="absolute inset-0 w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <div className="flex items-center gap-2 mb-1">
                  <Dumbbell className="w-4 h-4 text-primary" />
                  <h3 className="text-lg font-bold">{isGerman ? module.title_de : module.title}</h3>
                </div>
                <p className="text-xs text-white/80">{isGerman ? module.description_de : module.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Module Exercises Dialog */}
      <Dialog open={!!selectedModule} onOpenChange={(open) => !open && setSelectedModule(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-primary" />
              {selectedModuleData && (isGerman ? selectedModuleData.title_de : selectedModuleData.title)}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-2">
              {exercises.map((exercise, idx) => (
                <Card 
                  key={idx}
                  onClick={() => handleExerciseClick(exercise)}
                  className="relative overflow-hidden cursor-pointer hover:scale-105 transition-all border-white/10 hover:border-primary/50"
                >
                  <div className="aspect-square">
                    <img 
                      src={exercise.image} 
                      alt={isGerman ? exercise.name_de : exercise.name} 
                      className="w-full h-full object-contain bg-black/20 p-2"
                    />
                  </div>
                  <div className="p-2 bg-black/60">
                    <p className="text-sm font-medium text-white truncate">
                      {isGerman ? exercise.name_de : exercise.name}
                    </p>
                  </div>
                </Card>
              ))}
              {exercises.length === 0 && (
                <div className="col-span-full text-center py-8 text-white/60">
                  {isGerman ? "Keine Übungen gefunden" : "No exercises found"}
                </div>
              )}
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
