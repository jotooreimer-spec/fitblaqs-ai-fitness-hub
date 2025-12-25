import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { allExercises, ExerciseItem } from "@/data/exerciseImages";

interface ExerciseIconGridProps {
  isGerman: boolean;
  onSelectExercise: (exercise: ExerciseItem) => void;
  bodyPartFilter?: "upper_body" | "lower_body" | "core" | null;
}

const ExerciseIconGrid = ({ isGerman, onSelectExercise, bodyPartFilter }: ExerciseIconGridProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const getBodyPartLabel = (bodyPart: "upper_body" | "lower_body" | "core") => {
    const labels = {
      upper_body: { en: "Upper Body", de: "Oberkörper" },
      lower_body: { en: "Lower Body", de: "Unterkörper" },
      core: { en: "Core", de: "Core" },
    };
    return isGerman ? labels[bodyPart].de : labels[bodyPart].en;
  };

  const filteredExercises = bodyPartFilter 
    ? allExercises.filter(ex => {
        if (bodyPartFilter === "core") return ex.bodyPart === "core";
        return ex.bodyPart === bodyPartFilter;
      })
    : allExercises;

  const groupedExercises = {
    upper_body: filteredExercises.filter(ex => ex.bodyPart === "upper_body"),
    lower_body: filteredExercises.filter(ex => ex.bodyPart === "lower_body"),
    core: filteredExercises.filter(ex => ex.bodyPart === "core"),
  };

  const handleClick = (exercise: ExerciseItem) => {
    setSelectedId(exercise.id);
    onSelectExercise(exercise);
  };

  const renderExerciseGrid = (exercises: ExerciseItem[]) => (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
      {exercises.map((exercise) => (
        <Card
          key={exercise.id}
          onClick={() => handleClick(exercise)}
          className={`
            relative overflow-hidden cursor-pointer transition-all duration-200
            hover:scale-105 hover:ring-2 hover:ring-primary/50
            ${selectedId === exercise.id ? 'ring-2 ring-primary scale-105' : ''}
            bg-black/30 backdrop-blur-sm border-white/10
          `}
        >
          <div className="aspect-square p-2">
            <img
              src={exercise.image}
              alt={isGerman ? exercise.name_de : exercise.name}
              className="w-full h-full object-contain rounded-md"
              loading="lazy"
            />
          </div>
          <div className="p-2 pt-0">
            <p className="text-xs font-medium text-center text-white/90 line-clamp-2 leading-tight">
              {isGerman ? exercise.name_de : exercise.name}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <ScrollArea className="h-[400px] md:h-[500px]">
      <div className="space-y-6 pr-4">
        {/* Upper Body */}
        {groupedExercises.upper_body.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-primary mb-3 sticky top-0 bg-background/90 backdrop-blur-sm py-2 z-10">
              {getBodyPartLabel("upper_body")} ({groupedExercises.upper_body.length})
            </h3>
            {renderExerciseGrid(groupedExercises.upper_body)}
          </div>
        )}

        {/* Lower Body */}
        {groupedExercises.lower_body.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-primary mb-3 sticky top-0 bg-background/90 backdrop-blur-sm py-2 z-10">
              {getBodyPartLabel("lower_body")} ({groupedExercises.lower_body.length})
            </h3>
            {renderExerciseGrid(groupedExercises.lower_body)}
          </div>
        )}

        {/* Core */}
        {groupedExercises.core.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-primary mb-3 sticky top-0 bg-background/90 backdrop-blur-sm py-2 z-10">
              {getBodyPartLabel("core")} ({groupedExercises.core.length})
            </h3>
            {renderExerciseGrid(groupedExercises.core)}
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

export default ExerciseIconGrid;
