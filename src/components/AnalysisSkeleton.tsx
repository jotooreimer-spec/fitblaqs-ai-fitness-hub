import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

interface AnalysisSkeletonProps {
  message?: string;
}

export const AnalysisSkeleton = ({ message = "Analysiere..." }: AnalysisSkeletonProps) => {
  return (
    <Card className="bg-black/40 backdrop-blur-md border-white/10 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-primary/20 animate-pulse flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <span className="text-white font-medium">{message}</span>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full bg-white/10" />
        <Skeleton className="h-4 w-3/4 bg-white/10" />
        <div className="grid grid-cols-2 gap-3 mt-4">
          <Skeleton className="h-16 bg-white/10 rounded-lg" />
          <Skeleton className="h-16 bg-white/10 rounded-lg" />
          <Skeleton className="h-16 bg-white/10 rounded-lg" />
          <Skeleton className="h-16 bg-white/10 rounded-lg" />
        </div>
      </div>
    </Card>
  );
};

export const FoodAnalysisSkeleton = ({ isGerman = true }: { isGerman?: boolean }) => {
  return (
    <AnalysisSkeleton message={isGerman ? "Analysiere dein Essen..." : "Analyzing your food..."} />
  );
};

export const BodyAnalysisSkeleton = ({ isGerman = true }: { isGerman?: boolean }) => {
  return (
    <AnalysisSkeleton message={isGerman ? "Analysiere deinen Körper..." : "Analyzing your body..."} />
  );
};

export const CalendarSkeleton = () => {
  return (
    <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-6">
      <Skeleton className="h-6 w-32 mb-4 bg-white/10" />
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg bg-white/10" />
            <div className="flex-1">
              <Skeleton className="h-4 w-full mb-2 bg-white/10" />
              <Skeleton className="h-3 w-2/3 bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export const PageSkeleton = () => {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48 bg-white/10" />
      <Skeleton className="h-4 w-64 bg-white/10" />
      <div className="grid gap-4 mt-6">
        <Skeleton className="h-40 w-full bg-white/10 rounded-xl" />
        <Skeleton className="h-40 w-full bg-white/10 rounded-xl" />
      </div>
    </div>
  );
};
