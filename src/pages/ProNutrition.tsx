import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Camera, Barcode, Plus, Loader2 } from "lucide-react";
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

  const [isScanning, setIsScanning] = useState(false);
  const [manualFoodName, setManualFoodName] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);

  const analyzeFood = async (foodName: string, barcode?: string) => {
    setIsScanning(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-food`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          foodName: foodName,
          barcode: barcode
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Fehler bei der Analyse");
      }

      const data = await response.json();
      const nutritionData = data.nutritionData;
      
      setScannedFood({
        name: nutritionData.foodName || foodName,
        calories: nutritionData.calories || 0,
        protein: nutritionData.protein || 0,
        fat: nutritionData.fats || 0,
        carbs: nutritionData.carbs || 0
      });
      
      toast({
        title: isGerman ? "Analyse erfolgreich" : "Analysis successful",
        description: `${nutritionData.foodName || foodName} ${isGerman ? "analysiert" : "analyzed"}`
      });
    } catch (error) {
      console.error("Error analyzing food:", error);
      toast({
        title: isGerman ? "Fehler" : "Error",
        description: error instanceof Error ? error.message : "Lebensmittel konnte nicht analysiert werden",
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
      setShowManualInput(false);
      setManualFoodName("");
    }
  };

  const handleBarcodeScan = () => {
    // For demo, prompt for food name since we can't actually scan
    setShowManualInput(true);
  };

  const handlePhotoScan = () => {
    // For demo, prompt for food name since we can't actually take a photo
    setShowManualInput(true);
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
            {isScanning ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="text-muted-foreground text-lg">
                  {isGerman ? "Analysiere..." : "Analyzing..."}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground text-lg">
                {isGerman ? "Richte Barcode / Produkt in den Rahmen aus" : "Align barcode / product in frame"}
              </p>
            )}
          </div>
        </Card>

        {/* Manual Input */}
        {showManualInput && (
          <Card className="gradient-card card-shadow border-white/10 p-6 mb-6">
            <Label className="mb-2 block">{isGerman ? "Lebensmittel Name" : "Food Name"}</Label>
            <Input
              value={manualFoodName}
              onChange={(e) => setManualFoodName(e.target.value)}
              placeholder={isGerman ? "z.B. Banane, Hähnchenbrust, Reis..." : "e.g. Banana, Chicken Breast, Rice..."}
              className="mb-4"
            />
            <Button 
              onClick={() => analyzeFood(manualFoodName)} 
              disabled={!manualFoodName || isScanning}
              className="w-full"
            >
              {isScanning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {isGerman ? "Analysieren" : "Analyze"}
            </Button>
          </Card>
        )}

        {/* Scan Buttons */}
        <div className="flex gap-4 mb-8">
          <Button 
            onClick={handleBarcodeScan} 
            className="flex-1"
            size="lg"
            disabled={isScanning}
          >
            <Barcode className="w-5 h-5 mr-2" />
            Barcode
          </Button>
          <Button 
            onClick={handlePhotoScan} 
            variant="outline"
            className="flex-1"
            size="lg"
            disabled={isScanning}
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