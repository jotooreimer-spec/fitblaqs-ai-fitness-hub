import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Trash2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { NutritionLogDialog } from "@/components/NutritionLogDialog";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import vegetableImg from "@/assets/vegetable.jpg";
import veganImg from "@/assets/vegan.jpg";
import proteinImg from "@/assets/protein.jpg";
import supplementsImg from "@/assets/supplements.jpg";
import nutritionBg from "@/assets/nutrition-bg.png";

const Nutrition = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGerman, setIsGerman] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [userWeight, setUserWeight] = useState(70);
  const [selectedCategory, setSelectedCategory] = useState<"vegetarian" | "vegan" | "protein" | "supplements" | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [nutritionLogs, setNutritionLogs] = useState<any[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate("/login");
        return;
      }

      const metadata = session.user.user_metadata;
      setIsGerman(metadata.language === "de");
      setUserId(session.user.id);

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
  }, [navigate, refreshTrigger]);

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

  const handleSaveToCalendar = (log: any) => {
    toast({
      title: isGerman ? "Gespeichert" : "Saved",
      description: isGerman ? "Im Kalender gespeichert" : "Saved to calendar"
    });
  };

  // Auto-calculate daily totals - Start at 0, only count actual entries
  const calculateDailyTotals = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = nutritionLogs.filter(log => log.completed_at.split('T')[0] === today);

    let totalCalories = 0, totalProtein = 0, totalWater = 0;

    todayLogs.forEach(log => {
      totalCalories += log.calories || 0;
      totalProtein += log.protein || 0;
      
      const waterMatch = log.notes?.match(/Water: ([\d.]+)/);
      if (waterMatch) {
        totalWater += parseFloat(waterMatch[1]) || 0;
      }
    });

    // Always start at 0 - no default values based on weight
    return { calories: totalCalories, protein: totalProtein, water: totalWater };
  };

  const dailyTotals = calculateDailyTotals();

  const getCategoryName = (mealType: string) => {
    const categories: Record<string, string> = {
      breakfast: isGerman ? "Vegetarisch" : "Vegetarian",
      lunch: "Vegan",
      dinner: isGerman ? "Fleisch & Protein" : "Meat & Protein",
      snack: "Supplements"
    };
    return categories[mealType] || mealType;
  };

  const nutritionCategories = [
    { image: vegetableImg, title: isGerman ? "Vegetarisch" : "Vegetarian", description: isGerman ? "Pflanzliche Ernährung" : "Plant-based nutrition", key: "vegetarian" as const },
    { image: veganImg, title: "Vegan", description: isGerman ? "100% pflanzlich" : "100% plant-based", key: "vegan" as const },
    { image: proteinImg, title: isGerman ? "Fleisch & Protein" : "Meat & Protein", description: isGerman ? "Proteinreiche Ernährung" : "High-protein nutrition", key: "protein" as const },
    { image: supplementsImg, title: "Supplements", description: isGerman ? "Nahrungsergänzung" : "Nutritional supplements", key: "supplements" as const },
  ];

  // Group logs by date
  const today = new Date().toISOString().split('T')[0];
  const todayLogs = nutritionLogs.filter(log => log.completed_at.split('T')[0] === today);

  return (
    <div className="min-h-screen pb-24 relative">
      {/* Background Image */}
      <div className="fixed inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${nutritionBg})` }} />
      <div className="fixed inset-0 bg-black/60" />

      <div className="relative z-10 max-w-screen-xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-white">{isGerman ? "Ernährung & Kalorien" : "Nutrition & Calories"}</h1>
          <p className="text-white/70">{isGerman ? "Wähle deinen Ernährungsplan" : "Choose your nutrition plan"}</p>
        </div>

        {/* Daily Stats - Starts at 0, auto-calculated from entries */}
        <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-6 mb-8">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-sm text-white/60 mb-1">{isGerman ? "Kalorien" : "Calories"}</div>
              <div className="text-3xl font-bold text-orange-400">{dailyTotals.calories}</div>
              <div className="text-xs text-white/50">kcal</div>
            </div>
            <div>
              <div className="text-sm text-white/60 mb-1">Protein</div>
              <div className="text-3xl font-bold text-green-400">{Math.round(dailyTotals.protein)}g</div>
            </div>
            <div>
              <div className="text-sm text-white/60 mb-1">{isGerman ? "Wasser" : "Water"}</div>
              <div className="text-3xl font-bold text-blue-400">{(dailyTotals.water / 1000).toFixed(1)}L</div>
            </div>
          </div>
          <p className="text-xs text-white/50 text-center mt-4">
            {todayLogs.length === 0 
              ? (isGerman ? "Keine Einträge - Füge Mahlzeiten hinzu" : "No entries - Add meals to start") 
              : (isGerman ? "Auto-berechnet aus Essensplan" : "Auto-calculated from meal plan")}
          </p>
        </Card>

        {/* Nutrition Categories */}
        <div className="grid md:grid-cols-2 gap-6">
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

        {/* Today's Meal Plan */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-6 text-white">{isGerman ? "Heutiger Essensplan" : "Today's Meal Plan"}</h2>
          <div className="space-y-4">
            {todayLogs.map((log) => (
              <Card key={log.id} className="bg-black/40 backdrop-blur-sm border-white/10 p-4">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    {/* Category as header */}
                    <div className="text-xs font-semibold text-primary mb-1">{getCategoryName(log.meal_type)}</div>
                    <div className="font-semibold text-white">{log.food_name}</div>
                    <div className="text-sm text-white/60 mt-1">
                      {log.calories} kcal • {Math.round(log.protein || 0)}g Protein
                    </div>
                    <div className="text-xs text-white/40 mt-1">
                      {new Date(log.completed_at).toLocaleDateString(isGerman ? "de-DE" : "en-US")}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" onClick={() => handleSaveToCalendar(log)} className="text-primary hover:text-primary">
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDeleteLog(log.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            {todayLogs.length === 0 && (
              <div className="text-center text-white/50 py-8">{isGerman ? "Keine Einträge für heute" : "No entries for today"}</div>
            )}
          </div>
        </div>
      </div>

      <NutritionLogDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} category={selectedCategory} userId={userId} isGerman={isGerman} onSuccess={() => setRefreshTrigger(prev => prev + 1)} />
      <BottomNav />
    </div>
  );
};

export default Nutrition;