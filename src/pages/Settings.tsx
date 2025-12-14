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
import { LogOut, User, Bell, Globe, Shield, X, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { signOut } from "@/lib/auth";
import { AvatarUpload } from "@/components/AvatarUpload";
import { languages, useLanguage } from "@/contexts/LanguageContext";
import { PasswordChangeDialog } from "@/components/PasswordChangeDialog";
import settingsBg from "@/assets/settings-bg.jpg";
import fitblaqsSupportIcon from "@/assets/fitblaqs-support-icon.png";
import fitblaqsLogoSmall from "@/assets/fitblaqs-logo-small.png";

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
  const [privacyContentDialogOpen, setPrivacyContentDialogOpen] = useState(false);
  const [termsContentDialogOpen, setTermsContentDialogOpen] = useState(false);
  const [shopDialogOpen, setShopDialogOpen] = useState(false);
  
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  
  // Settings states
  const [updateNotifications, setUpdateNotifications] = useState(false);
  
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
    // Robust logout for Web, PWA, and Android APK
    try {
      await signOut();
    } catch (e) {
      // Ignore errors - proceed with logout anyway
    }
    
    document.documentElement.classList.remove("theme-female");
    toast.success(t("logout") + " ✓");
    
    // Navigate to landing page
    window.location.href = "/";
    
    // Fallback reload for APK
    setTimeout(() => {
      try {
        window.location.reload();
      } catch (e) {
        // Ignore
      }
    }, 200);
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
      icon: Lock,
      title: language === "de" ? "Passwort ändern" : "Change Password",
      description: language === "de" ? "Passwort aktualisieren" : "Update your password",
      onClick: () => setPasswordDialogOpen(true),
    },
    {
      icon: Bell,
      title: t("notifications"),
      description: language === "de" ? "Update Benachrichtigungen" : "Update notifications",
      onClick: () => setNotificationsDialogOpen(true),
    },
    {
      icon: Globe,
      title: t("language"),
      description: languages.find(l => l.code === language)?.name + " " + languages.find(l => l.code === language)?.flag || "English 🇬🇧",
      onClick: () => setLanguageDialogOpen(true),
    },
    {
      icon: Mail,
      title: "Fitblaqs Support Service",
      description: "Supportservice@Fitblaq.com",
      onClick: () => setShopDialogOpen(true),
      customIcon: fitblaqsSupportIcon,
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
                  {(section as any).customIcon ? (
                    <img src={(section as any).customIcon} alt={section.title} className="w-6 h-6 rounded object-cover" />
                  ) : (
                    <Icon className="w-6 h-6 text-primary" />
                  )}
                  <div className="flex-1">
                    <div className="font-semibold text-white">{section.title}</div>
                    <div className="text-sm text-white/70">{section.description}</div>
                  </div>
                  {section.title === "Fitblaqs Support Service" && (
                    <Mail className="w-4 h-4 text-white/50" />
                  )}
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

        {/* App Logo */}
        <div className="flex justify-center mt-8">
          <img src={fitblaqsLogoSmall} alt="FitBlaqs" className="w-16 h-16 object-contain" />
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

      {/* Privacy & Security Dialog */}
      <Dialog open={privacyDialogOpen} onOpenChange={setPrivacyDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              Privacy & Security
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
                setPrivacyContentDialogOpen(true);
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
                setTermsContentDialogOpen(true);
              }}
            >
              <Shield className="w-4 h-4 mr-2" />
              {language === "de" ? "Nutzungsbedingungen" : "Terms of Service"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Privacy Policy Content Dialog */}
      <Dialog open={privacyContentDialogOpen} onOpenChange={setPrivacyContentDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              {language === "de" ? "Datenschutzerklärung" : "Privacy Policy"}
              <Button variant="ghost" size="icon" onClick={() => setPrivacyContentDialogOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="prose prose-sm max-w-none">
            {language === "de" ? (
              <>
                <h3 className="font-bold text-lg">1. Verantwortlicher</h3>
                <p>FitBlaq Company<br/>E-Mail: Supportservice@Fitblaq.com</p>

                <h3 className="font-bold text-lg mt-4">2. Erhebung und Verarbeitung personenbezogener Daten</h3>
                <p>Wir erheben und verarbeiten folgende personenbezogene Daten:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Kontoinformationen (Name, E-Mail-Adresse, Passwort)</li>
                  <li>Profilinformationen (Größe, Gewicht, Körpertyp, Sportlevel)</li>
                  <li>Trainingsdaten (Übungen, Sätze, Wiederholungen, Gewichte)</li>
                  <li>Ernährungsdaten (Mahlzeiten, Kalorien, Makronährstoffe)</li>
                  <li>Jogging-Daten (Distanz, Dauer, verbrannte Kalorien)</li>
                  <li>Gewichtshistorie</li>
                  <li>Hochgeladene Bilder und Videos</li>
                </ul>

                <h3 className="font-bold text-lg mt-4">3. Zweck der Datenverarbeitung</h3>
                <p>Ihre Daten werden ausschließlich verwendet, um die Fitness-App-Dienste bereitzustellen.</p>

                <h3 className="font-bold text-lg mt-4">4. Datensicherheit</h3>
                <p>Alle Daten werden mittels TLS/SSL verschlüsselt übertragen und sicher gespeichert.</p>

                <h3 className="font-bold text-lg mt-4">5. Ihre Rechte</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Auskunftsrecht</strong></li>
                  <li><strong>Recht auf Berichtigung</strong></li>
                  <li><strong>Recht auf Löschung</strong></li>
                  <li><strong>Recht auf Datenübertragbarkeit</strong></li>
                  <li><strong>Widerspruchsrecht</strong></li>
                </ul>

                <h3 className="font-bold text-lg mt-4">6. Speicherdauer</h3>
                <p>Ihre Daten werden 30 Tage nach Kontolöschung gelöscht. Pro Athlete-Daten nach 5 Tagen.</p>

                <h3 className="font-bold text-lg mt-4">7. Kontakt</h3>
                <p>FitBlaq Company<br/>E-Mail: Supportservice@Fitblaq.com</p>
              </>
            ) : (
              <>
                <h3 className="font-bold text-lg">1. Data Controller</h3>
                <p>FitBlaq Company<br/>Email: Supportservice@Fitblaq.com</p>

                <h3 className="font-bold text-lg mt-4">2. Collection and Processing of Personal Data</h3>
                <p>We collect and process the following personal data:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Account information (name, email address, password)</li>
                  <li>Profile information (height, weight, body type, athletic level)</li>
                  <li>Training data (exercises, sets, repetitions, weights)</li>
                  <li>Nutrition data (meals, calories, macronutrients)</li>
                  <li>Jogging data (distance, duration, calories burned)</li>
                  <li>Weight history</li>
                  <li>Uploaded images and videos</li>
                </ul>

                <h3 className="font-bold text-lg mt-4">3. Purpose of Data Processing</h3>
                <p>Your data is used exclusively to provide fitness app services.</p>

                <h3 className="font-bold text-lg mt-4">4. Data Security</h3>
                <p>All data is transmitted using TLS/SSL encryption and stored securely.</p>

                <h3 className="font-bold text-lg mt-4">5. Your Rights</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Right to access</strong></li>
                  <li><strong>Right to rectification</strong></li>
                  <li><strong>Right to erasure</strong></li>
                  <li><strong>Right to data portability</strong></li>
                  <li><strong>Right to object</strong></li>
                </ul>

                <h3 className="font-bold text-lg mt-4">6. Data Retention</h3>
                <p>Your data is deleted 30 days after account deletion. Pro Athlete data after 5 days.</p>

                <h3 className="font-bold text-lg mt-4">7. Contact</h3>
                <p>FitBlaq Company<br/>Email: Supportservice@Fitblaq.com</p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Terms of Service Content Dialog */}
      <Dialog open={termsContentDialogOpen} onOpenChange={setTermsContentDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              {language === "de" ? "Nutzungsbedingungen" : "Terms of Service"}
              <Button variant="ghost" size="icon" onClick={() => setTermsContentDialogOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="prose prose-sm max-w-none">
            {language === "de" ? (
              <>
                <h3 className="font-bold text-lg">1. Geltungsbereich</h3>
                <p>Diese Nutzungsbedingungen gelten für die Nutzung der FitBlaqs-App.</p>

                <h3 className="font-bold text-lg mt-4">2. Nutzerkonto</h3>
                <p>Zur Nutzung der App ist ein Benutzerkonto erforderlich.</p>

                <h3 className="font-bold text-lg mt-4">3. Pro-Zugang</h3>
                <p>Pro-Zugang wird über unsere Website aktiviert. Für weitere Informationen kontaktieren Sie uns bitte.</p>

                <h3 className="font-bold text-lg mt-4">4. KI-Funktionen</h3>
                <p>Die KI-gestützte Analyse dient nur zu Informationszwecken.</p>

                <h3 className="font-bold text-lg mt-4">5. Nutzungsregeln</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Keine illegalen Inhalte hochladen</li>
                  <li>Die App nicht missbrauchen</li>
                  <li>Keine falschen Informationen angeben</li>
                </ul>

                <h3 className="font-bold text-lg mt-4">6. Haftungsausschluss</h3>
                <p>Konsultieren Sie vor Beginn eines Trainingsprogramms einen Arzt.</p>

                <h3 className="font-bold text-lg mt-4">7. Kündigung</h3>
                <p>Konto jederzeit in Einstellungen löschbar.</p>

                <h3 className="font-bold text-lg mt-4">8. Altersfreigabe</h3>
                <p>Diese App ist für Benutzer ab 12 Jahren (12+) geeignet.</p>

                <h3 className="font-bold text-lg mt-4">9. Kontakt</h3>
                <p>Supportservice@Fitblaq.com</p>
              </>
            ) : (
              <>
                <h3 className="font-bold text-lg">1. Scope</h3>
                <p>These Terms of Service apply to the use of the FitBlaqs app.</p>

                <h3 className="font-bold text-lg mt-4">2. User Account</h3>
                <p>A user account is required to use the app.</p>

                <h3 className="font-bold text-lg mt-4">3. Pro Access</h3>
                <p>Pro access is activated via our website. For more information, please contact us.</p>

                <h3 className="font-bold text-lg mt-4">4. AI Features</h3>
                <p>AI-powered analysis is for informational purposes only.</p>

                <h3 className="font-bold text-lg mt-4">5. Usage Rules</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Not upload illegal content</li>
                  <li>Not misuse the app</li>
                  <li>Not provide false information</li>
                </ul>

                <h3 className="font-bold text-lg mt-4">6. Disclaimer</h3>
                <p>Consult a physician before starting any training program.</p>

                <h3 className="font-bold text-lg mt-4">7. Termination</h3>
                <p>Delete account anytime in Settings.</p>

                <h3 className="font-bold text-lg mt-4">8. Age Rating</h3>
                <p>This app is suitable for users aged 12 and above (12+).</p>

                <h3 className="font-bold text-lg mt-4">9. Contact</h3>
                <p>Supportservice@Fitblaq.com</p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Change Dialog */}
      <PasswordChangeDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
        userEmail={userData?.email || ""}
      />

      {/* Fitblaqs Support Service Dialog */}
      <Dialog open={shopDialogOpen} onOpenChange={setShopDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              Fitblaqs Support Service
              <Button variant="ghost" size="icon" onClick={() => setShopDialogOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-center">
            <img src={fitblaqsSupportIcon} alt="Fitblaqs Support Service" className="w-20 h-20 mx-auto rounded-xl" />
            <div>
              <p className="text-lg font-semibold mb-2">{language === "de" ? "Kontaktiere uns" : "Contact Us"}</p>
              <p className="text-muted-foreground mb-4">
                {language === "de" 
                  ? "Für Anfragen und Support erreichst du uns unter:" 
                  : "For inquiries and support, reach us at:"}
              </p>
            </div>
            <Card className="p-4 bg-primary/10 border-primary/30 cursor-pointer hover:bg-primary/20 transition-colors"
              onClick={() => window.location.href = "mailto:Supportservice@Fitblaq.com?subject=FitBlaqs%20Support%20Inquiry"}
            >
              <div className="flex items-center justify-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                <span className="font-mono text-lg">Supportservice@Fitblaq.com</span>
              </div>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default Settings;