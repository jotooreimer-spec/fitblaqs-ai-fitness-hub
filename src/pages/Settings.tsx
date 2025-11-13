import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, User, Bell, CreditCard, Globe, Shield } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { signOut } from "@/lib/auth";

const Settings = () => {
  const navigate = useNavigate();
  const [isGerman, setIsGerman] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
        return;
      }

      const user = session.user;
      const metadata = user.user_metadata;
      
      setUserData({
        name: metadata.name || metadata.full_name || "User",
        email: user.email,
        language: metadata.language || "de"
      });
      
      setIsGerman(metadata.language === "de");
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

  const settingsSections = [
    {
      icon: User,
      title: isGerman ? "Profil bearbeiten" : "Edit Profile",
      description: isGerman ? "Name, Gewicht, Größe ändern" : "Change name, weight, height",
    },
    {
      icon: Bell,
      title: isGerman ? "Benachrichtigungen" : "Notifications",
      description: isGerman ? "Erinnerungen verwalten" : "Manage reminders",
    },
    {
      icon: CreditCard,
      title: isGerman ? "Abo & Zahlung" : "Subscription & Payment",
      description: isGerman ? "Premium-Funktionen" : "Premium features",
    },
    {
      icon: Globe,
      title: isGerman ? "Sprache" : "Language",
      description: userData?.language === "de" ? "Deutsch 🇩🇪" : "English 🇬🇧",
    },
    {
      icon: Shield,
      title: isGerman ? "Datenschutz" : "Privacy",
      description: isGerman ? "Daten & Sicherheit" : "Data & Security",
    },
  ];

  if (!userData) return null;

  return (
    <div className="min-h-screen pb-24 gradient-male">
      <div className="max-w-screen-xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {isGerman ? "Einstellungen" : "Settings"}
          </h1>
          <p className="text-muted-foreground">
            {isGerman ? "Dein FitBlaqs-Profil verwalten" : "Manage your FitBlaqs profile"}
          </p>
        </div>

        {/* Profile Card */}
        <Card className="gradient-card card-shadow border-white/10 p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-10 h-10 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{userData.name}</h2>
              <p className="text-muted-foreground">{userData.email}</p>
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
                className="gradient-card card-shadow border-white/10 p-5 hover:border-primary/50 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <Icon className="w-6 h-6 text-primary" />
                  <div className="flex-1">
                    <div className="font-semibold">{section.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {section.description}
                    </div>
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
        <div className="text-center mt-8 text-sm text-muted-foreground">
          FitBlaqs v1.0.0
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Settings;
