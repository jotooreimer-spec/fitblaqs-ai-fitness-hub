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
import { LogOut, User, Bell, Globe, Shield, X, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { signOut } from "@/lib/auth";
import { AvatarUpload } from "@/components/AvatarUpload";
import { languages, useLanguage } from "@/contexts/LanguageContext";
// WorkoutReminder removed
import settingsBg from "@/assets/settings-bg.jpg";

const Settings = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const [userData, setUserData] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [userId, setUserId] = useState<string>("");
  
  // Dialog states
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [notificationsDialogOpen, setNotificationsDialogOpen] = useState(false);
  const [languageDialogOpen, setLanguageDialogOpen] = useState(false);
  const [privacyDialogOpen, setPrivacyDialogOpen] = useState(false);
  // reminderDialogOpen removed
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  
  // Settings states
  const [pushNotifications, setPushNotifications] = useState(false);
  const [updateNotifications, setUpdateNotifications] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  
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
    // Check notification permission on mount
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      setPushNotifications(Notification.permission === 'granted');
    }

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
        language: metadata.language || "en"
      });

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
      toast.success(t("logout") + " ✓");
      navigate("/");
    } catch (error) {
      toast.error(t("error"));
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
      toast.error(t("error"));
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
    toast.success(t("saved"));
  };

  const handleLanguageChange = async (lang: "de" | "en" | "es" | "fr" | "pt" | "ru" | "tr" | "it") => {
    setLanguage(lang);
    toast.success(t("saved"));
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.error(language === 'de' ? 'Benachrichtigungen werden nicht unterstützt' : 'Notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        // Register service worker for push notifications if available
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          console.log('Service Worker ready for notifications');
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const handlePushNotificationToggle = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermission();
      if (granted) {
        setPushNotifications(true);
        toast.success(language === 'de' ? 'Push-Benachrichtigungen aktiviert' : 'Push notifications enabled');
        
        // Show test notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('FitBlaqs', {
            body: language === 'de' ? 'Benachrichtigungen sind jetzt aktiv!' : 'Notifications are now active!',
            icon: '/pwa-192x192.png'
          });
        }
      } else {
        toast.error(language === 'de' ? 'Benachrichtigungen wurden blockiert' : 'Notifications were blocked');
      }
    } else {
      setPushNotifications(false);
      toast.success(language === 'de' ? 'Push-Benachrichtigungen deaktiviert' : 'Push notifications disabled');
    }
  };

  const handleUpdateNotificationToggle = (value: boolean) => {
    setUpdateNotifications(value);
    toast.success(t("saved"));
  };

  const bodyTypeOptions = [
    { value: "ectomorph", label: { de: "Fett", en: "Fat", es: "Gordo", fr: "Gras", pt: "Gordo", ru: "Полный", tr: "Şişman", it: "Grasso" } },
    { value: "mesomorph", label: { de: "Schlank", en: "Slim", es: "Delgado", fr: "Mince", pt: "Magro", ru: "Стройный", tr: "İnce", it: "Magro" } },
    { value: "endomorph", label: { de: "Muskulös", en: "Muscular", es: "Musculoso", fr: "Musclé", pt: "Musculoso", ru: "Мускулистый", tr: "Kaslı", it: "Muscoloso" } },
    { value: "defined", label: { de: "Definiert", en: "Defined", es: "Definido", fr: "Défini", pt: "Definido", ru: "Рельефный", tr: "Kaslı", it: "Definito" } }
  ];

  const athleteLevelOptions = [
    { value: "beginner", label: { de: "Anfänger", en: "Beginner", es: "Principiante", fr: "Débutant", pt: "Iniciante", ru: "Начинающий", tr: "Başlangıç", it: "Principiante" } },
    { value: "professional", label: { de: "Profi", en: "Professional", es: "Profesional", fr: "Professionnel", pt: "Profissional", ru: "Профессионал", tr: "Profesyonel", it: "Professionista" } }
  ];

  const settingsSections = [
    {
      icon: User,
      title: t("editProfile"),
      description: language === "de" ? "Name, Gewicht, Größe ändern" : "Change name, weight, height",
      onClick: () => setProfileDialogOpen(true),
    },
    {
      icon: CreditCard,
      title: t("subscription"),
      description: "Pro Athlete & Pro Nutrition",
      onClick: () => setSubscriptionDialogOpen(true),
    },
    {
      icon: Bell,
      title: t("notifications"),
      description: language === "de" ? "Push & Update Benachrichtigungen" : "Push & Update notifications",
      onClick: () => setNotificationsDialogOpen(true),
    },
    {
      icon: Globe,
      title: t("language"),
      description: languages.find(l => l.code === language)?.name + " " + languages.find(l => l.code === language)?.flag || "English 🇬🇧",
      onClick: () => setLanguageDialogOpen(true),
    },
    {
      icon: Shield,
      title: t("privacy"),
      description: language === "de" ? "Daten & Sicherheit" : "Data & Security",
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
          <h1 className="text-4xl font-bold mb-2 text-white">{t("settings")}</h1>
          <p className="text-white/70">
            {language === "de" ? "Dein FitBlaqs-Profil verwalten" : "Manage your FitBlaqs profile"}
          </p>
        </div>

        {/* Profile Card */}
        <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-6 mb-8">
          <div className="flex items-center gap-4">
            <AvatarUpload
              userId={userId}
              currentAvatarUrl={profileData?.avatar_url}
              onUploadSuccess={(url) => setProfileData({ ...profileData, avatar_url: url })}
              isGerman={language === "de"}
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
          {t("logout")}
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
              {t("editProfile")}
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
                isGerman={language === "de"}
              />
            </div>
            <div>
              <Label>Name</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={editForm.email} disabled className="opacity-50" />
            </div>
            <div>
              <Label>{language === "de" ? "Größe (cm)" : "Height (cm)"}</Label>
              <Input type="number" value={editForm.height} onChange={(e) => setEditForm({ ...editForm, height: e.target.value })} />
            </div>
            <div>
              <Label>{language === "de" ? "Gewicht (kg)" : "Weight (kg)"}</Label>
              <Input type="number" value={editForm.weight} onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })} />
            </div>
            <div>
              <Label>{language === "de" ? "Körpertyp" : "Body Type"}</Label>
              <Select value={editForm.body_type} onValueChange={(v) => setEditForm({ ...editForm, body_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {bodyTypeOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label[language as keyof typeof opt.label] || opt.label.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Athlete Level</Label>
              <Select value={editForm.athlete_level} onValueChange={(v) => setEditForm({ ...editForm, athlete_level: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {athleteLevelOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label[language as keyof typeof opt.label] || opt.label.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSaveProfile} className="w-full">
              {t("save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Subscription Dialog */}
      <Dialog open={subscriptionDialogOpen} onOpenChange={setSubscriptionDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              {t("subscription")}
              <Button variant="ghost" size="icon" onClick={() => setSubscriptionDialogOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Card className="p-4 border-primary/50">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold">Pro Athlete</h3>
                <span className="text-2xl font-bold">€19.99/yr</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                AI training plans, body analysis
              </p>
              <Button onClick={() => navigate("/pro-subscription")} className="w-full">
                {t("learnMore")}
              </Button>
            </Card>
            
            <Card className="p-4 border-green-500/50">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold">Pro Nutrition</h3>
                <span className="text-2xl font-bold">€14.99/yr</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Food tracker, AI food analysis
              </p>
              <Button onClick={() => navigate("/pro-subscription")} className="w-full bg-green-600 hover:bg-green-700">
                {t("learnMore")}
              </Button>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notifications Dialog - Now with real PWA functionality */}
      <Dialog open={notificationsDialogOpen} onOpenChange={setNotificationsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              {t("notifications")}
              <Button variant="ghost" size="icon" onClick={() => setNotificationsDialogOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Push Notifications</div>
                <div className="text-sm text-muted-foreground">
                  {language === "de" ? "Erinnerungen erhalten" : "Receive reminders"}
                </div>
              </div>
              <Switch 
                checked={pushNotifications} 
                onCheckedChange={handlePushNotificationToggle}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Update Notifications</div>
                <div className="text-sm text-muted-foreground">
                  {language === "de" ? "Über neue Features informiert werden" : "Get notified about new features"}
                </div>
              </div>
              <Switch 
                checked={updateNotifications} 
                onCheckedChange={handleUpdateNotificationToggle}
              />
            </div>
            
            {/* PWA Install hint */}
            <div className="border-t pt-4 mt-4">
              <p className="text-xs text-muted-foreground">
                {language === "de" 
                  ? "Installiere die App für beste Benachrichtigungserfahrung"
                  : "Install the app for the best notification experience"}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Language Dialog */}
      <Dialog open={languageDialogOpen} onOpenChange={setLanguageDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              {t("language")}
              <Button variant="ghost" size="icon" onClick={() => setLanguageDialogOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
            {languages.map((lang) => (
              <Button
                key={lang.code}
                variant={language === lang.code ? "default" : "outline"}
                onClick={() => {
                  handleLanguageChange(lang.code);
                  setLanguageDialogOpen(false);
                }}
                className="justify-start"
              >
                {lang.flag} {lang.name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Privacy Dialog */}
      <Dialog open={privacyDialogOpen} onOpenChange={setPrivacyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              {t("privacy")}
              <Button variant="ghost" size="icon" onClick={() => setPrivacyDialogOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              onClick={() => {
                setPrivacyDialogOpen(false);
                navigate("/privacy-policy");
              }}
            >
              <Shield className="w-4 h-4 mr-2" />
              {language === "de" ? "Datenschutzerklärung" : "Privacy Policy"}
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => {
                setPrivacyDialogOpen(false);
                navigate("/terms-of-service");
              }}
            >
              <Shield className="w-4 h-4 mr-2" />
              {language === "de" ? "Nutzungsbedingungen" : "Terms of Service"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>


      <BottomNav />
    </div>
  );
};

export default Settings;