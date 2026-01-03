import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Droplets, Info, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { NutritionLogDialog } from "@/components/NutritionLogDialog";
import { HydrationDialog } from "@/components/HydrationDialog";
import { MilchprodukteDialog } from "@/components/MilchprodukteDialog";
import { NutritionHistory } from "@/components/NutritionHistory";
import { LiveUpdatePopup } from "@/components/LiveUpdatePopup";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLiveData } from "@/contexts/LiveDataContext";
import {
  calculateDailyNutrition,
  calculatePercentageChange,
  formatMLToLiters,
  DailyNutritionTotals
} from "@/lib/calculationUtils";
import vegetableImg from "@/assets/vegetable.jpg";
import veganImg from "@/assets/vegan.jpg";
import proteinImg from "@/assets/protein.jpg";
import supplementsImg from "@/assets/supplements.jpg";
import nutritionBg from "@/assets/nutrition-bg.png";
import hydrationBg from "@/assets/hydration-bg.jpg";
import milchprodukteBg from "@/assets/milchprodukte-bg.jpg";

interface LivePopup {
  type: "calories" | "protein" | "hydration";
  currentValue: number;
  previousValue: number;
  percentChange: number;
}

const Nutrition = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isGerman } = useLanguage();
  const { nutritionLogs: liveNutritionLogs, stats, refetch, setUserId: setLiveUserId } = useLiveData();
  const [userId, setUserId] = useState<string>("");
  const [userWeight, setUserWeight] = useState(70);
  const [selectedCategory, setSelectedCategory] = useState<"vegetarian" | "vegan" | "protein" | "supplements" | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isHydrationDialogOpen, setIsHydrationDialogOpen] = useState(false);
  const [isMilchprodukteDialogOpen, setIsMilchprodukteDialogOpen] = useState(false);
  const [nutritionLogs, setNutritionLogs] = useState<any[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  
  // Live update popup state
  const [livePopup, setLivePopup] = useState<LivePopup | null>(null);
  const previousTotalsRef = useRef<{ calories: number; protein: number; hydration: number } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate("/login");
        return;
      }

      setUserId(session.user.id);
      setLiveUserId(session.user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("weight")
        .eq("user_id", session.user.id)
        .single();

      if (profile?.weight) {
        setUserWeight(profile.weight);
      }

      loadNutritionLogs(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, refreshTrigger, setLiveUserId]);

  const loadNutritionLogs = async (uid: string) => {
    const { data, error } = await supabase
      .from("nutrition_logs")
      .select("*")
      .eq("user_id", uid)
      .order("completed_at", { ascending: false })
      .limit(30);

    if (error) {
      console.error("Error loading nutrition logs:", error);
      return;
    }

    setNutritionLogs(data || []);
  };

  const handleCategoryClick = (category: "vegetarian" | "vegan" | "protein" | "supplements") => {
    setSelectedCategory(category);
    setIsDialogOpen(true);
  };

  const handleDeleteLog = async (id: string) => {
    const { error } = await supabase
      .from("nutrition_logs")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: isGerman ? "Fehler" : "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: isGerman ? "Gelöscht" : "Deleted", description: isGerman ? "Eintrag gelöscht - Werte neu berechnet" : "Entry deleted - Values recalculated" });
    setRefreshTrigger(prev => prev + 1);
  };

  // Use centralized calculation from LiveDataContext - auto-calculated with proper unit normalization
  const dailyTotals = useMemo(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayNutrition = calculateDailyNutrition(nutritionLogs, today);
    const yesterdayNutrition = calculateDailyNutrition(nutritionLogs, yesterday);
    
    return {
      calories: todayNutrition.calories,
      protein: todayNutrition.protein,
      hydration: todayNutrition.hydration,
      caloriesChange: calculatePercentageChange(todayNutrition.calories, yesterdayNutrition.calories),
      proteinChange: calculatePercentageChange(todayNutrition.protein, yesterdayNutrition.protein),
      hydrationChange: calculatePercentageChange(todayNutrition.hydration, yesterdayNutrition.hydration),
    };
  }, [nutritionLogs]);

  // Show live update popup when values change
  useEffect(() => {
    if (previousTotalsRef.current) {
      const prev = previousTotalsRef.current;
      
      if (dailyTotals.calories > prev.calories && dailyTotals.caloriesChange !== 0) {
        setLivePopup({
          type: "calories",
          currentValue: dailyTotals.calories,
          previousValue: prev.calories,
          percentChange: dailyTotals.caloriesChange
        });
      } else if (dailyTotals.protein > prev.protein && dailyTotals.proteinChange !== 0) {
        setLivePopup({
          type: "protein",
          currentValue: dailyTotals.protein,
          previousValue: prev.protein,
          percentChange: dailyTotals.proteinChange
        });
      } else if (dailyTotals.hydration > prev.hydration && dailyTotals.hydrationChange !== 0) {
        setLivePopup({
          type: "hydration",
          currentValue: dailyTotals.hydration,
          previousValue: prev.hydration,
          percentChange: dailyTotals.hydrationChange
        });
      }
    }
    
    previousTotalsRef.current = {
      calories: dailyTotals.calories,
      protein: dailyTotals.protein,
      hydration: dailyTotals.hydration
    };
  }, [dailyTotals.calories, dailyTotals.protein, dailyTotals.hydration]);

  const nutritionCategories = [
    { image: vegetableImg, title: isGerman ? "Vegetarisch" : "Vegetarian", description: isGerman ? "Pflanzliche Ernährung" : "Plant-based nutrition", key: "vegetarian" as const },
    { image: veganImg, title: "Vegan", description: isGerman ? "100% pflanzlich" : "100% plant-based", key: "vegan" as const },
    { image: proteinImg, title: isGerman ? "Fleisch & Protein" : "Meat & Protein", description: isGerman ? "Proteinreiche Ernährung" : "High-protein nutrition", key: "protein" as const },
    { image: supplementsImg, title: "Supplements", description: isGerman ? "Nahrungsergänzung" : "Nutritional supplements", key: "supplements" as const },
  ];

  // Group logs by date - limit to 10 entries
  const today = new Date().toISOString().split('T')[0];
  const todayLogs = nutritionLogs.filter(log => log.completed_at.split('T')[0] === today).slice(0, 10);

  return (
    <div className="min-h-screen pb-24 relative">
      {/* Live Update Popup */}
      {livePopup && (
        <LiveUpdatePopup
          type={livePopup.type}
          currentValue={livePopup.currentValue}
          previousValue={livePopup.previousValue}
          percentChange={livePopup.percentChange}
          isGerman={isGerman}
          onClose={() => setLivePopup(null)}
        />
      )}
      
      {/* Background Image */}
      <div className="fixed inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${nutritionBg})` }} />
      <div className="fixed inset-0 bg-black/60" />

      <div className="relative z-10 max-w-screen-xl mx-auto p-6">
        {/* Header with Info Button */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold mb-2 text-white">{isGerman ? "Ernährung & Kalorien" : "Nutrition & Calories"}</h1>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setInfoDialogOpen(true)}
              className="text-white hover:bg-white/10"
            >
              <Info className="w-6 h-6" />
            </Button>
          </div>
          <p className="text-white/70">{isGerman ? "Wähle deinen Ernährungsplan" : "Choose your nutrition plan"}</p>
        </div>

        {/* Daily Stats - Starts at 0,00 auto-calculated from entries with units */}
        <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-6 mb-8">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-sm text-white/60 mb-1">{isGerman ? "Kalorien" : "Calories"}</div>
              <div className="text-3xl font-bold text-orange-400">{dailyTotals.calories.toFixed(2).replace('.', ',')}</div>
              <div className="text-xs text-white/50">kcal</div>
              {dailyTotals.caloriesChange !== 0 && (
                <div className={`text-xs mt-1 px-2 py-0.5 rounded-full inline-block ${dailyTotals.caloriesChange > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {dailyTotals.caloriesChange > 0 ? '+' : ''}{dailyTotals.caloriesChange.toFixed(0)}%
                </div>
              )}
            </div>
            <div>
              <div className="text-sm text-white/60 mb-1">Protein</div>
              <div className="text-3xl font-bold text-green-400">{dailyTotals.protein.toFixed(2).replace('.', ',')}</div>
              <div className="text-xs text-white/50">g</div>
              {dailyTotals.proteinChange !== 0 && (
                <div className={`text-xs mt-1 px-2 py-0.5 rounded-full inline-block ${dailyTotals.proteinChange > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {dailyTotals.proteinChange > 0 ? '+' : ''}{dailyTotals.proteinChange.toFixed(0)}%
                </div>
              )}
            </div>
            <div>
              <div className="text-sm text-white/60 mb-1">Hydration</div>
              <div className="text-3xl font-bold text-blue-400">{dailyTotals.hydration.toFixed(2).replace('.', ',')}</div>
              <div className="text-xs text-white/50">ml / L</div>
              {dailyTotals.hydrationChange !== 0 && (
                <div className={`text-xs mt-1 px-2 py-0.5 rounded-full inline-block ${dailyTotals.hydrationChange > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {dailyTotals.hydrationChange > 0 ? '+' : ''}{dailyTotals.hydrationChange.toFixed(0)}%
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-white/50 text-center mt-4">
            {todayLogs.length === 0 
              ? (isGerman ? "Keine Einträge - Füge Mahlzeiten hinzu" : "No entries - Add meals to start") 
              : (isGerman ? "Auto-berechnet aus Essensplan • Prozent = Vergleich zu gestern" : "Auto-calculated from meal plan • Percent = compared to yesterday")}
          </p>
        </Card>

        {/* Nutrition Categories */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {nutritionCategories.map((category, index) => (
            <Card key={index} onClick={() => handleCategoryClick(category.key)} className="relative overflow-hidden border-white/10 hover:scale-105 transition-all duration-300 cursor-pointer hover:border-primary/50 h-48">
              <img src={category.image} alt={category.title} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-xl font-bold mb-1">{category.title}</h3>
                <p className="text-sm text-white/80">{category.description}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Hydration & Milchprodukte Boxes */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card 
            onClick={() => setIsHydrationDialogOpen(true)} 
            className="relative overflow-hidden border-white/10 hover:scale-105 transition-all duration-300 cursor-pointer hover:border-blue-500/50 h-32"
          >
            <img src={hydrationBg} alt="Hydration" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 via-blue-800/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
              <div className="flex items-center gap-2">
                <Droplets className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-bold">Hydration</h3>
              </div>
              <p className="text-xs text-white/80">{isGerman ? "Wasser tracken" : "Track water"}</p>
            </div>
          </Card>
          <Card 
            onClick={() => setIsMilchprodukteDialogOpen(true)} 
            className="relative overflow-hidden border-white/10 hover:scale-105 transition-all duration-300 cursor-pointer hover:border-amber-500/50 h-32"
          >
            <img src={milchprodukteBg} alt="Milchprodukte" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-amber-900/80 via-amber-800/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
              <h3 className="text-lg font-bold">{isGerman ? "Milchprodukte" : "Dairy"}</h3>
              <p className="text-xs text-white/80">{isGerman ? "Milch, Käse, Eier" : "Milk, Cheese, Eggs"}</p>
            </div>
          </Card>
        </div>

        {/* Today's Meal Plan - Editable */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-6 text-white">{isGerman ? "Heutiger Essensplan" : "Today's Meal Plan"}</h2>
          <NutritionHistory 
            logs={todayLogs} 
            onRefresh={() => setRefreshTrigger(prev => prev + 1)} 
            onDelete={handleDeleteLog}
          />
        </div>
      </div>

      {/* Info-Popup Dialog */}
      <Dialog open={infoDialogOpen} onOpenChange={setInfoDialogOpen}>
        <DialogContent className="sm:max-w-md bg-black/90 backdrop-blur-lg border-white/20">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-white">
              <span className="flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                {isGerman ? "Über den Algorithmus" : "About the Algorithm"}
              </span>
              <Button variant="ghost" size="icon" onClick={() => setInfoDialogOpen(false)} className="text-white hover:bg-white/10">
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-white/90 leading-relaxed">
              {isGerman 
                ? "In dieser App ist ein Algorithmus integriert, der dir täglich automatisch anzeigt:"
                : "This app has an integrated algorithm that automatically shows you daily:"}
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-blue-400">
                <Droplets className="w-5 h-5" />
                <span>{isGerman ? "Wie viel Wasser du heute getrunken hast" : "How much water you drank today"}</span>
              </li>
              <li className="flex items-center gap-3 text-orange-400">
                <span className="w-5 h-5 flex items-center justify-center">🔥</span>
                <span>{isGerman ? "Wie viele Kalorien du heute aufgenommen hast" : "How many calories you consumed today"}</span>
              </li>
              <li className="flex items-center gap-3 text-green-400">
                <span className="w-5 h-5 flex items-center justify-center">💪</span>
                <span>{isGerman ? "Wie viel Protein du heute aufgenommen hast" : "How much protein you consumed today"}</span>
              </li>
            </ul>
            <div className="pt-4 border-t border-white/10">
              <p className="text-xs text-white/60">
                {isGerman 
                  ? "Alle Werte werden automatisch aus deinen Einträgen berechnet. Die Prozentanzeige vergleicht deinen heutigen Wert mit gestern."
                  : "All values are automatically calculated from your entries. The percentage display compares today's value with yesterday."}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <NutritionLogDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} category={selectedCategory} userId={userId} isGerman={isGerman} onSuccess={() => setRefreshTrigger(prev => prev + 1)} />
      <HydrationDialog open={isHydrationDialogOpen} onOpenChange={setIsHydrationDialogOpen} userId={userId} isGerman={isGerman} onSuccess={() => setRefreshTrigger(prev => prev + 1)} />
      <MilchprodukteDialog open={isMilchprodukteDialogOpen} onOpenChange={setIsMilchprodukteDialogOpen} userId={userId} isGerman={isGerman} onSuccess={() => setRefreshTrigger(prev => prev + 1)} />
      <BottomNav />
    </div>
  );
};

export default Nutrition;
