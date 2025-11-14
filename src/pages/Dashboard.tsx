import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Dumbbell, Heart, Zap, Target, 
  Bike, PersonStanding, Armchair, TrendingUp,
  Activity, Award, Edit
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userData, setUserData] = useState<any>(null);
  const [isGerman, setIsGerman] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    height: "",
    weight: "",
    body_type: ""
  });

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate("/login");
        return;
      }

      const user = session.user;
      const metadata = user.user_metadata;
      
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
          body_type: profile.body_type || ""
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
        body_type: editForm.body_type || null
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

  const muscleGroups = [
    { icon: Dumbbell, category: "beine", color: "text-blue-400", bodyPart: "lower_body" },
    { icon: Heart, category: "waden", color: "text-pink-400", bodyPart: "lower_body" },
    { icon: Target, category: "squats", color: "text-red-400", bodyPart: "lower_body" },
    { icon: Armchair, category: "po", color: "text-cyan-400", bodyPart: "lower_body" },
    { icon: Dumbbell, category: "brust", color: "text-blue-400", bodyPart: "upper_body" },
    { icon: TrendingUp, category: "ruecken", color: "text-green-400", bodyPart: "upper_body" },
    { icon: Activity, category: "core", color: "text-purple-400", bodyPart: "upper_body" },
    { icon: Zap, category: "schulter", color: "text-yellow-400", bodyPart: "upper_body" },
    { icon: Activity, category: "trizeps", color: "text-purple-400", bodyPart: "upper_body" },
    { icon: Target, category: "bizeps", color: "text-red-400", bodyPart: "upper_body" },
    { icon: PersonStanding, category: "bauch", color: "text-orange-400", bodyPart: "upper_body" },
  ];

  if (!userData) return null;

  return (
    <div className="min-h-screen pb-24 gradient-male">
      <div className="max-w-screen-xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {isGerman ? `Willkommen, ${userData.name}!` : `Welcome, ${userData.name}!`}
          </h1>
          <p className="text-muted-foreground">
            {isGerman ? "Wähle deine Muskelgruppe" : "Choose your muscle group"}
          </p>
        </div>

        {/* Profile Card with Edit */}
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
                        <SelectItem value="ectomorph">Ectomorph</SelectItem>
                        <SelectItem value="mesomorph">Mesomorph</SelectItem>
                        <SelectItem value="endomorph">Endomorph</SelectItem>
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
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              <div className="text-sm text-muted-foreground mb-1">BMI</div>
              <div className="text-2xl font-bold">
                {profileData?.height && profileData?.weight
                  ? (profileData.weight / Math.pow(profileData.height / 100, 2)).toFixed(1)
                  : "N/A"}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                {isGerman ? "Körpertyp" : "Body Type"}
              </div>
              <div className="text-lg font-bold capitalize">
                {profileData?.body_type || "N/A"}
              </div>
            </div>
          </div>
        </Card>

        {/* Training Modules */}
        <div>
          <h2 className="text-2xl font-bold mb-6">
            {isGerman ? "Trainingsmodule" : "Training Modules"}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {muscleGroups.map((group, index) => {
              const Icon = group.icon;
              const categoryKey = Object.keys(muscleGroupsMap).find(
                key => muscleGroupsMap[key].de === group.label || muscleGroupsMap[key].en === group.label
              ) || group.label.toLowerCase();
              
              return (
                <Card
                  key={index}
                  onClick={() => navigate(`/exercise/${categoryKey}`)}
                  className="gradient-card card-shadow border-white/10 p-6 hover:scale-105 transition-all duration-300 cursor-pointer hover:border-primary/50"
                >
                  <div className="flex flex-col items-center gap-3">
                    <Icon className={`w-12 h-12 ${group.color}`} />
                    <span className="text-sm font-semibold text-center">
                      {group.label}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Dashboard;
