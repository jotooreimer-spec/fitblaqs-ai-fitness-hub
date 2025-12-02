import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Leaf, Carrot, Drumstick, Pill, Trash2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { NutritionLogDialog } from "@/components/NutritionLogDialog";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const Nutrition = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGerman, setIsGerman] = useState(true);
  const [userId, setUserId] = useState<string>("");
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

      // Load nutrition logs
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
      toast({
        title: isGerman ? "Fehler" : "Error",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    toast({
      title: isGerman ? "Gelöscht" : "Deleted",
      description: isGerman ? "Eintrag gelöscht" : "Entry deleted"
    });

    setRefreshTrigger(prev => prev + 1);
  };

  const calculateDailyTotals = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = nutritionLogs.filter(log => 
      log.completed_at.split('T')[0] === today
    );

    const totals = {
      calories: 0,
      protein: 0,
      water: 0
    };

    todayLogs.forEach(log => {
      totals.calories += log.calories || 0;
      totals.protein += log.protein || 0;
      
      // Extract water from notes
      const waterMatch = log.notes?.match(/Water: ([\d.]+)/);
      if (waterMatch) {
        totals.water += parseFloat(waterMatch[1]) || 0;
      }
    });

    return totals;
  };

  const dailyTotals = calculateDailyTotals();

  const nutritionCategories = [
    {
      icon: Leaf,
      title: isGerman ? "Vegetarisch" : "Vegetarian",
      description: isGerman ? "Pflanzliche Ernährung" : "Plant-based nutrition",
      color: "text-green-400",
    },
    {
      icon: Carrot,
      title: "Vegan",
      description: isGerman ? "100% pflanzlich" : "100% plant-based",
      color: "text-emerald-400",
    },
    {
      icon: Drumstick,
      title: isGerman ? "Fleisch & Protein" : "Meat & Protein",
      description: isGerman ? "Proteinreiche Ernährung" : "High-protein nutrition",
      color: "text-orange-400",
    },
    {
      icon: Pill,
      title: "Supplements",
      description: isGerman ? "Nahrungsergänzung" : "Nutritional supplements",
      color: "text-purple-400",
    },
  ];

  return (
    <div className="min-h-screen pb-24 gradient-male">
      <div className="max-w-screen-xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {isGerman ? "Ernährung & Kalorien" : "Nutrition & Calories"}
          </h1>
          <p className="text-muted-foreground">
            {isGerman ? "Wähle deinen Ernährungsplan" : "Choose your nutrition plan"}
          </p>
        </div>

        {/* Daily Stats */}
        <Card className="gradient-card card-shadow border-white/10 p-6 mb-8">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                {isGerman ? "Kalorien" : "Calories"}
              </div>
              <div className="text-3xl font-bold text-primary">{dailyTotals.calories}</div>
              <div className="text-xs text-muted-foreground">kcal</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                {isGerman ? "Protein" : "Protein"}
              </div>
              <div className="text-3xl font-bold text-green-400">{Math.round(dailyTotals.protein)}g</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                {isGerman ? "Wasser" : "Water"}
              </div>
              <div className="text-3xl font-bold text-blue-400">{(dailyTotals.water / 1000).toFixed(1)}L</div>
            </div>
          </div>
        </Card>

        {/* Nutrition Categories */}
        <div className="grid md:grid-cols-2 gap-6">
          {nutritionCategories.map((category, index) => {
            const Icon = category.icon;
            const categoryKey = index === 0 ? "vegetarian" : index === 1 ? "vegan" : index === 2 ? "protein" : "supplements";
            return (
              <Card
                key={index}
                onClick={() => handleCategoryClick(categoryKey as any)}
                className="gradient-card card-shadow border-white/10 p-8 hover:scale-105 transition-all duration-300 cursor-pointer hover:border-primary/50"
              >
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-background/50">
                    <Icon className={`w-12 h-12 ${category.color}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">{category.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Nutrition History */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-6">
            {isGerman ? "Heutiger Essensplan" : "Today's Meal Plan"}
          </h2>
          <div className="space-y-4">
            {nutritionLogs.map((log) => (
              <Card
                key={log.id}
                className="gradient-card card-shadow border-white/10 p-4"
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="font-semibold">{log.food_name}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {log.calories} kcal • {Math.round(log.protein || 0)}g Protein
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(log.completed_at).toLocaleDateString(isGerman ? "de-DE" : "en-US")}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteLog(log.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            {nutritionLogs.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                {isGerman ? "Keine Einträge vorhanden" : "No entries yet"}
              </div>
            )}
          </div>
        </div>
      </div>

      <NutritionLogDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        category={selectedCategory}
        userId={userId}
        isGerman={isGerman}
        onSuccess={() => setRefreshTrigger(prev => prev + 1)}
      />

      <BottomNav />
    </div>
  );
};

export default Nutrition;
