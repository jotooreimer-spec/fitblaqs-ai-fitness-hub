import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, HelpCircle, Upload, X, Utensils, Scan, Save, Trash2, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import BottomNav from "@/components/BottomNav";
import { FoodAnalysisSkeleton } from "@/components/AnalysisSkeleton";
import { compressImage, isValidImageFile } from "@/lib/imageUtils";
import proNutritionBg from "@/assets/pro-nutrition-bg.png";
import performanceButtonBg from "@/assets/performance-button.png";

interface FoodItem {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar?: number;
  fiber?: number;
}

interface HealthEvaluation {
  rating: string;
  calorie_density: string;
  nutrient_density: string;
  satiety_score: number;
  sugar_risk: string;
  fat_quality: string;
}

interface Improvement {
  action: string;
  impact: string;
  reason: string;
}

interface AlternativeMeal {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  calories_saved: number;
  why_better: string;
}

interface MacroDistribution {
  protein_pct: number;
  carbs_pct: number;
  fat_pct: number;
}

interface FoodAnalysis {
  items: FoodItem[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_sugar?: number;
  total_fiber?: number;
  category: string;
  notes: string;
  macro_distribution?: MacroDistribution;
  health_evaluation?: HealthEvaluation;
  improvements?: Improvement[];
  alternative_meal?: AlternativeMeal;
  calculated_calories?: { from_protein: number; from_carbs: number; from_fat: number; total_calculated: number; deviation_pct: number };
  trace_elements?: { vitamin_a: string; vitamin_c: string; iron: string; calcium: string };
  nutrition_plan?: { recommendations: string[]; supplements: string[]; meal_timing: string; hydration: string };
  history_summary?: string;
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
  const [manualForm, setManualForm] = useState({ 
    name: "", calories: "", calories_unit: "kcal", protein: "", protein_unit: "g", 
    carbs: "", carbs_unit: "g", fat: "", fat_unit: "g", sugar: "", sugar_unit: "g", 
    water: "", water_unit: "ml", category: "protein",
    traceElements: { iron: "", iron_unit: "mg", calcium: "", calcium_unit: "mg", magnesium: "", magnesium_unit: "mg", zinc: "", zinc_unit: "mg" }
  });
  const [dailyTotals, setDailyTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0, water: 0 });
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
      // Calculate daily totals automatically from all entries
      const today = new Date().toISOString().split('T')[0];
      const todayLogs = data.filter(d => d.created_at.split('T')[0] === today);
      const totals = todayLogs.reduce((acc, log) => {
        const items = (log.items as unknown as FoodItem[]) || [];
        const notesData = log.notes ? (typeof log.notes === 'string' ? JSON.parse(log.notes) : log.notes) : {};
        return {
          calories: acc.calories + (log.total_calories || 0),
          protein: acc.protein + items.reduce((s, i) => s + (i.protein || 0), 0),
          carbs: acc.carbs + items.reduce((s, i) => s + (i.carbs || 0), 0),
          fat: acc.fat + items.reduce((s, i) => s + (i.fat || 0), 0),
          water: acc.water + (notesData.water || 0),
        };
      }, { calories: 0, protein: 0, carbs: 0, fat: 0, water: 0 });
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

      // Send manual data along with the image for better analysis
      const manualData = {
        name: manualForm.name || undefined,
        category: manualForm.category,
        protein: manualForm.protein || undefined,
        calories: manualForm.calories || undefined,
        carbs: manualForm.carbs || undefined,
        fat: manualForm.fat || undefined,
        sugar: manualForm.sugar || undefined,
        water: manualForm.water || undefined,
        traceElements: `Eisen: ${manualForm.traceElements.iron || '0'}mg, Calcium: ${manualForm.traceElements.calcium || '0'}mg, Magnesium: ${manualForm.traceElements.magnesium || '0'}mg, Zink: ${manualForm.traceElements.zinc || '0'}mg`
      };

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-food-ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          imageBase64: compressed.base64,
          category: manualForm.category,
          manualData: manualData,
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
    setManualForm({ 
      name: "", calories: "", calories_unit: "kcal", protein: "", protein_unit: "g", 
      carbs: "", carbs_unit: "g", fat: "", fat_unit: "g", sugar: "", sugar_unit: "g", 
      water: "", water_unit: "ml", category: "protein",
      traceElements: { iron: "", iron_unit: "mg", calcium: "", calcium_unit: "mg", magnesium: "", magnesium_unit: "mg", zinc: "", zinc_unit: "mg" }
    });
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
        fat: prev.fat + (analysisResult.total_fat || 0),
        water: prev.water + 0,
      }));
      toast({ title: isGerman ? "Zum Tag hinzugefügt" : "Added to day" });
      setAnalysisResult(null);
      setUploadedFile(null);
      setUploadedFileRaw(null);
      // Reset form
      setManualForm({ 
        name: "", calories: "", calories_unit: "kcal", protein: "", protein_unit: "g", 
        carbs: "", carbs_unit: "g", fat: "", fat_unit: "g", sugar: "", sugar_unit: "g", 
        water: "", water_unit: "ml", category: "protein",
        traceElements: { iron: "", iron_unit: "mg", calcium: "", calcium_unit: "mg", magnesium: "", magnesium_unit: "mg", zinc: "", zinc_unit: "mg" }
      });
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

        {/* Performance Box - Square with image background */}
        <Card 
          onClick={() => navigate("/calendar")}
          className="bg-black/40 backdrop-blur-md border-white/10 rounded-2xl overflow-hidden mb-4 cursor-pointer hover:scale-[1.02] transition-all w-24 h-24 relative"
        >
          <img src={performanceButtonBg} alt="Performance" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white mb-1" />
            <span className="text-xs font-semibold text-white">Performance</span>
          </div>
        </Card>

        {/* Daily Totals - Auto calculated */}
        <Card className="bg-black/40 backdrop-blur-md border-white/10 rounded-2xl p-4 mb-4">
          <div className="w-full bg-zinc-700 rounded-full h-2 mb-4">
            <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${Math.min((dailyTotals.calories / 2500) * 100, 100)}%` }} />
          </div>
          <div className="grid grid-cols-5 gap-2 text-center text-sm">
            <div>
              <div className="text-xl font-bold text-white">{dailyTotals.calories}</div>
              <div className="text-xs text-zinc-400">kcal</div>
            </div>
            <div>
              <div className="text-xl font-medium text-white">{Math.round(dailyTotals.protein)}g</div>
              <div className="text-xs text-zinc-400">Protein</div>
            </div>
            <div>
              <div className="text-xl font-medium text-white">{Math.round(dailyTotals.carbs)}g</div>
              <div className="text-xs text-zinc-400">Carbs</div>
            </div>
            <div>
              <div className="text-xl font-medium text-white">{Math.round(dailyTotals.fat)}g</div>
              <div className="text-xs text-zinc-400">Fat</div>
            </div>
            <div>
              <div className="text-xl font-medium text-blue-400">{dailyTotals.water}ml</div>
              <div className="text-xs text-zinc-400">💧</div>
            </div>
          </div>
          <p className="text-xs text-zinc-500 text-center mt-2">{isGerman ? "Automatisch berechnet" : "Auto-calculated"}</p>
        </Card>

        {/* Manual Input + Upload Area */}
        <Card className="bg-black/40 backdrop-blur-md border-white/10 rounded-2xl p-4 mb-4">
          <h3 className="text-white font-semibold text-sm mb-3">{isGerman ? "1. Manuelle Werte (optional)" : "1. Manual Values (optional)"}</h3>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <Input placeholder="Name" value={manualForm.name} onChange={(e) => setManualForm({...manualForm, name: e.target.value})} className="bg-zinc-800/50 border-zinc-700 text-white text-sm h-9" />
            <Select value={manualForm.category} onValueChange={(v) => setManualForm({...manualForm, category: v})}>
              <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white text-sm h-9"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-zinc-800">
                <SelectItem value="protein">Protein</SelectItem>
                <SelectItem value="vegetarian">{isGerman ? "Vegetarisch" : "Vegetarian"}</SelectItem>
                <SelectItem value="vegan">Vegan</SelectItem>
                <SelectItem value="supplements">Supplements</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-1">
              <Input type="number" placeholder="Calories" value={manualForm.calories} onChange={(e) => setManualForm({...manualForm, calories: e.target.value})} className="bg-zinc-800/50 border-zinc-700 text-white text-sm h-9 flex-1" />
              <Select value={manualForm.calories_unit} onValueChange={(v) => setManualForm({...manualForm, calories_unit: v})}>
                <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white text-xs h-9 w-16"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-800"><SelectItem value="kcal">kcal</SelectItem><SelectItem value="kJ">kJ</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex gap-1">
              <Input type="number" placeholder="Protein" value={manualForm.protein} onChange={(e) => setManualForm({...manualForm, protein: e.target.value})} className="bg-zinc-800/50 border-zinc-700 text-white text-sm h-9 flex-1" />
              <Select value={manualForm.protein_unit} onValueChange={(v) => setManualForm({...manualForm, protein_unit: v})}>
                <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white text-xs h-9 w-14"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-800"><SelectItem value="g">g</SelectItem><SelectItem value="mg">mg</SelectItem><SelectItem value="kg">kg</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex gap-1">
              <Input type="number" placeholder="Carbs" value={manualForm.carbs} onChange={(e) => setManualForm({...manualForm, carbs: e.target.value})} className="bg-zinc-800/50 border-zinc-700 text-white text-sm h-9 flex-1" />
              <Select value={manualForm.carbs_unit} onValueChange={(v) => setManualForm({...manualForm, carbs_unit: v})}>
                <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white text-xs h-9 w-14"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-800"><SelectItem value="g">g</SelectItem><SelectItem value="mg">mg</SelectItem><SelectItem value="kg">kg</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex gap-1">
              <Input type="number" placeholder="Fat" value={manualForm.fat} onChange={(e) => setManualForm({...manualForm, fat: e.target.value})} className="bg-zinc-800/50 border-zinc-700 text-white text-sm h-9 flex-1" />
              <Select value={manualForm.fat_unit} onValueChange={(v) => setManualForm({...manualForm, fat_unit: v})}>
                <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white text-xs h-9 w-14"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-800"><SelectItem value="g">g</SelectItem><SelectItem value="mg">mg</SelectItem><SelectItem value="kg">kg</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex gap-1">
              <Input type="number" placeholder="Sugar" value={manualForm.sugar} onChange={(e) => setManualForm({...manualForm, sugar: e.target.value})} className="bg-zinc-800/50 border-zinc-700 text-white text-sm h-9 flex-1" />
              <Select value={manualForm.sugar_unit} onValueChange={(v) => setManualForm({...manualForm, sugar_unit: v})}>
                <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white text-xs h-9 w-14"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-800"><SelectItem value="g">g</SelectItem><SelectItem value="mg">mg</SelectItem><SelectItem value="kg">kg</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex gap-1">
              <Input type="number" placeholder="Water" value={manualForm.water} onChange={(e) => setManualForm({...manualForm, water: e.target.value})} className="bg-zinc-800/50 border-zinc-700 text-white text-sm h-9 flex-1" />
              <Select value={manualForm.water_unit} onValueChange={(v) => setManualForm({...manualForm, water_unit: v})}>
                <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white text-xs h-9 w-14"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-800"><SelectItem value="ml">ml</SelectItem><SelectItem value="dl">dl</SelectItem><SelectItem value="l">l</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Trace Elements with units */}
          <div className="text-xs text-zinc-400 mb-2">{isGerman ? "Spurenelemente" : "Trace Elements"}</div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="flex gap-1">
              <Input type="number" placeholder="Eisen" value={manualForm.traceElements.iron} onChange={(e) => setManualForm({...manualForm, traceElements: {...manualForm.traceElements, iron: e.target.value}})} className="bg-zinc-800/50 border-zinc-700 text-white text-xs h-8 flex-1" />
              <Select value={manualForm.traceElements.iron_unit} onValueChange={(v) => setManualForm({...manualForm, traceElements: {...manualForm.traceElements, iron_unit: v}})}>
                <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white text-xs h-8 w-12"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-800"><SelectItem value="mg">mg</SelectItem><SelectItem value="g">g</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex gap-1">
              <Input type="number" placeholder="Calcium" value={manualForm.traceElements.calcium} onChange={(e) => setManualForm({...manualForm, traceElements: {...manualForm.traceElements, calcium: e.target.value}})} className="bg-zinc-800/50 border-zinc-700 text-white text-xs h-8 flex-1" />
              <Select value={manualForm.traceElements.calcium_unit} onValueChange={(v) => setManualForm({...manualForm, traceElements: {...manualForm.traceElements, calcium_unit: v}})}>
                <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white text-xs h-8 w-12"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-800"><SelectItem value="mg">mg</SelectItem><SelectItem value="g">g</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex gap-1">
              <Input type="number" placeholder="Magnesium" value={manualForm.traceElements.magnesium} onChange={(e) => setManualForm({...manualForm, traceElements: {...manualForm.traceElements, magnesium: e.target.value}})} className="bg-zinc-800/50 border-zinc-700 text-white text-xs h-8 flex-1" />
              <Select value={manualForm.traceElements.magnesium_unit} onValueChange={(v) => setManualForm({...manualForm, traceElements: {...manualForm.traceElements, magnesium_unit: v}})}>
                <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white text-xs h-8 w-12"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-800"><SelectItem value="mg">mg</SelectItem><SelectItem value="g">g</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex gap-1">
              <Input type="number" placeholder="Zink" value={manualForm.traceElements.zinc} onChange={(e) => setManualForm({...manualForm, traceElements: {...manualForm.traceElements, zinc: e.target.value}})} className="bg-zinc-800/50 border-zinc-700 text-white text-xs h-8 flex-1" />
              <Select value={manualForm.traceElements.zinc_unit} onValueChange={(v) => setManualForm({...manualForm, traceElements: {...manualForm.traceElements, zinc_unit: v}})}>
                <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white text-xs h-8 w-12"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-800"><SelectItem value="mg">mg</SelectItem><SelectItem value="g">g</SelectItem></SelectContent>
              </Select>
            </div>
          </div>

          <h3 className="text-white font-semibold text-sm mb-3">{isGerman ? "2. Bild hochladen" : "2. Upload Image"}</h3>
          <div 
            className={`border-2 border-dashed rounded-xl p-4 text-center min-h-[80px] flex items-center justify-center transition-colors ${isDragging ? 'border-primary bg-primary/10' : 'border-zinc-600'}`} 
            onDrop={handleDrop} 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} 
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          >
            {uploadedFile ? (
              <div className="relative w-full">
                <img src={uploadedFile} alt="Food" className="max-h-16 mx-auto rounded-lg" />
                <Button variant="destructive" size="icon" className="absolute top-0 right-0 w-6 h-6" onClick={() => { setUploadedFile(null); setUploadedFileRaw(null); }}><X className="w-3 h-3" /></Button>
              </div>
            ) : (
              <div>
                <Upload className="w-5 h-5 mx-auto mb-1 text-zinc-400" />
                <p className="text-zinc-400 text-xs mb-2">{isGerman ? "Drag & Drop" : "Drag & drop"}</p>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" id="food-upload" />
                <label htmlFor="food-upload">
                  <Button asChild variant="outline" size="sm" className="bg-zinc-800/50 border-zinc-600 text-white text-xs">
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
            <Save className="w-4 h-4 mr-2" />{isGerman ? "Nur speichern" : "Save only"}
          </Button>
          <Button onClick={analyzeFood} disabled={!uploadedFile || isAnalyzing} className="flex-1 bg-primary hover:bg-primary/90 text-white border-0 rounded-full py-5">
            {isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            {isGerman ? "Upload" : "Upload"}
          </Button>
        </div>

        {/* Analysis Loading Skeleton */}
        {isAnalyzing && <FoodAnalysisSkeleton isGerman={isGerman} />}

        {/* Analysis Result with Visual Charts */}
        {analysisResult && !isAnalyzing && (
          <div className="space-y-4 mb-4">
            <Card className="bg-black/40 backdrop-blur-md border-white/10 rounded-2xl p-4">
              {/* Show uploaded image at top - smaller */}
              {uploadedFile && (
                <div className="mb-4">
                  <img src={uploadedFile} alt="Analyzed Food" className="w-12 h-12 object-cover rounded-lg mx-auto" />
                </div>
              )}
              <h2 className="text-lg font-bold text-white mb-4">{isGerman ? "🥗 Analyse Ergebnis" : "🥗 Analysis Result"}</h2>
              
              {/* Macro Distribution Pie */}
              {analysisResult.macro_distribution && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-red-500/20 p-3 rounded-lg text-center">
                    <div className="text-red-400 font-bold text-lg">{analysisResult.macro_distribution.protein_pct}%</div>
                    <div className="text-xs text-zinc-400">Protein</div>
                  </div>
                  <div className="bg-yellow-500/20 p-3 rounded-lg text-center">
                    <div className="text-yellow-400 font-bold text-lg">{analysisResult.macro_distribution.carbs_pct}%</div>
                    <div className="text-xs text-zinc-400">Carbs</div>
                  </div>
                  <div className="bg-blue-500/20 p-3 rounded-lg text-center">
                    <div className="text-blue-400 font-bold text-lg">{analysisResult.macro_distribution.fat_pct}%</div>
                    <div className="text-xs text-zinc-400">Fett</div>
                  </div>
                </div>
              )}
              
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
                {analysisResult.total_sugar !== undefined && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-zinc-400">{isGerman ? "Zucker" : "Sugar"}</span>
                      <span className="text-pink-400 font-bold">{analysisResult.total_sugar}g</span>
                    </div>
                    <div className="w-full bg-zinc-700 rounded-full h-3">
                      <div className="bg-gradient-to-r from-pink-500 to-pink-400 h-3 rounded-full transition-all" style={{ width: `${Math.min((analysisResult.total_sugar / 50) * 100, 100)}%` }} />
                    </div>
                  </div>
                )}
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
            </Card>

            {/* Health Evaluation */}
            {analysisResult.health_evaluation && (
              <Card className="bg-black/40 backdrop-blur-md border-white/10 rounded-2xl p-4">
                <h3 className="text-white font-bold mb-3">{isGerman ? "⚕️ Gesundheitsbewertung" : "⚕️ Health Evaluation"}</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 p-3 rounded-lg">
                    <div className="text-xs text-zinc-400">Rating</div>
                    <div className={`font-bold ${analysisResult.health_evaluation.rating === 'sehr_gesund' ? 'text-green-400' : analysisResult.health_evaluation.rating === 'mittel' ? 'text-yellow-400' : 'text-red-400'}`}>
                      {analysisResult.health_evaluation.rating === 'sehr_gesund' ? '✅ Sehr gesund' : analysisResult.health_evaluation.rating === 'mittel' ? '⚠️ Mittel' : '❌ Ungünstig'}
                    </div>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg">
                    <div className="text-xs text-zinc-400">{isGerman ? "Sättigungsgrad" : "Satiety"}</div>
                    <div className="text-white font-bold">{analysisResult.health_evaluation.satiety_score}/10</div>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg">
                    <div className="text-xs text-zinc-400">{isGerman ? "Kaloriendichte" : "Calorie Density"}</div>
                    <div className="text-white font-medium">{analysisResult.health_evaluation.calorie_density}</div>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg">
                    <div className="text-xs text-zinc-400">{isGerman ? "Zucker-Risiko" : "Sugar Risk"}</div>
                    <div className={`font-medium ${analysisResult.health_evaluation.sugar_risk === 'niedrig' ? 'text-green-400' : analysisResult.health_evaluation.sugar_risk === 'mittel' ? 'text-yellow-400' : 'text-red-400'}`}>
                      {analysisResult.health_evaluation.sugar_risk}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Improvements */}
            {analysisResult.improvements && analysisResult.improvements.length > 0 && (
              <Card className="bg-black/40 backdrop-blur-md border-white/10 rounded-2xl p-4">
                <h3 className="text-white font-bold mb-3">{isGerman ? "💡 Verbesserungen" : "💡 Improvements"}</h3>
                <div className="space-y-2">
                  {analysisResult.improvements.map((imp, idx) => (
                    <div key={idx} className="bg-white/5 p-3 rounded-lg">
                      <div className="text-white font-medium text-sm">{imp.action}</div>
                      <div className="text-primary text-xs font-bold">{imp.impact}</div>
                      <div className="text-zinc-400 text-xs">{imp.reason}</div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Alternative Meal */}
            {analysisResult.alternative_meal && (
              <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 backdrop-blur-md border-green-500/20 rounded-2xl p-4">
                <h3 className="text-white font-bold mb-3">{isGerman ? "🥗 Bessere Alternative" : "🥗 Better Alternative"}</h3>
                <div className="flex justify-between items-center mb-2">
                  <div className="text-white font-medium">{analysisResult.alternative_meal.name}</div>
                  <div className="text-green-400 font-bold">{analysisResult.alternative_meal.calories} kcal</div>
                </div>
                <div className="text-xs text-zinc-400 mb-2">
                  P: {analysisResult.alternative_meal.protein}g | C: {analysisResult.alternative_meal.carbs}g | F: {analysisResult.alternative_meal.fat}g
                </div>
                <div className="bg-green-500/20 p-2 rounded-lg">
                  <span className="text-green-400 font-bold">{analysisResult.alternative_meal.calories_saved} kcal gespart!</span>
                </div>
                <p className="text-zinc-300 text-xs mt-2">{analysisResult.alternative_meal.why_better}</p>
              </Card>
            )}

            {/* Nutrition Plan */}
            {analysisResult.nutrition_plan && (
              <Card className="bg-black/40 backdrop-blur-md border-white/10 rounded-2xl p-4">
                <h3 className="text-white font-bold mb-3">{isGerman ? "📋 Empfehlungen" : "📋 Recommendations"}</h3>
                <div className="space-y-2">
                  {analysisResult.nutrition_plan.recommendations?.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span className="text-zinc-300 text-sm">{rec}</span>
                    </div>
                  ))}
                  <div className="mt-3 bg-white/5 p-3 rounded-lg">
                    <div className="text-xs text-zinc-400">{isGerman ? "Beste Essenszeit" : "Best Meal Time"}</div>
                    <div className="text-white text-sm">{analysisResult.nutrition_plan.meal_timing}</div>
                  </div>
                  <div className="bg-blue-500/20 p-3 rounded-lg">
                    <div className="text-xs text-zinc-400">💧 Hydration</div>
                    <div className="text-blue-400 text-sm">{analysisResult.nutrition_plan.hydration}</div>
                  </div>
                </div>
              </Card>
            )}

            {analysisResult.notes && (
              <Card className="bg-black/40 backdrop-blur-md border-white/10 rounded-2xl p-4">
                <p className="text-sm text-zinc-300">{analysisResult.notes}</p>
              </Card>
            )}

            <Button onClick={addToDay} className="w-full">{isGerman ? "Zum Tag hinzufügen" : "Add to Day"}</Button>
          </div>
        )}

        {/* History with smaller images */}
        <div className="space-y-2">
          <h3 className="text-white font-semibold mb-2">{isGerman ? "Verlauf" : "History"}</h3>
          {history.slice(0, 10).map((entry) => (
            <Card key={entry.id} className="bg-black/40 backdrop-blur-md border-white/10 p-3">
              <div className="flex justify-between items-center gap-3">
                {entry.image_url && (
                  <img src={entry.image_url} alt="Food" className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-semibold ${getCategoryColor(entry.category)} mb-1 capitalize`}>{entry.category}</div>
                  <div className="text-white text-sm truncate">{(entry.items as unknown as FoodItem[])?.[0]?.name || "Food Entry"}</div>
                  <div className="text-xs text-zinc-400">{entry.total_calories} kcal</div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
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
