import React, { createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RealtimeChannel } from "@supabase/supabase-js";

interface RealtimeContextType {
  isOnline: boolean;
  isSyncing: boolean;
  lastSync: Date | null;
  triggerSync: () => void;
  subscribeToTable: (table: string, callback: (payload: any) => void) => () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

const OFFLINE_QUEUE_KEY = "fitblaqs_offline_queue";

interface OfflineAction {
  id: string;
  table: string;
  action: "insert" | "update" | "delete";
  data: any;
  timestamp: number;
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [lastSync, setLastSync] = React.useState<Date | null>(null);
  const [channels, setChannels] = React.useState<Map<string, RealtimeChannel>>(new Map());

  // Online/Offline detection
  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Wieder online", { description: "Daten werden synchronisiert..." });
      syncOfflineQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("Offline-Modus", { description: "Änderungen werden lokal gespeichert" });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Sync offline queue when coming back online
  const syncOfflineQueue = async () => {
    const queue = getOfflineQueue();
    if (queue.length === 0) return;

    setIsSyncing(true);
    
    for (const action of queue) {
      try {
        if (action.action === "insert") {
          await supabase.from(action.table as any).insert(action.data);
        } else if (action.action === "update") {
          await supabase.from(action.table as any).update(action.data).eq("id", action.data.id);
        } else if (action.action === "delete") {
          await supabase.from(action.table as any).delete().eq("id", action.data.id);
        }
      } catch (error) {
        console.error("Sync error:", error);
      }
    }

    clearOfflineQueue();
    setIsSyncing(false);
    setLastSync(new Date());
    toast.success("Synchronisation abgeschlossen");
  };

  const getOfflineQueue = (): OfflineAction[] => {
    try {
      return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]");
    } catch {
      return [];
    }
  };

  const clearOfflineQueue = () => {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  };

  const triggerSync = React.useCallback(() => {
    if (isOnline) {
      syncOfflineQueue();
    }
  }, [isOnline]);

  // Subscribe to real-time changes for a specific table
  const subscribeToTable = React.useCallback((table: string, callback: (payload: any) => void) => {
    const channelName = `realtime-${table}-${Date.now()}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: table,
        },
        (payload) => {
          callback(payload);
          
          // Show visual feedback
          const eventType = payload.eventType;
          if (eventType === "INSERT") {
            toast.info("Neue Daten", { description: `${table} wurde aktualisiert`, duration: 2000 });
          } else if (eventType === "UPDATE") {
            toast.info("Aktualisiert", { description: `${table} wurde geändert`, duration: 2000 });
          } else if (eventType === "DELETE") {
            toast.info("Entfernt", { description: `${table} Eintrag gelöscht`, duration: 2000 });
          }
        }
      )
      .subscribe();

    setChannels((prev) => new Map(prev).set(channelName, channel));

    return () => {
      supabase.removeChannel(channel);
      setChannels((prev) => {
        const newMap = new Map(prev);
        newMap.delete(channelName);
        return newMap;
      });
    };
  }, []);

  // Cleanup channels on unmount
  React.useEffect(() => {
    return () => {
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
  }, []);

  return (
    <RealtimeContext.Provider value={{ isOnline, isSyncing, lastSync, triggerSync, subscribeToTable }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error("useRealtime must be used within a RealtimeProvider");
  }
  return context;
}

// Helper function to queue offline actions
export const queueOfflineAction = (table: string, action: "insert" | "update" | "delete", data: any) => {
  const queue: OfflineAction[] = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]");
  queue.push({
    id: crypto.randomUUID(),
    table,
    action,
    data,
    timestamp: Date.now(),
  });
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
};
