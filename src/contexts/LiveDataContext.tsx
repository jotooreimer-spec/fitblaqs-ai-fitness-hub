import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NutritionLog {
  id: string;
  user_id: string;
  meal_type: string;
  calories: number;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
  food_name: string;
  notes: string | null;
  completed_at: string;
  created_at: string;
}

interface WorkoutLog {
  id: string;
  user_id: string;
  exercise_id: string;
  sets: number;
  reps: number;
  weight: number | null;
  unit: string | null;
  notes: string | null;
  completed_at: string;
  created_at: string;
}

interface JoggingLog {
  id: string;
  user_id: string;
  distance: number;
  duration: number;
  calories: number | null;
  notes: string | null;
  completed_at: string;
  created_at: string;
}

interface WeightLog {
  id: string;
  user_id: string;
  weight: number;
  notes: string | null;
  measured_at: string;
  created_at: string;
}

interface Profile {
  id: string;
  user_id: string;
  height: number | null;
  weight: number | null;
  body_type: string | null;
  athlete_level: string | null;
  avatar_url: string | null;
  has_completed_onboarding: boolean | null;
}

interface BodyAnalysis {
  id: string;
  user_id: string;
  image_url: string | null;
  body_fat_pct: number | null;
  muscle_mass_pct: number | null;
  fitness_level: number | null;
  health_notes: string | null;
  created_at: string;
}

interface FoodAnalysis {
  id: string;
  user_id: string;
  image_url: string | null;
  items: any;
  total_calories: number | null;
  notes: string | null;
  category: string | null;
  created_at: string;
}

interface LiveStats {
  totalWorkouts: number;
  todayCalories: number;
  todayProtein: number;
  todayWater: number;
  totalDistance: number;
  currentWeight: number;
  monthlyWorkoutHours: number;
}

interface LiveDataContextType {
  // Data
  nutritionLogs: NutritionLog[];
  workoutLogs: WorkoutLog[];
  joggingLogs: JoggingLog[];
  weightLogs: WeightLog[];
  profile: Profile | null;
  bodyAnalysis: BodyAnalysis[];
  foodAnalysis: FoodAnalysis[];
  
  // Computed stats
  stats: LiveStats;
  
  // State
  isLoading: boolean;
  userId: string | null;
  
  // Actions
  refetch: () => Promise<void>;
  setUserId: (id: string) => void;
}

const LiveDataContext = createContext<LiveDataContextType | undefined>(undefined);

export const LiveDataProvider = ({ children }: { children: ReactNode }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Data states
  const [nutritionLogs, setNutritionLogs] = useState<NutritionLog[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [joggingLogs, setJoggingLogs] = useState<JoggingLog[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bodyAnalysis, setBodyAnalysis] = useState<BodyAnalysis[]>([]);
  const [foodAnalysis, setFoodAnalysis] = useState<FoodAnalysis[]>([]);
  
  // Computed stats
  const [stats, setStats] = useState<LiveStats>({
    totalWorkouts: 0,
    todayCalories: 0,
    todayProtein: 0,
    todayWater: 0,
    totalDistance: 0,
    currentWeight: 0,
    monthlyWorkoutHours: 0,
  });

  // Calculate stats from data
  const calculateStats = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    
    // Today's nutrition
    const todayNutrition = nutritionLogs.filter(n => {
      const date = new Date(n.completed_at);
      return date >= today && date <= todayEnd;
    });
    
    let totalCalories = 0;
    let totalProtein = 0;
    let totalWater = 0;
    
    todayNutrition.forEach(log => {
      totalCalories += log.calories || 0;
      totalProtein += log.protein || 0;
      
      // Parse water from notes
      if (log.notes) {
        try {
          const parsed = JSON.parse(log.notes);
          if (parsed?.water?.value) {
            const value = parseFloat(parsed.water.value) || 0;
            const unit = parsed.water.unit || 'ml';
            if (unit === 'l' || unit === 'liter') totalWater += value * 1000;
            else if (unit === 'dl') totalWater += value * 100;
            else totalWater += value;
          }
        } catch {}
      }
    });
    
    // Total distance from jogging
    const totalDistance = joggingLogs.reduce((sum, j) => sum + (parseFloat(String(j.distance)) || 0), 0);
    
    // Current weight
    const currentWeight = weightLogs.length > 0 
      ? parseFloat(String(weightLogs[0].weight)) || (profile?.weight || 0)
      : (profile?.weight || 0);
    
    // This year workouts
    const yearStart = new Date(today.getFullYear(), 0, 1);
    const yearWorkouts = workoutLogs.filter(w => new Date(w.completed_at) >= yearStart);
    const yearJogging = joggingLogs.filter(j => new Date(j.completed_at) >= yearStart);
    
    // Monthly workout hours
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthWorkouts = workoutLogs.filter(w => new Date(w.completed_at) >= monthStart);
    const monthJogging = joggingLogs.filter(j => new Date(j.completed_at) >= monthStart);
    
    const workoutHours = monthWorkouts.reduce((sum, w) => sum + ((w.sets || 1) * 3 / 60), 0);
    const joggingHours = monthJogging.reduce((sum, j) => sum + ((j.duration || 0) / 60), 0);
    
    setStats({
      totalWorkouts: yearWorkouts.length + yearJogging.length,
      todayCalories: totalCalories,
      todayProtein: totalProtein,
      todayWater: totalWater,
      totalDistance: totalDistance,
      currentWeight: currentWeight,
      monthlyWorkoutHours: workoutHours + joggingHours,
    });
  }, [nutritionLogs, workoutLogs, joggingLogs, weightLogs, profile]);

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    if (!userId) return;
    
    setIsLoading(true);
    
    try {
      const [
        nutritionRes,
        workoutRes,
        joggingRes,
        weightRes,
        profileRes,
        bodyAnalysisRes,
        foodAnalysisRes,
      ] = await Promise.all([
        supabase.from("nutrition_logs").select("*").eq("user_id", userId).order("completed_at", { ascending: false }),
        supabase.from("workout_logs").select("*").eq("user_id", userId).order("completed_at", { ascending: false }),
        supabase.from("jogging_logs").select("*").eq("user_id", userId).order("completed_at", { ascending: false }),
        supabase.from("weight_logs").select("*").eq("user_id", userId).order("measured_at", { ascending: false }),
        supabase.from("profiles").select("*").eq("user_id", userId).single(),
        supabase.from("body_analysis").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("food_analysis").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      ]);
      
      setNutritionLogs((nutritionRes.data || []) as NutritionLog[]);
      setWorkoutLogs((workoutRes.data || []) as WorkoutLog[]);
      setJoggingLogs((joggingRes.data || []) as JoggingLog[]);
      setWeightLogs((weightRes.data || []) as WeightLog[]);
      setProfile(profileRes.data as Profile | null);
      setBodyAnalysis((bodyAnalysisRes.data || []) as BodyAnalysis[]);
      setFoodAnalysis((foodAnalysisRes.data || []) as FoodAnalysis[]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!userId) return;

    const channels: ReturnType<typeof supabase.channel>[] = [];

    // Nutrition logs channel
    const nutritionChannel = supabase
      .channel("nutrition-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "nutrition_logs", filter: `user_id=eq.${userId}` }, (payload) => {
        if (payload.eventType === "INSERT") {
          setNutritionLogs(prev => [payload.new as NutritionLog, ...prev]);
          toast.success("Ernährung aktualisiert");
        } else if (payload.eventType === "UPDATE") {
          setNutritionLogs(prev => prev.map(item => item.id === payload.new.id ? payload.new as NutritionLog : item));
        } else if (payload.eventType === "DELETE") {
          setNutritionLogs(prev => prev.filter(item => item.id !== payload.old.id));
        }
      })
      .subscribe();
    channels.push(nutritionChannel);

    // Workout logs channel
    const workoutChannel = supabase
      .channel("workout-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "workout_logs", filter: `user_id=eq.${userId}` }, (payload) => {
        if (payload.eventType === "INSERT") {
          setWorkoutLogs(prev => [payload.new as WorkoutLog, ...prev]);
          toast.success("Training aktualisiert");
        } else if (payload.eventType === "UPDATE") {
          setWorkoutLogs(prev => prev.map(item => item.id === payload.new.id ? payload.new as WorkoutLog : item));
        } else if (payload.eventType === "DELETE") {
          setWorkoutLogs(prev => prev.filter(item => item.id !== payload.old.id));
        }
      })
      .subscribe();
    channels.push(workoutChannel);

    // Jogging logs channel
    const joggingChannel = supabase
      .channel("jogging-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "jogging_logs", filter: `user_id=eq.${userId}` }, (payload) => {
        if (payload.eventType === "INSERT") {
          setJoggingLogs(prev => [payload.new as JoggingLog, ...prev]);
          toast.success("Jogging aktualisiert");
        } else if (payload.eventType === "UPDATE") {
          setJoggingLogs(prev => prev.map(item => item.id === payload.new.id ? payload.new as JoggingLog : item));
        } else if (payload.eventType === "DELETE") {
          setJoggingLogs(prev => prev.filter(item => item.id !== payload.old.id));
        }
      })
      .subscribe();
    channels.push(joggingChannel);

    // Weight logs channel
    const weightChannel = supabase
      .channel("weight-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "weight_logs", filter: `user_id=eq.${userId}` }, (payload) => {
        if (payload.eventType === "INSERT") {
          setWeightLogs(prev => [payload.new as WeightLog, ...prev]);
          toast.success("Gewicht aktualisiert");
        } else if (payload.eventType === "UPDATE") {
          setWeightLogs(prev => prev.map(item => item.id === payload.new.id ? payload.new as WeightLog : item));
        } else if (payload.eventType === "DELETE") {
          setWeightLogs(prev => prev.filter(item => item.id !== payload.old.id));
        }
      })
      .subscribe();
    channels.push(weightChannel);

    // Profile channel
    const profileChannel = supabase
      .channel("profile-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles", filter: `user_id=eq.${userId}` }, (payload) => {
        if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
          setProfile(payload.new as Profile);
        }
      })
      .subscribe();
    channels.push(profileChannel);

    // Body analysis channel
    const bodyAnalysisChannel = supabase
      .channel("body-analysis-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "body_analysis", filter: `user_id=eq.${userId}` }, (payload) => {
        if (payload.eventType === "INSERT") {
          setBodyAnalysis(prev => [payload.new as BodyAnalysis, ...prev]);
          toast.success("Body Analysis aktualisiert");
        } else if (payload.eventType === "UPDATE") {
          setBodyAnalysis(prev => prev.map(item => item.id === payload.new.id ? payload.new as BodyAnalysis : item));
        } else if (payload.eventType === "DELETE") {
          setBodyAnalysis(prev => prev.filter(item => item.id !== payload.old.id));
        }
      })
      .subscribe();
    channels.push(bodyAnalysisChannel);

    // Food analysis channel
    const foodAnalysisChannel = supabase
      .channel("food-analysis-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "food_analysis", filter: `user_id=eq.${userId}` }, (payload) => {
        if (payload.eventType === "INSERT") {
          setFoodAnalysis(prev => [payload.new as FoodAnalysis, ...prev]);
          toast.success("Food Analysis aktualisiert");
        } else if (payload.eventType === "UPDATE") {
          setFoodAnalysis(prev => prev.map(item => item.id === payload.new.id ? payload.new as FoodAnalysis : item));
        } else if (payload.eventType === "DELETE") {
          setFoodAnalysis(prev => prev.filter(item => item.id !== payload.old.id));
        }
      })
      .subscribe();
    channels.push(foodAnalysisChannel);

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [userId]);

  // Initial fetch when userId changes
  useEffect(() => {
    if (userId) {
      fetchAllData();
    }
  }, [userId, fetchAllData]);

  // Recalculate stats when data changes
  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  return (
    <LiveDataContext.Provider value={{
      nutritionLogs,
      workoutLogs,
      joggingLogs,
      weightLogs,
      profile,
      bodyAnalysis,
      foodAnalysis,
      stats,
      isLoading,
      userId,
      refetch: fetchAllData,
      setUserId,
    }}>
      {children}
    </LiveDataContext.Provider>
  );
};

export const useLiveData = () => {
  const context = useContext(LiveDataContext);
  if (context === undefined) {
    throw new Error("useLiveData must be used within a LiveDataProvider");
  }
  return context;
};
