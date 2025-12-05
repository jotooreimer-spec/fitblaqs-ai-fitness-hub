import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Camera, Plus, Loader2, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";

// Barcode Icon
const BarcodeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="2" height="16" />
    <rect x="7" y="4" width="1" height="16" />
    <rect x="10" y="4" width="2" height="16" />
    <rect x="14" y="4" width="1" height="16" />
    <rect x="17" y="4" width="2" height="16" />
    <rect x="21" y="4" width="1" height="16" />
  </svg>
);

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
    setShowManualInput(true);
  };

  const handlePhotoScan = () => {
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
    <div className="min-h-screen pb-24 bg-black">
      <div className="max-w-screen-xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/pro-subscription")}>
            <ArrowLeft className="w-6 h-6 text-white" />
          </Button>
          <h1 className="text-xl font-semibold text-white">Mahlzeit scannen</h1>
          <Button variant="ghost" size="icon">
            <HelpCircle className="w-6 h-6 text-white" />
          </Button>
        </div>

        {/* Scan Area */}
        <Card className="bg-zinc-900 border-zinc-700 rounded-3xl p-8 mb-6">
          <div className="border-2 border-dashed border-zinc-600 rounded-2xl p-12 text-center min-h-[200px] flex items-center justify-center">
            {isScanning ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="text-zinc-400 text-lg">
                  {isGerman ? "Analysiere..." : "Analyzing..."}
                </p>
              </div>
            ) : (
              <p className="text-zinc-400 text-lg">
                {isGerman ? "Richte Barcode / Produkt in den Rahmen aus" : "Align barcode / product in frame"}
              </p>
            )}
          </div>
        </Card>

        {/* Manual Input */}
        {showManualInput && (
          <Card className="bg-zinc-900 border-zinc-700 rounded-3xl p-6 mb-6">
            <Label className="mb-2 block text-zinc-300">{isGerman ? "Lebensmittel Name" : "Food Name"}</Label>
            <Input
              value={manualFoodName}
              onChange={(e) => setManualFoodName(e.target.value)}
              placeholder={isGerman ? "z.B. Banane, Hähnchenbrust, Reis..." : "e.g. Banana, Chicken Breast, Rice..."}
              className="mb-4 bg-zinc-800 border-zinc-600 text-white"
            />
            <Button 
              onClick={() => analyzeFood(manualFoodName)} 
              disabled={!manualFoodName || isScanning}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {isScanning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {isGerman ? "Analysieren" : "Analyze"}
            </Button>
          </Card>
        )}

        {/* Scan Buttons */}
        <div className="flex gap-3 mb-6">
          <Button 
            onClick={handleBarcodeScan} 
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white border-0 rounded-full py-6"
            size="lg"
            disabled={isScanning}
          >
            <BarcodeIcon className="w-5 h-5 mr-2" />
            Barcode
          </Button>
          <Button 
            onClick={handlePhotoScan} 
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white border-0 rounded-full py-6"
            size="lg"
            disabled={isScanning}
          >
            <Camera className="w-5 h-5 mr-2" />
            Foto
          </Button>
        </div>

        {/* Scanned Food Display */}
        {scannedFood && (
          <Card className="bg-zinc-900 border-zinc-700 rounded-3xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">{scannedFood.name}</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-zinc-400">{isGerman ? "Kalorien" : "Calories"}</span>
                <span className="text-white font-medium">{scannedFood.calories} ㎈</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Protein</span>
                <span className="text-white font-medium">{scannedFood.protein} g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Fett</span>
                <span className="text-white font-medium">{scannedFood.fat} g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">{isGerman ? "Kohlenhydrate" : "Carbs"}</span>
                <span className="text-white font-medium">{scannedFood.carbs} g</span>
              </div>
            </div>

            <div className="text-sm text-yellow-500 flex items-center gap-2 mb-6">
              <span>ⓘ</span>
              <span>{isGerman ? "Überdosierung möglich" : "Overdose possible"}</span>
            </div>

            <Button onClick={() => setAddToDayDialogOpen(true)} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white rounded-full py-6" size="lg">
              {isGerman ? "Hinzufügen zum Tag" : "Add to Day"}
            </Button>
          </Card>
        )}

        {/* Daily Totals */}
        <Card className="bg-zinc-900 border-zinc-700 rounded-3xl p-6">
          <div className="w-full bg-zinc-700 rounded-full h-2 mb-4">
            <div 
              className="bg-emerald-500 h-2 rounded-full transition-all" 
              style={{ width: `${Math.min((dailyTotals.calories / 2500) * 100, 100)}%` }}
            ></div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-white">{dailyTotals.calories} kcal</div>
              <div className="text-sm text-zinc-400">{dailyTotals.protein} g</div>
            </div>
            <div>
              <div className="text-lg font-medium text-white">Protein</div>
              <div className="text-sm text-zinc-400">{dailyTotals.protein} g</div>
            </div>
            <div>
              <div className="text-lg font-medium text-white">{isGerman ? "Kohlenhydrate" : "Carbs"}</div>
              <div className="text-sm text-zinc-400">{dailyTotals.carbs} g</div>
            </div>
          </div>
        </Card>

        {/* Add to Day Dialog */}
        <Dialog open={addToDayDialogOpen} onOpenChange={setAddToDayDialogOpen}>
          <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-700">
            <DialogHeader>
              <DialogTitle className="text-white">{isGerman ? "Kategorie wählen" : "Choose Category"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Button 
                onClick={() => handleAddToDay("Healthy & Power")} 
                className="w-full justify-start bg-zinc-800 hover:bg-zinc-700 text-white"
                variant="outline"
              >
                🥗 Healthy & Power
              </Button>
              <Button 
                onClick={() => handleAddToDay("Gesundheitssicherheit")} 
                className="w-full justify-start bg-zinc-800 hover:bg-zinc-700 text-white"
                variant="outline"
              >
                💊 {isGerman ? "Gesundheitssicherheit" : "Health Safety"}
              </Button>
              <Button 
                onClick={() => handleAddToDay("Ernährung")} 
                className="w-full justify-start bg-zinc-800 hover:bg-zinc-700 text-white"
                variant="outline"
              >
                🍽️ {isGerman ? "Ernährung" : "Nutrition"}
              </Button>
              <Button 
                onClick={() => handleAddToDay("Tageskalorien")} 
                className="w-full justify-start bg-zinc-800 hover:bg-zinc-700 text-white"
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
