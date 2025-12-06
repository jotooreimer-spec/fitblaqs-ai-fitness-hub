import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import DashboardStats from "@/components/DashboardStats";
import { AvatarUpload } from "@/components/AvatarUpload";
import { TrainingLogDialog } from "@/components/TrainingLogDialog";
import { TrainingHistory } from "@/components/TrainingHistory";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Edit, Dumbbell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import upperbodyImg from "@/assets/upperbody-bg.png";
import middlebodyImg from "@/assets/middlebody.png";
import lowerbodyImg from "@/assets/lowerbody.png";
import fitblaqsLogo from "@/assets/fitblaqs-logo.png";
import dashboardBg from "@/assets/dashboard-bg.png";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userData, setUserData] = useState<any>(null);
  const [userId, setUserId] = useState<string>("");
  const [isGerman, setIsGerman] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    height: "",
    weight: "",
    body_type: "",
    athlete_level: ""
  });
  const [isTrainingDialogOpen, setIsTrainingDialogOpen] = useState(false);
  const [refreshHistory, setRefreshHistory] = useState(0);
  const [monthlyProgress, setMonthlyProgress] = useState(0);
  const [todayNutrition, setTodayNutrition] = useState({ calories: 0, protein: 0, water: 0 });

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate("/login");
        return;
      }

      const user = session.user;
      const metadata = user.user_metadata;
      
      setUserId(user.id);
      setUserData({
        name: metadata.name || metadata.full_name || "User",
        age: metadata.age || "N/A",
        gender: metadata.gender || "male",
        language: metadata.language || "de"
      });
      
      setIsGerman(metadata.language === "de");

      const theme = metadata.gender === "female" ? "theme-female" : "";
      if (theme) {
        document.documentElement.classList.add(theme);
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        setProfileData(profile);
        setEditForm({
          height: profile.height?.toString() || "",
          weight: profile.weight?.toString() || "",
          body_type: profile.body_type || "",
          athlete_level: profile.athlete_level || ""
        });
      }

      // Calculate monthly workout progress
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { count } = await supabase
        .from("workout_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("completed_at", startOfMonth.toISOString());

      const progress = Math.min(((count || 0) / 30) * 100, 100);
      setMonthlyProgress(progress);

      // Load today's nutrition data - Start at 0, only count actual entries
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: nutritionData } = await supabase
        .from("nutrition_logs")
        .select("calories, protein, notes")
        .eq("user_id", user.id)
        .gte("completed_at", today.toISOString())
        .lt("completed_at", tomorrow.toISOString());

      if (nutritionData && nutritionData.length > 0) {
        const totals = nutritionData.reduce((acc, log) => {
          acc.calories += log.calories || 0;
          acc.protein += log.protein || 0;
          const waterMatch = log.notes?.match(/Water: ([\d.]+)/);
          if (waterMatch) acc.water += parseFloat(waterMatch[1]) || 0;
          return acc;
        }, { calories: 0, protein: 0, water: 0 });
        setTodayNutrition(totals);
      } else {
        // Start at 0 when no entries
        setTodayNutrition({ calories: 0, protein: 0, water: 0 });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, refreshHistory]);

  const handleSaveProfile = async () => {
    if (!userData) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        height: editForm.height ? parseFloat(editForm.height) : null,
        weight: editForm.weight ? parseFloat(editForm.weight) : null,
        body_type: editForm.body_type || null,
        athlete_level: editForm.athlete_level || null
      })
      .eq("user_id", session.user.id);

    if (error) {
      toast({
        title: isGerman ? "Fehler" : "Error",
        description: isGerman ? "Profil konnte nicht gespeichert werden" : "Could not save profile",
        variant: "destructive"
      });
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    if (profile) {
      setProfileData(profile);
    }

    setIsEditDialogOpen(false);
    toast({
      title: isGerman ? "Gespeichert" : "Saved",
      description: isGerman ? "Profil erfolgreich aktualisiert" : "Profile updated successfully"
    });
  };

  const trainingModules = [
    { 
      image: upperbodyImg,
      title: "Upper Body",
      description: isGerman ? "Brust, Rücken, Schultern, Arme" : "Chest, Back, Shoulders, Arms",
    },
    { 
      image: middlebodyImg,
      title: "Middle Body",
      description: isGerman ? "Core, Bauch" : "Core, Abs",
    },
    { 
      image: lowerbodyImg,
      title: "Lower Body",
      description: isGerman ? "Beine, Po, Waden" : "Legs, Glutes, Calves",
    },
    { 
      image: dashboardBg,
      title: "Fullbody",
      description: isGerman ? "Ganzkörper Training" : "Full Body Workout",
    }
  ];

  const bodyTypeTranslations: Record<string, Record<string, string>> = {
    de: { "ectomorph": "Fett", "mesomorph": "Schlank", "endomorph": "Muskulös", "defined": "Definiert" },
    en: { "ectomorph": "Fat", "mesomorph": "Slim", "endomorph": "Muscular", "defined": "Defined" }
  };

  const athleteLevelTranslations: Record<string, Record<string, string>> = {
    de: { "beginner": "Anfänger", "professional": "Profi" },
    en: { "beginner": "Beginner", "professional": "Professional" }
  };

  if (!userData) return null;

  return (
    <div className="min-h-screen pb-24 relative">
      {/* Background Image */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${dashboardBg})` }}
      />
      <div className="fixed inset-0 bg-black/60" />

      <div className="relative z-10 max-w-screen-xl mx-auto p-6">
        {/* Header with Logo */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <img src={fitblaqsLogo} alt="FitBlaqs" className="w-12 h-12 object-contain" />
            <h1 className="text-4xl font-bold text-white">
              {isGerman ? `Starte dein Training, ${userData.name}` : `Start your Workout, ${userData.name}`}
            </h1>
          </div>
          <p className="text-white/70">
            {isGerman ? "Wähle deine Trainingseinheit" : "Choose your training session"}
          </p>
        </div>

        {/* Statistics Dashboard */}
        <div className="mb-8">
          {userId && <DashboardStats isGerman={isGerman} userId={userId} />}
        </div>

        {/* Quick Nutrition Overview - Starts at 0 */}
        <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-bold text-white">{isGerman ? "Heute Ernährung" : "Today's Nutrition"}</h3>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="cursor-pointer hover:scale-105 transition-all" onClick={() => navigate("/nutrition")}>
              <div className="text-sm text-white/60 mb-1">{isGerman ? "Kalorien" : "Calories"}</div>
              <div className="text-2xl font-bold text-orange-400">{todayNutrition.calories}</div>
              <div className="text-xs text-white/50">kcal</div>
            </div>
            <div className="cursor-pointer hover:scale-105 transition-all" onClick={() => navigate("/nutrition")}>
              <div className="text-sm text-white/60 mb-1">Protein</div>
              <div className="text-2xl font-bold text-green-400">{Math.round(todayNutrition.protein)}g</div>
            </div>
            <div className="cursor-pointer hover:scale-105 transition-all" onClick={() => navigate("/nutrition")}>
              <div className="text-sm text-white/60 mb-1">{isGerman ? "Wasser" : "Water"}</div>
              <div className="text-2xl font-bold text-blue-400">{(todayNutrition.water / 1000).toFixed(1)}L</div>
            </div>
          </div>
        </Card>

        {/* Profile Card */}
        <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">
              {isGerman ? "Mein Profil" : "My Profile"}
            </h2>
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="border-white/20">
                  <Edit className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{isGerman ? "Profil bearbeiten" : "Edit Profile"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="height">{isGerman ? "Größe (cm)" : "Height (cm)"}</Label>
                    <Input id="height" type="number" step="0.1" value={editForm.height} onChange={(e) => setEditForm({ ...editForm, height: e.target.value })} placeholder="180" />
                  </div>
                  <div>
                    <Label htmlFor="weight">{isGerman ? "Gewicht (kg)" : "Weight (kg)"}</Label>
                    <Input id="weight" type="number" step="0.1" value={editForm.weight} onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })} placeholder="75" />
                  </div>
                  <div>
                    <Label htmlFor="body_type">{isGerman ? "Körpertyp" : "Body Type"}</Label>
                    <Select value={editForm.body_type} onValueChange={(value) => setEditForm({ ...editForm, body_type: value })}>
                      <SelectTrigger><SelectValue placeholder={isGerman ? "Wählen..." : "Select..."} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ectomorph">{bodyTypeTranslations[isGerman ? 'de' : 'en'].ectomorph}</SelectItem>
                        <SelectItem value="mesomorph">{bodyTypeTranslations[isGerman ? 'de' : 'en'].mesomorph}</SelectItem>
                        <SelectItem value="endomorph">{bodyTypeTranslations[isGerman ? 'de' : 'en'].endomorph}</SelectItem>
                        <SelectItem value="defined">{bodyTypeTranslations[isGerman ? 'de' : 'en'].defined}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="athlete_level">Athlete Level</Label>
                    <Select value={editForm.athlete_level} onValueChange={(value) => setEditForm({ ...editForm, athlete_level: value })}>
                      <SelectTrigger><SelectValue placeholder={isGerman ? "Wählen..." : "Select..."} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">{athleteLevelTranslations[isGerman ? 'de' : 'en'].beginner}</SelectItem>
                        <SelectItem value="professional">{athleteLevelTranslations[isGerman ? 'de' : 'en'].professional}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleSaveProfile} className="w-full">{isGerman ? "Speichern" : "Save"}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            <AvatarUpload userId={userId} currentAvatarUrl={profileData?.avatar_url} onUploadSuccess={(url) => setProfileData({ ...profileData, avatar_url: url })} isGerman={isGerman} />
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
              <div>
                <div className="text-sm text-white/60 mb-1">{isGerman ? "Größe" : "Height"}</div>
                <div className="text-2xl font-bold text-white">{profileData?.height ? `${profileData.height} cm` : "N/A"}</div>
              </div>
              <div className="cursor-pointer hover:scale-105 transition-all" onClick={() => navigate("/weight-tracker")}>
                <div className="text-sm text-white/60 mb-1">{isGerman ? "Gewicht" : "Weight"}</div>
                <div className="text-2xl font-bold text-white">{profileData?.weight ? `${profileData.weight} kg` : "N/A"}</div>
              </div>
              <div>
                <div className="text-sm text-white/60 mb-1">Athlete</div>
                <div className="text-lg font-bold capitalize text-white">{profileData?.athlete_level ? athleteLevelTranslations[isGerman ? 'de' : 'en'][profileData.athlete_level] : "N/A"}</div>
              </div>
              <div>
                <div className="text-sm text-white/60 mb-1">{isGerman ? "Körpertyp" : "Body Type"}</div>
                <div className="text-lg font-bold text-white">{profileData?.body_type ? bodyTypeTranslations[isGerman ? 'de' : 'en'][profileData.body_type] : "N/A"}</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Training Modules - Now includes Fullbody */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 text-white">{isGerman ? "Trainingsmodule" : "Training Modules"}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trainingModules.map((module, index) => (
              <Card key={index} onClick={() => setIsTrainingDialogOpen(true)} className="relative overflow-hidden border-white/10 hover:scale-105 transition-all duration-300 cursor-pointer hover:border-primary/50 h-48 md:h-56">
                <img src={module.image} alt={module.title} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <Dumbbell className="w-4 h-4 text-primary" />
                    <h3 className="text-lg font-bold">{module.title}</h3>
                  </div>
                  <p className="text-xs text-white/80">{module.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Workout Activity Progress - Monthly */}
        <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-6 mb-8">
          <h3 className="text-lg font-bold mb-4 text-white">{isGerman ? "Workout Aktivitäten" : "Workout Activities"}</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">{isGerman ? "Monatlicher Fortschritt" : "Monthly Progress"}</span>
              <span className="font-bold text-white">{Math.round(monthlyProgress)}%</span>
            </div>
            <Progress value={monthlyProgress} className="h-3" />
            <div className="flex justify-between text-xs text-white/40">
              <span>0</span>
              <span>15</span>
              <span>30 {isGerman ? "Tage" : "days"}</span>
            </div>
          </div>
        </Card>

        {/* Training History */}
        <div>
          <h2 className="text-2xl font-bold mb-6 text-white">{isGerman ? "Trainingsverlauf" : "Training History"}</h2>
          <TrainingHistory userId={userId} isGerman={isGerman} refreshTrigger={refreshHistory} />
        </div>
      </div>

      <TrainingLogDialog open={isTrainingDialogOpen} onOpenChange={setIsTrainingDialogOpen} userId={userId} isGerman={isGerman} onSuccess={() => setRefreshHistory(prev => prev + 1)} />
      <BottomNav />
    </div>
  );
};

export default Dashboard;