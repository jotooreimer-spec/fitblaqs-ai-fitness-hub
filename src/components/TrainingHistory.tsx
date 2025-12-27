import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Trash2, Check, X, Image, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ExerciseImageDialog } from "./ExerciseImageDialog";
import { allExercises } from "@/data/exerciseImages";

interface WorkoutLog {
  id: string;
  sets: number;
  reps: number;
  weight: number | null;
  unit: string | null;
  completed_at: string;
  notes: string | null;
  saved_to_calendar?: boolean;
  exercises: {
    name_de: string;
    name_en: string;
    body_part?: string;
  } | null;
}

interface ExerciseSet {
  sets: string;
  reps: string;
  weight: string;
  unit: string;
}

interface TrainingHistoryProps {
  userId: string;
  isGerman: boolean;
  refreshTrigger: number;
  maxEntries?: number;
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

// Parse body part from notes
const parseBodyPart = (notes: string | null): string => {
  if (!notes) return "";
  const match = notes.match(/\(([^)]+)\)/);
  return match ? match[1] : "";
};

// Parse exercise name from notes
const parseExerciseName = (notes: string | null): string => {
  if (!notes) return "";
  return notes.split(" (")[0] || "";
};

export const TrainingHistory = ({ userId, isGerman, refreshTrigger, maxEntries = 10 }: TrainingHistoryProps) => {
  const { toast } = useToast();
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [exerciseSets, setExerciseSets] = useState<ExerciseSet[]>([
    { sets: "", reps: "", weight: "", unit: "kg" },
    { sets: "", reps: "", weight: "", unit: "kg" },
    { sets: "", reps: "", weight: "", unit: "kg" }
  ]);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedExerciseName, setSelectedExerciseName] = useState("");

  useEffect(() => {
    loadWorkouts();
  }, [userId, refreshTrigger]);

  const loadWorkouts = async () => {
    const { data, error } = await supabase
      .from('workout_logs')
      .select(`
        id,
        sets,
        reps,
        weight,
        unit,
        completed_at,
        notes,
        exercises (
          name_de,
          name_en
        )
      `)
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(maxEntries);

    if (error) {
      console.error('Error loading workouts:', error);
      return;
    }

    setWorkouts(data || []);
  };

  const handleSaveToCalendar = async (workout: WorkoutLog) => {
    setSavedItems(prev => new Set(prev).add(workout.id));
    
    toast({
      title: isGerman ? "Gespeichert" : "Saved",
      description: isGerman 
        ? `Training wurde im Kalender unter ${format(new Date(workout.completed_at), "dd.MM.yyyy")} gespeichert` 
        : `Training saved to calendar on ${format(new Date(workout.completed_at), "dd.MM.yyyy")}`
    });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('workout_logs')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: isGerman ? "Fehler" : "Error",
        description: isGerman ? "Löschen fehlgeschlagen" : "Delete failed",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: isGerman ? "Gelöscht" : "Deleted",
      description: isGerman ? "Training wurde gelöscht" : "Training was deleted"
    });

    loadWorkouts();
  };

  const startEditing = (workout: WorkoutLog) => {
    if (savedItems.has(workout.id)) {
      toast({
        title: isGerman ? "Nicht bearbeitbar" : "Not editable",
        description: isGerman ? "Gespeicherte Einträge können nicht bearbeitet werden" : "Saved entries cannot be edited",
        variant: "destructive"
      });
      return;
    }
    
    setEditingId(workout.id);
    setExerciseSets([
      { sets: workout.sets.toString(), reps: workout.reps.toString(), weight: workout.weight?.toString() || "0", unit: workout.unit || "kg" },
      { sets: "", reps: "", weight: "", unit: "kg" },
      { sets: "", reps: "", weight: "", unit: "kg" }
    ]);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setExerciseSets([
      { sets: "", reps: "", weight: "", unit: "kg" },
      { sets: "", reps: "", weight: "", unit: "kg" },
      { sets: "", reps: "", weight: "", unit: "kg" }
    ]);
  };

  const updateSet = (index: number, field: keyof ExerciseSet, value: string) => {
    const newSets = [...exerciseSets];
    newSets[index] = { ...newSets[index], [field]: value };
    setExerciseSets(newSets);
  };

  const saveEditing = async (workout: WorkoutLog) => {
    const validSets = exerciseSets.filter(s => s.sets && s.reps);
    if (validSets.length === 0) {
      toast({
        title: isGerman ? "Fehler" : "Error",
        description: isGerman ? "Mindestens ein Satz erforderlich" : "At least one set required",
        variant: "destructive"
      });
      return;
    }

    // Update the first set
    const firstSet = validSets[0];
    const { error: updateError } = await supabase
      .from('workout_logs')
      .update({
        sets: parseInt(firstSet.sets),
        reps: parseInt(firstSet.reps),
        weight: parseFloat(firstSet.weight) || 0,
        unit: firstSet.unit,
        notes: workout.notes ? `${workout.notes} | All Sets: ${validSets.map((s, i) => `Set${i+1}: ${s.sets}x${s.reps} @ ${s.weight}${s.unit}`).join(', ')}` : null
      })
      .eq('id', workout.id);

    if (updateError) {
      toast({
        title: isGerman ? "Fehler" : "Error",
        description: isGerman ? "Speichern fehlgeschlagen" : "Save failed",
        variant: "destructive"
      });
      return;
    }

    // Insert additional sets as new entries
    if (validSets.length > 1) {
      const additionalSets = validSets.slice(1).map((set, index) => ({
        user_id: userId,
        exercise_id: workout.exercises ? undefined : undefined,
        sets: parseInt(set.sets),
        reps: parseInt(set.reps),
        weight: parseFloat(set.weight) || 0,
        unit: set.unit,
        completed_at: workout.completed_at,
        notes: `${parseExerciseName(workout.notes)} (${parseBodyPart(workout.notes)}) | Set ${index + 2}`
      }));

      // Get exercise_id from first workout
      const { data: originalWorkout } = await supabase
        .from('workout_logs')
        .select('exercise_id')
        .eq('id', workout.id)
        .single();

      if (originalWorkout?.exercise_id) {
        for (const set of additionalSets) {
          await supabase
            .from('workout_logs')
            .insert({ ...set, exercise_id: originalWorkout.exercise_id });
        }
      }
    }

    setSavedItems(prev => new Set(prev).add(workout.id));
    
    toast({
      title: isGerman ? "Gespeichert" : "Saved",
      description: isGerman ? `${validSets.length} Sätze gespeichert` : `${validSets.length} sets saved`
    });

    setEditingId(null);
    loadWorkouts();
  };

  if (workouts.length === 0) {
    return (
      <Card className="gradient-card card-shadow border-white/10 p-8 text-center">
        <p className="text-muted-foreground">
          {isGerman ? "Noch keine Trainingseinträge" : "No training entries yet"}
        </p>
      </Card>
    );
  }

  const handleOpenImage = (exerciseName: string) => {
    setSelectedExerciseName(exerciseName);
    setImageDialogOpen(true);
  };

  return (
    <>
    <div className="space-y-4">
      {workouts.map((workout) => {
        const isSaved = savedItems.has(workout.id);
        const isEditing = editingId === workout.id;
        const exerciseName = parseExerciseName(workout.notes) || (isGerman ? workout.exercises?.name_de : workout.exercises?.name_en) || "Training";
        const bodyPart = parseBodyPart(workout.notes);
        const exerciseImage = findExerciseImage(exerciseName);
        
        return (
          <Card 
            key={workout.id} 
            className={`gradient-card card-shadow border-white/10 p-4 ${!isSaved && !isEditing ? 'cursor-pointer hover:border-primary/30' : ''}`}
            onClick={() => !isEditing && !isSaved && startEditing(workout)}
          >
            <div className="flex justify-between items-start gap-3">
              {/* Exercise Image Thumbnail */}
              {exerciseImage && (
                <div 
                  className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-black/30 border border-white/10 cursor-pointer hover:scale-110 transition-transform"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenImage(exerciseName);
                  }}
                >
                  <img 
                    src={exerciseImage} 
                    alt={exerciseName}
                    className="w-full h-full object-contain p-1"
                  />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                {/* Body Part */}
                {bodyPart && (
                  <div className="text-xs font-semibold text-primary mb-1">{bodyPart}</div>
                )}
                
                {/* Exercise Name */}
                <h3 className="font-bold text-base mb-1 flex items-center gap-2">
                  {exerciseName}
                  {exerciseImage && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-5 text-primary/70 hover:text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenImage(exerciseName);
                      }}
                    >
                      <Image className="w-3 h-3" />
                    </Button>
                  )}
                </h3>
                
                {isEditing ? (
                  <div className="space-y-2 mt-2" onClick={(e) => e.stopPropagation()}>
                    <div className="text-xs text-muted-foreground mb-2">
                      {isGerman ? "3 weitere Sätze eingeben:" : "Enter 3 additional sets:"}
                    </div>
                    {exerciseSets.map((set, index) => (
                      <div key={index} className="grid grid-cols-4 gap-1">
                        <div>
                          <label className="text-[10px] text-muted-foreground">{isGerman ? "Sätze" : "Sets"}</label>
                          <Input
                            type="number"
                            min="1"
                            max="100"
                            value={set.sets}
                            onChange={(e) => updateSet(index, "sets", e.target.value)}
                            className="h-7 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground">{isGerman ? "Wdh." : "Reps"}</label>
                          <Input
                            type="number"
                            min="1"
                            max="100"
                            value={set.reps}
                            onChange={(e) => updateSet(index, "reps", e.target.value)}
                            className="h-7 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground">{isGerman ? "Gewicht" : "Weight"}</label>
                          <Input
                            type="number"
                            min="0"
                            step="0.5"
                            value={set.weight}
                            onChange={(e) => updateSet(index, "weight", e.target.value)}
                            className="h-7 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground">kg</label>
                          <Select value={set.unit} onValueChange={(v) => updateSet(index, "unit", v)}>
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="kg">kg</SelectItem>
                              <SelectItem value="lbs">lbs</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" onClick={() => saveEditing(workout)} className="flex-1">
                        <Save className="w-3 h-3 mr-1" /> {isGerman ? "Speichern" : "Save"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEditing}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground space-y-1">
                    {/* Sets, Reps, Weight */}
                    <div className="flex gap-3 flex-wrap text-xs">
                      <span className="bg-primary/10 px-2 py-0.5 rounded">{isGerman ? "Sätze" : "Sets"}: {workout.sets}</span>
                      <span className="bg-primary/10 px-2 py-0.5 rounded">{isGerman ? "Wdh." : "Reps"}: {workout.reps}</span>
                      {workout.weight !== null && workout.weight > 0 && (
                        <span className="bg-primary/10 px-2 py-0.5 rounded">{isGerman ? "Gewicht" : "Weight"}: {workout.weight} {workout.unit || 'kg'}</span>
                      )}
                    </div>
                    
                    {/* Date and Time */}
                    <div className="text-xs text-white/50 mt-2">
                      {format(new Date(workout.completed_at), "dd.MM.yyyy HH:mm")}
                    </div>
                    
                    {isSaved && (
                      <div className="text-xs text-green-500 mt-1">
                        ✓ {isGerman ? "Gespeichert" : "Saved"}
                      </div>
                    )}
                    {!isSaved && (
                      <div className="text-xs text-primary/60 mt-1 flex items-center gap-1">
                        <Plus className="w-3 h-3" />
                        {isGerman ? "Klicken für weitere Sätze" : "Click to add more sets"}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {!isEditing && (
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  {!isSaved && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-primary hover:text-primary h-8 w-8"
                      onClick={() => handleSaveToCalendar(workout)}
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                  )}
                  {isSaved && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-green-500 h-8 w-8"
                      disabled
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive h-8 w-8"
                    onClick={() => handleDelete(workout.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
    
    <ExerciseImageDialog
      open={imageDialogOpen}
      onOpenChange={setImageDialogOpen}
      exerciseName={selectedExerciseName}
      isGerman={isGerman}
    />
    </>
  );
};