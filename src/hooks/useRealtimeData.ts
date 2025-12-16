import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtime, queueOfflineAction } from "@/contexts/RealtimeContext";

type TableName = "nutrition_logs" | "workout_logs" | "jogging_logs" | "weight_logs" | "body_analysis" | "food_analysis" | "profiles";

interface UseRealtimeDataOptions {
  table: TableName;
  filter?: { column: string; value: string };
  orderBy?: { column: string; ascending?: boolean };
  enabled?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useRealtimeData<T = any>({ 
  table, 
  filter, 
  orderBy,
  enabled = true 
}: UseRealtimeDataOptions) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { isOnline, subscribeToTable } = useRealtime();

  // Fetch data from Supabase
  const fetchData = useCallback(async () => {
    if (!enabled) return;
    
    try {
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = supabase.from(table).select("*") as any;
      
      if (filter) {
        query = query.eq(filter.column, filter.value);
      }
      
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? false });
      }
      
      const { data: result, error: fetchError } = await query;
      
      if (fetchError) throw fetchError;
      
      setData((result || []) as T[]);
      
      // Cache locally for offline use
      localStorage.setItem(`cache_${table}`, JSON.stringify(result));
    } catch (err) {
      // Try to load from cache if offline
      if (!isOnline) {
        const cached = localStorage.getItem(`cache_${table}`);
        if (cached) {
          setData(JSON.parse(cached));
        }
      }
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [table, filter?.column, filter?.value, orderBy?.column, orderBy?.ascending, enabled, isOnline]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = subscribeToTable(table, (payload) => {
      if (payload.eventType === "INSERT") {
        setData((prev) => [payload.new as T, ...prev]);
      } else if (payload.eventType === "UPDATE") {
        setData((prev) =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          prev.map((item: any) =>
            item.id === payload.new.id ? (payload.new as T) : item
          )
        );
      } else if (payload.eventType === "DELETE") {
        setData((prev) =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          prev.filter((item: any) => item.id !== payload.old.id)
        );
      }
    });

    return unsubscribe;
  }, [table, subscribeToTable, enabled]);

  // CRUD operations with offline support
  const insert = useCallback(async (newData: Partial<T>) => {
    if (!isOnline) {
      queueOfflineAction(table, "insert", newData);
      // Optimistic update
      setData((prev) => [{ ...newData, id: crypto.randomUUID() } as T, ...prev]);
      return { data: newData, error: null };
    }

    const { data: result, error: insertError } = await supabase
      .from(table)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(newData as any)
      .select()
      .single();

    if (!insertError && result) {
      setData((prev) => [result as T, ...prev]);
    }

    return { data: result, error: insertError };
  }, [table, isOnline]);

  const update = useCallback(async (id: string, updates: Partial<T>) => {
    if (!isOnline) {
      queueOfflineAction(table, "update", { id, ...updates });
      // Optimistic update
      setData((prev) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        prev.map((item: any) => (item.id === id ? { ...item, ...updates } : item))
      );
      return { data: updates, error: null };
    }

    const { data: result, error: updateError } = await supabase
      .from(table)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update(updates as any)
      .eq("id", id)
      .select()
      .single();

    if (!updateError && result) {
      setData((prev) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        prev.map((item: any) => (item.id === id ? (result as T) : item))
      );
    }

    return { data: result, error: updateError };
  }, [table, isOnline]);

  const remove = useCallback(async (id: string) => {
    if (!isOnline) {
      queueOfflineAction(table, "delete", { id });
      // Optimistic update
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setData((prev) => prev.filter((item: any) => item.id !== id));
      return { error: null };
    }

    const { error: deleteError } = await supabase.from(table).delete().eq("id", id);

    if (!deleteError) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setData((prev) => prev.filter((item: any) => item.id !== id));
    }

    return { error: deleteError };
  }, [table, isOnline]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    insert,
    update,
    remove,
  };
}
