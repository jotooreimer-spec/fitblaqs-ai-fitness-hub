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

// Exercise categories
const lowerBodyExercises = [
  "Squats", "Lunges", "Leg Press", "Leg Extension", "Leg Curl",
  "Standing Calf Raise", "Seated Calf Raise", "Single Leg Calf Raise",
  "Calf Press", "Donkey Calf Raises", "Classic Squat", "Goblet Squat",
  "Bulgarian Split Squat", "Sumo Squat", "Front Squat", "Hip Thrust",
  "Glute Bridge", "Kickbacks", "Side Leg Raises", "Donkey Kicks"
];

const upperBodyExercises = [
  "Bench Press", "Incline Bench Press", "Decline Bench Press", "Dumbbell Bench Press",
  "Incline Dumbbell Press", "Close Grip Bench Press", "Reverse Grip Bench Press",
  "Smith Machine Bench Press", "Chest Press Machine", "Floor Press", "Chest Fly",
  "Push-ups", "Cable Chest Press", "Pull-ups", "Deadlift", "Rows", "Lat Pulldown",
  "Reverse Flys", "Shoulder Press", "Lateral Raises", "Front Raises", "Arnold Press",
  "Face Pulls", "Tricep Pushdown", "Dips", "Overhead Tricep Extension", "Tricep Kickbacks",
  "Diamond Push-ups", "Bicep Curls", "Hammer Curls", "Concentration Curls",
  "Preacher Curls", "21s Bicep Exercise"
];

const middleBodyExercises = [
  "Forearm Plank", "Side Plank", "Mountain Climbers", "Russian Twists",
  "Dead Bug", "Crunches", "Hanging Leg Raise", "Toe Touches",
  "Bicycle Crunches", "V-ups", "Hollow Body Hold", "Flutter Kicks",
  "Lying Leg Raise", "Heel Touches", "Jackknife Sit-ups"
];

const fullBodyExercises = [
  "Burpees", "Clean and Press", "Thrusters", "Kettlebell Swings",
  "Turkish Get-ups", "Man Makers", "Devil Press", "Bear Crawls",
  "Box Jumps", "Battle Ropes", "Jumping Jacks", "High Knees",
  "Mountain Climbers Full", "Squat to Press", "Lunge with Twist",
  "Deadlift to Row", "Renegade Rows", "Slam Ball", "Wall Balls",
  "Sled Push", "Farmer's Walk", "Tire Flips"
];

export const TrainingLogDialog = ({ open, onOpenChange, userId, isGerman, onSuccess }: TrainingLogDialogProps) => {
  const { toast } = useToast();
  const [bodyPart, setBodyPart] = useState("");
  const [exercise, setExercise] = useState("");
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("10");
  const [weight, setWeight] = useState("0");
  const [unit, setUnit] = useState("kg");
  const [date, setDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");

  const getExercises = () => {
    switch (bodyPart) {
      case "lower_body":
        return lowerBodyExercises;
      case "upper_body":
        return upperBodyExercises;
      case "middle_body":
        return middleBodyExercises;
      case "fullbody":
        return fullBodyExercises;
      default:
        return [];
    }
  };

  const handleSave = async () => {
    if (!bodyPart || !exercise || !sets || !reps) {
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
      .eq('name_en', exercise)
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

    const { error } = await supabase
      .from('workout_logs')
      .insert({
        user_id: userId,
        exercise_id: exerciseId,
        sets: parseInt(sets),
        reps: parseInt(reps),
        weight: parseFloat(weight),
        unit: unit,
        completed_at: completedAt.toISOString(),
        notes: `${exercise} (${bodyPart}) | ${startTime}-${endTime}`
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

    setBodyPart("");
    setExercise("");
    setSets("3");
    setReps("10");
    setWeight("0");
    setDate(new Date());
    setStartTime("09:00");
    setEndTime("10:00");
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isGerman ? "Training eintragen" : "Log Training"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Body Part Selection */}
          <div>
            <Label>{isGerman ? "Körperbereich" : "Body Part"}</Label>
            <Select value={bodyPart} onValueChange={(v) => { setBodyPart(v); setExercise(""); }}>
              <SelectTrigger>
                <SelectValue placeholder={isGerman ? "Wählen..." : "Select..."} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lower_body">{isGerman ? "Unterkörper (Beine, Waden, Squats, Po)" : "Lower Body (Legs, Calves, Squats, Glutes)"}</SelectItem>
                <SelectItem value="upper_body">{isGerman ? "Oberkörper (Brust, Schulter, Trizeps, Bizeps)" : "Upper Body (Chest, Shoulders, Triceps, Biceps)"}</SelectItem>
                <SelectItem value="middle_body">{isGerman ? "Core (Bauch, Rücken)" : "Middle Body (Core)"}</SelectItem>
                <SelectItem value="fullbody">{isGerman ? "Ganzkörper (Fullbody)" : "Fullbody"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Exercise Selection */}
          <div>
            <Label>{isGerman ? "Übung" : "Exercise"}</Label>
            <Select value={exercise} onValueChange={setExercise} disabled={!bodyPart}>
              <SelectTrigger>
                <SelectValue placeholder={isGerman ? "Übung wählen..." : "Select exercise..."} />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {getExercises().map((ex) => (
                  <SelectItem key={ex} value={ex}>{ex}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              <Label htmlFor="weight">{isGerman ? "Gewicht" : "Weight"}</Label>
              <Input
                id="weight"
                type="number"
                min="0"
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