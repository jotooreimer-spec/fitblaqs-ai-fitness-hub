import { Dialog, DialogContent } from "@/components/ui/dialog";
import { allExercises } from "@/data/exerciseImages";

interface ExerciseImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exerciseName: string;
  isGerman: boolean;
}

export const ExerciseImageDialog = ({ open, onOpenChange, exerciseName, isGerman }: ExerciseImageDialogProps) => {
  // Find exercise by name (check both German and English names)
  const exercise = allExercises.find(
    ex => ex.name.toLowerCase() === exerciseName.toLowerCase() || 
          ex.name_de.toLowerCase() === exerciseName.toLowerCase() ||
          exerciseName.toLowerCase().includes(ex.name.toLowerCase()) ||
          exerciseName.toLowerCase().includes(ex.name_de.toLowerCase())
  );

  const getBodyPartLabel = (bodyPart: string) => {
    const labels: Record<string, { en: string; de: string }> = {
      upper_body: { en: "Upper Body", de: "Oberkörper" },
      lower_body: { en: "Lower Body", de: "Unterkörper" },
      core: { en: "Core", de: "Core" },
    };
    return isGerman ? labels[bodyPart]?.de || bodyPart : labels[bodyPart]?.en || bodyPart;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-black/90 border-white/20">
        {exercise ? (
          <div className="flex flex-col items-center">
            <div className="w-full aspect-square max-h-[400px] bg-black/50 flex items-center justify-center p-4">
              <img
                src={exercise.image}
                alt={isGerman ? exercise.name_de : exercise.name}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
            <div className="p-4 text-center w-full bg-gradient-to-t from-black/80 to-transparent">
              <h3 className="text-xl font-bold text-white mb-1">
                {isGerman ? exercise.name_de : exercise.name}
              </h3>
              <p className="text-sm text-primary">
                {getBodyPartLabel(exercise.bodyPart)}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-white/60">{isGerman ? "Kein Bild verfügbar" : "No image available"}</p>
            <p className="text-sm text-white/40 mt-2">{exerciseName}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
