import { useState, useEffect } from "react";
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
import ExerciseIconGrid from "./ExerciseIconGrid";
import { ExerciseItem } from "@/data/exerciseImages";

interface TrainingLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  isGerman: boolean;
  onSuccess: () => void;
  defaultBodyPart?: "lower_body" | "upper_body" | "middle_body" | "fullbody" | null;
}

interface ExerciseSet {
  sets: string;
  reps: string;
  weight: string;
  unit: string;
}

export const TrainingLogDialog = ({ open, onOpenChange, userId, isGerman, onSuccess, defaultBodyPart }: TrainingLogDialogProps) => {
  const { toast } = useToast();
  const [bodyPart, setBodyPart] = useState(defaultBodyPart || "");
  const [exercise, setExercise] = useState("");
  const [selectedExerciseItem, setSelectedExerciseItem] = useState<ExerciseItem | null>(null);
  const [customExercise, setCustomExercise] = useState("");
  const [customBodyPart, setCustomBodyPart] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [showExerciseGrid, setShowExerciseGrid] = useState(false);
  
  // 4 Exercise Sets
  const [exerciseSets, setExerciseSets] = useState<ExerciseSet[]>([
    { sets: "3", reps: "10", weight: "0", unit: "kg" },
    { sets: "", reps: "", weight: "", unit: "kg" },
    { sets: "", reps: "", weight: "", unit: "kg" },
    { sets: "", reps: "", weight: "", unit: "kg" }
  ]);

  // Update body part when defaultBodyPart changes - show grid immediately
  useEffect(() => {
    if (defaultBodyPart) {
      setBodyPart(defaultBodyPart);
      setExercise("");
      setSelectedExerciseItem(null);
      setCustomExercise("");
      setCustomBodyPart("");
      // Show exercise grid immediately when dialog opens with a body part
      if (defaultBodyPart !== "fullbody") {
        setShowExerciseGrid(true);
      }
    }
  }, [defaultBodyPart, open]);

  const handleExerciseSelect = (exerciseItem: ExerciseItem) => {
    setSelectedExerciseItem(exerciseItem);
    setExercise(isGerman ? exerciseItem.name_de : exerciseItem.name);
    setShowExerciseGrid(false);
  };

  const getBodyPartFilter = (): "upper_body" | "lower_body" | "core" | null => {
    if (bodyPart === "upper_body") return "upper_body";
    if (bodyPart === "lower_body") return "lower_body";
    if (bodyPart === "middle_body") return "core";
    return null;
  };

  const getBodyPartLabel = () => {
    switch (bodyPart) {
      case "lower_body":
        return isGerman ? "Unterkörper (Lower Body)" : "Lower Body";
      case "upper_body":
        return isGerman ? "Oberkörper (Upper Body)" : "Upper Body";
      case "middle_body":
        return isGerman ? "Core (Middle Body)" : "Core";
      case "fullbody":
        return isGerman ? "Ganzkörper (Fullbody)" : "Fullbody";
      default:
        return "";
    }
  };

  const updateSet = (index: number, field: keyof ExerciseSet, value: string) => {
    const newSets = [...exerciseSets];
    newSets[index] = { ...newSets[index], [field]: value };
    setExerciseSets(newSets);
  };

  const handleSave = async () => {
    const exerciseName = bodyPart === "fullbody" ? customExercise : exercise;
    const finalBodyPart = bodyPart === "fullbody" && customBodyPart ? customBodyPart : bodyPart;
    
    // Get the first valid set
    const validSets = exerciseSets.filter(s => s.sets && s.reps);
    if (validSets.length === 0) {
      toast({
        title: isGerman ? "Fehler" : "Error",
        description: isGerman ? "Bitte mindestens einen Satz ausfüllen" : "Please fill at least one set",
        variant: "destructive"
      });
      return;
    }

    if (!bodyPart || (!exerciseName && bodyPart !== "fullbody") || (bodyPart === "fullbody" && !customExercise)) {
      toast({
        title: isGerman ? "Fehler" : "Error",
        description: isGerman ? "Bitte alle Felder ausfüllen" : "Please fill all fields",
        variant: "destructive"
      });
      return;
    }

    const { data: exerciseData, error: exerciseError } = await supabase
      .from('exercises')
      .select('id')
      .eq('name_en', exerciseName)
      .maybeSingle();

    let exerciseId = exerciseData?.id;

    if (!exerciseId) {
      const { data: firstExercise } = await supabase
        .from('exercises')
        .select('id')
        .limit(1)
        .single();
      
      exerciseId = firstExercise?.id;
    }

    const completedAt = new Date(date);
    const [startHour, startMin] = startTime.split(':').map(Number);
    completedAt.setHours(startHour, startMin, 0, 0);

    // Save all valid sets
    const inserts = validSets.map((set, index) => ({
      user_id: userId,
      exercise_id: exerciseId,
      sets: parseInt(set.sets),
      reps: parseInt(set.reps),
      weight: parseFloat(set.weight) || 0,
      unit: set.unit,
      completed_at: completedAt.toISOString(),
      notes: `${exerciseName} (${getBodyPartLabel()}) | Set ${index + 1} | ${startTime}-${endTime}`
    }));

    const { error } = await supabase
      .from('workout_logs')
      .insert(inserts);

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
      description: isGerman ? `${validSets.length} Sätze eingetragen` : `${validSets.length} sets logged`
    });

    setBodyPart(defaultBodyPart || "");
    setExercise("");
    setCustomExercise("");
    setCustomBodyPart("");
    setExerciseSets([
      { sets: "3", reps: "10", weight: "0", unit: "kg" },
      { sets: "", reps: "", weight: "", unit: "kg" },
      { sets: "", reps: "", weight: "", unit: "kg" },
      { sets: "", reps: "", weight: "", unit: "kg" }
    ]);
    setDate(new Date());
    setStartTime("09:00");
    setEndTime("10:00");
    onOpenChange(false);
    onSuccess();
  };

  const isFullbody = bodyPart === "fullbody";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isGerman ? "Training eintragen" : "Log Training"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Body Part - Locked to selection from Dashboard */}
          <div>
            <Label>{isGerman ? "Körperbereich" : "Body Part"}</Label>
            {defaultBodyPart ? (
              <div className="p-2 bg-primary/10 rounded-md text-sm font-medium">
                {getBodyPartLabel()}
              </div>
            ) : (
              <Select value={bodyPart} onValueChange={(v) => { setBodyPart(v); setExercise(""); setCustomExercise(""); }}>
                <SelectTrigger>
                  <SelectValue placeholder={isGerman ? "Wählen..." : "Select..."} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lower_body">{isGerman ? "Unterkörper (Beine, Waden, Squats, Po)" : "Lower Body (Legs, Calves, Squats, Glutes)"}</SelectItem>
                  <SelectItem value="upper_body">{isGerman ? "Oberkörper (Brust, Schulter, Trizeps, Bizeps)" : "Upper Body (Chest, Shoulders, Triceps, Biceps)"}</SelectItem>
                  <SelectItem value="middle_body">{isGerman ? "Core (Bauch, Rücken)" : "Core (Abs, Back)"}</SelectItem>
                  <SelectItem value="fullbody">{isGerman ? "Ganzkörper (Eigene Übungen)" : "Fullbody (Custom Exercises)"}</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Exercise Selection or Custom Input */}
          {isFullbody ? (
            <>
              <div>
                <Label>{isGerman ? "Körperbereich (eigene Eingabe)" : "Body Part (custom)"}</Label>
                <Input
                  value={customBodyPart}
                  onChange={(e) => setCustomBodyPart(e.target.value)}
                  placeholder={isGerman ? "z.B. Ganzkörper, Cardio..." : "e.g. Full Body, Cardio..."}
                />
              </div>
              <div>
                <Label>{isGerman ? "Eigene Übung" : "Custom Exercise"}</Label>
                <Input
                  value={customExercise}
                  onChange={(e) => setCustomExercise(e.target.value)}
                  placeholder={isGerman ? "z.B. Burpees, Kettlebell Swings..." : "e.g. Burpees, Kettlebell Swings..."}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {isGerman ? "Schreibe deine eigene Übung" : "Write your own exercise"}
                </p>
              </div>
            </>
          ) : (
            <div>
              <Label>{isGerman ? "Übung" : "Exercise"} ({getBodyPartLabel()} {isGerman ? "nur" : "only"})</Label>
              {selectedExerciseItem ? (
                <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
                  <img src={selectedExerciseItem.image} alt="" className="w-12 h-12 rounded object-contain bg-black/20" />
                  <span className="font-medium">{isGerman ? selectedExerciseItem.name_de : selectedExerciseItem.name}</span>
                  <Button variant="ghost" size="sm" onClick={() => setShowExerciseGrid(true)} className="ml-auto">
                    {isGerman ? "Ändern" : "Change"}
                  </Button>
                </div>
              ) : (
                <Button variant="outline" onClick={() => setShowExerciseGrid(true)} className="w-full justify-start" disabled={!bodyPart}>
                  {isGerman ? "Übung wählen..." : "Select exercise..."}
                </Button>
              )}
              {showExerciseGrid && (
                <div className="mt-3">
                  <ExerciseIconGrid 
                    isGerman={isGerman} 
                    onSelectExercise={handleExerciseSelect}
                    bodyPartFilter={getBodyPartFilter()}
                  />
                </div>
              )}
            </div>
          )}
          
          {/* 4 Exercise Sets */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">{isGerman ? "4 Sätze eintragen" : "Enter 4 Sets"}</Label>
            {exerciseSets.map((set, index) => (
              <div key={index} className="p-3 bg-muted/30 rounded-lg space-y-2">
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  {isGerman ? `Satz ${index + 1}` : `Set ${index + 1}`}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <Label className="text-xs">{isGerman ? "Sätze" : "Sets"}</Label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={set.sets}
                      onChange={(e) => updateSet(index, "sets", e.target.value)}
                      placeholder="1-100"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">{isGerman ? "Wdh." : "Reps"}</Label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={set.reps}
                      onChange={(e) => updateSet(index, "reps", e.target.value)}
                      placeholder="1-100"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">{isGerman ? "Gewicht" : "Weight"}</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      value={set.weight}
                      onChange={(e) => updateSet(index, "weight", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">{isGerman ? "Einheit" : "Unit"}</Label>
                    <Select value={set.unit} onValueChange={(v) => updateSet(index, "unit", v)}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="lbs">lbs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Start and End Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">{isGerman ? "Beginn" : "Start Time"}</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endTime">{isGerman ? "Ende" : "End Time"}</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
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