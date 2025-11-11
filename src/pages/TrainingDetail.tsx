import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
}

const TrainingDetail = () => {
  const { muscleGroup } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGerman, setIsGerman] = useState(true);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [newExercise, setNewExercise] = useState({
    name: "",
    sets: "",
    reps: "",
    weight: "",
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("fitblaqs_user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setIsGerman(user.language === "de");
      
      // Apply theme
      const theme = user.gender === "female" ? "theme-female" : "";
      if (theme) {
        document.documentElement.classList.add(theme);
      }
    }

    // Load saved exercises
    const savedExercises = localStorage.getItem(`training_${muscleGroup}`);
    if (savedExercises) {
      setExercises(JSON.parse(savedExercises));
    }
  }, [muscleGroup]);

  const addExercise = () => {
    if (!newExercise.name || !newExercise.sets || !newExercise.reps) {
      toast({
        title: isGerman ? "Fehler" : "Error",
        description: isGerman ? "Bitte alle Pflichtfelder ausfüllen" : "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    const exercise: Exercise = {
      id: Date.now().toString(),
      name: newExercise.name,
      sets: parseInt(newExercise.sets),
      reps: parseInt(newExercise.reps),
      weight: parseFloat(newExercise.weight) || 0,
    };

    const updatedExercises = [...exercises, exercise];
    setExercises(updatedExercises);
    localStorage.setItem(`training_${muscleGroup}`, JSON.stringify(updatedExercises));

    setNewExercise({ name: "", sets: "", reps: "", weight: "" });
    
    toast({
      title: isGerman ? "Übung hinzugefügt" : "Exercise added",
      description: isGerman ? "Deine Übung wurde gespeichert" : "Your exercise has been saved",
    });
  };

  const deleteExercise = (id: string) => {
    const updatedExercises = exercises.filter((ex) => ex.id !== id);
    setExercises(updatedExercises);
    localStorage.setItem(`training_${muscleGroup}`, JSON.stringify(updatedExercises));
    
    toast({
      title: isGerman ? "Übung gelöscht" : "Exercise deleted",
    });
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
          <h1 className="text-4xl font-bold capitalize">{muscleGroup}</h1>
        </div>

        {/* Add Exercise Form */}
        <Card className="gradient-card card-shadow border-white/10 p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">
            {isGerman ? "Neue Übung" : "New Exercise"}
          </h2>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="name">
                {isGerman ? "Übungsname" : "Exercise Name"}
              </Label>
              <Input
                id="name"
                value={newExercise.name}
                onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                placeholder={isGerman ? "z.B. Bankdrücken" : "e.g. Bench Press"}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="sets">
                  {isGerman ? "Sätze" : "Sets"}
                </Label>
                <Input
                  id="sets"
                  type="number"
                  value={newExercise.sets}
                  onChange={(e) => setNewExercise({ ...newExercise, sets: e.target.value })}
                  placeholder="3"
                />
              </div>
              <div>
                <Label htmlFor="reps">
                  {isGerman ? "Wiederholungen" : "Reps"}
                </Label>
                <Input
                  id="reps"
                  type="number"
                  value={newExercise.reps}
                  onChange={(e) => setNewExercise({ ...newExercise, reps: e.target.value })}
                  placeholder="10"
                />
              </div>
              <div>
                <Label htmlFor="weight">
                  {isGerman ? "Gewicht (kg)" : "Weight (kg)"}
                </Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.5"
                  value={newExercise.weight}
                  onChange={(e) => setNewExercise({ ...newExercise, weight: e.target.value })}
                  placeholder="20"
                />
              </div>
            </div>
            <Button onClick={addExercise} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              {isGerman ? "Übung hinzufügen" : "Add Exercise"}
            </Button>
          </div>
        </Card>

        {/* Exercise List */}
        <div>
          <h2 className="text-2xl font-bold mb-4">
            {isGerman ? "Deine Übungen" : "Your Exercises"}
          </h2>
          {exercises.length === 0 ? (
            <Card className="gradient-card card-shadow border-white/10 p-8 text-center">
              <p className="text-muted-foreground">
                {isGerman ? "Noch keine Übungen hinzugefügt" : "No exercises added yet"}
              </p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {exercises.map((exercise) => (
                <Card
                  key={exercise.id}
                  className="gradient-card card-shadow border-white/10 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-2">{exercise.name}</h3>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>
                          {exercise.sets} {isGerman ? "Sätze" : "Sets"}
                        </span>
                        <span>×</span>
                        <span>
                          {exercise.reps} {isGerman ? "Wdh." : "Reps"}
                        </span>
                        {exercise.weight > 0 && (
                          <>
                            <span>×</span>
                            <span>{exercise.weight} kg</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteExercise(exercise.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainingDetail;
