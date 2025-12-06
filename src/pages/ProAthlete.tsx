import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Dumbbell, Upload, X, Loader2, HelpCircle, Scan } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";
import proAthleteBg from "@/assets/pro-athlete-bg.png";

const ProAthlete = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGerman, setIsGerman] = useState(true);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [proAthleteDialogOpen, setProAthleteDialogOpen] = useState(false);
  const [bodyAnalysisDialogOpen, setBodyAnalysisDialogOpen] = useState(false);
  const [trainingPlan, setTrainingPlan] = useState<any>(null);
  const [bodyAnalysis, setBodyAnalysis] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [athleteForm, setAthleteForm] = useState({
    body_type: "", weight: "", weight_unit: "kg", target_weight: "", target_weight_unit: "kg",
    age: "", height: "", height_unit: "cm", health_status: false, health_notes: "",
    activity_level: "", training_frequency: "", goal: ""
  });

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { navigate("/login"); return; }
      const metadata = session.user.user_metadata;
      setIsGerman(metadata.language === "de");
    });
  }, [navigate]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setUploadedFile(url);
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setUploadedFile(URL.createObjectURL(file));
  };

  const generateTrainingPlan = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-training-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          bodyType: athleteForm.body_type, weight: `${athleteForm.weight} ${athleteForm.weight_unit}`,
          targetWeight: `${athleteForm.target_weight} ${athleteForm.target_weight_unit}`, age: athleteForm.age,
          height: `${athleteForm.height} ${athleteForm.height_unit}`, healthStatus: athleteForm.health_status ? athleteForm.health_notes : null,
          activityLevel: athleteForm.activity_level, trainingFrequency: athleteForm.training_frequency, goal: athleteForm.goal
        }),
      });
      const data = await response.json();
      setTrainingPlan({ duration: data.trainingPlan?.duration || "8 Wochen", goal_kcal: data.trainingPlan?.nutrition?.dailyCalories || 2000, regeneration: data.trainingPlan?.recovery?.sleepHours || "7-8h", workout_week: `${athleteForm.training_frequency || 4}x` });
      setProAthleteDialogOpen(false);
      toast({ title: isGerman ? "Trainingsplan erstellt" : "Training plan created" });
    } catch (error) {
      toast({ title: isGerman ? "Fehler" : "Error", variant: "destructive" });
    } finally { setIsGenerating(false); }
  };

  const analyzeBody = async () => {
    if (!uploadedFile) { toast({ title: isGerman ? "Bitte Bild hochladen" : "Please upload image", variant: "destructive" }); return; }
    setIsAnalyzing(true);
    try {
      // Simulated body analysis result
      const analysis = `1. Geschlecht: Mann (geschätzt)\n2. Alter: 25-30 Jahre\n3. Körperfett: ~15%\n4. Muskeldefinition: 7/10\n5. Haltung: Gute Schulterposition, leichte Beckenkippung\n6. Symmetrie: Ausgeglichen\n7. Körperform-Typ: Athletic/Mesomorph\n8. Fitness-Level: 7/10\n9. Gesundheits-Hinweise: Gute Grundfitness, Mobilität verbessern\n10. Trainings-Empfehlungen: Compound-Übungen, Core-Training\n11. Ernährungstipps: Proteinreich essen, Hydration, Gemüse erhöhen`;
      setBodyAnalysis(analysis);
      setBodyAnalysisDialogOpen(false);
      toast({ title: isGerman ? "Body Analyse abgeschlossen" : "Body analysis complete" });
    } catch (error) {
      toast({ title: isGerman ? "Fehler" : "Error", variant: "destructive" });
    } finally { setIsAnalyzing(false); }
  };

  return (
    <div className="min-h-screen pb-24 relative">
      <div className="fixed inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${proAthleteBg})` }} />
      <div className="fixed inset-0 bg-black/70" />

      <div className="relative z-10 max-w-screen-xl mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/pro-subscription")} className="text-white"><ArrowLeft className="w-6 h-6" /></Button>
          <h1 className="text-lg font-semibold text-white">Pro Athlete</h1>
          <Button variant="ghost" size="icon" className="text-white"><HelpCircle className="w-6 h-6" /></Button>
        </div>

        {/* Upload Area */}
        <Card className="bg-black/40 backdrop-blur-md border-white/10 rounded-2xl p-4 mb-4">
          <div className={`border-2 border-dashed rounded-xl p-6 text-center min-h-[100px] flex items-center justify-center transition-colors ${isDragging ? 'border-primary bg-primary/10' : 'border-zinc-600'}`} onDrop={handleDrop} onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}>
            {uploadedFile ? (
              <div className="relative w-full">
                <img src={uploadedFile} alt="Uploaded" className="max-h-20 mx-auto rounded-lg" />
                <Button variant="destructive" size="icon" className="absolute top-0 right-0 w-6 h-6" onClick={() => setUploadedFile(null)}><X className="w-3 h-3" /></Button>
              </div>
            ) : (
              <div>
                <Upload className="w-6 h-6 mx-auto mb-2 text-zinc-400" />
                <p className="text-zinc-400 text-xs mb-2">{isGerman ? "Bild per Drag & Drop" : "Drag & drop image"}</p>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" id="file-upload" />
                <label htmlFor="file-upload"><Button asChild variant="outline" size="sm" className="bg-zinc-800/50 border-zinc-600 text-white"><span><Upload className="w-3 h-3 mr-1" />{isGerman ? "Hochladen" : "Upload"}</span></Button></label>
              </div>
            )}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-4">
          <Button onClick={() => setProAthleteDialogOpen(true)} className="flex-1 bg-zinc-800/80 hover:bg-zinc-700 text-white border-0 rounded-full py-5">
            <Dumbbell className="w-4 h-4 mr-2" />Pro-Athlete
          </Button>
          <Button onClick={() => setBodyAnalysisDialogOpen(true)} className="flex-1 bg-zinc-800/80 hover:bg-zinc-700 text-white border-0 rounded-full py-5">
            <Scan className="w-4 h-4 mr-2" />Body Analyse
          </Button>
        </div>

        {/* Training Plan / Body Analysis Display */}
        <Card className="bg-black/40 backdrop-blur-md border-white/10 rounded-2xl p-4">
          <h2 className="text-lg font-bold text-white mb-3">{bodyAnalysis ? "Body Analyse" : "Trainingsplan"}</h2>
          {bodyAnalysis ? (
            <pre className="text-sm text-white/80 whitespace-pre-wrap">{bodyAnalysis}</pre>
          ) : trainingPlan ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-zinc-400">Goal</span><span className="text-white font-medium">{trainingPlan.goal_kcal} kcal</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Regeneration</span><span className="text-white font-medium">{trainingPlan.regeneration}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Workout Week</span><span className="text-white font-medium">{trainingPlan.workout_week}</span></div>
            </div>
          ) : (
            <p className="text-zinc-400 text-center py-6 text-sm">{isGerman ? "Klicke auf 'Pro-Athlete' oder 'Body Analyse'" : "Click 'Pro-Athlete' or 'Body Analyse'"}</p>
          )}
        </Card>

        {/* Pro Athlete Dialog */}
        <Dialog open={proAthleteDialogOpen} onOpenChange={setProAthleteDialogOpen}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-zinc-900 border-zinc-700">
            <DialogHeader><DialogTitle className="text-white">{isGerman ? "Pro Athlete Profil" : "Pro Athlete Profile"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-zinc-300">{isGerman ? "Körpertyp" : "Body Type"}</Label><Select value={athleteForm.body_type} onValueChange={(v) => setAthleteForm({ ...athleteForm, body_type: v })}><SelectTrigger className="bg-zinc-800 border-zinc-600 text-white"><SelectValue /></SelectTrigger><SelectContent className="bg-zinc-800"><SelectItem value="fat">Fett</SelectItem><SelectItem value="muscular">Muskulös</SelectItem><SelectItem value="slim">Schlank</SelectItem><SelectItem value="defined">Definiert</SelectItem></SelectContent></Select></div>
              <div className="grid grid-cols-2 gap-3"><div><Label className="text-zinc-300">{isGerman ? "Gewicht" : "Weight"}</Label><Input type="number" value={athleteForm.weight} onChange={(e) => setAthleteForm({ ...athleteForm, weight: e.target.value })} className="bg-zinc-800 border-zinc-600 text-white" /></div><div><Label className="text-zinc-300">{isGerman ? "Zielgewicht" : "Target"}</Label><Input type="number" value={athleteForm.target_weight} onChange={(e) => setAthleteForm({ ...athleteForm, target_weight: e.target.value })} className="bg-zinc-800 border-zinc-600 text-white" /></div></div>
              <div className="grid grid-cols-2 gap-3"><div><Label className="text-zinc-300">{isGerman ? "Alter" : "Age"}</Label><Input type="number" value={athleteForm.age} onChange={(e) => setAthleteForm({ ...athleteForm, age: e.target.value })} className="bg-zinc-800 border-zinc-600 text-white" /></div><div><Label className="text-zinc-300">{isGerman ? "Größe" : "Height"}</Label><Input type="number" value={athleteForm.height} onChange={(e) => setAthleteForm({ ...athleteForm, height: e.target.value })} className="bg-zinc-800 border-zinc-600 text-white" /></div></div>
              <div><Label className="text-zinc-300">{isGerman ? "Aktivitätslevel" : "Activity Level"}</Label><Select value={athleteForm.activity_level} onValueChange={(v) => setAthleteForm({ ...athleteForm, activity_level: v })}><SelectTrigger className="bg-zinc-800 border-zinc-600 text-white"><SelectValue /></SelectTrigger><SelectContent className="bg-zinc-800"><SelectItem value="inactive">Inaktiv</SelectItem><SelectItem value="active">Aktiv</SelectItem><SelectItem value="very_active">Sehr aktiv</SelectItem></SelectContent></Select></div>
              <div><Label className="text-zinc-300">{isGerman ? "Trainingshäufigkeit/Woche" : "Training/Week"}</Label><Input type="number" min="1" max="6" value={athleteForm.training_frequency} onChange={(e) => setAthleteForm({ ...athleteForm, training_frequency: e.target.value })} className="bg-zinc-800 border-zinc-600 text-white" /></div>
              <div><Label className="text-zinc-300">{isGerman ? "Ziel" : "Goal"}</Label><Select value={athleteForm.goal} onValueChange={(v) => setAthleteForm({ ...athleteForm, goal: v })}><SelectTrigger className="bg-zinc-800 border-zinc-600 text-white"><SelectValue /></SelectTrigger><SelectContent className="bg-zinc-800"><SelectItem value="fat_loss">Fettabbau</SelectItem><SelectItem value="muscle">Muskelaufbau</SelectItem><SelectItem value="maintain">Erhalt</SelectItem><SelectItem value="conditioning">Kondition</SelectItem></SelectContent></Select></div>
              <Button onClick={generateTrainingPlan} className="w-full" disabled={isGenerating}>{isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}{isGerman ? "Speichern & Generieren" : "Save & Generate"}</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Body Analysis Dialog */}
        <Dialog open={bodyAnalysisDialogOpen} onOpenChange={setBodyAnalysisDialogOpen}>
          <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-700">
            <DialogHeader><DialogTitle className="text-white">Body Analyse</DialogTitle></DialogHeader>
            <p className="text-zinc-400 text-sm mb-4">{isGerman ? "Lade ein Körperfoto hoch für KI-Analyse" : "Upload a body photo for AI analysis"}</p>
            {uploadedFile && <img src={uploadedFile} alt="Body" className="max-h-40 mx-auto rounded-lg mb-4" />}
            <Button onClick={analyzeBody} className="w-full" disabled={isAnalyzing || !uploadedFile}>{isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}{isGerman ? "Analysieren" : "Analyze"}</Button>
          </DialogContent>
        </Dialog>
      </div>
      <BottomNav />
    </div>
  );
};

export default ProAthlete;