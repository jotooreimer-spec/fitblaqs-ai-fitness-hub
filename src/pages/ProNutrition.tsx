import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, HelpCircle, Upload, X, Utensils, Scan } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import BottomNav from "@/components/BottomNav";
import proNutritionBg from "@/assets/pro-nutrition-bg.png";

const ProNutrition = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGerman, setIsGerman] = useState(true);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [foodTrackerDialogOpen, setFoodTrackerDialogOpen] = useState(false);
  const [manualForm, setManualForm] = useState({ name: "", vitamin: "", fiber: "", minerals: "", protein: "", carbs: "", unit: "g" });
  const [dailyTotals, setDailyTotals] = useState({ calories: 1776, protein: 108, carbs: 215 });

  const { hasProNutrition, loading: subscriptionLoading } = useSubscription("pro_nutrition");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { navigate("/login"); return; }
      const metadata = session.user.user_metadata;
      setIsGerman(metadata.language === "de");
    });
  }, [navigate]);

  useEffect(() => {
    if (!subscriptionLoading && !hasProNutrition) {
      navigate("/pro-subscription");
    }
  }, [subscriptionLoading, hasProNutrition, navigate]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) setUploadedFile(URL.createObjectURL(file));
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setUploadedFile(URL.createObjectURL(file));
  };

  const analyzeUploadedFood = async () => {
    if (!uploadedFile) return;
    setIsAnalyzing(true);
    try {
      // Simulated AI analysis
      setAnalysisResult({ name: "Gegrilltes Hähnchen mit Gemüse", vitamin: 25, fiber: 8, minerals: 15, protein: 45, carbs: 30, calories: 420 });
      toast({ title: isGerman ? "Analyse erfolgreich" : "Analysis successful" });
    } catch (error) {
      toast({ title: isGerman ? "Fehler" : "Error", variant: "destructive" });
    } finally { setIsAnalyzing(false); }
  };

  const saveManualEntry = () => {
    setAnalysisResult({ name: manualForm.name, vitamin: parseFloat(manualForm.vitamin) || 0, fiber: parseFloat(manualForm.fiber) || 0, minerals: parseFloat(manualForm.minerals) || 0, protein: parseFloat(manualForm.protein) || 0, carbs: parseFloat(manualForm.carbs) || 0, calories: (parseFloat(manualForm.protein) || 0) * 4 + (parseFloat(manualForm.carbs) || 0) * 4 });
    setFoodTrackerDialogOpen(false);
    toast({ title: isGerman ? "Gespeichert" : "Saved" });
  };

  const addToDay = () => {
    if (analysisResult) {
      setDailyTotals(prev => ({ calories: prev.calories + (analysisResult.calories || 0), protein: prev.protein + (analysisResult.protein || 0), carbs: prev.carbs + (analysisResult.carbs || 0) }));
      toast({ title: isGerman ? "Zum Tag hinzugefügt" : "Added to day" });
      setAnalysisResult(null);
      setUploadedFile(null);
    }
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

        {/* Upload Area */}
        <Card className="bg-black/40 backdrop-blur-md border-white/10 rounded-2xl p-4 mb-4">
          <div className={`border-2 border-dashed rounded-xl p-6 text-center min-h-[100px] flex items-center justify-center transition-colors ${isDragging ? 'border-primary bg-primary/10' : 'border-zinc-600'}`} onDrop={handleDrop} onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}>
            {uploadedFile ? (
              <div className="relative w-full">
                <img src={uploadedFile} alt="Food" className="max-h-20 mx-auto rounded-lg" />
                <Button variant="destructive" size="icon" className="absolute top-0 right-0 w-6 h-6" onClick={() => setUploadedFile(null)}><X className="w-3 h-3" /></Button>
              </div>
            ) : (
              <div>
                <Upload className="w-6 h-6 mx-auto mb-2 text-zinc-400" />
                <p className="text-zinc-400 text-xs mb-2">{isGerman ? "Bild per Drag & Drop" : "Drag & drop image"}</p>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" id="food-upload" />
                <label htmlFor="food-upload"><Button asChild variant="outline" size="sm" className="bg-zinc-800/50 border-zinc-600 text-white"><span><Upload className="w-3 h-3 mr-1" />{isGerman ? "Hochladen" : "Upload"}</span></Button></label>
              </div>
            )}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-4">
          <Button onClick={() => setFoodTrackerDialogOpen(true)} className="flex-1 bg-zinc-800/80 hover:bg-zinc-700 text-white border-0 rounded-full py-5">
            <Utensils className="w-4 h-4 mr-2" />Food Tracker
          </Button>
          <Button onClick={analyzeUploadedFood} disabled={!uploadedFile || isAnalyzing} className="flex-1 bg-zinc-800/80 hover:bg-zinc-700 text-white border-0 rounded-full py-5">
            {isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Scan className="w-4 h-4 mr-2" />}
            Analyse Upload
          </Button>
        </div>

        {/* Analysis Result */}
        {analysisResult && (
          <Card className="bg-black/40 backdrop-blur-md border-white/10 rounded-2xl p-4 mb-4">
            <h2 className="text-lg font-bold text-white mb-3">Analyse</h2>
            <div className="text-white font-semibold mb-2">{analysisResult.name}</div>
            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
              <div className="flex justify-between"><span className="text-zinc-400">Vitamin</span><span className="text-white">{analysisResult.vitamin}mg</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Ballaststoffe</span><span className="text-white">{analysisResult.fiber}g</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Mineralstoffe</span><span className="text-white">{analysisResult.minerals}mg</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Protein</span><span className="text-white">{analysisResult.protein}g</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Kohlenhydrate</span><span className="text-white">{analysisResult.carbs}g</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Kalorien</span><span className="text-white">{analysisResult.calories}kcal</span></div>
            </div>
            <Button onClick={addToDay} className="w-full">Analyse</Button>
          </Card>
        )}

        {/* Daily Totals */}
        <Card className="bg-black/40 backdrop-blur-md border-white/10 rounded-2xl p-4">
          <div className="w-full bg-zinc-700 rounded-full h-2 mb-4"><div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${Math.min((dailyTotals.calories / 2500) * 100, 100)}%` }}></div></div>
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div><div className="text-lg font-bold text-white">{dailyTotals.calories}</div><div className="text-xs text-zinc-400">kcal</div></div>
            <div><div className="text-lg font-medium text-white">{dailyTotals.protein}g</div><div className="text-xs text-zinc-400">Protein</div></div>
            <div><div className="text-lg font-medium text-white">{dailyTotals.carbs}g</div><div className="text-xs text-zinc-400">{isGerman ? "Kohlenhydrate" : "Carbs"}</div></div>
          </div>
        </Card>

        {/* Food Tracker Dialog */}
        <Dialog open={foodTrackerDialogOpen} onOpenChange={setFoodTrackerDialogOpen}>
          <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-700">
            <DialogHeader><DialogTitle className="text-white">Food Tracker</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-zinc-300">Name</Label><Input value={manualForm.name} onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })} className="bg-zinc-800 border-zinc-600 text-white" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-zinc-300">Vitamin</Label><Input type="number" value={manualForm.vitamin} onChange={(e) => setManualForm({ ...manualForm, vitamin: e.target.value })} className="bg-zinc-800 border-zinc-600 text-white" /></div>
                <div><Label className="text-zinc-300">Ballaststoffe</Label><Input type="number" value={manualForm.fiber} onChange={(e) => setManualForm({ ...manualForm, fiber: e.target.value })} className="bg-zinc-800 border-zinc-600 text-white" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-zinc-300">Mineralstoffe</Label><Input type="number" value={manualForm.minerals} onChange={(e) => setManualForm({ ...manualForm, minerals: e.target.value })} className="bg-zinc-800 border-zinc-600 text-white" /></div>
                <div><Label className="text-zinc-300">Protein</Label><Input type="number" value={manualForm.protein} onChange={(e) => setManualForm({ ...manualForm, protein: e.target.value })} className="bg-zinc-800 border-zinc-600 text-white" /></div>
              </div>
              <div><Label className="text-zinc-300">Kohlenhydrate</Label><Input type="number" value={manualForm.carbs} onChange={(e) => setManualForm({ ...manualForm, carbs: e.target.value })} className="bg-zinc-800 border-zinc-600 text-white" /></div>
              <div><Label className="text-zinc-300">Einheit</Label><Select value={manualForm.unit} onValueChange={(v) => setManualForm({ ...manualForm, unit: v })}><SelectTrigger className="bg-zinc-800 border-zinc-600 text-white"><SelectValue /></SelectTrigger><SelectContent className="bg-zinc-800"><SelectItem value="g">g</SelectItem><SelectItem value="mg">mg</SelectItem><SelectItem value="kg">kg</SelectItem></SelectContent></Select></div>
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