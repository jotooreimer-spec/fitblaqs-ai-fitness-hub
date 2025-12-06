import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type SubscriptionPlan = "pro_athlete" | "pro_nutrition";
type SubscriptionStatus = "active" | "cancelled" | "expired" | "pending";

interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  start_date: string;
  end_date: string | null;
}

export const useSubscription = (plan?: SubscriptionPlan) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasProAthlete, setHasProAthlete] = useState(false);
  const [hasProNutrition, setHasProNutrition] = useState(false);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      let query = supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("status", "active");

      if (plan) {
        query = query.eq("plan", plan);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching subscriptions:", error);
        setLoading(false);
        return;
      }

      // Type assertion since we know the structure matches
      const typedData = (data || []) as unknown as Subscription[];
      setSubscriptions(typedData);
      setHasProAthlete(typedData.some((s) => s.plan === "pro_athlete" && s.status === "active"));
      setHasProNutrition(typedData.some((s) => s.plan === "pro_nutrition" && s.status === "active"));
      setLoading(false);
    };

    fetchSubscriptions();

    // Subscribe to changes
    const channel = supabase
      .channel("subscriptions-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions" },
        () => {
          fetchSubscriptions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [plan]);

  return {
    subscriptions,
    loading,
    hasProAthlete,
    hasProNutrition,
    hasActiveSubscription: (p: SubscriptionPlan) => 
      subscriptions.some((s) => s.plan === p && s.status === "active"),
  };
};
