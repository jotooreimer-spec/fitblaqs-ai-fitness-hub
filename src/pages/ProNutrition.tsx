import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Camera, Loader2, HelpCircle, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";
import proSubscriptionBg from "@/assets/pro-subscription-bg.png";

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
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedFile(url);
      setShowManualInput(true);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setUploadedFile(url);
      setShowManualInput(true);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

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
      setUploadedFile(null);
    }
  };

  return (
    <div className="min-h-screen pb-24 relative">
      {/* Background Image */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${proSubscriptionBg})` }}
      />
      <div className="fixed inset-0 bg-black/70" />

      <div className="relative z-10 max-w-screen-xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/pro-subscription")} className="text-white">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-lg font-semibold text-white">{isGerman ? "Mahlzeit scannen" : "Scan Meal"}</h1>
          <Button variant="ghost" size="icon" className="text-white">
            <HelpCircle className="w-6 h-6" />
          </Button>
        </div>

        {/* Scan Area - Smaller with Drag & Drop */}
        <Card className="bg-black/40 backdrop-blur-md border-white/10 rounded-2xl p-4 mb-4">
          <div 
            className={`border-2 border-dashed rounded-xl p-6 text-center min-h-[120px] flex items-center justify-center transition-colors ${
              isDragging ? 'border-primary bg-primary/10' : 'border-zinc-600'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {isScanning ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-zinc-400 text-sm">
                  {isGerman ? "Analysiere..." : "Analyzing..."}
                </p>
              </div>
            ) : uploadedFile ? (
              <div className="relative w-full">
                <img src={uploadedFile} alt="Uploaded" className="max-h-24 mx-auto rounded-lg" />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-0 right-0 w-6 h-6"
                  onClick={() => setUploadedFile(null)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <div>
                <Upload className="w-8 h-8 mx-auto mb-2 text-zinc-400" />
                <p className="text-zinc-400 text-sm mb-2">
                  {isGerman ? "Bild/Scan per Drag & Drop hochladen" : "Drag & drop image/scan"}
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="food-upload"
                />
                <label htmlFor="food-upload">
                  <Button asChild variant="outline" size="sm" className="bg-zinc-800/50 border-zinc-600 text-white">
                    <span>
                      <Upload className="w-3 h-3 mr-1" />
                      {isGerman ? "Hochladen" : "Upload"}
                    </span>
                  </Button>
                </label>
              </div>
            )}
          </div>
        </Card>

        {/* Manual Input */}
        {showManualInput && (
          <Card className="bg-black/40 backdrop-blur-md border-white/10 rounded-2xl p-4 mb-4">
            <Label className="mb-2 block text-zinc-300 text-sm">{isGerman ? "Lebensmittel Name" : "Food Name"}</Label>
            <Input
              value={manualFoodName}
              onChange={(e) => setManualFoodName(e.target.value)}
              placeholder={isGerman ? "z.B. Banane, Hähnchenbrust..." : "e.g. Banana, Chicken..."}
              className="mb-3 bg-zinc-800/50 border-zinc-600 text-white"
            />
            <Button 
              onClick={() => analyzeFood(manualFoodName)} 
              disabled={!manualFoodName || isScanning}
              className="w-full bg-primary hover:bg-primary/90"
              size="sm"
            >
              {isScanning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {isGerman ? "Analysieren" : "Analyze"}
            </Button>
          </Card>
        )}

        {/* Scan Buttons */}
        <div className="flex gap-3 mb-4">
          <Button 
            onClick={handleBarcodeScan} 
            className="flex-1 bg-zinc-800/80 hover:bg-zinc-700 text-white border-0 rounded-full py-5"
            disabled={isScanning}
          >
            <BarcodeIcon className="w-4 h-4 mr-2" />
            Barcode
          </Button>
          <Button 
            onClick={handlePhotoScan} 
            className="flex-1 bg-zinc-800/80 hover:bg-zinc-700 text-white border-0 rounded-full py-5"
            disabled={isScanning}
          >
            <Camera className="w-4 h-4 mr-2" />
            Foto
          </Button>
        </div>

        {/* Scanned Food Display */}
        {scannedFood && (
          <Card className="bg-black/40 backdrop-blur-md border-white/10 rounded-2xl p-4 mb-4">
            <h2 className="text-xl font-bold text-white mb-3">{scannedFood.name}</h2>
            
            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">{isGerman ? "Kalorien" : "Calories"}</span>
                <span className="text-white font-medium">{scannedFood.calories} kcal</span>
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

            <Button onClick={() => setAddToDayDialogOpen(true)} className="w-full bg-zinc-800/80 hover:bg-zinc-700 text-white rounded-full py-5">
              {isGerman ? "Hinzufügen zum Tag" : "Add to Day"}
            </Button>
          </Card>
        )}

        {/* Daily Totals */}
        <Card className="bg-black/40 backdrop-blur-md border-white/10 rounded-2xl p-4">
          <div className="w-full bg-zinc-700 rounded-full h-2 mb-4">
            <div 
              className="bg-emerald-500 h-2 rounded-full transition-all" 
              style={{ width: `${Math.min((dailyTotals.calories / 2500) * 100, 100)}%` }}
            ></div>
          </div>
          
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div>
              <div className="text-lg font-bold text-white">{dailyTotals.calories}</div>
              <div className="text-xs text-zinc-400">kcal</div>
            </div>
            <div>
              <div className="text-lg font-medium text-white">{dailyTotals.protein}g</div>
              <div className="text-xs text-zinc-400">Protein</div>
            </div>
            <div>
              <div className="text-lg font-medium text-white">{dailyTotals.carbs}g</div>
              <div className="text-xs text-zinc-400">{isGerman ? "Kohlenhydrate" : "Carbs"}</div>
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