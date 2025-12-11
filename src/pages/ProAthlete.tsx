import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Dumbbell, Upload, X, Loader2, HelpCircle, Scan, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import BottomNav from "@/components/BottomNav";
import { BodyAnalysisSkeleton } from "@/components/AnalysisSkeleton";
import { compressImage, isValidImageFile } from "@/lib/imageUtils";
import proAthleteBg from "@/assets/pro-athlete-bg.png";
import performanceButtonBg from "@/assets/performance-button.png";

interface TrainingDay {
  day: string;
  workout: string;
  duration: string;
}

interface TrainingPlan {
  weeks: number;
  focus: string;
  weekly_schedule: TrainingDay[];
}

interface BodyAnalysisResult {
  gender: string;
  age_estimate: number;
  body_fat_pct: number;
  muscle_mass_pct: number;
  muscle_category?: string;
  posture: string;
  symmetry: string;
  waist_hip_ratio: number;
  fitness_level: number;
  health_notes: string;
  training_tips: string;
  bmi?: { value: number; category: string };
  tdee?: { bmr: number; activity_factor: number; total: number };
  target_calories?: { daily: number; deficit_surplus: number; goal: string; weekly_change_kg: number };
  time_to_goal?: { weeks: number; days: number; weight_to_lose_gain: number };
  training_plan?: TrainingPlan;
  nutrition_plan?: { daily_calories: number; protein_g: number; carbs_g: number; fat_g: number; hydration_liters: number; supplements: string[] };
  strategy?: { weekly_workouts: number; sleep_hours: number; water_liters: number; key_focus: string; mistakes_to_avoid: string[] };
  history_summary?: string;
}

const ProAthlete = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGerman, setIsGerman] = useState(true);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [uploadedFileRaw, setUploadedFileRaw] = useState<File | null>(null);
  const [proAthleteDialogOpen, setProAthleteDialogOpen] = useState(false);
  const [bodyAnalysisDialogOpen, setBodyAnalysisDialogOpen] = useState(false);
  const [trainingPlan, setTrainingPlan] = useState<any>(null);
  const [bodyAnalysis, setBodyAnalysis] = useState<BodyAnalysisResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [athleteForm, setAthleteForm] = useState({
    body_type: "", weight: "", weight_unit: "kg", target_weight: "", target_weight_unit: "kg",
    age: "", height: "", height_unit: "cm", health_status: false, health_notes: "",
    activity_level: "", training_frequency: "", goal: ""
  });

  // Subscription check disabled for testing - pages are freely accessible
  // const { hasProAthlete, loading: subscriptionLoading } = useSubscription("pro_athlete");

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

  const generateTrainingPlan = async () => {
    setIsGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-training-plan`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${session.access_token}` 
        },
        body: JSON.stringify({
          bodyType: athleteForm.body_type, 
          weight: `${athleteForm.weight} ${athleteForm.weight_unit}`,
          targetWeight: `${athleteForm.target_weight} ${athleteForm.target_weight_unit}`, 
          age: athleteForm.age,
          height: `${athleteForm.height} ${athleteForm.height_unit}`, 
          healthStatus: athleteForm.health_status ? athleteForm.health_notes : null,
          activityLevel: athleteForm.activity_level, 
          trainingFrequency: athleteForm.training_frequency, 
          goal: athleteForm.goal
        }),
      });
      const data = await response.json();
      setTrainingPlan({ 
        duration: data.trainingPlan?.duration || "8 Wochen", 
        goal_kcal: data.trainingPlan?.nutrition?.dailyCalories || 2000, 
        regeneration: data.trainingPlan?.recovery?.sleepHours || "7-8h", 
        workout_week: `${athleteForm.training_frequency || 4}x` 
      });
      setProAthleteDialogOpen(false);
      toast({ title: isGerman ? "Trainingsplan erstellt" : "Training plan created" });
    } catch (error) {
      console.error("Training plan error:", error);
      toast({ title: isGerman ? "Fehler" : "Error", variant: "destructive" });
    } finally { 
      setIsGenerating(false); 
    }
  };

  const analyzeBody = async () => {
    if (!uploadedFileRaw) { 
      toast({ title: isGerman ? "Bitte Bild hochladen" : "Please upload image", variant: "destructive" }); 
      return; 
    }
    setIsAnalyzing(true);
    setBodyAnalysisDialogOpen(false);
    
    try {
      const compressed = await compressImage(uploadedFileRaw);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Send manual form data for better AI analysis
      const userData = {
        weight: athleteForm.weight ? parseFloat(athleteForm.weight) : undefined,
        targetWeight: athleteForm.target_weight ? parseFloat(athleteForm.target_weight) : undefined,
        age: athleteForm.age ? parseInt(athleteForm.age) : undefined,
        height: athleteForm.height ? parseFloat(athleteForm.height) : undefined,
        activityLevel: athleteForm.activity_level || "Moderate",
        trainingFrequency: athleteForm.training_frequency ? parseInt(athleteForm.training_frequency) : 4,
        bodyType: athleteForm.body_type || "Normal",
        goal: athleteForm.goal || "Maintain Weight",
        healthNotes: athleteForm.health_notes || undefined
      };

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-body`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          imageBase64: compressed.base64,
          userData: userData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check for invalid image error
        if (data.error === "invalid_image") {
          toast({ 
            title: isGerman ? "Ungültiges Bild" : "Invalid Image", 
            description: data.message || (isGerman ? "Bitte ein passendes Körperbild hochladen" : "Please upload a valid body/fitness image"),
            variant: "destructive" 
          });
          return;
        }
        throw new Error(data.error || "API error");
      }

      setBodyAnalysis(data.analysis);
      toast({ title: isGerman ? "Body Analyse abgeschlossen" : "Body analysis complete" });
    } catch (error) {
      console.error("Body analysis error:", error);
      toast({ 
        title: isGerman ? "Analyse fehlgeschlagen" : "Analysis failed", 
        description: isGerman ? "Bitte versuche es erneut" : "Please try again",
        variant: "destructive" 
      });
    } finally { 
      setIsAnalyzing(false); 
    }
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

        {/* Manual Input + Upload Area */}
        <Card className="bg-black/40 backdrop-blur-md border-white/10 rounded-2xl p-4 mb-4">
          <h3 className="text-white font-semibold text-sm mb-3">{isGerman ? "1. Manuelle Werte eingeben" : "1. Enter Manual Values"}</h3>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <Input type="number" placeholder={isGerman ? "Gewicht (kg)" : "Weight (kg)"} value={athleteForm.weight} onChange={(e) => setAthleteForm({...athleteForm, weight: e.target.value})} className="bg-zinc-800/50 border-zinc-700 text-white text-sm h-9" />
            <Input type="number" placeholder={isGerman ? "Zielgewicht (kg)" : "Target Weight (kg)"} value={athleteForm.target_weight} onChange={(e) => setAthleteForm({...athleteForm, target_weight: e.target.value})} className="bg-zinc-800/50 border-zinc-700 text-white text-sm h-9" />
            <Input type="number" placeholder={isGerman ? "Alter" : "Age"} value={athleteForm.age} onChange={(e) => setAthleteForm({...athleteForm, age: e.target.value})} className="bg-zinc-800/50 border-zinc-700 text-white text-sm h-9" />
            <Input type="number" placeholder={isGerman ? "Größe (cm)" : "Height (cm)"} value={athleteForm.height} onChange={(e) => setAthleteForm({...athleteForm, height: e.target.value})} className="bg-zinc-800/50 border-zinc-700 text-white text-sm h-9" />
            <Select value={athleteForm.activity_level} onValueChange={(v) => setAthleteForm({...athleteForm, activity_level: v})}>
              <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white text-sm h-9"><SelectValue placeholder={isGerman ? "Aktivitätslevel" : "Activity Level"} /></SelectTrigger>
              <SelectContent className="bg-zinc-800">
                <SelectItem value="Sedentary">{isGerman ? "Sitzend" : "Sedentary"}</SelectItem>
                <SelectItem value="Light">{isGerman ? "Leicht aktiv" : "Light"}</SelectItem>
                <SelectItem value="Moderate">{isGerman ? "Moderat" : "Moderate"}</SelectItem>
                <SelectItem value="Active">{isGerman ? "Aktiv" : "Active"}</SelectItem>
                <SelectItem value="Very Active">{isGerman ? "Sehr aktiv" : "Very Active"}</SelectItem>
              </SelectContent>
            </Select>
            <Input type="number" placeholder={isGerman ? "Training/Woche" : "Training/Week"} value={athleteForm.training_frequency} onChange={(e) => setAthleteForm({...athleteForm, training_frequency: e.target.value})} className="bg-zinc-800/50 border-zinc-700 text-white text-sm h-9" />
            <Select value={athleteForm.body_type} onValueChange={(v) => setAthleteForm({...athleteForm, body_type: v})}>
              <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white text-sm h-9"><SelectValue placeholder={isGerman ? "Körpertyp" : "Body Type"} /></SelectTrigger>
              <SelectContent className="bg-zinc-800">
                <SelectItem value="Ectomorph">{isGerman ? "Schlank" : "Ectomorph"}</SelectItem>
                <SelectItem value="Mesomorph">{isGerman ? "Muskulös" : "Mesomorph"}</SelectItem>
                <SelectItem value="Endomorph">{isGerman ? "Kräftig" : "Endomorph"}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={athleteForm.goal} onValueChange={(v) => setAthleteForm({...athleteForm, goal: v})}>
              <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white text-sm h-9"><SelectValue placeholder={isGerman ? "Ziel" : "Goal"} /></SelectTrigger>
              <SelectContent className="bg-zinc-800">
                <SelectItem value="Lose Fat">{isGerman ? "Fett verlieren" : "Lose Fat"}</SelectItem>
                <SelectItem value="Gain Muscle">{isGerman ? "Muskeln aufbauen" : "Gain Muscle"}</SelectItem>
                <SelectItem value="Maintain Weight">{isGerman ? "Gewicht halten" : "Maintain Weight"}</SelectItem>
              </SelectContent>
            </Select>
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
                <img src={uploadedFile} alt="Uploaded" className="max-h-20 mx-auto rounded-lg" />
                <Button variant="destructive" size="icon" className="absolute top-0 right-0 w-6 h-6" onClick={() => { setUploadedFile(null); setUploadedFileRaw(null); }}><X className="w-3 h-3" /></Button>
              </div>
            ) : (
              <div>
                <Upload className="w-5 h-5 mx-auto mb-1 text-zinc-400" />
                <p className="text-zinc-400 text-xs mb-2">{isGerman ? "Drag & Drop" : "Drag & drop"}</p>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" id="file-upload" />
                <label htmlFor="file-upload"><Button asChild variant="outline" size="sm" className="bg-zinc-800/50 border-zinc-600 text-white text-xs"><span><Upload className="w-3 h-3 mr-1" />{isGerman ? "Hochladen" : "Upload"}</span></Button></label>
              </div>
            )}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-4">
          <Button onClick={() => setProAthleteDialogOpen(true)} className="flex-1 bg-zinc-800/80 hover:bg-zinc-700 text-white border-0 rounded-full py-5">
            <Dumbbell className="w-4 h-4 mr-2" />{isGerman ? "Trainingsplan" : "Training Plan"}
          </Button>
          <Button onClick={analyzeBody} disabled={!uploadedFile || isAnalyzing} className="flex-1 bg-primary hover:bg-primary/90 text-white border-0 rounded-full py-5">
            {isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Scan className="w-4 h-4 mr-2" />}
            {isGerman ? "3. AI Analyse" : "3. AI Analyze"}
          </Button>
        </div>

        {/* Analysis Loading Skeleton */}
        {isAnalyzing && <BodyAnalysisSkeleton isGerman={isGerman} />}

        {/* Body Analysis Result with Charts */}
        {bodyAnalysis && !isAnalyzing && (
          <Card className="bg-black/40 backdrop-blur-md border-white/10 rounded-2xl p-4 mb-4">
            {/* Show uploaded image at top */}
            {uploadedFile && (
              <div className="mb-4">
                <img src={uploadedFile} alt="Body Analysis" className="w-16 h-16 object-cover rounded-lg mx-auto" />
              </div>
            )}
            <h2 className="text-lg font-bold text-white mb-4">Body Analyse</h2>
            
            {/* Visual Progress Bars */}
            <div className="space-y-4 mb-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-400">{isGerman ? "Körperfett" : "Body Fat"}</span>
                  <span className="text-orange-400 font-bold">{bodyAnalysis.body_fat_pct}%</span>
                </div>
                <div className="w-full bg-zinc-700 rounded-full h-3">
                  <div className="bg-gradient-to-r from-orange-500 to-orange-400 h-3 rounded-full transition-all" style={{ width: `${Math.min(bodyAnalysis.body_fat_pct, 50)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-400">{isGerman ? "Muskelmasse" : "Muscle Mass"}</span>
                  <span className="text-green-400 font-bold">{bodyAnalysis.muscle_mass_pct}%</span>
                </div>
                <div className="w-full bg-zinc-700 rounded-full h-3">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-400 h-3 rounded-full transition-all" style={{ width: `${Math.min(bodyAnalysis.muscle_mass_pct, 60)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-400">Fitness Level</span>
                  <span className="text-primary font-bold">{bodyAnalysis.fitness_level}/10</span>
                </div>
                <div className="w-full bg-zinc-700 rounded-full h-3">
                  <div className="bg-gradient-to-r from-primary to-blue-400 h-3 rounded-full transition-all" style={{ width: `${bodyAnalysis.fitness_level * 10}%` }} />
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/5 p-3 rounded-lg">
                <div className="text-xs text-zinc-400">{isGerman ? "Geschlecht" : "Gender"}</div>
                <div className="text-white font-medium">{bodyAnalysis.gender}</div>
              </div>
              <div className="bg-white/5 p-3 rounded-lg">
                <div className="text-xs text-zinc-400">{isGerman ? "Geschätztes Alter" : "Est. Age"}</div>
                <div className="text-white font-medium">{bodyAnalysis.age_estimate} {isGerman ? "Jahre" : "years"}</div>
              </div>
              <div className="bg-white/5 p-3 rounded-lg">
                <div className="text-xs text-zinc-400">{isGerman ? "Haltung" : "Posture"}</div>
                <div className="text-white font-medium text-sm">{bodyAnalysis.posture}</div>
              </div>
              <div className="bg-white/5 p-3 rounded-lg">
                <div className="text-xs text-zinc-400">{isGerman ? "Symmetrie" : "Symmetry"}</div>
                <div className="text-white font-medium">{bodyAnalysis.symmetry}</div>
              </div>
              <div className="bg-white/5 p-3 rounded-lg col-span-2">
                <div className="text-xs text-zinc-400">{isGerman ? "Taille-Hüfte-Verhältnis" : "Waist-Hip Ratio"}</div>
                <div className="text-white font-medium">{bodyAnalysis.waist_hip_ratio}</div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white/5 p-3 rounded-lg mb-3">
              <div className="text-xs text-zinc-400 mb-1">{isGerman ? "Gesundheitshinweise" : "Health Notes"}</div>
              <div className="text-white text-sm">{bodyAnalysis.health_notes}</div>
            </div>
            <div className="bg-white/5 p-3 rounded-lg mb-3">
              <div className="text-xs text-zinc-400 mb-1">{isGerman ? "Trainingstipps" : "Training Tips"}</div>
              <div className="text-white text-sm">{bodyAnalysis.training_tips}</div>
            </div>

            {/* AI-Generated Training Plan */}
            {bodyAnalysis.training_plan && (
              <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-4 rounded-xl mt-4">
                <h3 className="text-white font-bold mb-3">
                  {isGerman ? `${bodyAnalysis.training_plan.weeks}-Wochen Trainingsplan` : `${bodyAnalysis.training_plan.weeks}-Week Training Plan`}
                </h3>
                <div className="text-xs text-zinc-400 mb-3">
                  {isGerman ? "Fokus:" : "Focus:"} <span className="text-primary font-medium">{bodyAnalysis.training_plan.focus}</span>
                </div>
                <div className="space-y-2">
                  {bodyAnalysis.training_plan.weekly_schedule?.map((day, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-black/30 p-2 rounded-lg">
                      <div>
                        <div className="text-white font-medium text-sm">{day.day}</div>
                        <div className="text-zinc-400 text-xs">{day.workout}</div>
                      </div>
                      <div className="text-primary text-xs">{day.duration}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Training Plan Display */}
        {trainingPlan && !bodyAnalysis && !isAnalyzing && (
          <Card className="bg-black/40 backdrop-blur-md border-white/10 rounded-2xl p-4">
            <h2 className="text-lg font-bold text-white mb-3">Trainingsplan</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-zinc-400">Goal</span><span className="text-white font-medium">{trainingPlan.goal_kcal} kcal</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Regeneration</span><span className="text-white font-medium">{trainingPlan.regeneration}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Workout Week</span><span className="text-white font-medium">{trainingPlan.workout_week}</span></div>
            </div>
          </Card>
        )}

        {/* Default State */}
        {!trainingPlan && !bodyAnalysis && !isAnalyzing && (
          <Card className="bg-black/40 backdrop-blur-md border-white/10 rounded-2xl p-4">
            <p className="text-zinc-400 text-center py-6 text-sm">{isGerman ? "Klicke auf 'Pro-Athlete' oder 'Body Analyse'" : "Click 'Pro-Athlete' or 'Body Analyse'"}</p>
          </Card>
        )}

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