import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface WorkoutLog {
  id: string;
  sets: number;
  reps: number;
  weight: number | null;
  unit: string | null;
  completed_at: string;
  notes: string | null;
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

export const TrainingHistory = ({ userId, isGerman, refreshTrigger }: TrainingHistoryProps) => {
  const { toast } = useToast();
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);

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

  if (workouts.length === 0) {
    return (
      <Card className="gradient-card card-shadow border-white/10 p-8 text-center">
        <p className="text-muted-foreground">
          {isGerman ? "Noch keine Trainingseinträge" : "No training entries yet"}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {workouts.map((workout) => (
        <Card key={workout.id} className="gradient-card card-shadow border-white/10 p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">
                {workout.notes || (isGerman ? (workout.exercises?.name_de || "Training") : (workout.exercises?.name_en || "Training"))}
              </h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex gap-4">
                  <span>{isGerman ? "Sätze:" : "Sets:"} {workout.sets}</span>
                  <span>{isGerman ? "Wdh.:" : "Reps:"} {workout.reps}</span>
                  {workout.weight && (
                    <span>{isGerman ? "Gewicht:" : "Weight:"} {workout.weight} {workout.unit || 'kg'}</span>
                  )}
                </div>
                <div className="text-xs">
                  {format(new Date(workout.completed_at), "dd.MM.yyyy")}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-primary hover:text-primary"
              >
                <Save className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => handleDelete(workout.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
