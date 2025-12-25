import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Dumbbell, ChevronLeft, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ExerciseImageDialog } from "@/components/ExerciseImageDialog";
import { allExercises } from "@/data/exerciseImages";
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
  const [isGerman, setIsGerman] = useState(true);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false);
  const [selectedExerciseName, setSelectedExerciseName] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
        return;
      }
      const metadata = session.user.user_metadata;
      setIsGerman(metadata.language === "de");
    });
  }, [navigate]);

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
