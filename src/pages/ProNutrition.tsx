import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, HelpCircle, Upload, X, Utensils, Scan, Save, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import BottomNav from "@/components/BottomNav";
import { FoodAnalysisSkeleton } from "@/components/AnalysisSkeleton";
import { compressImage, isValidImageFile } from "@/lib/imageUtils";
import proNutritionBg from "@/assets/pro-nutrition-bg.png";

interface FoodItem {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface FoodAnalysis {
  items: FoodItem[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  category: string;
  notes: string;
}

const ProNutrition = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGerman, setIsGerman] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [uploadedFileRaw, setUploadedFileRaw] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<FoodAnalysis | null>(null);
  const [foodTrackerDialogOpen, setFoodTrackerDialogOpen] = useState(false);
  const [manualForm, setManualForm] = useState({ name: "", calories: "", protein: "", carbs: "", fat: "", category: "protein" });
  const [dailyTotals, setDailyTotals] = useState({ calories: 0, protein: 0, carbs: 0 });
  const [history, setHistory] = useState<any[]>([]);

  // Subscription check disabled for testing - pages are freely accessible
  // const { hasProNutrition, loading: subscriptionLoading } = useSubscription("pro_nutrition");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { navigate("/login"); return; }
      const metadata = session.user.user_metadata;
      setIsGerman(metadata.language === "de");
      setUserId(session.user.id);
      loadHistory(session.user.id);
    });
  }, [navigate]);

  const loadHistory = async (uid: string) => {
    const { data } = await supabase
      .from("food_analysis")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(30);

    if (data) {
      setHistory(data);
      // Calculate daily totals
      const today = new Date().toISOString().split('T')[0];
      const todayLogs = data.filter(d => d.created_at.split('T')[0] === today);
      const totals = todayLogs.reduce((acc, log) => {
        const items = (log.items as unknown as FoodItem[]) || [];
        return {
          calories: acc.calories + (log.total_calories || 0),
          protein: acc.protein + items.reduce((s, i) => s + (i.protein || 0), 0),
          carbs: acc.carbs + items.reduce((s, i) => s + (i.carbs || 0), 0),
        };
      }, { calories: 0, protein: 0, carbs: 0 });
      setDailyTotals(totals);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && isValidImageFile(file)) {
      setUploadedFileRaw(file);
      setUploadedFile(URL.createObjectURL(file));
    } else {
      toast({ title: isGerman ? "Ungültiger Dateityp" : "Invalid file type", variant: "destructive" });
    }
  }, [isGerman, toast]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isValidImageFile(file)) {
      setUploadedFileRaw(file);
      setUploadedFile(URL.createObjectURL(file));
    } else if (file) {
      toast({ title: isGerman ? "Ungültiger Dateityp" : "Invalid file type", variant: "destructive" });
    }
  };

  const analyzeFood = async () => {
    if (!uploadedFileRaw) {
      toast({ title: isGerman ? "Bitte lade ein Bild hoch" : "Please upload an image", variant: "destructive" });
      return;
    }

    setIsAnalyzing(true);
    try {
      const compressed = await compressImage(uploadedFileRaw);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-food-ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          imageBase64: compressed.base64,
          category: manualForm.category,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check for invalid image error
        if (data.error === "invalid_image") {
          toast({ 
            title: isGerman ? "Ungültiges Bild" : "Invalid Image", 
            description: data.message || (isGerman ? "Bitte ein passendes Essensbild hochladen" : "Please upload a valid food image"),
            variant: "destructive" 
          });
          return;
        }
        throw new Error(data.error || "API error");
      }

      setAnalysisResult(data.analysis);
      loadHistory(userId);
      toast({ title: isGerman ? "Analyse erfolgreich" : "Analysis successful" });
    } catch (error) {
      console.error("Food analysis error:", error);
      toast({ 
        title: isGerman ? "Analyse fehlgeschlagen" : "Analysis failed", 
        description: isGerman ? "Bitte versuche es erneut" : "Please try again",
        variant: "destructive" 
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveManualEntry = async () => {
    if (!manualForm.name || !manualForm.calories) {
      toast({ title: isGerman ? "Bitte Name und Kalorien eingeben" : "Please enter name and calories", variant: "destructive" });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const items = [{
      name: manualForm.name,
      portion: "1 serving",
      calories: parseFloat(manualForm.calories) || 0,
      protein: parseFloat(manualForm.protein) || 0,
      carbs: parseFloat(manualForm.carbs) || 0,
      fat: parseFloat(manualForm.fat) || 0,
    }];

    const { error } = await supabase.from("food_analysis").insert([{
      user_id: session.user.id,
      items: items as unknown as null,
      total_calories: items[0].calories,
      category: manualForm.category as "meat" | "protein" | "supplements" | "vegetarian" | "vegan",
      notes: "Manual entry",
    }]);

    if (error) {
      toast({ title: isGerman ? "Fehler" : "Error", variant: "destructive" });
      return;
    }

    setFoodTrackerDialogOpen(false);
    setManualForm({ name: "", calories: "", protein: "", carbs: "", fat: "", category: "protein" });
    loadHistory(userId);
    toast({ title: isGerman ? "Gespeichert" : "Saved" });
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase.from("food_analysis").delete().eq("id", id);
    if (!error) {
      loadHistory(userId);
      toast({ title: isGerman ? "Gelöscht" : "Deleted" });
    }
  };

  const addToDay = () => {
    if (analysisResult) {
      setDailyTotals(prev => ({
        calories: prev.calories + (analysisResult.total_calories || 0),
        protein: prev.protein + (analysisResult.total_protein || 0),
        carbs: prev.carbs + (analysisResult.total_carbs || 0),
      }));
      toast({ title: isGerman ? "Zum Tag hinzugefügt" : "Added to day" });
      setAnalysisResult(null);
      setUploadedFile(null);
      setUploadedFileRaw(null);
    }
  };

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      meat: "text-red-400",
      protein: "text-orange-400",
      vegetarian: "text-green-400",
      vegan: "text-emerald-400",
      supplements: "text-purple-400",
    };
    return colors[cat] || "text-white";
  };

  return (
    <div className="min-h-screen pb-24 relative">
      <div className="fixed inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${proNutritionBg})` }} />
      <div className="fixed inset-0 bg-black/70" />

      <div className="relative z-10 max-w-screen-xl mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/pro-subscription")} className="text-white"><ArrowLeft className="w-6 h-6" /></Button>
          <h1 className="text-lg font-semibold text-white">Pro Nutrition</h1>
          <Button variant="ghost" size="icon" className="text-white"><HelpCircle className="w-6 h-6" /></Button>
        </div>

        {/* Daily Totals */}
        <Card className="bg-black/40 backdrop-blur-md border-white/10 rounded-2xl p-4 mb-4">
          <div className="w-full bg-zinc-700 rounded-full h-2 mb-4">
            <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${Math.min((dailyTotals.calories / 2500) * 100, 100)}%` }} />
          </div>
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div>
              <div className="text-2xl font-bold text-white">{dailyTotals.calories}</div>
              <div className="text-xs text-zinc-400">kcal</div>
            </div>
            <div>
              <div className="text-2xl font-medium text-white">{Math.round(dailyTotals.protein)}g</div>
              <div className="text-xs text-zinc-400">Protein</div>
            </div>
            <div>
              <div className="text-2xl font-medium text-white">{Math.round(dailyTotals.carbs)}g</div>
              <div className="text-xs text-zinc-400">{isGerman ? "Kohlenhydrate" : "Carbs"}</div>
            </div>
          </div>
        </Card>

        {/* Upload Area */}
        <Card className="bg-black/40 backdrop-blur-md border-white/10 rounded-2xl p-4 mb-4">
          <div 
            className={`border-2 border-dashed rounded-xl p-6 text-center min-h-[100px] flex items-center justify-center transition-colors ${isDragging ? 'border-primary bg-primary/10' : 'border-zinc-600'}`} 
            onDrop={handleDrop} 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} 
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          >
            {uploadedFile ? (
              <div className="relative w-full">
                <img src={uploadedFile} alt="Food" className="max-h-24 mx-auto rounded-lg" />
                <Button variant="destructive" size="icon" className="absolute top-0 right-0 w-6 h-6" onClick={() => { setUploadedFile(null); setUploadedFileRaw(null); }}><X className="w-3 h-3" /></Button>
              </div>
            ) : (
              <div>
                <Upload className="w-6 h-6 mx-auto mb-2 text-zinc-400" />
                <p className="text-zinc-400 text-xs mb-2">{isGerman ? "Bild per Drag & Drop" : "Drag & drop image"}</p>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" id="food-upload" />
                <label htmlFor="food-upload">
                  <Button asChild variant="outline" size="sm" className="bg-zinc-800/50 border-zinc-600 text-white">
                    <span><Upload className="w-3 h-3 mr-1" />{isGerman ? "Hochladen" : "Upload"}</span>
                  </Button>
                </label>
              </div>
            )}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-4">
          <Button onClick={() => setFoodTrackerDialogOpen(true)} className="flex-1 bg-zinc-800/80 hover:bg-zinc-700 text-white border-0 rounded-full py-5">
            <Utensils className="w-4 h-4 mr-2" />Food Tracker
          </Button>
          <Button onClick={analyzeFood} disabled={!uploadedFile || isAnalyzing} className="flex-1 bg-primary hover:bg-primary/90 text-white border-0 rounded-full py-5">
            {isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Scan className="w-4 h-4 mr-2" />}
            {isGerman ? "Essen analysieren" : "Analyze Food"}
          </Button>
        </div>

        {/* Analysis Loading Skeleton */}
        {isAnalyzing && <FoodAnalysisSkeleton isGerman={isGerman} />}

        {/* Analysis Result with Visual Charts */}
        {analysisResult && !isAnalyzing && (
          <Card className="bg-black/40 backdrop-blur-md border-white/10 rounded-2xl p-4 mb-4">
            <h2 className="text-lg font-bold text-white mb-4">{isGerman ? "Analyse Ergebnis" : "Analysis Result"}</h2>
            
            {/* Visual Macro Progress Bars */}
            <div className="space-y-3 mb-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-400">{isGerman ? "Kalorien" : "Calories"}</span>
                  <span className="text-orange-400 font-bold">{analysisResult.total_calories} kcal</span>
                </div>
                <div className="w-full bg-zinc-700 rounded-full h-3">
                  <div className="bg-gradient-to-r from-orange-500 to-orange-400 h-3 rounded-full transition-all" style={{ width: `${Math.min((analysisResult.total_calories / 2500) * 100, 100)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-400">Protein</span>
                  <span className="text-red-400 font-bold">{analysisResult.total_protein}g</span>
                </div>
                <div className="w-full bg-zinc-700 rounded-full h-3">
                  <div className="bg-gradient-to-r from-red-500 to-red-400 h-3 rounded-full transition-all" style={{ width: `${Math.min((analysisResult.total_protein / 150) * 100, 100)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-400">{isGerman ? "Kohlenhydrate" : "Carbs"}</span>
                  <span className="text-yellow-400 font-bold">{analysisResult.total_carbs}g</span>
                </div>
                <div className="w-full bg-zinc-700 rounded-full h-3">
                  <div className="bg-gradient-to-r from-yellow-500 to-yellow-400 h-3 rounded-full transition-all" style={{ width: `${Math.min((analysisResult.total_carbs / 300) * 100, 100)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-400">{isGerman ? "Fett" : "Fat"}</span>
                  <span className="text-blue-400 font-bold">{analysisResult.total_fat}g</span>
                </div>
                <div className="w-full bg-zinc-700 rounded-full h-3">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-400 h-3 rounded-full transition-all" style={{ width: `${Math.min((analysisResult.total_fat / 100) * 100, 100)}%` }} />
                </div>
              </div>
            </div>

            {/* Food Items List */}
            <div className="space-y-2 mb-4">
              {analysisResult.items.map((item, idx) => (
                <div key={idx} className="bg-white/5 p-3 rounded-lg flex justify-between items-center">
                  <div>
                    <div className="text-white font-medium">{item.name}</div>
                    <div className="text-xs text-zinc-400">{item.portion}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-orange-400 font-bold">{item.calories} kcal</div>
                    <div className="text-xs text-zinc-400">P: {item.protein}g | C: {item.carbs}g | F: {item.fat}g</div>
                  </div>
                </div>
              ))}
            </div>

            {analysisResult.notes && (
              <p className="text-sm text-zinc-400 mb-4">{analysisResult.notes}</p>
            )}

            <Button onClick={addToDay} className="w-full">{isGerman ? "Zum Tag hinzufügen" : "Add to Day"}</Button>
          </Card>
        )}

        {/* History */}
        <div className="space-y-2">
          <h3 className="text-white font-semibold mb-2">{isGerman ? "Verlauf" : "History"}</h3>
          {history.slice(0, 10).map((entry) => (
            <Card key={entry.id} className="bg-black/40 backdrop-blur-md border-white/10 p-3">
              <div className="flex justify-between items-center">
                <div>
                  <div className={`text-xs font-semibold ${getCategoryColor(entry.category)} mb-1 capitalize`}>{entry.category}</div>
                  <div className="text-white text-sm">{(entry.items as unknown as FoodItem[])?.[0]?.name || "Food Entry"}</div>
                  <div className="text-xs text-zinc-400">{entry.total_calories} kcal</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="text-primary hover:text-primary h-8 w-8">
                    <Save className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteEntry(entry.id)} className="text-destructive hover:text-destructive h-8 w-8">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Food Tracker Dialog */}
        <Dialog open={foodTrackerDialogOpen} onOpenChange={setFoodTrackerDialogOpen}>
          <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-700">
            <DialogHeader><DialogTitle className="text-white">Food Tracker</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-zinc-300">Name</Label>
                <Input value={manualForm.name} onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })} className="bg-zinc-800 border-zinc-600 text-white" />
              </div>
              <div>
                <Label className="text-zinc-300">{isGerman ? "Kategorie" : "Category"}</Label>
                <Select value={manualForm.category} onValueChange={(v) => setManualForm({ ...manualForm, category: v })}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-800">
                    <SelectItem value="meat">{isGerman ? "Fleisch" : "Meat"}</SelectItem>
                    <SelectItem value="protein">Protein</SelectItem>
                    <SelectItem value="vegetarian">{isGerman ? "Vegetarisch" : "Vegetarian"}</SelectItem>
                    <SelectItem value="vegan">Vegan</SelectItem>
                    <SelectItem value="supplements">Supplements</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-zinc-300">{isGerman ? "Kalorien" : "Calories"}</Label>
                  <Input type="number" value={manualForm.calories} onChange={(e) => setManualForm({ ...manualForm, calories: e.target.value })} className="bg-zinc-800 border-zinc-600 text-white" />
                </div>
                <div>
                  <Label className="text-zinc-300">Protein (g)</Label>
                  <Input type="number" value={manualForm.protein} onChange={(e) => setManualForm({ ...manualForm, protein: e.target.value })} className="bg-zinc-800 border-zinc-600 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-zinc-300">{isGerman ? "Kohlenhydrate" : "Carbs"} (g)</Label>
                  <Input type="number" value={manualForm.carbs} onChange={(e) => setManualForm({ ...manualForm, carbs: e.target.value })} className="bg-zinc-800 border-zinc-600 text-white" />
                </div>
                <div>
                  <Label className="text-zinc-300">{isGerman ? "Fett" : "Fat"} (g)</Label>
                  <Input type="number" value={manualForm.fat} onChange={(e) => setManualForm({ ...manualForm, fat: e.target.value })} className="bg-zinc-800 border-zinc-600 text-white" />
                </div>
              </div>
              <Button onClick={saveManualEntry} className="w-full">{isGerman ? "Speichern" : "Save"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <BottomNav />
    </div>
  );
};

export default ProNutrition;
