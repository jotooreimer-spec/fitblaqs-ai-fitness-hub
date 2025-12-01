import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface TrainingLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  isGerman: boolean;
  onSuccess: () => void;
}

export const TrainingLogDialog = ({ open, onOpenChange, userId, isGerman, onSuccess }: TrainingLogDialogProps) => {
  const { toast } = useToast();
  const [category, setCategory] = useState("");
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("10");
  const [weight, setWeight] = useState("0");
  const [unit, setUnit] = useState("kg");
  const [date, setDate] = useState<Date>(new Date());

  const handleSave = async () => {
    if (!category || !sets || !reps) {
      toast({
        title: isGerman ? "Fehler" : "Error",
        description: isGerman ? "Bitte alle Felder ausfüllen" : "Please fill all fields",
        variant: "destructive"
      });
      return;
    }

    // Create a custom exercise entry
    const { data: exercise, error: exerciseError } = await supabase
      .from('exercises')
      .select('id')
      .eq('name_de', category)
      .maybeSingle();

    let exerciseId = exercise?.id;

    // If exercise doesn't exist, we'll use a placeholder
    if (!exerciseId) {
      // Use first available exercise as placeholder (workout_logs requires exercise_id)
      const { data: firstExercise } = await supabase
        .from('exercises')
        .select('id')
        .limit(1)
        .single();
      
      exerciseId = firstExercise?.id;
    }

    const { error } = await supabase
      .from('workout_logs')
      .insert({
        user_id: userId,
        exercise_id: exerciseId,
        sets: parseInt(sets),
        reps: parseInt(reps),
        weight: parseFloat(weight),
        unit: unit,
        completed_at: date.toISOString(),
        notes: category // Store custom category in notes
      });

    if (error) {
      toast({
        title: isGerman ? "Fehler" : "Error",
        description: isGerman ? "Speichern fehlgeschlagen" : "Save failed",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: isGerman ? "Gespeichert!" : "Saved!",
      description: isGerman ? "Training wurde eingetragen" : "Training was logged"
    });

    setCategory("");
    setSets("3");
    setReps("10");
    setWeight("0");
    setDate(new Date());
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isGerman ? "Training eintragen" : "Log Training"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="category">{isGerman ? "Kategorie/Übung" : "Category/Exercise"}</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder={isGerman ? "z.B. Bankdrücken" : "e.g. Bench Press"}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sets">{isGerman ? "Sätze (1-100)" : "Sets (1-100)"}</Label>
              <Input
                id="sets"
                type="number"
                min="1"
                max="100"
                value={sets}
                onChange={(e) => setSets(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="reps">{isGerman ? "Wiederholungen (1-100)" : "Reps (1-100)"}</Label>
              <Input
                id="reps"
                type="number"
                min="1"
                max="100"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="weight">{isGerman ? "Gewicht (1-100)" : "Weight (1-100)"}</Label>
              <Input
                id="weight"
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="unit">{isGerman ? "Einheit" : "Unit"}</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger id="unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="lbs">lbs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>{isGerman ? "Datum" : "Date"}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>{isGerman ? "Datum wählen" : "Pick a date"}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => newDate && setDate(newDate)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button onClick={handleSave} className="w-full">
            {isGerman ? "Speichern" : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
