import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Upload, X, Loader2, HelpCircle, Save, BarChart3, Trash2, Edit, Info, TrendingUp, Target, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";
import { compressImage, isValidImageFile, base64ToBlob } from "@/lib/imageUtils";
import { useLiveData } from "@/contexts/LiveDataContext";
import { useLanguage } from "@/contexts/LanguageContext";
import proAthleteBg from "@/assets/pro-athlete-bg.png";
import performanceButtonBg from "@/assets/performance-button.png";

interface BodyAnalysisEntry {
  id: string;
  image_url: string | null;
  body_fat_pct: number | null;
  muscle_mass_pct: number | null;
  fitness_level: number | null;
  health_notes: string | null;
  created_at: string;
}

const ProAthlete = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language, isGerman } = useLanguage();
  const { bodyAnalysis, workoutLogs, joggingLogs, weightLogs, stats, setUserId, refetch } = useLiveData();
  const [userId, setLocalUserId] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [uploadedFileRaw, setUploadedFileRaw] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [startWeight, setStartWeight] = useState(0);
  
  // Calculated percentages from live data
  const [calculatedStats, setCalculatedStats] = useState({
    trainingHours: 0,
    trainingHoursPct: 0,
    weightLoss: 0,
    weightLossPct: 0,
    currentWeight: 0,
    weightPct: 0,
    totalTrainings: 0,
    trainingsPct: 0,
  });

  const [athleteForm, setAthleteForm] = useState({
    body_type: "", weight: "", weight_unit: "kg", target_weight: "", target_weight_unit: "kg",
    age: "", height: "", height_unit: "cm", training_time: "", training_frequency: "", goal: ""
  });

  // Upload dialog state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploadCategory, setUploadCategory] = useState("progress");

  // Edit entry state
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  
  // Info dialog state
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);

  const bodyCategories = ["progress", "front", "back", "side", "flexing"];
  const history = bodyAnalysis as BodyAnalysisEntry[];

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { navigate("/login"); return; }
      setLocalUserId(session.user.id);
      setUserId(session.user.id);
      
      // Get start weight from first weight log or profile
      const { data: firstWeight } = await supabase
        .from("weight_logs")
        .select("weight")
        .eq("user_id", session.user.id)
        .order("measured_at", { ascending: true })
        .limit(1)
        .single();
      
      if (firstWeight?.weight) {
        setStartWeight(firstWeight.weight);
      }
    });
  }, [navigate, setUserId]);

  // Calculate stats from live data AND manual values in real-time
  useEffect(() => {
    // Get manual values from latest body_analysis entry
    let manualTrainingTime = 0;
    let manualWeight = 0;
    let manualTargetWeight = 0;
    let manualTrainingFreq = 0;

    // Find latest manual entry with values
    const manualEntries = history.filter(h => {
      const notes = parseHealthNotes(h.health_notes);
      return notes?.training_time || notes?.weight || notes?.training_frequency;
    });

    if (manualEntries.length > 0) {
      const latestManual = parseHealthNotes(manualEntries[0].health_notes);
      manualTrainingTime = parseFloat(latestManual?.training_time) || 0;
      manualWeight = parseFloat(latestManual?.weight) || 0;
      manualTargetWeight = parseFloat(latestManual?.target_weight) || 0;
      manualTrainingFreq = parseFloat(latestManual?.training_frequency) || 0;
    }

    // Training hours from manual input or workouts/jogging
    const workoutHours = workoutLogs.reduce((sum, w) => sum + ((w.sets || 1) * 3 / 60), 0);
    const joggingHours = joggingLogs.reduce((sum, j) => sum + ((j.duration || 0) / 60), 0);
    const totalHours = manualTrainingTime > 0 ? manualTrainingTime : (workoutHours + joggingHours);
    
    // Total trainings count from manual frequency or actual logs
    const loggedSessions = workoutLogs.length + joggingLogs.length;
    const totalSessions = manualTrainingFreq > 0 ? manualTrainingFreq * 4 : loggedSessions;
    
    // Current weight from manual input or weight tracker
    const currentWeight = manualWeight > 0 ? manualWeight : (stats.currentWeight || 0);
    
    // Weight loss calculation - from current vs start weight OR current vs target
    const weightFromLogs = weightLogs.length > 0 ? weightLogs[0].weight : 0;
    const effectiveStartWeight = startWeight > 0 ? startWeight : (weightFromLogs || currentWeight);
    const weightLoss = effectiveStartWeight > 0 && currentWeight > 0 ? Math.max(0, effectiveStartWeight - currentWeight) : 0;
    const weightLossPct = effectiveStartWeight > 0 ? (weightLoss / effectiveStartWeight) * 100 : 0;
    
    // Weight percentage compared to start weight
    const weightPct = effectiveStartWeight > 0 && currentWeight > 0 
      ? ((effectiveStartWeight - currentWeight) / effectiveStartWeight) * 100 
      : 0;
    
    // Training hours percentage (assume 100 hours monthly max goal)
    const trainingHoursPct = Math.min((totalHours / 50) * 100, 100);
    
    // Trainings percentage (assume 30 sessions monthly goal)
    const trainingsPct = Math.min((totalSessions / 30) * 100, 100);
    
    setCalculatedStats({
      trainingHours: Math.round(totalHours * 10) / 10,
      trainingHoursPct: Math.round(trainingHoursPct * 10) / 10,
      weightLoss: Math.round(weightLoss * 10) / 10,
      weightLossPct: Math.round(weightLossPct * 10) / 10,
      currentWeight: Math.round(currentWeight * 10) / 10,
      weightPct: Math.round(weightPct * 10) / 10,
      totalTrainings: totalSessions,
      trainingsPct: Math.round(trainingsPct * 10) / 10,
    });
  }, [stats, workoutLogs, joggingLogs, weightLogs, startWeight, history]);

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

      // Use signed URL for private bucket storage
      const { data: signedData, error: signedError } = await supabase.storage
        .from("avatars")
        .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year expiry

      if (signedError) throw signedError;

      // Store the file path reference, not the signed URL (URLs expire)
      const { error: dbError } = await supabase.from("body_analysis").insert([{
        user_id: session.user.id,
        image_url: `storage:${fileName}`,
        body_fat_pct: null,
        muscle_mass_pct: null,
        fitness_level: null,
        health_notes: JSON.stringify({
          upload_name: uploadName,
          upload_category: uploadCategory,
        }),
      }]);

      if (dbError) throw dbError;

      setUploadedFile(null);
      setUploadedFileRaw(null);
      setUploadName("");
      setUploadCategory("progress");
      setUploadDialogOpen(false);
      refetch();
      toast({ title: isGerman ? "Bild gespeichert" : "Image saved" });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: isGerman ? "Fehler beim Hochladen" : "Upload failed", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const saveManualValues = async () => {
    if (!athleteForm.weight && !athleteForm.target_weight && !athleteForm.training_time) {
      toast({ title: isGerman ? "Bitte Werte eingeben" : "Please enter values", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const weight = parseFloat(athleteForm.weight) || 0;
      const targetWeight = parseFloat(athleteForm.target_weight) || 0;
      const trainingTime = parseFloat(athleteForm.training_time) || 0;
      const trainingFreq = parseFloat(athleteForm.training_frequency) || 0;

      // Live calculate stats from manual values
      const weightLoss = weight && targetWeight ? weight - targetWeight : 0;
      const weightPct = weight && startWeight ? ((startWeight - weight) / startWeight) * 100 : 0;
      const totalTrainings = trainingFreq * 4; // Monthly

      setCalculatedStats({
        trainingHours: trainingTime,
        trainingHoursPct: Math.min((trainingTime / 100) * 100, 100),
        weightLoss: Math.max(0, weightLoss),
        weightLossPct: Math.abs(weightPct),
        currentWeight: weight,
        weightPct: weightPct,
        totalTrainings: totalTrainings,
        trainingsPct: Math.min((totalTrainings / 100) * 100, 100),
      });

      // Save manual values to body_analysis
      const { error } = await supabase.from("body_analysis").insert([{
        user_id: session.user.id,
        image_url: null,
        body_fat_pct: null,
        muscle_mass_pct: null,
        fitness_level: null,
        health_notes: JSON.stringify({
          weight: athleteForm.weight,
          weight_unit: athleteForm.weight_unit,
          target_weight: athleteForm.target_weight,
          target_weight_unit: athleteForm.target_weight_unit,
          age: athleteForm.age,
          height: athleteForm.height,
          height_unit: athleteForm.height_unit,
          training_time: athleteForm.training_time,
          training_frequency: athleteForm.training_frequency,
          goal: athleteForm.goal,
          body_type: athleteForm.body_type,
        }),
      }]);

      if (error) throw error;

      refetch();
      toast({ title: isGerman ? "Werte gespeichert" : "Values saved" });
      
      // Reset form
      setAthleteForm({
        body_type: "", weight: "", weight_unit: "kg", target_weight: "", target_weight_unit: "kg",
        age: "", height: "", height_unit: "cm", training_time: "", training_frequency: "", goal: ""
      });
    } catch (error) {
      console.error("Save error:", error);
      toast({ title: isGerman ? "Fehler" : "Error", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase.from("body_analysis").delete().eq("id", id);
    if (!error) {
      refetch();
      toast({ title: isGerman ? "Gelöscht" : "Deleted" });
    }
  };

  const parseHealthNotes = (notes: string | null) => {
    if (!notes) return null;
    try {
      return JSON.parse(notes);
    } catch {
      return null;
    }
  };

  return (
    <div className="min-h-screen pb-24 relative">
      <div className="fixed inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${proAthleteBg})` }} />
      <div className="fixed inset-0 bg-black/70" />

      <div className="relative z-10 max-w-screen-xl mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/pro-premium")} className="text-white"><ArrowLeft className="w-6 h-6" /></Button>
          <h1 className="text-lg font-semibold text-white">Pro Athlete</h1>
          <Button variant="ghost" size="icon" className="text-white" onClick={() => setInfoDialogOpen(true)}><Info className="w-6 h-6" /></Button>
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

        {/* Live Stats - Trainingzeit, Weight Loss, Gewicht, Trainings */}
        <Card className="bg-black/40 backdrop-blur-md border-white/10 rounded-2xl p-4 mb-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 p-3 rounded-lg">
              <div className="text-xs text-zinc-400">{isGerman ? "Trainingzeit" : "Training Time"}</div>
              <div className="text-white font-bold text-lg">{calculatedStats.trainingHours}h</div>
              <div className="text-primary text-xs">{calculatedStats.trainingHoursPct.toFixed(1)}%</div>
            </div>
            <div className="bg-white/5 p-3 rounded-lg">
              <div className="text-xs text-zinc-400">Weight Loss</div>
              <div className="text-white font-bold text-lg">{calculatedStats.weightLoss.toFixed(1)} kg</div>
              <div className={`text-xs ${calculatedStats.weightLoss > 0 ? 'text-green-400' : 'text-orange-400'}`}>
                {calculatedStats.weightLossPct.toFixed(1)}%
              </div>
            </div>
            <div className="bg-white/5 p-3 rounded-lg">
              <div className="text-xs text-zinc-400">{isGerman ? "Gewicht" : "Weight"}</div>
              <div className="text-white font-bold text-lg">{calculatedStats.currentWeight} kg</div>
              <div className={`text-xs ${calculatedStats.weightPct >= 0 ? 'text-green-400' : 'text-orange-400'}`}>
                {calculatedStats.weightPct.toFixed(1)}%
              </div>
            </div>
            <div className="bg-white/5 p-3 rounded-lg">
              <div className="text-xs text-zinc-400">Trainings</div>
              <div className="text-white font-bold text-lg">{calculatedStats.totalTrainings}</div>
              <div className="text-blue-400 text-xs">{calculatedStats.trainingsPct.toFixed(1)}%</div>
            </div>
          </div>
        </Card>

        {/* Manual Input - Changed "Aktivitätslevel" to "Trainingzeit" */}
        <Card className="bg-black/40 backdrop-blur-md border-white/10 rounded-2xl p-4 mb-4">
          <h3 className="text-white font-semibold text-sm mb-3">{isGerman ? "1. Manuelle Werte eingeben" : "1. Enter Manual Values"}</h3>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="flex gap-1">
              <Input type="number" placeholder={isGerman ? "Gewicht" : "Weight"} value={athleteForm.weight} onChange={(e) => setAthleteForm({...athleteForm, weight: e.target.value})} className="bg-zinc-800/50 border-zinc-700 text-white text-sm h-9 flex-1" />
              <Select value={athleteForm.weight_unit} onValueChange={(v) => setAthleteForm({...athleteForm, weight_unit: v})}>
                <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white text-xs h-9 w-16"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-800"><SelectItem value="kg">kg</SelectItem><SelectItem value="lbs">lbs</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex gap-1">
              <Input type="number" placeholder={isGerman ? "Zielgewicht" : "Target"} value={athleteForm.target_weight} onChange={(e) => setAthleteForm({...athleteForm, target_weight: e.target.value})} className="bg-zinc-800/50 border-zinc-700 text-white text-sm h-9 flex-1" />
              <Select value={athleteForm.target_weight_unit} onValueChange={(v) => setAthleteForm({...athleteForm, target_weight_unit: v})}>
                <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white text-xs h-9 w-16"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-800"><SelectItem value="kg">kg</SelectItem><SelectItem value="lbs">lbs</SelectItem></SelectContent>
              </Select>
            </div>
            <Input type="number" placeholder={isGerman ? "Alter" : "Age"} value={athleteForm.age} onChange={(e) => setAthleteForm({...athleteForm, age: e.target.value})} className="bg-zinc-800/50 border-zinc-700 text-white text-sm h-9" />
            <div className="flex gap-1">
              <Input type="number" placeholder={isGerman ? "Größe" : "Height"} value={athleteForm.height} onChange={(e) => setAthleteForm({...athleteForm, height: e.target.value})} className="bg-zinc-800/50 border-zinc-700 text-white text-sm h-9 flex-1" />
              <Select value={athleteForm.height_unit} onValueChange={(v) => setAthleteForm({...athleteForm, height_unit: v})}>
                <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white text-xs h-9 w-16"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-800"><SelectItem value="cm">cm</SelectItem><SelectItem value="ft">ft</SelectItem></SelectContent>
              </Select>
            </div>
            {/* Changed from Aktivitätslevel to Trainingzeit (hours) */}
            <Input type="number" placeholder={isGerman ? "Trainingzeit (Std)" : "Training Time (hrs)"} value={athleteForm.training_time} onChange={(e) => setAthleteForm({...athleteForm, training_time: e.target.value})} className="bg-zinc-800/50 border-zinc-700 text-white text-sm h-9" />
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
                <SelectItem value="Maintain">{isGerman ? "Halten" : "Maintain"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={saveManualValues} disabled={isSaving} className="w-full">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {isGerman ? "Speichern" : "Save Only"}
          </Button>
        </Card>

        {/* Image Upload */}
        <Card className="bg-black/40 backdrop-blur-md border-white/10 rounded-2xl p-4 mb-4">
          <h3 className="text-white font-semibold text-sm mb-3">{isGerman ? "2. Bild hochladen" : "2. Upload Image"}</h3>
          <div
            className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${isDragging ? 'border-primary bg-primary/10' : 'border-zinc-600'}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            {uploadedFile ? (
              <div className="relative">
                <img src={uploadedFile} alt="Preview" className="w-24 h-24 mx-auto rounded-lg object-cover" />
                <Button variant="ghost" size="icon" className="absolute top-0 right-0" onClick={() => { setUploadedFile(null); setUploadedFileRaw(null); }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <label className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto text-zinc-500 mb-2" />
                <p className="text-xs text-zinc-400">{isGerman ? "Bild hierher ziehen" : "Drag image here"}</p>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </label>
            )}
          </div>
          <Button onClick={handleUploadClick} disabled={!uploadedFileRaw || isUploading} className="w-full mt-3">
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
            Upload
          </Button>
        </Card>

        {/* History - Inline display, no popup on click */}
        <Card className="bg-black/40 backdrop-blur-md border-white/10 rounded-2xl p-4">
          <h3 className="text-white font-semibold text-sm mb-3">{isGerman ? "Verlauf" : "History"}</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {history.map((entry) => {
              const notes = parseHealthNotes(entry.health_notes);
              const isUpload = entry.image_url && notes?.upload_name;
              const isManual = notes?.weight || notes?.training_time;
              
              return (
                <div key={entry.id} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                  {entry.image_url && (
                    <img src={entry.image_url} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    {isUpload && (
                      <div className="text-sm text-white truncate">{notes.upload_name}</div>
                    )}
                    {isManual && (
                      <div className="text-sm text-white">
                        {notes.weight && <span>{notes.weight}{notes.weight_unit || 'kg'}</span>}
                        {notes.training_time && <span className="ml-2">{notes.training_time}h</span>}
                        {notes.training_frequency && <span className="ml-2">{notes.training_frequency}x/{isGerman ? "Woche" : "week"}</span>}
                      </div>
                    )}
                    <div className="text-xs text-zinc-400">
                      {new Date(entry.created_at).toLocaleDateString(isGerman ? 'de-DE' : 'en-US')}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteEntry(entry.id)} className="text-destructive flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
            {history.length === 0 && (
              <div className="text-center text-zinc-500 py-4 text-sm">
                {isGerman ? "Keine Einträge" : "No entries"}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{isGerman ? "Bild speichern" : "Save Image"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Name" value={uploadName} onChange={(e) => setUploadName(e.target.value)} />
            <Select value={uploadCategory} onValueChange={setUploadCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {bodyCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={uploadImage} disabled={isUploading} className="w-full">
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {isGerman ? "Speichern" : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Info Dialog - Algorithmus Erklärung */}
      <Dialog open={infoDialogOpen} onOpenChange={setInfoDialogOpen}>
        <DialogContent className="sm:max-w-md bg-black/95 backdrop-blur-lg border-white/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Info className="w-5 h-5 text-primary" />
              {isGerman ? "Pro Athlete Algorithmus" : "Pro Athlete Algorithm"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-white/90 leading-relaxed">
              {isGerman 
                ? "Der Pro Athlete Algorithmus analysiert automatisch deine Trainings- und Körperdaten:"
                : "The Pro Athlete algorithm automatically analyzes your training and body data:"}
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-orange-400">
                <Activity className="w-5 h-5" />
                <span>{isGerman ? "Trainingsstunden & Intensität werden berechnet" : "Training hours & intensity are calculated"}</span>
              </li>
              <li className="flex items-center gap-3 text-green-400">
                <TrendingUp className="w-5 h-5" />
                <span>{isGerman ? "Gewichtsverlust-Fortschritt in Prozent" : "Weight loss progress in percentage"}</span>
              </li>
              <li className="flex items-center gap-3 text-blue-400">
                <Target className="w-5 h-5" />
                <span>{isGerman ? "Zielgewicht-Tracking & Prognosen" : "Target weight tracking & projections"}</span>
              </li>
              <li className="flex items-center gap-3 text-purple-400">
                <BarChart3 className="w-5 h-5" />
                <span>{isGerman ? "Performance-Statistiken im Kalender" : "Performance statistics in calendar"}</span>
              </li>
            </ul>
            <div className="pt-4 border-t border-white/10">
              <p className="text-xs text-white/60">
                {isGerman 
                  ? "Alle Werte werden live aus deinen Workout-Logs, Gewichts-Tracking und manuellen Eingaben berechnet."
                  : "All values are calculated live from your workout logs, weight tracking and manual entries."}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default ProAthlete;