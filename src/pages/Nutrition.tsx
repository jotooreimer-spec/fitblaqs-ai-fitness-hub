import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Leaf, Carrot, Drumstick, Pill } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Nutrition = () => {
  const navigate = useNavigate();
  const [isGerman, setIsGerman] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
        return;
      }

      const metadata = session.user.user_metadata;
      setIsGerman(metadata.language === "de");
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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
              <div className="text-3xl font-bold text-primary">1,850</div>
              <div className="text-xs text-muted-foreground">/ 2,200</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                {isGerman ? "Protein" : "Protein"}
              </div>
              <div className="text-3xl font-bold text-green-400">125g</div>
              <div className="text-xs text-muted-foreground">/ 150g</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                {isGerman ? "Wasser" : "Water"}
              </div>
              <div className="text-3xl font-bold text-blue-400">2.1L</div>
              <div className="text-xs text-muted-foreground">/ 3L</div>
            </div>
          </div>
        </Card>

        {/* Nutrition Categories */}
        <div className="grid md:grid-cols-2 gap-6">
          {nutritionCategories.map((category, index) => {
            const Icon = category.icon;
            return (
              <Card
                key={index}
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

        {/* Meal Plan Preview */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-6">
            {isGerman ? "Heutiger Essensplan" : "Today's Meal Plan"}
          </h2>
          <div className="space-y-4">
            {["Frühstück", "Mittagessen", "Abendessen", "Snacks"].map((meal, index) => (
              <Card
                key={index}
                className="gradient-card card-shadow border-white/10 p-4 hover:border-primary/50 transition-all cursor-pointer"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{meal}</div>
                    <div className="text-sm text-muted-foreground">
                      {isGerman ? "Tippen zum Hinzufügen" : "Tap to add"}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">0 kcal</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Nutrition;
