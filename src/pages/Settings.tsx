import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { LogOut, User, Bell, Globe, Shield, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { signOut } from "@/lib/auth";
import { AvatarUpload } from "@/components/AvatarUpload";
import settingsBg from "@/assets/settings-bg.jpg";

const Settings = () => {
  const navigate = useNavigate();
  const [isGerman, setIsGerman] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [userId, setUserId] = useState<string>("");
  
  // Dialog states
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [notificationsDialogOpen, setNotificationsDialogOpen] = useState(false);
  const [languageDialogOpen, setLanguageDialogOpen] = useState(false);
  const [privacyDialogOpen, setPrivacyDialogOpen] = useState(false);
  
  // Settings states
  const [pushNotifications, setPushNotifications] = useState(true);
  const [updateNotifications, setUpdateNotifications] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState("de");
  
  // Edit form
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    height: "",
    weight: "",
    body_type: "",
    athlete_level: ""
  });

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
        email: user.email,
        language: metadata.language || "de"
      });
      
      setIsGerman(metadata.language === "de");
      setSelectedLanguage(metadata.language || "de");

      // Fetch profile data
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        setProfileData(profile);
        setEditForm({
          name: metadata.name || metadata.full_name || "",
          email: user.email || "",
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

  const handleLogout = async () => {
    try {
      await signOut();
      document.documentElement.classList.remove("theme-female");
      toast.success(isGerman ? "Erfolgreich abgemeldet" : "Logged out successfully");
      navigate("/");
    } catch (error) {
      toast.error(isGerman ? "Abmelden fehlgeschlagen" : "Logout failed");
    }
  };

  const handleSaveProfile = async () => {
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
      toast.error(isGerman ? "Fehler beim Speichern" : "Error saving");
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

    setProfileDialogOpen(false);
    toast.success(isGerman ? "Profil gespeichert" : "Profile saved");
  };

  const handleLanguageChange = async (lang: string) => {
    setSelectedLanguage(lang);
    setIsGerman(lang === "de");
    
    // Update user metadata
    await supabase.auth.updateUser({
      data: { language: lang }
    });

    toast.success(isGerman ? "Sprache geändert" : "Language changed");
  };

  const languages = [
    { code: "de", name: "Deutsch 🇩🇪" },
    { code: "en", name: "English 🇬🇧" },
    { code: "es", name: "Español 🇪🇸" },
    { code: "fr", name: "Français 🇫🇷" },
    { code: "it", name: "Italiano 🇮🇹" },
    { code: "pt", name: "Português 🇵🇹" },
    { code: "ru", name: "Русский 🇷🇺" },
    { code: "zh", name: "中文 🇨🇳" },
    { code: "ja", name: "日本語 🇯🇵" },
    { code: "ko", name: "한국어 🇰🇷" },
    { code: "ar", name: "العربية 🇸🇦" },
    { code: "tr", name: "Türkçe 🇹🇷" },
  ];

  const bodyTypeTranslations: Record<string, Record<string, string>> = {
    de: { "ectomorph": "Fett", "mesomorph": "Schlank", "endomorph": "Muskulös", "defined": "Definiert" },
    en: { "ectomorph": "Fat", "mesomorph": "Slim", "endomorph": "Muscular", "defined": "Defined" }
  };

  const athleteLevelTranslations: Record<string, Record<string, string>> = {
    de: { "beginner": "Anfänger", "professional": "Profi" },
    en: { "beginner": "Beginner", "professional": "Professional" }
  };

  const settingsSections = [
    {
      icon: User,
      title: isGerman ? "Profil bearbeiten" : "Edit Profile",
      description: isGerman ? "Name, Gewicht, Größe ändern" : "Change name, weight, height",
      onClick: () => setProfileDialogOpen(true),
    },
    {
      icon: Bell,
      title: isGerman ? "Benachrichtigungen" : "Notifications",
      description: isGerman ? "Push & Update Benachrichtigungen" : "Push & Update notifications",
      onClick: () => setNotificationsDialogOpen(true),
    },
    {
      icon: Globe,
      title: isGerman ? "Sprache" : "Language",
      description: languages.find(l => l.code === selectedLanguage)?.name || "Deutsch 🇩🇪",
      onClick: () => setLanguageDialogOpen(true),
    },
    {
      icon: Shield,
      title: isGerman ? "Datenschutz & Sicherheit" : "Privacy & Security",
      description: isGerman ? "Daten & Sicherheit" : "Data & Security",
      onClick: () => setPrivacyDialogOpen(true),
    },
  ];

  if (!userData) return null;

  return (
    <div className="min-h-screen pb-24 relative">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${settingsBg})` }}
      />
      <div className="absolute inset-0 bg-black/60" />
      
      <div className="relative z-10 max-w-screen-xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-white">
            {isGerman ? "Einstellungen" : "Settings"}
          </h1>
          <p className="text-white/70">
            {isGerman ? "Dein FitBlaqs-Profil verwalten" : "Manage your FitBlaqs profile"}
          </p>
        </div>

        {/* Profile Card */}
        <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-6 mb-8">
          <div className="flex items-center gap-4">
            <AvatarUpload
              userId={userId}
              currentAvatarUrl={profileData?.avatar_url}
              onUploadSuccess={(url) => setProfileData({ ...profileData, avatar_url: url })}
              isGerman={isGerman}
            />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white">{userData.name}</h2>
              <p className="text-white/70">{userData.email}</p>
            </div>
          </div>
        </Card>

        {/* Settings Sections */}
        <div className="space-y-4 mb-8">
          {settingsSections.map((section, index) => {
            const Icon = section.icon;
            return (
              <Card
                key={index}
                onClick={section.onClick}
                className="bg-black/40 backdrop-blur-sm border-white/10 p-5 hover:border-primary/50 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <Icon className="w-6 h-6 text-primary" />
                  <div className="flex-1">
                    <div className="font-semibold text-white">{section.title}</div>
                    <div className="text-sm text-white/70">{section.description}</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Logout Button */}
        <Button
          variant="destructive"
          size="lg"
          onClick={handleLogout}
          className="w-full"
        >
          <LogOut className="w-5 h-5 mr-2" />
          {isGerman ? "Abmelden" : "Logout"}
        </Button>

        {/* App Version */}
        <div className="text-center mt-8 text-sm text-white/50">
          FitBlaqs v1.0.0
        </div>
      </div>

      {/* Profile Dialog */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              {isGerman ? "Profil bearbeiten" : "Edit Profile"}
              <Button variant="ghost" size="icon" onClick={() => setProfileDialogOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center mb-4">
              <AvatarUpload
                userId={userId}
                currentAvatarUrl={profileData?.avatar_url}
                onUploadSuccess={(url) => setProfileData({ ...profileData, avatar_url: url })}
                isGerman={isGerman}
              />
            </div>
            <div>
              <Label>{isGerman ? "Name" : "Name"}</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={editForm.email} disabled className="opacity-50" />
            </div>
            <div>
              <Label>{isGerman ? "Größe (cm)" : "Height (cm)"}</Label>
              <Input type="number" value={editForm.height} onChange={(e) => setEditForm({ ...editForm, height: e.target.value })} />
            </div>
            <div>
              <Label>{isGerman ? "Gewicht (kg)" : "Weight (kg)"}</Label>
              <Input type="number" value={editForm.weight} onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })} />
            </div>
            <div>
              <Label>{isGerman ? "Körpertyp" : "Body Type"}</Label>
              <Select value={editForm.body_type} onValueChange={(v) => setEditForm({ ...editForm, body_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ectomorph">{bodyTypeTranslations[isGerman ? 'de' : 'en'].ectomorph}</SelectItem>
                  <SelectItem value="mesomorph">{bodyTypeTranslations[isGerman ? 'de' : 'en'].mesomorph}</SelectItem>
                  <SelectItem value="endomorph">{bodyTypeTranslations[isGerman ? 'de' : 'en'].endomorph}</SelectItem>
                  <SelectItem value="defined">{bodyTypeTranslations[isGerman ? 'de' : 'en'].defined}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Athlete Level</Label>
              <Select value={editForm.athlete_level} onValueChange={(v) => setEditForm({ ...editForm, athlete_level: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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

      {/* Notifications Dialog */}
      <Dialog open={notificationsDialogOpen} onOpenChange={setNotificationsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              {isGerman ? "Benachrichtigungen" : "Notifications"}
              <Button variant="ghost" size="icon" onClick={() => setNotificationsDialogOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{isGerman ? "Push-Benachrichtigungen" : "Push Notifications"}</div>
                <div className="text-sm text-muted-foreground">{isGerman ? "Erinnerungen erhalten" : "Receive reminders"}</div>
              </div>
              <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{isGerman ? "Update-Benachrichtigungen" : "Update Notifications"}</div>
                <div className="text-sm text-muted-foreground">{isGerman ? "Über neue Features informiert werden" : "Get notified about new features"}</div>
              </div>
              <Switch checked={updateNotifications} onCheckedChange={setUpdateNotifications} />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Language Dialog */}
      <Dialog open={languageDialogOpen} onOpenChange={setLanguageDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              {isGerman ? "Sprache wählen" : "Select Language"}
              <Button variant="ghost" size="icon" onClick={() => setLanguageDialogOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
            {languages.map((lang) => (
              <Button
                key={lang.code}
                variant={selectedLanguage === lang.code ? "default" : "outline"}
                onClick={() => {
                  handleLanguageChange(lang.code);
                  setLanguageDialogOpen(false);
                }}
                className="justify-start"
              >
                {lang.name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Privacy Dialog */}
      <Dialog open={privacyDialogOpen} onOpenChange={setPrivacyDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              {isGerman ? "Datenschutz & Sicherheit" : "Privacy & Security"}
              <Button variant="ghost" size="icon" onClick={() => setPrivacyDialogOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <h3 className="font-bold">{isGerman ? "Datenschutzerklärung" : "Privacy Policy"}</h3>
            <p>{isGerman ? "FitBlaqs respektiert Ihre Privatsphäre und verpflichtet sich zum Schutz Ihrer persönlichen Daten." : "FitBlaqs respects your privacy and is committed to protecting your personal data."}</p>
            
            <h4 className="font-semibold">{isGerman ? "Welche Daten wir sammeln" : "Data We Collect"}</h4>
            <ul className="list-disc pl-4 space-y-1">
              <li>{isGerman ? "Kontoinformationen (Name, E-Mail)" : "Account information (name, email)"}</li>
              <li>{isGerman ? "Gesundheitsdaten (Gewicht, Größe, Trainingsaktivitäten)" : "Health data (weight, height, workout activities)"}</li>
              <li>{isGerman ? "Nutzungsdaten" : "Usage data"}</li>
            </ul>
            
            <h4 className="font-semibold">{isGerman ? "Datensicherheit" : "Data Security"}</h4>
            <p>{isGerman ? "Alle Daten werden verschlüsselt übertragen und sicher gespeichert." : "All data is encrypted in transit and stored securely."}</p>
            
            <h4 className="font-semibold">{isGerman ? "Ihre Rechte" : "Your Rights"}</h4>
            <p>{isGerman ? "Sie haben das Recht auf Zugang, Berichtigung und Löschung Ihrer Daten." : "You have the right to access, rectify, and delete your data."}</p>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default Settings;