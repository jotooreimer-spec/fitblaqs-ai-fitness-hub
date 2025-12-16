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
import { useLiveData } from "@/contexts/LiveDataContext";
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
  const { bodyAnalysis, workoutLogs, joggingLogs, stats, setUserId, refetch } = useLiveData();
  const [isGerman, setIsGerman] = useState(true);
  const [userId, setLocalUserId] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [uploadedFileRaw, setUploadedFileRaw] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Calculated percentages from live data
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

  // Use live body analysis data as history
  const history = bodyAnalysis as BodyAnalysisEntry[];

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { navigate("/login"); return; }
      const metadata = session.user.user_metadata;
      setIsGerman(metadata.language === "de");
      setLocalUserId(session.user.id);
      setUserId(session.user.id);
    });
  }, [navigate, setUserId]);

  // Calculate stats from live data
  useEffect(() => {
    const workoutHours = stats.monthlyWorkoutHours;
    const totalSessions = workoutLogs.length + joggingLogs.length;
    
    setCalculatedStats({
      totalWorkoutHours: Math.round(workoutHours * 10) / 10,
      totalWorkoutHoursPct: Math.min((workoutHours / 100) * 100, 100),
      totalDistance: stats.totalDistance,
      totalDistancePct: Math.min((stats.totalDistance / 100) * 100, 100),
      avgWeight: stats.currentWeight,
      weightChangePct: 0,
      totalTrainingSessions: totalSessions,
      trainingSessionsPct: Math.min((totalSessions / 100) * 100, 100),
    });
  }, [stats, workoutLogs, joggingLogs]);

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
    if (!athleteForm.weight && !athleteForm.target_weight) {
      toast({ title: isGerman ? "Bitte Werte eingeben" : "Please enter values", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const weight = parseFloat(athleteForm.weight) || 0;
      const targetWeight = parseFloat(athleteForm.target_weight) || 0;
      const trainingFreq = parseFloat(athleteForm.training_frequency) || 0;

      // Calculate stats from manual values ONLY
      const workoutHours = trainingFreq * 4; // Assuming 4 weeks in month
      const weightChange = weight && targetWeight ? Math.abs(((weight - targetWeight) / weight) * 100) : 0;

      setCalculatedStats({
        totalWorkoutHours: workoutHours,
        totalWorkoutHoursPct: Math.min((workoutHours / 100) * 100, 100),
        totalDistance: 0,
        totalDistancePct: 0,
        avgWeight: weight,
        weightChangePct: weightChange,
        totalTrainingSessions: trainingFreq * 4,
        trainingSessionsPct: Math.min((trainingFreq * 4 / 100) * 100, 100),
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
          activity_level: athleteForm.activity_level,
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
      refetch();
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
            refetch();
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
        <Card className="bg-black/40 backdrop-blur-md border-white/10 rounded-2xl p-4">
          <h3 className="text-white font-semibold text-sm mb-3">{isGerman ? "Verlauf" : "History"}</h3>
          {history.slice(0, 10).map((entry) => {
            const healthNotes = entry.health_notes ? (typeof entry.health_notes === 'string' ? JSON.parse(entry.health_notes) : entry.health_notes) : null;
            const isUpload = entry.image_url && healthNotes?.upload_name;
            const isManualSave = healthNotes?.weight || healthNotes?.target_weight;
            
            return (
              <Card 
                key={entry.id} 
                className="bg-white/5 border-white/10 p-3 mb-2 cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => { setSelectedEntry(entry); setHistoryDetailOpen(true); }}
              >
                <div className="flex items-center gap-3">
                  {entry.image_url && (
                    <img src={entry.image_url} alt="Body" className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                  )}
                  {!entry.image_url && isManualSave && (
                    <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Save className="w-6 h-6 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {isUpload ? (
                      <>
                        <div className="text-white text-sm font-medium truncate">{healthNotes?.upload_name}</div>
                        <div className="text-xs text-primary capitalize">{healthNotes?.upload_category}</div>
                      </>
                    ) : isManualSave ? (
                      <>
                        <div className="text-white text-sm font-medium">
                          {healthNotes?.weight && `${healthNotes.weight} ${healthNotes.weight_unit || 'kg'}`}
                          {healthNotes?.target_weight && ` → ${healthNotes.target_weight} ${healthNotes.target_weight_unit || 'kg'}`}
                        </div>
                        <div className="text-xs text-green-400">
                          {healthNotes?.activity_level && `${healthNotes.activity_level}`}
                          {healthNotes?.training_frequency && ` | ${healthNotes.training_frequency}x/Woche`}
                          {healthNotes?.goal && ` | ${healthNotes.goal}`}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-white text-sm">{entry.body_fat_pct ? `${entry.body_fat_pct}%` : 'Entry'}</div>
                        <div className="text-xs text-zinc-400">-</div>
                      </>
                    )}
                    <div className="text-xs text-zinc-500 mt-1">{new Date(entry.created_at).toLocaleDateString()}</div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deleteEntry(entry.id); }} className="text-destructive hover:text-destructive h-8 w-8 flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
          {history.length === 0 && (
            <p className="text-zinc-400 text-center text-sm py-4">{isGerman ? "Noch keine Einträge" : "No entries yet"}</p>
          )}
        </Card>
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

      {/* History Detail Dialog - Shows both Uploads and Manual Values */}
      <Dialog open={historyDetailOpen} onOpenChange={setHistoryDetailOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-700">
          <DialogHeader>
            <DialogTitle className="text-white">Pro Athlete</DialogTitle>
          </DialogHeader>
          {selectedEntry && (() => {
            const notes = selectedEntry.health_notes ? (typeof selectedEntry.health_notes === 'string' ? JSON.parse(selectedEntry.health_notes) : selectedEntry.health_notes) : null;
            const isUpload = selectedEntry.image_url && notes?.upload_name;
            const isManualSave = notes?.weight || notes?.target_weight;
            
            return (
              <div className="space-y-4">
                {selectedEntry.image_url && (
                  <img src={selectedEntry.image_url} alt="Body" className="w-48 h-48 object-cover rounded-lg mx-auto" />
                )}
                
                {isUpload && (
                  <div className="space-y-2 text-center">
                    <div className="text-white font-semibold text-lg">{notes?.upload_name}</div>
                    <div className="text-primary capitalize">{notes?.upload_category}</div>
                  </div>
                )}
                
                {isManualSave && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {notes?.weight && (
                        <div className="bg-white/5 p-3 rounded-lg">
                          <div className="text-xs text-zinc-400">{isGerman ? "Gewicht" : "Weight"}</div>
                          <div className="text-white font-bold">{notes.weight} {notes.weight_unit || 'kg'}</div>
                        </div>
                      )}
                      {notes?.target_weight && (
                        <div className="bg-white/5 p-3 rounded-lg">
                          <div className="text-xs text-zinc-400">{isGerman ? "Ziel" : "Target"}</div>
                          <div className="text-green-400 font-bold">{notes.target_weight} {notes.target_weight_unit || 'kg'}</div>
                        </div>
                      )}
                      {notes?.height && (
                        <div className="bg-white/5 p-3 rounded-lg">
                          <div className="text-xs text-zinc-400">{isGerman ? "Größe" : "Height"}</div>
                          <div className="text-white font-bold">{notes.height} {notes.height_unit || 'cm'}</div>
                        </div>
                      )}
                      {notes?.age && (
                        <div className="bg-white/5 p-3 rounded-lg">
                          <div className="text-xs text-zinc-400">{isGerman ? "Alter" : "Age"}</div>
                          <div className="text-white font-bold">{notes.age}</div>
                        </div>
                      )}
                    </div>
                    {notes?.activity_level && (
                      <div className="bg-white/5 p-3 rounded-lg">
                        <div className="text-xs text-zinc-400">{isGerman ? "Aktivitätslevel" : "Activity Level"}</div>
                        <div className="text-white">{notes.activity_level}</div>
                      </div>
                    )}
                    {notes?.training_frequency && (
                      <div className="bg-white/5 p-3 rounded-lg">
                        <div className="text-xs text-zinc-400">{isGerman ? "Training/Woche" : "Training/Week"}</div>
                        <div className="text-white">{notes.training_frequency}x</div>
                      </div>
                    )}
                    {notes?.goal && (
                      <div className="bg-white/5 p-3 rounded-lg">
                        <div className="text-xs text-zinc-400">{isGerman ? "Ziel" : "Goal"}</div>
                        <div className="text-primary">{notes.goal}</div>
                      </div>
                    )}
                    {notes?.calculated_stats && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="bg-primary/10 p-2 rounded-lg text-center">
                          <div className="text-xs text-zinc-400">{isGerman ? "Training Std." : "Workout Hrs"}</div>
                          <div className="text-primary font-bold">{notes.calculated_stats.totalWorkoutHours}h</div>
                        </div>
                        <div className="bg-green-500/10 p-2 rounded-lg text-center">
                          <div className="text-xs text-zinc-400">{isGerman ? "Distanz" : "Distance"}</div>
                          <div className="text-green-400 font-bold">{notes.calculated_stats.totalDistance?.toFixed(1)} km</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="text-xs text-zinc-500 text-center">{new Date(selectedEntry.created_at).toLocaleDateString()}</div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default ProAthlete;