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
import { LogOut, User, Bell, Globe, Shield, X, CreditCard, Share2 } from "lucide-react";
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
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [platformDialogOpen, setPlatformDialogOpen] = useState(false);
  
  // Settings states
  const [pushNotifications, setPushNotifications] = useState(true);
  const [updateNotifications, setUpdateNotifications] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState("de");
  
  // Platform settings
  const [instagramConnected, setInstagramConnected] = useState(false);
  const [tiktokConnected, setTiktokConnected] = useState(false);
  const [instagramUrl, setInstagramUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  
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

  const handleNotificationToggle = (type: 'push' | 'update', value: boolean) => {
    if (type === 'push') {
      setPushNotifications(value);
      toast.success(value 
        ? (isGerman ? "Push-Benachrichtigungen aktiviert" : "Push notifications enabled")
        : (isGerman ? "Push-Benachrichtigungen deaktiviert" : "Push notifications disabled")
      );
    } else {
      setUpdateNotifications(value);
      toast.success(value 
        ? (isGerman ? "Update-Benachrichtigungen aktiviert" : "Update notifications enabled")
        : (isGerman ? "Update-Benachrichtigungen deaktiviert" : "Update notifications disabled")
      );
    }
  };

  const handlePlatformConnect = (platform: 'instagram' | 'tiktok') => {
    if (platform === 'instagram') {
      setInstagramConnected(!instagramConnected);
      toast.success(instagramConnected 
        ? (isGerman ? "Instagram getrennt" : "Instagram disconnected")
        : (isGerman ? "Instagram verbunden" : "Instagram connected")
      );
    } else {
      setTiktokConnected(!tiktokConnected);
      toast.success(tiktokConnected 
        ? (isGerman ? "TikTok getrennt" : "TikTok disconnected")
        : (isGerman ? "TikTok verbunden" : "TikTok connected")
      );
    }
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
      icon: CreditCard,
      title: isGerman ? "Abo & Zahlung" : "Subscription & Payment",
      description: isGerman ? "Pro Athlete & Nutrition Abos" : "Pro Athlete & Nutrition subscriptions",
      onClick: () => setSubscriptionDialogOpen(true),
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
      icon: Share2,
      title: isGerman ? "Platform Einstellung" : "Platform Settings",
      description: isGerman ? "Instagram & TikTok verbinden" : "Connect Instagram & TikTok",
      onClick: () => setPlatformDialogOpen(true),
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

      {/* Subscription Dialog */}
      <Dialog open={subscriptionDialogOpen} onOpenChange={setSubscriptionDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              {isGerman ? "Abo & Zahlung" : "Subscription & Payment"}
              <Button variant="ghost" size="icon" onClick={() => setSubscriptionDialogOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Card className="p-4 border-primary/50">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold">Pro Athlete</h3>
                <span className="text-2xl font-bold">€19,99/mo</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {isGerman ? "KI-Trainingspläne, Social Media Upload" : "AI training plans, Social media upload"}
              </p>
              <Button onClick={() => navigate("/pro-subscription")} className="w-full">
                {isGerman ? "Mehr erfahren" : "Learn more"}
              </Button>
            </Card>
            
            <Card className="p-4 border-green-500/50">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold">Pro Nutrition</h3>
                <span className="text-2xl font-bold">€14,99/mo</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {isGerman ? "Food Tracker, Barcode Scanner, KI-Analyse" : "Food tracker, Barcode scanner, AI analysis"}
              </p>
              <Button onClick={() => navigate("/pro-subscription")} className="w-full bg-green-600 hover:bg-green-700">
                {isGerman ? "Mehr erfahren" : "Learn more"}
              </Button>
            </Card>
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
              <Switch checked={pushNotifications} onCheckedChange={(v) => handleNotificationToggle('push', v)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{isGerman ? "Update-Benachrichtigungen" : "Update Notifications"}</div>
                <div className="text-sm text-muted-foreground">{isGerman ? "Über neue Features informiert werden" : "Get notified about new features"}</div>
              </div>
              <Switch checked={updateNotifications} onCheckedChange={(v) => handleNotificationToggle('update', v)} />
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

      {/* Platform Settings Dialog */}
      <Dialog open={platformDialogOpen} onOpenChange={setPlatformDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              {isGerman ? "Platform Einstellung" : "Platform Settings"}
              <Button variant="ghost" size="icon" onClick={() => setPlatformDialogOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Instagram */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-medium">Instagram</div>
                  <div className="text-sm text-muted-foreground">
                    {instagramConnected ? (isGerman ? "Verbunden" : "Connected") : (isGerman ? "Nicht verbunden" : "Not connected")}
                  </div>
                </div>
                <Button 
                  variant={instagramConnected ? "destructive" : "default"}
                  size="sm"
                  onClick={() => handlePlatformConnect('instagram')}
                >
                  {instagramConnected ? "Disconnect" : "Connect"}
                </Button>
              </div>
              <div>
                <Label>Instagram URL</Label>
                <Input 
                  placeholder="https://instagram.com/username"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                />
              </div>
            </div>

            {/* TikTok */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-medium">TikTok</div>
                  <div className="text-sm text-muted-foreground">
                    {tiktokConnected ? (isGerman ? "Verbunden" : "Connected") : (isGerman ? "Nicht verbunden" : "Not connected")}
                  </div>
                </div>
                <Button 
                  variant={tiktokConnected ? "destructive" : "default"}
                  size="sm"
                  onClick={() => handlePlatformConnect('tiktok')}
                >
                  {tiktokConnected ? "Disconnect" : "Connect"}
                </Button>
              </div>
              <div>
                <Label>TikTok URL</Label>
                <Input 
                  placeholder="https://tiktok.com/@username"
                  value={tiktokUrl}
                  onChange={(e) => setTiktokUrl(e.target.value)}
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

{/* Privacy Dialog */}
      <Dialog open={privacyDialogOpen} onOpenChange={setPrivacyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              {isGerman ? "Datenschutz & Sicherheit" : "Privacy & Security"}
              <Button variant="ghost" size="icon" onClick={() => setPrivacyDialogOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {isGerman 
                ? "Hier findest du unsere rechtlichen Dokumente:" 
                : "Here you can find our legal documents:"}
            </p>
            <div className="flex flex-col gap-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  setPrivacyDialogOpen(false);
                  navigate("/privacy");
                }}
              >
                <Shield className="w-4 h-4 mr-2" />
                {isGerman ? "Datenschutzerklärung" : "Privacy Policy"}
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  setPrivacyDialogOpen(false);
                  navigate("/terms");
                }}
              >
                <Shield className="w-4 h-4 mr-2" />
                {isGerman ? "AGB / Nutzungsbedingungen" : "Terms of Service"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default Settings;