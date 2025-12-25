import { cn } from "@/lib/utils";

interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  mainValue: string;
  mainLabel?: string;
  secondaryLabel?: string;
  className?: string;
}

const CircularProgress = ({
  value,
  max = 100,
  size = 180,
  strokeWidth = 10,
  mainValue,
  mainLabel,
  secondaryLabel,
  className,
}: CircularProgressProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min((value / max) * 100, 100);
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className={cn(
        "aspect-square rounded-xl bg-card/80 backdrop-blur-sm border border-border/20 flex items-center justify-center p-4",
        className
      )}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth - 2}
            className="opacity-30"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-300 ease-out"
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {secondaryLabel && (
            <span className="text-xs text-muted-foreground mb-1">
              {secondaryLabel}
            </span>
          )}
          <span className="text-3xl font-bold text-foreground tabular-nums">
            {mainValue}
          </span>
          {mainLabel && (
            <span className="text-sm text-muted-foreground mt-1">
              {mainLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CircularProgress;
