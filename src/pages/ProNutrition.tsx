import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Camera, Barcode, X, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";

interface ScannedFood {
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

const ProNutrition = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGerman, setIsGerman] = useState(true);
  const [scannedFood, setScannedFood] = useState<ScannedFood | null>(null);
  const [addToDayDialogOpen, setAddToDayDialogOpen] = useState(false);
  const [dailyTotals, setDailyTotals] = useState({
    calories: 1776,
    protein: 108,
    carbs: 215
  });

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate("/login");
        return;
      }
      const metadata = session.user.user_metadata;
      setIsGerman(metadata.language === "de");
    });
  }, [navigate]);

  const simulateScan = (type: "barcode" | "photo") => {
    // Simulate AI scanning a food item
    setTimeout(() => {
      const foods = [
        { name: "Bananen", calories: 90, protein: 1.2, fat: 0.3, carbs: 23 },
        { name: "Hähnchenbrust", calories: 165, protein: 31, fat: 3.6, carbs: 0 },
        { name: "Reis", calories: 130, protein: 2.7, fat: 0.3, carbs: 28 },
        { name: "Proteinshake", calories: 120, protein: 24, fat: 1, carbs: 3 },
      ];
      const randomFood = foods[Math.floor(Math.random() * foods.length)];
      setScannedFood(randomFood);
      
      toast({
        title: isGerman ? "Scan erfolgreich" : "Scan successful",
        description: `${randomFood.name} ${isGerman ? "erkannt" : "detected"}`
      });
    }, 1500);
  };

  const handleAddToDay = (category: string) => {
    if (scannedFood) {
      setDailyTotals(prev => ({
        calories: prev.calories + scannedFood.calories,
        protein: prev.protein + scannedFood.protein,
        carbs: prev.carbs + scannedFood.carbs
      }));
      
      toast({
        title: isGerman ? "Hinzugefügt" : "Added",
        description: `${scannedFood.name} ${isGerman ? "zu" : "to"} ${category} ${isGerman ? "hinzugefügt" : "added"}`
      });
      
      setAddToDayDialogOpen(false);
      setScannedFood(null);
    }
  };

  return (
    <div className="min-h-screen pb-24 gradient-male">
      <div className="max-w-screen-xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/pro-subscription")}>
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold">Mahlzeit scannen</h1>
            <p className="text-muted-foreground">
              {isGerman ? "Scanne deine Mahlzeit" : "Scan your meal"}
            </p>
          </div>
        </div>

        {/* Scan Area */}
        <Card className="gradient-card card-shadow border-white/10 p-8 mb-6">
          <div className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center">
            <p className="text-muted-foreground text-lg">
              {isGerman ? "Richte Barcode / Produkt in den Rahmen aus" : "Align barcode / product in frame"}
            </p>
          </div>
        </Card>

        {/* Scan Buttons */}
        <div className="flex gap-4 mb-8">
          <Button 
            onClick={() => simulateScan("barcode")} 
            className="flex-1"
            size="lg"
          >
            <Barcode className="w-5 h-5 mr-2" />
            Barcode
          </Button>
          <Button 
            onClick={() => simulateScan("photo")} 
            variant="outline"
            className="flex-1"
            size="lg"
          >
            <Camera className="w-5 h-5 mr-2" />
            Foto
          </Button>
        </div>

        {/* Scanned Food Display */}
        {scannedFood && (
          <Card className="gradient-card card-shadow border-white/10 p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">{scannedFood.name}</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isGerman ? "Kalorien" : "Calories"}</span>
                <span className="font-bold">{scannedFood.calories} ㎈</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Protein</span>
                <span className="font-bold">{scannedFood.protein} g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fett</span>
                <span className="font-bold">{scannedFood.fat} g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isGerman ? "Kohlenhydrate" : "Carbs"}</span>
                <span className="font-bold">{scannedFood.carbs} g</span>
              </div>
            </div>

            <div className="text-sm text-yellow-400 flex items-center gap-2 mb-6">
              <span>ⓘ</span>
              <span>{isGerman ? "Überdosierung möglich" : "Overdose possible"}</span>
            </div>

            <Button onClick={() => setAddToDayDialogOpen(true)} className="w-full" size="lg">
              <Plus className="w-4 h-4 mr-2" />
              {isGerman ? "Hinzufügen zum Tag" : "Add to Day"}
            </Button>
          </Card>
        )}

        {/* Daily Totals */}
        <Card className="gradient-card card-shadow border-white/10 p-6">
          <div className="w-full bg-green-500/30 rounded-full h-3 mb-4">
            <div 
              className="bg-green-500 h-3 rounded-full transition-all" 
              style={{ width: `${Math.min((dailyTotals.calories / 2500) * 100, 100)}%` }}
            ></div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{dailyTotals.calories} kcal</div>
              <div className="text-sm text-muted-foreground">{dailyTotals.protein} g</div>
            </div>
            <div>
              <div className="text-lg font-bold">Protein</div>
              <div className="text-sm text-muted-foreground">{dailyTotals.protein} g</div>
            </div>
            <div>
              <div className="text-lg font-bold">{isGerman ? "Kohlenhydrate" : "Carbs"}</div>
              <div className="text-sm text-muted-foreground">{dailyTotals.carbs} g</div>
            </div>
          </div>
        </Card>

        {/* Add to Day Dialog */}
        <Dialog open={addToDayDialogOpen} onOpenChange={setAddToDayDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{isGerman ? "Kategorie wählen" : "Choose Category"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Button 
                onClick={() => handleAddToDay("Healthy & Power")} 
                className="w-full justify-start"
                variant="outline"
              >
                🥗 Healthy & Power
              </Button>
              <Button 
                onClick={() => handleAddToDay("Gesundheitssicherheit")} 
                className="w-full justify-start"
                variant="outline"
              >
                💊 {isGerman ? "Gesundheitssicherheit" : "Health Safety"}
              </Button>
              <Button 
                onClick={() => handleAddToDay("Ernährung")} 
                className="w-full justify-start"
                variant="outline"
              >
                🍽️ {isGerman ? "Ernährung" : "Nutrition"}
              </Button>
              <Button 
                onClick={() => handleAddToDay("Tageskalorien")} 
                className="w-full justify-start"
                variant="outline"
              >
                🔥 {isGerman ? "Tageskalorien" : "Daily Calories"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <BottomNav />
    </div>
  );
};

export default ProNutrition;