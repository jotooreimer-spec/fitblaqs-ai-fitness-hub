import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Loader2, HelpCircle, Upload, X, Save, Trash2, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";
import { compressImage, isValidImageFile, base64ToBlob } from "@/lib/imageUtils";
import proNutritionBg from "@/assets/pro-nutrition-bg.png";
import performanceButtonBg from "@/assets/performance-button.png";

interface FoodAnalysisEntry {
  id: string;
  image_url: string | null;
  total_calories: number | null;
  category: string | null;
  items: any;
  notes: string | null;
  created_at: string;
}

const ProNutrition = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGerman, setIsGerman] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [uploadedFileRaw, setUploadedFileRaw] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [history, setHistory] = useState<FoodAnalysisEntry[]>([]);

  // Calculated percentages from nutrition history
  const [calculatedStats, setCalculatedStats] = useState({
    totalCalories: 0,
    caloriesPct: 0,
    totalProtein: 0,
    proteinPct: 0,
    totalCarbs: 0,
    carbsPct: 0,
    totalFat: 0,
    fatPct: 0,
    totalWater: 0,
    waterPct: 0,
  });

  const [manualForm, setManualForm] = useState({ 
    name: "", calories: "", calories_unit: "kcal", protein: "", protein_unit: "g", 
    carbs: "", carbs_unit: "g", fat: "", fat_unit: "g", sugar: "", sugar_unit: "g", 
    water: "", water_unit: "ml", category: "protein",
    traceElements: { iron: "", iron_unit: "mg", calcium: "", calcium_unit: "mg", magnesium: "", magnesium_unit: "mg", zinc: "", zinc_unit: "mg" }
  });

  // Upload dialog state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploadCategory, setUploadCategory] = useState("protein");
  
  // History detail dialog
  const [historyDetailOpen, setHistoryDetailOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<FoodAnalysisEntry | null>(null);

  const validCategories = ["protein", "vegetarian", "vegan", "supplements", "meat"];

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { navigate("/login"); return; }
      const metadata = session.user.user_metadata;
      setIsGerman(metadata.language === "de");
      setUserId(session.user.id);
      loadHistory(session.user.id);
      loadCalculatedStats(session.user.id);
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
    }
  };

  const loadCalculatedStats = async (uid: string) => {
    // Load nutrition logs, weight and Pro Nutrition analysis in parallel
    const [
      { data: nutritionLogs },
      { data: weightLogs },
      { data: foodAnalysis },
    ] = await Promise.all([
      supabase
        .from("nutrition_logs")
        .select("*")
        .eq("user_id", uid),
      supabase
        .from("weight_logs")
        .select("weight")
        .eq("user_id", uid)
        .order("measured_at", { ascending: false })
        .limit(1),
      supabase
        .from("food_analysis")
        .select("*")
        .eq("user_id", uid),
    ]);

    const userWeight = weightLogs?.[0]?.weight || 70;
    const dailyCalorieTarget = userWeight * 30; // Rough TDEE estimate
    const dailyProteinTarget = userWeight * 2; // 2g per kg
    const dailyCarbsTarget = 300;
    const dailyFatTarget = 80;
    const dailyWaterTarget = userWeight * 35; // 35ml per kg

    let totalCals = 0;
    let totalProt = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalWater = 0;

    // Standard nutrition logs (from Nutrition page)
    nutritionLogs?.forEach((log) => {
      totalCals += log.calories || 0;
      totalProt += Number(log.protein) || 0;
      totalCarbs += Number(log.carbs) || 0;
      totalFat += Number(log.fats) || 0;

      // Parse water from notes if stored as JSON
      if (log.notes) {
        try {
          const notesData = typeof log.notes === "string" ? JSON.parse(log.notes) : log.notes;
          if (notesData.water) {
            let waterMl = Number(notesData.water) || 0;
            const waterUnit = notesData.water_unit || "ml";
            if (waterUnit === "l") waterMl *= 1000;
            else if (waterUnit === "dl") waterMl *= 100;
            totalWater += waterMl;
          }
        } catch {}
      }
    });

    // Pro Nutrition analysis entries (manual values & AI results)
    foodAnalysis?.forEach((entry) => {
      // Total calories from analysis table
      totalCals += Number(entry.total_calories) || 0;

      // Macros from AI items array
      if (entry.items && Array.isArray(entry.items)) {
        entry.items.forEach((item: any) => {
          totalProt += Number(item.protein) || 0;
          totalCarbs += Number(item.carbs) || 0;
          totalFat += Number(item.fat) || 0;
        });
      }

      // Additional data from manual values stored in notes
      if (entry.notes) {
        try {
          const notesData = typeof entry.notes === "string" ? JSON.parse(entry.notes) : entry.notes;

          if (notesData.manual_values) {
            const mv = notesData.manual_values;
            totalProt += Number(mv.protein) || 0;
            totalCarbs += Number(mv.carbs) || 0;
            totalFat += Number(mv.fat) || 0;

            if (mv.water) {
              let waterMl = Number(mv.water) || 0;
              const waterUnit = mv.water_unit || notesData.units?.water || "ml";
              if (waterUnit === "l") waterMl *= 1000;
              else if (waterUnit === "dl") waterMl *= 100;
              totalWater += waterMl;
            }
          }
        } catch {}
      }
    });

    setCalculatedStats({
      totalCalories: totalCals,
      caloriesPct: Math.min((totalCals / dailyCalorieTarget) * 100, 100),
      totalProtein: totalProt,
      proteinPct: Math.min((totalProt / dailyProteinTarget) * 100, 100),
      totalCarbs: totalCarbs,
      carbsPct: Math.min((totalCarbs / dailyCarbsTarget) * 100, 100),
      totalFat: totalFat,
      fatPct: Math.min((totalFat / dailyFatTarget) * 100, 100),
      totalWater: totalWater,
      waterPct: Math.min((totalWater / dailyWaterTarget) * 100, 100),
    });
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

  const handleUploadClick = () => {
    if (!uploadedFileRaw) {
      toast({ title: isGerman ? "Bitte Bild hochladen" : "Please upload image", variant: "destructive" });
      return;
    }
    setUploadDialogOpen(true);
  };

  const uploadImage = async () => {
    if (!uploadedFileRaw || !uploadName) {
      toast({ title: isGerman ? "Bitte Name eingeben" : "Please enter name", variant: "destructive" });
      return;
    }
    setIsUploading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const compressed = await compressImage(uploadedFileRaw);
      const fileName = `${session.user.id}/${Date.now()}.jpg`;
      
      const blob = base64ToBlob(compressed.base64, 'image/jpeg');
      
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, blob, { contentType: "image/jpeg" });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);

      // Save with valid category and name in notes
      const { error: dbError } = await supabase.from("food_analysis").insert([{
        user_id: session.user.id,
        image_url: urlData.publicUrl,
        total_calories: null,
        category: uploadCategory, // Valid enum value
        items: null,
        notes: JSON.stringify({
          upload_name: uploadName,
          upload_category: uploadCategory,
        }),
      }]);

      if (dbError) throw dbError;

      setUploadedFile(null);
      setUploadedFileRaw(null);
      setUploadName("");
      setUploadCategory("protein");
      setUploadDialogOpen(false);
      loadHistory(session.user.id);
      toast({ title: isGerman ? "Bild gespeichert" : "Image saved" });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: isGerman ? "Fehler beim Hochladen" : "Upload failed", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const saveManualValues = async () => {
    setIsSaving(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Save manual values with calculated percentages
      const items = [{
        name: manualForm.name || "Manual Entry",
        portion: "1 serving",
        calories: parseFloat(manualForm.calories) || 0,
        protein: parseFloat(manualForm.protein) || 0,
        carbs: parseFloat(manualForm.carbs) || 0,
        fat: parseFloat(manualForm.fat) || 0,
        sugar: parseFloat(manualForm.sugar) || 0,
      }];

      const { error } = await supabase.from("food_analysis").insert([{
        user_id: session.user.id,
        image_url: null,
        total_calories: items[0].calories,
        category: manualForm.category,
        items: items as unknown as null,
        notes: JSON.stringify({
          manual_values: manualForm,
          calculated_stats: calculatedStats,
          units: {
            calories: manualForm.calories_unit,
            protein: manualForm.protein_unit,
            carbs: manualForm.carbs_unit,
            fat: manualForm.fat_unit,
            sugar: manualForm.sugar_unit,
            water: manualForm.water_unit,
          },
          trace_elements: manualForm.traceElements,
        }),
      }]);

      if (error) throw error;

      loadHistory(session.user.id);
      loadCalculatedStats(session.user.id);
      toast({ title: isGerman ? "Werte gespeichert" : "Values saved" });
      
      // Reset form
      setManualForm({ 
        name: "", calories: "", calories_unit: "kcal", protein: "", protein_unit: "g", 
        carbs: "", carbs_unit: "g", fat: "", fat_unit: "g", sugar: "", sugar_unit: "g", 
        water: "", water_unit: "ml", category: "protein",
        traceElements: { iron: "", iron_unit: "mg", calcium: "", calcium_unit: "mg", magnesium: "", magnesium_unit: "mg", zinc: "", zinc_unit: "mg" }
      });
    } catch (error) {
      console.error("Save error:", error);
      toast({ title: isGerman ? "Fehler" : "Error", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase.from("food_analysis").delete().eq("id", id);
    if (!error) {
      loadHistory(userId);
      loadCalculatedStats(userId);
      toast({ title: isGerman ? "Gelöscht" : "Deleted" });
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

        {/* Performance Box */}
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

        {/* Calculated Stats - Auto calculated from Nutrition History */}
        <Card className="bg-black/40 backdrop-blur-md border-white/10 rounded-2xl p-4 mb-4">
          <div className="w-full bg-zinc-700 rounded-full h-2 mb-4">
            <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${calculatedStats.caloriesPct}%` }} />
          </div>
          <div className="grid grid-cols-5 gap-2 text-center text-sm">
            <div>
              <div className="text-xl font-bold text-white">{calculatedStats.totalCalories}</div>
              <div className="text-xs text-zinc-400">kcal</div>
              <div className="text-xs text-orange-400">{calculatedStats.caloriesPct.toFixed(0)}%</div>
            </div>
            <div>
              <div className="text-xl font-medium text-white">{Math.round(calculatedStats.totalProtein)}g</div>
              <div className="text-xs text-zinc-400">Protein</div>
              <div className="text-xs text-red-400">{calculatedStats.proteinPct.toFixed(0)}%</div>
            </div>
            <div>
              <div className="text-xl font-medium text-white">{Math.round(calculatedStats.totalCarbs)}g</div>
              <div className="text-xs text-zinc-400">Carbs</div>
              <div className="text-xs text-yellow-400">{calculatedStats.carbsPct.toFixed(0)}%</div>
            </div>
            <div>
              <div className="text-xl font-medium text-white">{Math.round(calculatedStats.totalFat)}g</div>
              <div className="text-xs text-zinc-400">Fat</div>
              <div className="text-xs text-blue-400">{calculatedStats.fatPct.toFixed(0)}%</div>
            </div>
            <div>
              <div className="text-xl font-medium text-blue-400">{calculatedStats.totalWater}ml</div>
              <div className="text-xs text-zinc-400">💧</div>
              <div className="text-xs text-cyan-400">{calculatedStats.waterPct.toFixed(0)}%</div>
            </div>
          </div>
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
          <Button onClick={saveManualValues} disabled={isSaving} className="flex-1 bg-zinc-800/80 hover:bg-zinc-700 text-white border-0 rounded-full py-5">
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {isGerman ? "Nur speichern" : "Save only"}
          </Button>
          <Button onClick={async () => {
            const { data: entries } = await supabase.from("food_analysis").select("id").eq("user_id", userId);
            if (entries) {
              for (const entry of entries) {
                await supabase.from("food_analysis").delete().eq("id", entry.id);
              }
            }
            setCalculatedStats({ totalCalories: 0, caloriesPct: 0, totalProtein: 0, proteinPct: 0, totalCarbs: 0, carbsPct: 0, totalFat: 0, fatPct: 0, totalWater: 0, waterPct: 0 });
            loadHistory(userId);
            toast({ title: isGerman ? "Alle gelöscht" : "All deleted" });
          }} className="flex-1 bg-zinc-800/80 hover:bg-zinc-700 text-white border-0 rounded-full py-5">
            <Trash2 className="w-4 h-4 mr-2" />
            {isGerman ? "Löschen" : "Delete"}
          </Button>
          <Button onClick={handleUploadClick} disabled={!uploadedFile} className="flex-1 bg-primary hover:bg-primary/90 text-white border-0 rounded-full py-5">
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
        </div>

        {/* History with smaller images */}
        <div className="space-y-2">
          <h3 className="text-white font-semibold mb-2">{isGerman ? "Verlauf" : "History"}</h3>
          {history.slice(0, 10).map((entry) => {
            const notesData = entry.notes ? (typeof entry.notes === 'string' ? JSON.parse(entry.notes) : entry.notes) : null;
            return (
              <Card 
                key={entry.id} 
                className="bg-black/40 backdrop-blur-md border-white/10 p-3 cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => { setSelectedEntry(entry); setHistoryDetailOpen(true); }}
              >
                <div className="flex justify-between items-center gap-3">
                  {entry.image_url && (
                    <img src={entry.image_url} alt="Food" className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm truncate">{notesData?.upload_name || (entry.items as any)?.[0]?.name || "Food Entry"}</div>
                    <div className={`text-xs ${getCategoryColor(notesData?.upload_category || entry.category || '')} capitalize`}>
                      {notesData?.upload_category || entry.category || '-'}
                    </div>
                    <div className="text-xs text-zinc-500">{new Date(entry.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deleteEntry(entry.id); }} className="text-destructive hover:text-destructive h-8 w-8">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
          {history.length === 0 && (
            <Card className="bg-black/40 backdrop-blur-md border-white/10 p-4">
              <p className="text-zinc-400 text-center text-sm">{isGerman ? "Noch keine Einträge" : "No entries yet"}</p>
            </Card>
          )}
        </div>
      </div>

      {/* Upload Dialog - Name & Category */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-700">
          <DialogHeader>
            <DialogTitle className="text-white">{isGerman ? "Bild speichern" : "Save Image"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Input 
                placeholder={isGerman ? "Name eingeben" : "Enter name"} 
                value={uploadName} 
                onChange={(e) => setUploadName(e.target.value)} 
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div>
              <Select value={uploadCategory} onValueChange={setUploadCategory}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder={isGerman ? "Kategorie wählen" : "Select category"} />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800">
                  <SelectItem value="protein">Protein</SelectItem>
                  <SelectItem value="vegetarian">{isGerman ? "Vegetarisch" : "Vegetarian"}</SelectItem>
                  <SelectItem value="vegan">Vegan</SelectItem>
                  <SelectItem value="supplements">Supplements</SelectItem>
                  <SelectItem value="meat">{isGerman ? "Fleisch" : "Meat"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={uploadImage} disabled={isUploading || !uploadName} className="w-full">
              {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {isGerman ? "Speichern" : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* History Detail Dialog - Only Name & Category */}
      <Dialog open={historyDetailOpen} onOpenChange={setHistoryDetailOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-700">
          <DialogHeader>
            <DialogTitle className="text-white">Pro Nutrition Food Upload</DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              {selectedEntry.image_url && (
                <img src={selectedEntry.image_url} alt="Food" className="w-48 h-48 object-cover rounded-lg mx-auto" />
              )}
              {(() => {
                const notes = selectedEntry.notes ? (typeof selectedEntry.notes === 'string' ? JSON.parse(selectedEntry.notes) : selectedEntry.notes) : null;
                return (
                  <div className="space-y-2 text-center">
                    <div className="text-white font-semibold text-lg">{notes?.upload_name || 'Food Analysis'}</div>
                    <div className="text-zinc-400">{notes?.upload_category || selectedEntry.category || '-'}</div>
                    <div className="text-xs text-zinc-500">{new Date(selectedEntry.created_at).toLocaleDateString()}</div>
                  </div>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default ProNutrition;