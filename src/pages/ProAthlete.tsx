import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Upload, X, Loader2, HelpCircle, Save, BarChart3, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";
import { compressImage, isValidImageFile, base64ToBlob } from "@/lib/imageUtils";
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
  const [isGerman, setIsGerman] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [uploadedFileRaw, setUploadedFileRaw] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [history, setHistory] = useState<BodyAnalysisEntry[]>([]);
  
  // Calculated percentages from history
  const [calculatedStats, setCalculatedStats] = useState({
    totalWorkoutHours: 0,
    totalWorkoutHoursPct: 0,
    totalDistance: 0,
    totalDistancePct: 0,
    avgWeight: 0,
    weightChangePct: 0,
    totalTrainingSessions: 0,
    trainingSessionsPct: 0,
  });

  const [athleteForm, setAthleteForm] = useState({
    body_type: "", weight: "", weight_unit: "kg", target_weight: "", target_weight_unit: "kg",
    age: "", height: "", height_unit: "cm", activity_level: "", training_frequency: "", goal: ""
  });

  // Upload dialog state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploadCategory, setUploadCategory] = useState("progress");
  
  // History detail dialog
  const [historyDetailOpen, setHistoryDetailOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<BodyAnalysisEntry | null>(null);

  const bodyCategories = ["progress", "front", "back", "side", "flexing"];

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
      .from("body_analysis")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(30);

    if (data) {
      setHistory(data);
    }
  };

  const loadCalculatedStats = async (uid: string) => {
    // Load workout_logs for training hours calculation
    const { data: workoutLogs } = await supabase
      .from("workout_logs")
      .select("*")
      .eq("user_id", uid);

    // Load jogging_logs for distance calculation
    const { data: joggingLogs } = await supabase
      .from("jogging_logs")
      .select("*")
      .eq("user_id", uid);

    // Load weight_logs for weight tracking
    const { data: weightLogs } = await supabase
      .from("weight_logs")
      .select("*")
      .eq("user_id", uid)
      .order("measured_at", { ascending: false });

    const totalSessions = workoutLogs?.length || 0;
    const totalDistanceKm = joggingLogs?.reduce((sum, log) => sum + (Number(log.distance) || 0), 0) || 0;
    const latestWeight = weightLogs?.[0]?.weight || 0;
    const firstWeight = weightLogs?.[weightLogs.length - 1]?.weight || latestWeight;
    const weightChange = latestWeight && firstWeight ? ((latestWeight - firstWeight) / firstWeight * 100) : 0;

    // Calculate total workout hours (assuming each session is about 1 hour)
    const totalHours = totalSessions;

    setCalculatedStats({
      totalWorkoutHours: totalHours,
      totalWorkoutHoursPct: Math.min((totalHours / 100) * 100, 100),
      totalDistance: totalDistanceKm,
      totalDistancePct: Math.min((totalDistanceKm / 500) * 100, 100),
      avgWeight: latestWeight,
      weightChangePct: Math.abs(weightChange),
      totalTrainingSessions: totalSessions,
      trainingSessionsPct: Math.min((totalSessions / 100) * 100, 100),
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

      // Save with name and category
      const { error: dbError } = await supabase.from("body_analysis").insert([{
        user_id: session.user.id,
        image_url: urlData.publicUrl,
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
    if (!athleteForm.weight && !athleteForm.target_weight) {
      toast({ title: isGerman ? "Bitte Werte eingeben" : "Please enter values", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Save manual values to body_analysis with calculated percentages
      const { error } = await supabase.from("body_analysis").insert([{
        user_id: session.user.id,
        image_url: null,
        body_fat_pct: calculatedStats.totalWorkoutHoursPct,
        muscle_mass_pct: calculatedStats.trainingSessionsPct,
        fitness_level: Math.round(calculatedStats.totalDistancePct / 10),
        health_notes: JSON.stringify({
          weight: athleteForm.weight,
          weight_unit: athleteForm.weight_unit,
          target_weight: athleteForm.target_weight,
          target_weight_unit: athleteForm.target_weight_unit,
          age: athleteForm.age,
          height: athleteForm.height,
          height_unit: athleteForm.height_unit,
          activity_level: athleteForm.activity_level,
          training_frequency: athleteForm.training_frequency,
          goal: athleteForm.goal,
          calculated_stats: calculatedStats,
        }),
      }]);

      if (error) throw error;

      loadHistory(session.user.id);
      toast({ title: isGerman ? "Werte gespeichert" : "Values saved" });
      
      // Reset form
      setAthleteForm({
        body_type: "", weight: "", weight_unit: "kg", target_weight: "", target_weight_unit: "kg",
        age: "", height: "", height_unit: "cm", activity_level: "", training_frequency: "", goal: ""
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
      loadHistory(userId);
      toast({ title: isGerman ? "Gelöscht" : "Deleted" });
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

        {/* Calculated Stats from History */}
        <Card className="bg-black/40 backdrop-blur-md border-white/10 rounded-2xl p-4 mb-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 p-3 rounded-lg">
              <div className="text-xs text-zinc-400">{isGerman ? "Training Std." : "Workout Hrs"}</div>
              <div className="text-white font-bold text-lg">{calculatedStats.totalWorkoutHours}h</div>
              <div className="text-primary text-xs">{calculatedStats.totalWorkoutHoursPct.toFixed(1)}%</div>
            </div>
            <div className="bg-white/5 p-3 rounded-lg">
              <div className="text-xs text-zinc-400">{isGerman ? "Distanz" : "Distance"}</div>
              <div className="text-white font-bold text-lg">{calculatedStats.totalDistance.toFixed(1)} km</div>
              <div className="text-green-400 text-xs">{calculatedStats.totalDistancePct.toFixed(1)}%</div>
            </div>
            <div className="bg-white/5 p-3 rounded-lg">
              <div className="text-xs text-zinc-400">{isGerman ? "Gewicht" : "Weight"}</div>
              <div className="text-white font-bold text-lg">{calculatedStats.avgWeight} kg</div>
              <div className={`text-xs ${calculatedStats.weightChangePct >= 0 ? 'text-orange-400' : 'text-green-400'}`}>
                {calculatedStats.weightChangePct.toFixed(1)}%
              </div>
            </div>
            <div className="bg-white/5 p-3 rounded-lg">
              <div className="text-xs text-zinc-400">{isGerman ? "Trainings" : "Sessions"}</div>
              <div className="text-white font-bold text-lg">{calculatedStats.totalTrainingSessions}</div>
              <div className="text-blue-400 text-xs">{calculatedStats.trainingSessionsPct.toFixed(1)}%</div>
            </div>
          </div>
        </Card>

        {/* Manual Input */}
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
                <img src={uploadedFile} alt="Uploaded" className="max-h-16 mx-auto rounded-lg" />
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
          <Button onClick={saveManualValues} disabled={isSaving} className="flex-1 bg-zinc-800/80 hover:bg-zinc-700 text-white border-0 rounded-full py-5">
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {isGerman ? "Nur speichern" : "Save only"}
          </Button>
          <Button onClick={async () => {
            const { data: entries } = await supabase.from("body_analysis").select("id").eq("user_id", userId);
            if (entries) {
              for (const entry of entries) {
                await supabase.from("body_analysis").delete().eq("id", entry.id);
              }
            }
            setCalculatedStats({ totalWorkoutHours: 0, totalWorkoutHoursPct: 0, totalDistance: 0, totalDistancePct: 0, avgWeight: 0, weightChangePct: 0, totalTrainingSessions: 0, trainingSessionsPct: 0 });
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

        {/* History */}
        <div className="space-y-2">
          <h3 className="text-white font-semibold mb-2">{isGerman ? "Verlauf" : "History"}</h3>
          {history.slice(0, 10).map((entry) => {
            const healthNotes = entry.health_notes ? (typeof entry.health_notes === 'string' ? JSON.parse(entry.health_notes) : entry.health_notes) : null;
            return (
              <Card 
                key={entry.id} 
                className="bg-black/40 backdrop-blur-md border-white/10 p-3 cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => { setSelectedEntry(entry); setHistoryDetailOpen(true); }}
              >
                <div className="flex justify-between items-center gap-3">
                  {entry.image_url && (
                    <img src={entry.image_url} alt="Body" className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm truncate">
                      {healthNotes?.upload_name || healthNotes?.weight ? `${healthNotes.upload_name || healthNotes.weight} ${healthNotes.weight_unit || ''}` : 'Body Analysis'}
                    </div>
                    <div className="text-xs text-zinc-400">
                      {healthNotes?.upload_category || (entry.body_fat_pct ? `${entry.body_fat_pct}%` : '')}
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
                <SelectContent className="bg-zinc-800 z-50">
                  <SelectItem value="progress">{isGerman ? "Fortschritt" : "Progress"}</SelectItem>
                  <SelectItem value="fullbody">Fullbody</SelectItem>
                  <SelectItem value="legs">{isGerman ? "Beine" : "Legs"}</SelectItem>
                  <SelectItem value="stomach">{isGerman ? "Bauch" : "Stomach"}</SelectItem>
                  <SelectItem value="muscle">{isGerman ? "Muskeln" : "Muscle"}</SelectItem>
                  <SelectItem value="shoulders">{isGerman ? "Schultern" : "Shoulders"}</SelectItem>
                  <SelectItem value="back">{isGerman ? "Rücken" : "Back"}</SelectItem>
                  <SelectItem value="front">{isGerman ? "Vorne" : "Front"}</SelectItem>
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
            <DialogTitle className="text-white">Pro Athlete Body Upload</DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              {selectedEntry.image_url && (
                <img src={selectedEntry.image_url} alt="Body" className="w-48 h-48 object-cover rounded-lg mx-auto" />
              )}
              {(() => {
                const notes = selectedEntry.health_notes ? (typeof selectedEntry.health_notes === 'string' ? JSON.parse(selectedEntry.health_notes) : selectedEntry.health_notes) : null;
                return (
                  <div className="space-y-2 text-center">
                    <div className="text-white font-semibold text-lg">{notes?.upload_name || 'Body Analysis'}</div>
                    <div className="text-zinc-400">{notes?.upload_category || '-'}</div>
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

export default ProAthlete;