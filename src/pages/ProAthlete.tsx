import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Dumbbell, Share2, Upload, Camera, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";

const ProAthlete = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGerman, setIsGerman] = useState(true);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [proAthleteDialogOpen, setProAthleteDialogOpen] = useState(false);
  const [socialMediaDialogOpen, setSocialMediaDialogOpen] = useState(false);
  const [trainingPlan, setTrainingPlan] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Pro Athlete Form
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

  // Social Media Form
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
      
      // Format the AI response into our display format
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
    <div className="min-h-screen pb-24 gradient-male">
      <div className="max-w-screen-xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/pro-subscription")}>
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold">Pro Athlete</h1>
            <p className="text-muted-foreground">
              {isGerman ? "Dein persönlicher Trainingsassistent" : "Your personal training assistant"}
            </p>
          </div>
        </div>

        {/* Upload Area */}
        <Card className="gradient-card card-shadow border-white/10 p-8 mb-6">
          <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center">
            {uploadedFile ? (
              <div className="relative">
                <img src={uploadedFile} alt="Uploaded" className="max-h-64 mx-auto rounded-lg" />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => setUploadedFile(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  {isGerman ? "Richte Barcode / Produkt in den Rahmen aus" : "Align barcode / product in frame"}
                </p>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button asChild>
                    <span>
                      <Camera className="w-4 h-4 mr-2" />
                      {isGerman ? "Bild/Video hochladen" : "Upload Image/Video"}
                    </span>
                  </Button>
                </label>
              </>
            )}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <Button 
            onClick={() => setProAthleteDialogOpen(true)} 
            className="flex-1"
            size="lg"
          >
            <Dumbbell className="w-5 h-5 mr-2" />
            Pro-Athlete
          </Button>
          <Button 
            onClick={() => setSocialMediaDialogOpen(true)} 
            variant="outline"
            className="flex-1"
            size="lg"
          >
            <Share2 className="w-5 h-5 mr-2" />
            Social Media Upl.
          </Button>
        </div>

        {/* Training Plan Display */}
        {trainingPlan && (
          <Card className="gradient-card card-shadow border-white/10 p-6">
            <h2 className="text-2xl font-bold mb-6">Trainingsplan - {trainingPlan.duration}</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tägliche Kalorien</span>
                <span className="font-bold">{trainingPlan.goal_kcal} kcal</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Schlaf</span>
                <span className="font-bold">{trainingPlan.regeneration}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Training/Woche</span>
                <span className="font-bold">{trainingPlan.workout_week}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ziel</span>
                <span className="font-bold">{trainingPlan.category}</span>
              </div>
            </div>

            {/* Nutrition Info */}
            {trainingPlan.nutrition && (
              <div className="bg-primary/10 rounded-lg p-4 mb-6">
                <h3 className="font-bold mb-3">Ernährungsempfehlung</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold">{trainingPlan.nutrition.protein || "150g"}</div>
                    <div className="text-xs text-muted-foreground">Protein</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold">{trainingPlan.nutrition.carbs || "250g"}</div>
                    <div className="text-xs text-muted-foreground">Kohlenhydrate</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold">{trainingPlan.nutrition.fats || "80g"}</div>
                    <div className="text-xs text-muted-foreground">Fette</div>
                  </div>
                </div>
              </div>
            )}

            {/* Weekly Plan Preview */}
            {trainingPlan.weeklyPlan && trainingPlan.weeklyPlan.length > 0 && (
              <div className="space-y-3 mb-6">
                <h3 className="font-bold">Wochenplan</h3>
                {trainingPlan.weeklyPlan.slice(0, 3).map((day: any, index: number) => (
                  <div key={index} className="bg-muted/20 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{day.day}</span>
                      <span className="text-sm text-muted-foreground">{day.type}</span>
                    </div>
                    {day.exercises && day.exercises.slice(0, 2).map((ex: any, i: number) => (
                      <div key={i} className="text-sm text-muted-foreground">
                        {ex.name} - {ex.sets}x{ex.reps}
                      </div>
                    ))}
                    {day.exercises && day.exercises.length > 2 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        +{day.exercises.length - 2} weitere Übungen
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="text-sm text-green-400 flex items-center gap-2 mb-6">
              <span>✓</span>
              <span>{trainingPlan.progression}</span>
            </div>

            <div className="w-full bg-primary/20 rounded-full h-2 mt-4">
              <div className="bg-primary h-2 rounded-full" style={{ width: "40%" }}></div>
            </div>
          </Card>
        )}

        {/* Pro Athlete Dialog */}
        <Dialog open={proAthleteDialogOpen} onOpenChange={setProAthleteDialogOpen}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isGerman ? "Pro Athlete Profil" : "Pro Athlete Profile"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{isGerman ? "Körpertyp" : "Body Type"}</Label>
                <Select value={athleteForm.body_type} onValueChange={(v) => setAthleteForm({ ...athleteForm, body_type: v })}>
                  <SelectTrigger><SelectValue placeholder={isGerman ? "Wählen..." : "Select..."} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fat">Fett</SelectItem>
                    <SelectItem value="muscular">Muskulös</SelectItem>
                    <SelectItem value="slim">Schlank</SelectItem>
                    <SelectItem value="defined">Definiert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{isGerman ? "Gewicht" : "Weight"}</Label>
                  <Input type="number" value={athleteForm.weight} onChange={(e) => setAthleteForm({ ...athleteForm, weight: e.target.value })} />
                </div>
                <div>
                  <Label>{isGerman ? "Einheit" : "Unit"}</Label>
                  <Select value={athleteForm.weight_unit} onValueChange={(v) => setAthleteForm({ ...athleteForm, weight_unit: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="lbs">lbs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{isGerman ? "Zielgewicht" : "Target Weight"}</Label>
                  <Input type="number" value={athleteForm.target_weight} onChange={(e) => setAthleteForm({ ...athleteForm, target_weight: e.target.value })} />
                </div>
                <div>
                  <Label>{isGerman ? "Einheit" : "Unit"}</Label>
                  <Select value={athleteForm.target_weight_unit} onValueChange={(v) => setAthleteForm({ ...athleteForm, target_weight_unit: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="lbs">lbs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>{isGerman ? "Alter" : "Age"}</Label>
                <Input type="number" value={athleteForm.age} onChange={(e) => setAthleteForm({ ...athleteForm, age: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{isGerman ? "Körpergröße" : "Height"}</Label>
                  <Input type="number" value={athleteForm.height} onChange={(e) => setAthleteForm({ ...athleteForm, height: e.target.value })} />
                </div>
                <div>
                  <Label>{isGerman ? "Einheit" : "Unit"}</Label>
                  <Select value={athleteForm.height_unit} onValueChange={(v) => setAthleteForm({ ...athleteForm, height_unit: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
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
                <Label>{isGerman ? "Gesundheitszustand beachten" : "Consider health status"}</Label>
              </div>

              {athleteForm.health_status && (
                <div>
                  <Label>{isGerman ? "Gesundheitsnotizen" : "Health Notes"}</Label>
                  <Textarea 
                    value={athleteForm.health_notes} 
                    onChange={(e) => setAthleteForm({ ...athleteForm, health_notes: e.target.value })}
                    placeholder={isGerman ? "Beschreibe deinen Gesundheitszustand..." : "Describe your health status..."}
                  />
                </div>
              )}

              <div>
                <Label>{isGerman ? "Aktivitätslevel" : "Activity Level"}</Label>
                <Select value={athleteForm.activity_level} onValueChange={(v) => setAthleteForm({ ...athleteForm, activity_level: v })}>
                  <SelectTrigger><SelectValue placeholder={isGerman ? "Wählen..." : "Select..."} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inactive">{isGerman ? "Inaktiv" : "Inactive"}</SelectItem>
                    <SelectItem value="active">{isGerman ? "Aktiv" : "Active"}</SelectItem>
                    <SelectItem value="very_active">{isGerman ? "Sehr aktiv" : "Very Active"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{isGerman ? "Trainingshäufigkeit (pro Woche)" : "Training Frequency (per week)"}</Label>
                <Select value={athleteForm.training_frequency} onValueChange={(v) => setAthleteForm({ ...athleteForm, training_frequency: v })}>
                  <SelectTrigger><SelectValue placeholder={isGerman ? "Wählen..." : "Select..."} /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <SelectItem key={n} value={n.toString()}>{n}x</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{isGerman ? "Ziel" : "Goal"}</Label>
                <Select value={athleteForm.goal} onValueChange={(v) => setAthleteForm({ ...athleteForm, goal: v })}>
                  <SelectTrigger><SelectValue placeholder={isGerman ? "Wählen..." : "Select..."} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fat_loss">{isGerman ? "Fettabbau" : "Fat Loss"}</SelectItem>
                    <SelectItem value="muscle">{isGerman ? "Muskelaufbau" : "Muscle Gain"}</SelectItem>
                    <SelectItem value="maintain">{isGerman ? "Erhalt" : "Maintain"}</SelectItem>
                    <SelectItem value="conditioning">{isGerman ? "Kondition" : "Conditioning"}</SelectItem>
                    <SelectItem value="special">{isGerman ? "Spezialziel" : "Special Goal"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={generateTrainingPlan} className="w-full" disabled={isGenerating}>
                {isGenerating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isGenerating ? (isGerman ? "Generiere KI-Plan..." : "Generating AI Plan...") : (isGerman ? "Trainingsplan erstellen" : "Create Training Plan")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Social Media Dialog */}
        <Dialog open={socialMediaDialogOpen} onOpenChange={setSocialMediaDialogOpen}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Social Media Upload</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {uploadedFile && (
                <div className="rounded-lg overflow-hidden">
                  <img src={uploadedFile} alt="Preview" className="w-full max-h-48 object-cover" />
                </div>
              )}

              <div>
                <Label>Platform</Label>
                <Select value={socialForm.platform} onValueChange={(v) => setSocialForm({ ...socialForm, platform: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Platforms</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Audio {isGerman ? "Qualität" : "Quality"}</Label>
                <Select value={socialForm.audio_quality} onValueChange={(v) => setSocialForm({ ...socialForm, audio_quality: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Video {isGerman ? "Qualität" : "Quality"}</Label>
                <Select value={socialForm.video_quality} onValueChange={(v) => setSocialForm({ ...socialForm, video_quality: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="720p">720p</SelectItem>
                    <SelectItem value="1080p">1080p</SelectItem>
                    <SelectItem value="4k">4K</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Titel</Label>
                <Input value={socialForm.title} onChange={(e) => setSocialForm({ ...socialForm, title: e.target.value })} />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea value={socialForm.description} onChange={(e) => setSocialForm({ ...socialForm, description: e.target.value })} />
              </div>

              <div>
                <Label>Hashtags</Label>
                <Input 
                  value={socialForm.hashtags} 
                  onChange={(e) => setSocialForm({ ...socialForm, hashtags: e.target.value })}
                  placeholder="#fitness #workout #motivation"
                />
              </div>

              <div>
                <Label>Post Date</Label>
                <Input 
                  type="datetime-local" 
                  value={socialForm.post_date} 
                  onChange={(e) => setSocialForm({ ...socialForm, post_date: e.target.value })} 
                />
              </div>

              <Button onClick={handleSocialMediaUpload} className="w-full">
                <Share2 className="w-4 h-4 mr-2" />
                Platform Upload
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