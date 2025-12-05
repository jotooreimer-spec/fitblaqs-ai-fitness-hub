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
import { ArrowLeft, Dumbbell, Upload, X, Loader2, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";
import proSubscriptionBg from "@/assets/pro-subscription-bg.png";

// Instagram SVG Icon
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

// TikTok SVG Icon
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const ProAthlete = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGerman, setIsGerman] = useState(true);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [proAthleteDialogOpen, setProAthleteDialogOpen] = useState(false);
  const [socialMediaDialogOpen, setSocialMediaDialogOpen] = useState(false);
  const [trainingPlan, setTrainingPlan] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [athleteForm, setAthleteForm] = useState({
    body_type: "",
    weight: "",
    weight_unit: "kg",
    target_weight: "",
    target_weight_unit: "kg",
    age: "",
    height: "",
    height_unit: "cm",
    health_status: false,
    health_notes: "",
    activity_level: "",
    training_frequency: "",
    goal: ""
  });

  const [socialForm, setSocialForm] = useState({
    platform: "all",
    audio_quality: "high",
    video_quality: "1080p",
    title: "",
    description: "",
    hashtags: "",
    post_date: ""
  });

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedFile(url);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith('image/') || file.type.startsWith('video/'))) {
      const url = URL.createObjectURL(file);
      setUploadedFile(url);
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

  const generateTrainingPlan = async () => {
    setIsGenerating(true);
    
    try {
      const bodyTypeMap: Record<string, string> = {
        fat: "Fett",
        muscular: "Muskulös", 
        slim: "Schlank",
        defined: "Definiert"
      };
      
      const goalMap: Record<string, string> = {
        fat_loss: "Fettabbau",
        muscle: "Muskelaufbau",
        maintain: "Erhalt",
        conditioning: "Kondition",
        special: "Spezialziel"
      };
      
      const activityMap: Record<string, string> = {
        inactive: "Inaktiv",
        active: "Aktiv",
        very_active: "Sehr aktiv"
      };

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-training-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          bodyType: bodyTypeMap[athleteForm.body_type] || athleteForm.body_type,
          weight: `${athleteForm.weight} ${athleteForm.weight_unit}`,
          targetWeight: `${athleteForm.target_weight} ${athleteForm.target_weight_unit}`,
          age: athleteForm.age,
          height: `${athleteForm.height} ${athleteForm.height_unit}`,
          healthStatus: athleteForm.health_status ? athleteForm.health_notes : null,
          activityLevel: activityMap[athleteForm.activity_level] || athleteForm.activity_level,
          trainingFrequency: athleteForm.training_frequency,
          goal: goalMap[athleteForm.goal] || athleteForm.goal
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Fehler bei der Generierung");
      }

      const data = await response.json();
      
      const aiPlan = data.trainingPlan;
      const plan = {
        duration: aiPlan.duration || "8 Wochen",
        goal_kcal: aiPlan.nutrition?.dailyCalories || 2000,
        regeneration: aiPlan.recovery?.sleepHours || "7-8 Stunden",
        workout_week: `${athleteForm.training_frequency || 4}x`,
        category: goalMap[athleteForm.goal] || "Muskelaufbau",
        weeklyPlan: aiPlan.weeklyPlan || [],
        nutrition: aiPlan.nutrition || {},
        recovery: aiPlan.recovery || {},
        progression: aiPlan.progression || "2.5-5% wöchentliche Steigerung",
        rawContent: aiPlan.rawContent
      };
      
      setTrainingPlan(plan);
      setProAthleteDialogOpen(false);
      
      toast({
        title: isGerman ? "Trainingsplan erstellt" : "Training plan created",
        description: isGerman ? "Dein KI-Trainingsplan wurde generiert" : "Your AI training plan has been generated"
      });
    } catch (error) {
      console.error("Error generating training plan:", error);
      toast({
        title: isGerman ? "Fehler" : "Error",
        description: error instanceof Error ? error.message : "Trainingsplan konnte nicht erstellt werden",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSocialMediaUpload = () => {
    toast({
      title: isGerman ? "Upload gestartet" : "Upload started",
      description: isGerman ? "Dein Inhalt wird hochgeladen..." : "Your content is being uploaded..."
    });
    setSocialMediaDialogOpen(false);
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
          <h1 className="text-lg font-semibold text-white">Pro Athlete</h1>
          <Button variant="ghost" size="icon" className="text-white">
            <HelpCircle className="w-6 h-6" />
          </Button>
        </div>

        {/* Upload/Scan Area - Smaller */}
        <Card className="bg-black/40 backdrop-blur-md border-white/10 rounded-2xl p-4 mb-4">
          <div 
            className={`border-2 border-dashed rounded-xl p-6 text-center min-h-[120px] flex items-center justify-center transition-colors ${
              isDragging ? 'border-primary bg-primary/10' : 'border-zinc-600'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {uploadedFile ? (
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
                  {isGerman ? "Bild/Video per Drag & Drop hochladen" : "Drag & drop image/video"}
                </p>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
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

        {/* Action Buttons */}
        <div className="flex gap-3 mb-4">
          <Button 
            onClick={() => setProAthleteDialogOpen(true)} 
            className="flex-1 bg-zinc-800/80 hover:bg-zinc-700 text-white border-0 rounded-full py-5"
          >
            <Dumbbell className="w-4 h-4 mr-2" />
            Pro-Athlete
          </Button>
          <Button 
            onClick={() => setSocialMediaDialogOpen(true)} 
            className="flex-1 bg-zinc-800/80 hover:bg-zinc-700 text-white border-0 rounded-full py-5"
          >
            Social Media Upl.
          </Button>
        </div>

        {/* Training Plan Display */}
        {trainingPlan ? (
          <Card className="bg-black/40 backdrop-blur-md border-white/10 rounded-2xl p-4">
            <h2 className="text-lg font-bold text-white mb-3">Trainingsplan</h2>
            
            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Goal</span>
                <span className="text-white font-medium">{trainingPlan.goal_kcal} kcal</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Regeneration</span>
                <span className="text-white font-medium">{trainingPlan.regeneration}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Workout Week</span>
                <span className="text-white font-medium">{trainingPlan.workout_week}</span>
              </div>
            </div>

            <Button className="w-full bg-zinc-800/80 hover:bg-zinc-700 text-white rounded-full py-5 mb-4">
              Trainingsplan
            </Button>

            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <div>
                <div className="text-lg font-bold text-white">{trainingPlan.goal_kcal}</div>
                <div className="text-xs text-zinc-400">kcal</div>
              </div>
              <div>
                <div className="text-sm font-medium text-white">Regeneration</div>
                <div className="text-xs text-zinc-400">{trainingPlan.regeneration}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-white">Workout</div>
                <div className="text-xs text-zinc-400">{trainingPlan.workout_week}</div>
              </div>
            </div>

            <div className="w-full bg-zinc-700 rounded-full h-2 mt-4">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: "40%" }}></div>
            </div>
          </Card>
        ) : (
          <Card className="bg-black/40 backdrop-blur-md border-white/10 rounded-2xl p-4">
            <h2 className="text-lg font-bold text-white mb-3">Trainingsplan</h2>
            <p className="text-zinc-400 text-center py-6 text-sm">
              {isGerman ? "Klicke auf 'Pro-Athlete' um deinen Plan zu erstellen" : "Click 'Pro-Athlete' to create your plan"}
            </p>
          </Card>
        )}

        {/* Pro Athlete Dialog */}
        <Dialog open={proAthleteDialogOpen} onOpenChange={setProAthleteDialogOpen}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-zinc-900 border-zinc-700">
            <DialogHeader>
              <DialogTitle className="text-white">{isGerman ? "Pro Athlete Profil" : "Pro Athlete Profile"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-zinc-300">{isGerman ? "Körpertyp" : "Body Type"}</Label>
                <Select value={athleteForm.body_type} onValueChange={(v) => setAthleteForm({ ...athleteForm, body_type: v })}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white"><SelectValue placeholder={isGerman ? "Wählen..." : "Select..."} /></SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-600">
                    <SelectItem value="fat">Fett</SelectItem>
                    <SelectItem value="muscular">Muskulös</SelectItem>
                    <SelectItem value="slim">Schlank</SelectItem>
                    <SelectItem value="defined">Definiert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-zinc-300">{isGerman ? "Gewicht" : "Weight"}</Label>
                  <Input type="number" value={athleteForm.weight} onChange={(e) => setAthleteForm({ ...athleteForm, weight: e.target.value })} className="bg-zinc-800 border-zinc-600 text-white" />
                </div>
                <div>
                  <Label className="text-zinc-300">{isGerman ? "Einheit" : "Unit"}</Label>
                  <Select value={athleteForm.weight_unit} onValueChange={(v) => setAthleteForm({ ...athleteForm, weight_unit: v })}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-600">
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="lbs">lbs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-zinc-300">{isGerman ? "Zielgewicht" : "Target Weight"}</Label>
                  <Input type="number" value={athleteForm.target_weight} onChange={(e) => setAthleteForm({ ...athleteForm, target_weight: e.target.value })} className="bg-zinc-800 border-zinc-600 text-white" />
                </div>
                <div>
                  <Label className="text-zinc-300">{isGerman ? "Einheit" : "Unit"}</Label>
                  <Select value={athleteForm.target_weight_unit} onValueChange={(v) => setAthleteForm({ ...athleteForm, target_weight_unit: v })}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-600">
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="lbs">lbs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-zinc-300">{isGerman ? "Alter" : "Age"}</Label>
                <Input type="number" value={athleteForm.age} onChange={(e) => setAthleteForm({ ...athleteForm, age: e.target.value })} className="bg-zinc-800 border-zinc-600 text-white" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-zinc-300">{isGerman ? "Körpergröße" : "Height"}</Label>
                  <Input type="number" value={athleteForm.height} onChange={(e) => setAthleteForm({ ...athleteForm, height: e.target.value })} className="bg-zinc-800 border-zinc-600 text-white" />
                </div>
                <div>
                  <Label className="text-zinc-300">{isGerman ? "Einheit" : "Unit"}</Label>
                  <Select value={athleteForm.height_unit} onValueChange={(v) => setAthleteForm({ ...athleteForm, height_unit: v })}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-600">
                      <SelectItem value="cm">cm</SelectItem>
                      <SelectItem value="ft">ft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  checked={athleteForm.health_status} 
                  onCheckedChange={(checked) => setAthleteForm({ ...athleteForm, health_status: !!checked })} 
                />
                <Label className="text-zinc-300">{isGerman ? "Gesundheitszustand beachten" : "Consider health status"}</Label>
              </div>

              {athleteForm.health_status && (
                <div>
                  <Label className="text-zinc-300">{isGerman ? "Gesundheitsnotizen" : "Health Notes"}</Label>
                  <Textarea 
                    value={athleteForm.health_notes} 
                    onChange={(e) => setAthleteForm({ ...athleteForm, health_notes: e.target.value })}
                    placeholder={isGerman ? "Beschreibe deinen Gesundheitszustand..." : "Describe your health status..."}
                    className="bg-zinc-800 border-zinc-600 text-white"
                  />
                </div>
              )}

              <div>
                <Label className="text-zinc-300">{isGerman ? "Aktivitätslevel" : "Activity Level"}</Label>
                <Select value={athleteForm.activity_level} onValueChange={(v) => setAthleteForm({ ...athleteForm, activity_level: v })}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white"><SelectValue placeholder={isGerman ? "Wählen..." : "Select..."} /></SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-600">
                    <SelectItem value="inactive">{isGerman ? "Inaktiv" : "Inactive"}</SelectItem>
                    <SelectItem value="active">{isGerman ? "Aktiv" : "Active"}</SelectItem>
                    <SelectItem value="very_active">{isGerman ? "Sehr aktiv" : "Very Active"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-zinc-300">{isGerman ? "Trainingshäufigkeit (pro Woche)" : "Training Frequency (per week)"}</Label>
                <Select value={athleteForm.training_frequency} onValueChange={(v) => setAthleteForm({ ...athleteForm, training_frequency: v })}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white"><SelectValue placeholder={isGerman ? "Wählen..." : "Select..."} /></SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-600">
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <SelectItem key={n} value={n.toString()}>{n}x</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-zinc-300">{isGerman ? "Ziel" : "Goal"}</Label>
                <Select value={athleteForm.goal} onValueChange={(v) => setAthleteForm({ ...athleteForm, goal: v })}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white"><SelectValue placeholder={isGerman ? "Wählen..." : "Select..."} /></SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-600">
                    <SelectItem value="fat_loss">{isGerman ? "Fettabbau" : "Fat Loss"}</SelectItem>
                    <SelectItem value="muscle">{isGerman ? "Muskelaufbau" : "Muscle Building"}</SelectItem>
                    <SelectItem value="maintain">{isGerman ? "Erhalt" : "Maintain"}</SelectItem>
                    <SelectItem value="conditioning">{isGerman ? "Kondition" : "Conditioning"}</SelectItem>
                    <SelectItem value="special">{isGerman ? "Spezialziel" : "Special Goal"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={generateTrainingPlan} className="w-full bg-primary hover:bg-primary/90" disabled={isGenerating}>
                {isGenerating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isGerman ? "Plan erstellen" : "Create Plan"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Social Media Dialog */}
        <Dialog open={socialMediaDialogOpen} onOpenChange={setSocialMediaDialogOpen}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-zinc-900 border-zinc-700">
            <DialogHeader>
              <DialogTitle className="text-white">Social Media Upload</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {uploadedFile && (
                <div className="rounded-lg overflow-hidden mb-4">
                  <img src={uploadedFile} alt="Preview" className="w-full max-h-32 object-cover" />
                </div>
              )}

              <div>
                <Label className="text-zinc-300">{isGerman ? "Plattform wählen" : "Select Platform"}</Label>
                <Select value={socialForm.platform} onValueChange={(v) => setSocialForm({ ...socialForm, platform: v })}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-600">
                    <SelectItem value="all">All Platforms</SelectItem>
                    <SelectItem value="instagram">
                      <div className="flex items-center gap-2">
                        <InstagramIcon className="w-4 h-4" />
                        <span>Instagram</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="tiktok">
                      <div className="flex items-center gap-2">
                        <TikTokIcon className="w-4 h-4" />
                        <span>TikTok</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-zinc-300">{isGerman ? "Audio Qualität" : "Audio Quality"}</Label>
                <Select value={socialForm.audio_quality} onValueChange={(v) => setSocialForm({ ...socialForm, audio_quality: v })}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-600">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-zinc-300">{isGerman ? "Video Qualität" : "Video Quality"}</Label>
                <Select value={socialForm.video_quality} onValueChange={(v) => setSocialForm({ ...socialForm, video_quality: v })}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-600">
                    <SelectItem value="720p">720p</SelectItem>
                    <SelectItem value="1080p">1080p</SelectItem>
                    <SelectItem value="4k">4K</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-zinc-300">Titel</Label>
                <Input 
                  value={socialForm.title} 
                  onChange={(e) => setSocialForm({ ...socialForm, title: e.target.value })}
                  placeholder={isGerman ? "Titel eingeben..." : "Enter title..."}
                  className="bg-zinc-800 border-zinc-600 text-white"
                />
              </div>

              <div>
                <Label className="text-zinc-300">Description</Label>
                <Textarea 
                  value={socialForm.description} 
                  onChange={(e) => setSocialForm({ ...socialForm, description: e.target.value })}
                  placeholder={isGerman ? "Beschreibung eingeben..." : "Enter description..."}
                  className="bg-zinc-800 border-zinc-600 text-white"
                />
              </div>

              <div>
                <Label className="text-zinc-300">Hashtags</Label>
                <Input 
                  value={socialForm.hashtags} 
                  onChange={(e) => setSocialForm({ ...socialForm, hashtags: e.target.value })}
                  placeholder="#fitness #workout #gym"
                  className="bg-zinc-800 border-zinc-600 text-white"
                />
              </div>

              <div>
                <Label className="text-zinc-300">Post Date</Label>
                <Input 
                  type="datetime-local"
                  value={socialForm.post_date} 
                  onChange={(e) => setSocialForm({ ...socialForm, post_date: e.target.value })}
                  className="bg-zinc-800 border-zinc-600 text-white"
                />
              </div>

              <Button onClick={handleSocialMediaUpload} className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:opacity-90">
                <div className="flex items-center gap-2">
                  <InstagramIcon className="w-4 h-4" />
                  <TikTokIcon className="w-4 h-4" />
                  <span>Platform Upload</span>
                </div>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <BottomNav />
    </div>
  );
};

export default ProAthlete;