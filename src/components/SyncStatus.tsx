import { useRealtime } from "@/contexts/RealtimeContext";
import { Wifi, WifiOff, RefreshCw, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SyncStatusProps {
  className?: string;
  showLabel?: boolean;
}

const SyncStatus = ({ className, showLabel = false }: SyncStatusProps) => {
  const { isOnline, isSyncing, lastSync } = useRealtime();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {isSyncing ? (
        <>
          <RefreshCw className="w-4 h-4 text-primary animate-spin" />
          {showLabel && <span className="text-xs text-muted-foreground">Synchronisiere...</span>}
        </>
      ) : isOnline ? (
        <>
          <div className="relative">
            <Wifi className="w-4 h-4 text-green-500" />
            <Check className="w-2 h-2 text-green-500 absolute -bottom-0.5 -right-0.5" />
          </div>
          {showLabel && <span className="text-xs text-green-500">Online</span>}
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 text-orange-500" />
          {showLabel && <span className="text-xs text-orange-500">Offline</span>}
        </>
      )}
    </div>
  );
};

export default SyncStatus;
