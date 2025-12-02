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
import { useToast } from "@/hooks/use-toast";
import { 
  Dumbbell, User, Edit, Plus
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

  useEffect(() => {
    // Check authentication
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

      // Apply theme
      const theme = metadata.gender === "female" ? "theme-female" : "";
      if (theme) {
        document.documentElement.classList.add(theme);
      }

      // Fetch profile data
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
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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

    // Refresh profile data
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

  const muscleGroupsMap: { [key: string]: { de: string; en: string; category: string } } = {
    brust: { de: "Brust", en: "Chest", category: "brust" },
    ruecken: { de: "Rücken", en: "Back", category: "ruecken" },
    schulter: { de: "Schultern", en: "Shoulders", category: "schulter" },
    bizeps: { de: "Bizeps", en: "Biceps", category: "bizeps" },
    trizeps: { de: "Trizeps", en: "Triceps", category: "trizeps" },
    beine: { de: "Beine", en: "Legs", category: "beine" },
    waden: { de: "Waden", en: "Calves", category: "waden" },
    bauch: { de: "Bauch", en: "Abs", category: "bauch" },
    core: { de: "Core", en: "Core", category: "core" },
    po: { de: "Po", en: "Glutes", category: "po" }
  };

  // Category mapping for German/English
  const categoryMapping: Record<string, { de: string; en: string }> = {
    beine: { de: "Beine", en: "Legs" },
    waden: { de: "Waden", en: "Calves" },
    squats: { de: "Squats", en: "Squats" },
    po: { de: "Po", en: "Glutes" },
    brust: { de: "Brust", en: "Chest" },
    ruecken: { de: "Rücken", en: "Back" },
    core: { de: "Core", en: "Core" },
    schulter: { de: "Schultern", en: "Shoulders" },
    trizeps: { de: "Trizeps", en: "Triceps" },
    bizeps: { de: "Bizeps", en: "Biceps" },
    bauch: { de: "Bauch", en: "Abs" }
  };

  // Training modules with new icons
  const trainingModules = [
    { 
      icon: Dumbbell, 
      title: isGerman ? "Upper Body" : "Upper Body",
      description: isGerman ? "Brust, Rücken, Schultern, Arme" : "Chest, Back, Shoulders, Arms",
      color: "text-blue-400"
    },
    { 
      icon: User, 
      title: isGerman ? "Middle Body" : "Middle Body",
      description: isGerman ? "Core, Bauch" : "Core, Abs",
      color: "text-purple-400"
    },
    { 
      icon: User, 
      title: isGerman ? "Lower Body" : "Lower Body",
      description: isGerman ? "Beine, Po, Waden" : "Legs, Glutes, Calves",
      color: "text-green-400"
    }
  ];

  const bodyTypeTranslations: Record<string, Record<string, string>> = {
    de: {
      "ectomorph": "Fett",
      "mesomorph": "Schlank",
      "endomorph": "Muskulös",
      "defined": "Definiert"
    },
    en: {
      "ectomorph": "Fat",
      "mesomorph": "Slim",
      "endomorph": "Muscular",
      "defined": "Defined"
    }
  };

  const athleteLevelTranslations: Record<string, Record<string, string>> = {
    de: {
      "beginner": "Anfänger",
      "professional": "Profi"
    },
    en: {
      "beginner": "Beginner",
      "professional": "Professional"
    }
  };

  if (!userData) return null;

  return (
    <div className="min-h-screen pb-24 gradient-male">
      <div className="max-w-screen-xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {isGerman ? `Start your Workout Today, ${userData.name}` : `Start your Workout Today, ${userData.name}`}
          </h1>
          <p className="text-muted-foreground">
            {isGerman ? "Wähle deine Trainingseinheit" : "Choose your training session"}
          </p>
        </div>

        {/* Statistics Dashboard */}
        {userId && <DashboardStats isGerman={isGerman} userId={userId} />}

        {/* Profile Card with Avatar and Edit */}
        <Card className="gradient-card card-shadow border-white/10 p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">
              {isGerman ? "Mein Profil" : "My Profile"}
            </h2>
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Edit className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {isGerman ? "Profil bearbeiten" : "Edit Profile"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="height">{isGerman ? "Größe (cm)" : "Height (cm)"}</Label>
                    <Input
                      id="height"
                      type="number"
                      step="0.1"
                      value={editForm.height}
                      onChange={(e) => setEditForm({ ...editForm, height: e.target.value })}
                      placeholder="180"
                    />
                  </div>
                  <div>
                    <Label htmlFor="weight">{isGerman ? "Gewicht (kg)" : "Weight (kg)"}</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      value={editForm.weight}
                      onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
                      placeholder="75"
                    />
                  </div>
                  <div>
                    <Label htmlFor="body_type">{isGerman ? "Körpertyp" : "Body Type"}</Label>
                    <Select value={editForm.body_type} onValueChange={(value) => setEditForm({ ...editForm, body_type: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder={isGerman ? "Wählen..." : "Select..."} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ectomorph">{bodyTypeTranslations[isGerman ? 'de' : 'en'].ectomorph}</SelectItem>
                        <SelectItem value="mesomorph">{bodyTypeTranslations[isGerman ? 'de' : 'en'].mesomorph}</SelectItem>
                        <SelectItem value="endomorph">{bodyTypeTranslations[isGerman ? 'de' : 'en'].endomorph}</SelectItem>
                        <SelectItem value="defined">{bodyTypeTranslations[isGerman ? 'de' : 'en'].defined}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="athlete_level">{isGerman ? "Athlete Level" : "Athlete Level"}</Label>
                    <Select value={editForm.athlete_level} onValueChange={(value) => setEditForm({ ...editForm, athlete_level: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder={isGerman ? "Wählen..." : "Select..."} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">{athleteLevelTranslations[isGerman ? 'de' : 'en'].beginner}</SelectItem>
                        <SelectItem value="professional">{athleteLevelTranslations[isGerman ? 'de' : 'en'].professional}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleSaveProfile} className="w-full">
                    {isGerman ? "Speichern" : "Save"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            {/* Avatar Upload */}
            <AvatarUpload
              userId={userId}
              currentAvatarUrl={profileData?.avatar_url}
              onUploadSuccess={(url) => setProfileData({ ...profileData, avatar_url: url })}
              isGerman={isGerman}
            />

            {/* Profile Info Grid */}
            <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  {isGerman ? "Größe" : "Height"}
                </div>
                <div className="text-2xl font-bold">
                  {profileData?.height ? `${profileData.height} cm` : "N/A"}
                </div>
              </div>
              <div 
                className="cursor-pointer hover:scale-105 transition-all"
                onClick={() => navigate("/weight-tracker")}
              >
                <div className="text-sm text-muted-foreground mb-1">
                  {isGerman ? "Gewicht" : "Weight"}
                </div>
                <div className="text-2xl font-bold">
                  {profileData?.weight ? `${profileData.weight} kg` : "N/A"}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  {isGerman ? "Athlete" : "Athlete"}
                </div>
                <div className="text-lg font-bold capitalize">
                  {profileData?.athlete_level ? athleteLevelTranslations[isGerman ? 'de' : 'en'][profileData.athlete_level] : "N/A"}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  {isGerman ? "Körpertyp" : "Body Type"}
                </div>
                <div className="text-lg font-bold">
                  {profileData?.body_type ? bodyTypeTranslations[isGerman ? 'de' : 'en'][profileData.body_type] : "N/A"}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Training Modules - 3 Boxes */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">
            {isGerman ? "Trainingsmodule" : "Training Modules"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {trainingModules.map((module, index) => {
              const Icon = module.icon;
              return (
                <Card
                  key={index}
                  onClick={() => setIsTrainingDialogOpen(true)}
                  className="gradient-card card-shadow border-white/10 p-8 hover:scale-105 transition-all duration-300 cursor-pointer hover:border-primary/50"
                >
                  <div className="flex flex-col items-center gap-4 text-center">
                    <Icon className={`w-16 h-16 ${module.color}`} />
                    <div>
                      <h3 className="text-xl font-bold mb-2">{module.title}</h3>
                      <p className="text-sm text-muted-foreground">{module.description}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Training History */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {isGerman ? "Trainingsverlauf" : "Training History"}
            </h2>
            <Button onClick={() => setIsTrainingDialogOpen(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              {isGerman ? "Hinzufügen" : "Add"}
            </Button>
          </div>
          <TrainingHistory userId={userId} isGerman={isGerman} refreshTrigger={refreshHistory} />
        </div>
      </div>

      <TrainingLogDialog
        open={isTrainingDialogOpen}
        onOpenChange={setIsTrainingDialogOpen}
        userId={userId}
        isGerman={isGerman}
        onSuccess={() => setRefreshHistory(prev => prev + 1)}
      />

      <BottomNav />
    </div>
  );
};

export default Dashboard;
