import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Trash2, Check, X, Image } from "lucide-react";
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
  } | null;
}

interface TrainingHistoryProps {
  userId: string;
  isGerman: boolean;
  refreshTrigger: number;
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

export const TrainingHistory = ({ userId, isGerman, refreshTrigger }: TrainingHistoryProps) => {
  const { toast } = useToast();
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ sets: "", reps: "", weight: "", unit: "kg" });
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
      .limit(30);

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
      description: isGerman ? "Training wurde gelöscht - Keine Änderungen mehr möglich" : "Training was deleted - No more changes possible"
    });

    loadWorkouts();
  };

  const startEditing = (workout: WorkoutLog) => {
    // Can't edit if already saved to calendar
    if (savedItems.has(workout.id)) {
      toast({
        title: isGerman ? "Nicht bearbeitbar" : "Not editable",
        description: isGerman ? "Gespeicherte Einträge können nicht bearbeitet werden" : "Saved entries cannot be edited",
        variant: "destructive"
      });
      return;
    }
    
    setEditingId(workout.id);
    setEditForm({
      sets: workout.sets.toString(),
      reps: workout.reps.toString(),
      weight: workout.weight?.toString() || "0",
      unit: workout.unit || "kg"
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({ sets: "", reps: "", weight: "", unit: "kg" });
  };

  const saveEditing = async (id: string) => {
    const { error } = await supabase
      .from('workout_logs')
      .update({
        sets: parseInt(editForm.sets),
        reps: parseInt(editForm.reps),
        weight: parseFloat(editForm.weight) || 0,
        unit: editForm.unit
      })
      .eq('id', id);

    if (error) {
      toast({
        title: isGerman ? "Fehler" : "Error",
        description: isGerman ? "Speichern fehlgeschlagen" : "Save failed",
        variant: "destructive"
      });
      return;
    }

    // Mark as saved - no more edits allowed
    setSavedItems(prev => new Set(prev).add(id));
    
    toast({
      title: isGerman ? "Gespeichert" : "Saved",
      description: isGerman ? "Änderungen gespeichert - Keine weiteren Änderungen möglich" : "Changes saved - No more changes allowed"
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
        const exerciseName = workout.notes?.split(" (")[0] || (isGerman ? workout.exercises?.name_de : workout.exercises?.name_en) || "Training";
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
                  className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-black/30 border border-white/10 cursor-pointer hover:scale-110 transition-transform"
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
                <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                  {workout.notes || (isGerman ? (workout.exercises?.name_de || "Training") : (workout.exercises?.name_en || "Training"))}
                  {exerciseImage && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-primary/70 hover:text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenImage(exerciseName);
                      }}
                    >
                      <Image className="w-4 h-4" />
                    </Button>
                  )}
                </h3>
                
                {isEditing ? (
                  <div className="space-y-2 mt-2" onClick={(e) => e.stopPropagation()}>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground">{isGerman ? "Sätze" : "Sets"}</label>
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          value={editForm.sets}
                          onChange={(e) => setEditForm({...editForm, sets: e.target.value})}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">{isGerman ? "Wdh." : "Reps"}</label>
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          value={editForm.reps}
                          onChange={(e) => setEditForm({...editForm, reps: e.target.value})}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">{isGerman ? "Gewicht" : "Weight"}</label>
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          value={editForm.weight}
                          onChange={(e) => setEditForm({...editForm, weight: e.target.value})}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">{isGerman ? "Einheit" : "Unit"}</label>
                        <Select value={editForm.unit} onValueChange={(v) => setEditForm({...editForm, unit: v})}>
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kg">kg</SelectItem>
                            <SelectItem value="lbs">lbs</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" onClick={() => saveEditing(workout.id)} className="flex-1">
                        <Save className="w-4 h-4 mr-1" /> {isGerman ? "Speichern" : "Save"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEditing}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex gap-4 flex-wrap">
                      <span className="font-medium">{isGerman ? "Sätze:" : "Sets:"} {workout.sets}</span>
                      <span className="font-medium">{isGerman ? "Wdh.:" : "Reps:"} {workout.reps}</span>
                      {workout.weight !== null && workout.weight > 0 && (
                        <span className="font-medium">{isGerman ? "Gewicht:" : "Weight:"} {workout.weight} {workout.unit || 'kg'}</span>
                      )}
                    </div>
                    {/* Show all info from notes */}
                    {workout.notes && (
                      <div className="text-xs text-primary/70 bg-primary/10 px-2 py-1 rounded mt-1">
                        {workout.notes}
                      </div>
                    )}
                    <div className="text-xs">
                      {format(new Date(workout.completed_at), "dd.MM.yyyy HH:mm")}
                    </div>
                    {isSaved && (
                      <div className="text-xs text-green-500 mt-1">
                        ✓ {isGerman ? "Gespeichert - Keine Änderungen möglich" : "Saved - No changes allowed"}
                      </div>
                    )}
                    {!isSaved && (
                      <div className="text-xs text-primary/60 mt-1">
                        {isGerman ? "Klicken zum Bearbeiten" : "Click to edit"}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {!isEditing && (
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  {!isSaved && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-primary hover:text-primary"
                      onClick={() => handleSaveToCalendar(workout)}
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                  )}
                  {isSaved && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-green-500"
                      disabled
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
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