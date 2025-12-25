import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";

// Import exercise images for Upper Body
import arnoldPress from "@/assets/exercises/upperbody/arnold-press.jpg";
import barbellCurl from "@/assets/exercises/upperbody/barbell-curl.jpg";
import barbellFrontRaise from "@/assets/exercises/upperbody/barbell-front-raise.jpg";
import benchPress from "@/assets/exercises/upperbody/bench-press.jpg";
import cableFly from "@/assets/exercises/upperbody/cable-fly.jpg";
import chestPress from "@/assets/exercises/upperbody/chest-press.jpg";
import closeGripBenchPress from "@/assets/exercises/upperbody/close-grip-bench-press.jpg";
import deadlift from "@/assets/exercises/upperbody/deadlift.jpg";
import diamondPushUps from "@/assets/exercises/upperbody/diamond-push-ups.jpg";

// Map image URLs to imported images
const exerciseImageMap: { [key: string]: string } = {
  "/exercises/upperbody/arnold-press.jpg": arnoldPress,
  "/exercises/upperbody/barbell-curl.jpg": barbellCurl,
  "/exercises/upperbody/barbell-front-raise.jpg": barbellFrontRaise,
  "/exercises/upperbody/bench-press.jpg": benchPress,
  "/exercises/upperbody/cable-fly.jpg": cableFly,
  "/exercises/upperbody/chest-press.jpg": chestPress,
  "/exercises/upperbody/close-grip-bench-press.jpg": closeGripBenchPress,
  "/exercises/upperbody/deadlift.jpg": deadlift,
  "/exercises/upperbody/diamond-push-ups.jpg": diamondPushUps,
};

interface Exercise {
  id: string;
  name_de: string;
  name_en: string;
  description_de: string;
  description_en: string;
  category: string;
  body_part: string;
  image_url: string | null;
}

interface WorkoutLog {
  sets: number;
  reps: number;
  weight: number;
  unit: string;
}

const ExerciseCategory = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { category } = useParams<{ category: string }>();
  const [isGerman, setIsGerman] = useState(true);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [workoutForm, setWorkoutForm] = useState<WorkoutLog>({
    sets: 3,
    reps: 10,
    weight: 0,
    unit: "kg"
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
        return;
      }

      const metadata = session.user.user_metadata;
      setIsGerman(metadata.language === "de");
      
      // Apply theme
      const theme = metadata.gender === "female" ? "theme-female" : "";
      if (theme) {
        document.documentElement.classList.add(theme);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (category) {
      loadExercises();
    }
  }, [category]);

  const loadExercises = async () => {
    const { data, error } = await supabase
      .from("exercises")
      .select("*")
      .ilike("category", category?.toLowerCase() || "");

    if (error) {
      console.error("Error loading exercises:", error);
      return;
    }

    setExercises(data || []);
  };

  const handleLogWorkout = async () => {
    if (!selectedExercise) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from("workout_logs")
      .insert({
        user_id: session.user.id,
        exercise_id: selectedExercise.id,
        sets: workoutForm.sets,
        reps: workoutForm.reps,
        weight: workoutForm.weight,
        unit: workoutForm.unit
      });

    if (error) {
      toast({
        title: isGerman ? "Fehler" : "Error",
        description: isGerman ? "Workout konnte nicht gespeichert werden" : "Could not save workout",
        variant: "destructive"
      });
      return;
    }

    setIsLogDialogOpen(false);
    setSelectedExercise(null);
    setWorkoutForm({ sets: 3, reps: 10, weight: 0, unit: "kg" });
    
    toast({
      title: isGerman ? "Gespeichert!" : "Saved!",
      description: isGerman ? "Workout erfolgreich eingetragen" : "Workout logged successfully"
    });
  };

  const getCategoryTitle = () => {
    const categoryMap: { [key: string]: { de: string; en: string } } = {
      beine: { de: "Beine", en: "Legs" },
      waden: { de: "Waden", en: "Calves" },
      squats: { de: "Squats", en: "Squats" },
      po: { de: "Po", en: "Glutes" },
      brust: { de: "Brust", en: "Chest" },
      ruecken: { de: "Rücken", en: "Back" },
      core: { de: "Core", en: "Core" },
      schulter: { de: "Schultern", en: "Shoulders" },
      trizeps: { de: "Trizeps", en: "Triceps" },
      bizeps: { de: "Bizeps", en: "Biceps" },
      bauch: { de: "Bauch", en: "Abs" }
    };

    const cat = category?.toLowerCase() || "";
    return isGerman ? categoryMap[cat]?.de || cat : categoryMap[cat]?.en || cat;
  };

  const getExerciseImage = (imageUrl: string | null): string | null => {
    if (!imageUrl) return null;
    return exerciseImageMap[imageUrl] || null;
  };

  return (
    <div className="min-h-screen pb-24 gradient-male">
      <div className="max-w-screen-xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="text-foreground"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-4xl font-bold capitalize">
            {getCategoryTitle()}
          </h1>
        </div>

        {/* Exercises List */}
        <div className="grid gap-4">
          {exercises.map((exercise) => {
            const exerciseImage = getExerciseImage(exercise.image_url);
            
            return (
              <Card
                key={exercise.id}
                className="gradient-card card-shadow border-white/10 p-4 overflow-hidden"
              >
                <div className="flex items-center gap-4">
                  {/* Exercise Icon/Image - Prominent and proportional */}
                  {exerciseImage && (
                    <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-white/10 border border-white/20">
                      <img 
                        src={exerciseImage} 
                        alt={isGerman ? exercise.name_de : exercise.name_en}
                        className="w-full h-full object-contain p-1"
                      />
                    </div>
                  )}
                  
                  {/* Exercise Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                      {isGerman ? exercise.name_de : exercise.name_en}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {isGerman ? exercise.description_de : exercise.description_en}
                    </p>
                    <span className="text-xs text-primary/70 mt-1 inline-block capitalize">
                      {exercise.body_part === "upper_body" 
                        ? (isGerman ? "Oberkörper" : "Upper Body")
                        : (isGerman ? "Unterkörper" : "Lower Body")
                      }
                    </span>
                  </div>

                  {/* Log Button */}
                  <Dialog open={isLogDialogOpen && selectedExercise?.id === exercise.id} onOpenChange={(open) => {
                    setIsLogDialogOpen(open);
                    if (!open) setSelectedExercise(null);
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => {
                          setSelectedExercise(exercise);
                          setIsLogDialogOpen(true);
                        }}
                        size="sm"
                        className="flex-shrink-0"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        {isGerman ? "Log" : "Log"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                          {exerciseImage && (
                            <img 
                              src={exerciseImage} 
                              alt="" 
                              className="w-10 h-10 rounded-lg object-contain bg-white/10 p-1"
                            />
                          )}
                          {isGerman ? "Workout eintragen" : "Log Workout"}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>{isGerman ? "Übung" : "Exercise"}</Label>
                          <p className="font-semibold">
                            {isGerman ? exercise.name_de : exercise.name_en}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="sets">{isGerman ? "Sätze" : "Sets"}</Label>
                            <Input
                              id="sets"
                              type="number"
                              min="1"
                              value={workoutForm.sets}
                              onChange={(e) => setWorkoutForm({ ...workoutForm, sets: parseInt(e.target.value) || 1 })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="reps">{isGerman ? "Wiederholungen" : "Reps"}</Label>
                            <Input
                              id="reps"
                              type="number"
                              min="1"
                              value={workoutForm.reps}
                              onChange={(e) => setWorkoutForm({ ...workoutForm, reps: parseInt(e.target.value) || 1 })}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="weight">{isGerman ? "Gewicht" : "Weight"}</Label>
                            <Input
                              id="weight"
                              type="number"
                              step="0.5"
                              min="0"
                              value={workoutForm.weight}
                              onChange={(e) => setWorkoutForm({ ...workoutForm, weight: parseFloat(e.target.value) || 0 })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="unit">{isGerman ? "Einheit" : "Unit"}</Label>
                            <select
                              id="unit"
                              className="w-full h-10 px-3 rounded-md border border-input bg-background"
                              value={workoutForm.unit}
                              onChange={(e) => setWorkoutForm({ ...workoutForm, unit: e.target.value })}
                            >
                              <option value="kg">kg</option>
                              <option value="lbs">lbs</option>
                            </select>
                          </div>
                        </div>
                        <Button onClick={handleLogWorkout} className="w-full">
                          {isGerman ? "Speichern" : "Save"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </Card>
            );
          })}

          {exercises.length === 0 && (
            <Card className="gradient-card card-shadow border-white/10 p-8 text-center">
              <p className="text-muted-foreground">
                {isGerman ? "Keine Übungen in dieser Kategorie" : "No exercises in this category"}
              </p>
            </Card>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default ExerciseCategory;