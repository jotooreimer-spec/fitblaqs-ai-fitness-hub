import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Flame, Droplets } from "lucide-react";
import { Card } from "@/components/ui/card";

interface LiveUpdatePopupProps {
  type: "calories" | "protein" | "hydration";
  currentValue: number;
  previousValue: number;
  percentChange: number;
  isGerman: boolean;
  onClose: () => void;
}

export const LiveUpdatePopup = ({ 
  type, 
  currentValue, 
  previousValue, 
  percentChange, 
  isGerman,
  onClose 
}: LiveUpdatePopupProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getTypeConfig = () => {
    switch (type) {
      case "calories":
        return {
          label: isGerman ? "Kalorien" : "Calories",
          unit: "kcal",
          icon: Flame,
          color: "text-orange-400",
          bgColor: "from-orange-500/20 to-orange-600/10"
        };
      case "protein":
        return {
          label: "Protein",
          unit: "g",
          icon: TrendingUp,
          color: "text-green-400",
          bgColor: "from-green-500/20 to-green-600/10"
        };
      case "hydration":
        return {
          label: "Hydration",
          unit: "ml",
          icon: Droplets,
          color: "text-blue-400",
          bgColor: "from-blue-500/20 to-blue-600/10"
        };
    }
  };

  const config = getTypeConfig();
  const Icon = config.icon;
  const isPositive = percentChange > 0;

  if (!isVisible) return null;

  return (
    <div className={`fixed top-20 right-4 z-50 animate-in slide-in-from-right duration-300 ${!isVisible ? 'animate-out slide-out-to-right' : ''}`}>
      <Card className={`p-4 bg-gradient-to-r ${config.bgColor} backdrop-blur-lg border-white/20 shadow-xl min-w-[200px]`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full bg-white/10 flex items-center justify-center ${config.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-white/60">{config.label} {isGerman ? "Update" : "Update"}</div>
            <div className={`text-lg font-bold ${config.color}`}>
              {currentValue.toFixed(0)} {config.unit}
            </div>
            <div className="flex items-center gap-1 text-xs">
              {isPositive ? (
                <TrendingUp className="w-3 h-3 text-green-400" />
              ) : percentChange < 0 ? (
                <TrendingDown className="w-3 h-3 text-red-400" />
              ) : null}
              <span className={isPositive ? "text-green-400" : percentChange < 0 ? "text-red-400" : "text-white/50"}>
                {percentChange > 0 ? '+' : ''}{percentChange.toFixed(0)}% {isGerman ? "zu gestern" : "vs yesterday"}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LiveUpdatePopup;