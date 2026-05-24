import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dumbbell, Zap, Heart, Play, Crown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { completeOnboarding, checkOnboardingStatus } from "@/lib/auth";
import { toast } from "sonner";
import onboardingBg from "@/assets/onboarding-bg.jpg";
import fitblaqsLogo from "@/assets/fitblaqs-logo.png";
import levelImg from "@/assets/upperbody.png";
import powerImg from "@/assets/middlebody.png";
import healthyImg from "@/assets/protein.jpg";
import startImg from "@/assets/bodyworkout-bg.png";

declare global {
  interface Window {
    getDigitalGoodsService?: (provider: string) => Promise<any>;
  }
}

const HEALTH_KEYS = ["sleep", "stress", "diet", "activity"];

const Onboarding = () => {
  const navigate = useNavigate();

  const [isGerman, setIsGerman] = useState(true);
  const [userId, setUserId] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [hasPremium, setHasPremium] = useState(false);
  const [isPremiumLoading, setIsPremiumLoading] = useState(false);

  const [levelDialogOpen, setLevelDialogOpen] = useState(false);
  const [powerDialogOpen, setPowerDialogOpen] = useState(false);
  const [healthyDialogOpen, setHealthyDialogOpen] = useState(false);

  const [level, setLevel] = useState("");
  const [bodyType, setBodyType] = useState("");
  const [healthOptions, setHealthOptions] = useState<string[]>([]);

  const t = (de: string, en: string) => (isGerman ? de : en);

  const checkPurchase = async () => {
    try {
      if (!window.getDigitalGoodsService) return;
      const service = await window.getDigitalGoodsService(
        "https://play.google.com/billing"
      );
      const purchases = await service.listPurchases();
      if (purchases?.length > 0) setHasPremium(true);
    } catch (e) {
      console.error(e);
    }
  };

  const buyPremium = async (): Promise<boolean> => {
    try {
      setIsPremiumLoading(true);
      if (!window.getDigitalGoodsService) {
        setHasPremium(true);
        toast.success(t("Premium aktiviert", "Premium activated"));
        return true;
      }
      const service = await window.getDigitalGoodsService(
        "https://play.google.com/billing"
      );
      await service.launchBillingFlow("fitblaqspremium");
      await checkPurchase();
      toast.success(t("Premium aktiviert", "Premium activated"));
      return true;
    } catch {
      toast.error(t("Kauf fehlgeschlagen", "Purchase failed"));
      return false;
    } finally {
      setIsPremiumLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          navigate("/login", { replace: true });
          return;
        }

        setUserId(session.user.id);
        setIsGerman(session.user.user_metadata?.language === "de");

        await checkPurchase();

        const done = await checkOnboardingStatus(session.user.id);
        if (done) {
          navigate("/dashboard", { replace: true });
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("athlete_level, body_type")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (profile) {
          if (profile.athlete_level) setLevel(profile.athlete_level);
          if (profile.body_type) setBodyType(profile.body_type);
        }
      } catch {
        navigate("/login", { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [navigate]);

  const saveLevel = async () => {
    if (!level || !userId) return;
    await supabase.from("profiles").update({ athlete_level: level }).eq("user_id", userId);
    setLevelDialogOpen(false);
    toast.success(t("Level gespeichert", "Level saved"));
  };

  const savePower = async () => {
    if (!bodyType || !userId) return;
    await supabase.from("profiles").update({ body_type: bodyType }).eq("user_id", userId);
    setPowerDialogOpen(false);
    toast.success(t("Körpertyp gespeichert", "Body type saved"));
  };

  const saveHealth = () => {
    setHealthyDialogOpen(false);
    toast.success(t("Gesundheitsdaten gespeichert", "Health data saved"));
  };

  const toggleHealth = (value: string) => {
    setHealthOptions((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const allCompleted = !!level && !!bodyType && healthOptions.length > 0;

  const handleStart = async () => {
    if (!allCompleted) {
      toast.error(t("Bitte fülle alle Felder aus", "Please complete all fields"));
      return;
    }
    if (!userId) {
      navigate("/login", { replace: true });
      return;
    }
    let premiumOk = hasPremium;
    if (!premiumOk) {
      premiumOk = await buyPremium();
      if (!premiumOk) return;
    }
    const success = await completeOnboarding(userId);
    if (success) {
      navigate("/loading", { replace: true });
    } else {
      toast.error(t("Fehler beim Speichern", "Error saving"));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <img src={fitblaqsLogo} alt="FitBlaqs" className="w-20 animate-pulse" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative bg-cover bg-center"
      style={{ backgroundImage: `url(${onboardingBg})` }}
    >
      <div className="absolute inset-0 bg-black/70" />

      <div className="relative z-10 w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <img src={fitblaqsLogo} alt="FitBlaqs" className="w-20 h-20 mx-auto" />
          <h1 className="text-3xl font-bold text-white">FitBlaqs</h1>
          <p className="text-white/70 text-sm">{t("Power & Healthy", "Power & Healthy")}</p>
        </div>

        {/* Premium banner */}
        {!hasPremium && (
          <Card className="p-4 bg-gradient-to-r from-amber-600/30 to-yellow-500/30 border-amber-400/40 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-amber-100">
              <Crown className="w-5 h-5" />
              <span className="font-semibold">{t("Premium erforderlich", "Premium required")}</span>
            </div>
            <p className="text-amber-50/80 text-xs mt-1">
              {t("Aktiviere Premium um fortzufahren", "Activate premium to continue")}
            </p>
          </Card>
        )}

        {/* Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card
            onClick={() => setLevelDialogOpen(true)}
            className={`p-4 cursor-pointer transition hover:scale-105 backdrop-blur-sm ${
              level
                ? "bg-green-600/70 border-green-400/50"
                : "bg-black/60 border-white/10"
            }`}
          >
            <Dumbbell className="w-8 h-8 text-white mb-2" />
            <h3 className="text-white font-semibold">Level</h3>
            <p className="text-white/60 text-xs">{t("Fitness-Level", "Fitness level")}</p>
          </Card>

          <Card
            onClick={() => setPowerDialogOpen(true)}
            className={`p-4 cursor-pointer transition hover:scale-105 backdrop-blur-sm ${
              bodyType
                ? "bg-green-600/70 border-green-400/50"
                : "bg-black/60 border-white/10"
            }`}
          >
            <Zap className="w-8 h-8 text-white mb-2" />
            <h3 className="text-white font-semibold">Power</h3>
            <p className="text-white/60 text-xs">{t("Körpertyp", "Body type")}</p>
          </Card>

          <Card
            onClick={() => setHealthyDialogOpen(true)}
            className={`p-4 cursor-pointer transition hover:scale-105 backdrop-blur-sm ${
              healthOptions.length > 0
                ? "bg-green-600/70 border-green-400/50"
                : "bg-black/60 border-white/10"
            }`}
          >
            <Heart className="w-8 h-8 text-white mb-2" />
            <h3 className="text-white font-semibold">Healthy</h3>
            <p className="text-white/60 text-xs">{t("Gesundheit", "Health info")}</p>
          </Card>

          <Card
            onClick={handleStart}
            className="p-4 cursor-pointer transition hover:scale-105 backdrop-blur-sm bg-primary/80 border-primary/50"
          >
            {hasPremium ? (
              <Play className="w-8 h-8 text-white mb-2" />
            ) : (
              <Crown className="w-8 h-8 text-white mb-2" />
            )}
            <h3 className="text-white font-semibold">
              {hasPremium ? t("Start", "Start") : t("Premium", "Premium")}
            </h3>
            <p className="text-white/70 text-xs">
              {hasPremium ? t("Workout", "Workout") : t("Aktivieren", "Activate")}
            </p>
            {isPremiumLoading && (
              <Loader2 className="w-4 h-4 text-white animate-spin mt-2" />
            )}
          </Card>
        </div>

        {!allCompleted && (
          <p className="text-center text-white/60 text-xs">
            {t(
              "Fülle alle Felder aus um fortzufahren",
              "Complete all fields to continue"
            )}
          </p>
        )}
      </div>

      {/* LEVEL DIALOG */}
      <Dialog open={levelDialogOpen} onOpenChange={setLevelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Wähle dein Level", "Choose your level")}</DialogTitle>
          </DialogHeader>
          <RadioGroup value={level} onValueChange={setLevel}>
            {[
              { v: "beginner", de: "Anfänger", en: "Beginner" },
              { v: "intermediate", de: "Fortgeschritten", en: "Intermediate" },
              { v: "pro", de: "Profi", en: "Professional" },
            ].map((o) => (
              <div key={o.v} className="flex items-center gap-2">
                <RadioGroupItem value={o.v} id={`lvl-${o.v}`} />
                <Label htmlFor={`lvl-${o.v}`}>{t(o.de, o.en)}</Label>
              </div>
            ))}
          </RadioGroup>
          <Button onClick={saveLevel} disabled={!level}>
            {t("Speichern", "Save")}
          </Button>
        </DialogContent>
      </Dialog>

      {/* POWER DIALOG */}
      <Dialog open={powerDialogOpen} onOpenChange={setPowerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Wähle deinen Körpertyp", "Choose your body type")}</DialogTitle>
          </DialogHeader>
          <RadioGroup value={bodyType} onValueChange={setBodyType}>
            {[
              { v: "ectomorph", de: "Schlank", en: "Ectomorph" },
              { v: "mesomorph", de: "Athletisch", en: "Mesomorph" },
              { v: "endomorph", de: "Kräftig", en: "Endomorph" },
            ].map((o) => (
              <div key={o.v} className="flex items-center gap-2">
                <RadioGroupItem value={o.v} id={`pw-${o.v}`} />
                <Label htmlFor={`pw-${o.v}`}>{t(o.de, o.en)}</Label>
              </div>
            ))}
          </RadioGroup>
          <Button onClick={savePower} disabled={!bodyType}>
            {t("Speichern", "Save")}
          </Button>
        </DialogContent>
      </Dialog>

      {/* HEALTH DIALOG */}
      <Dialog open={healthyDialogOpen} onOpenChange={setHealthyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Gesundheits-Infos", "Health info")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {HEALTH_KEYS.map((k) => (
              <label key={k} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={healthOptions.includes(k)}
                  onCheckedChange={() => toggleHealth(k)}
                />
                <span className="capitalize">{k}</span>
              </label>
            ))}
          </div>
          <Button onClick={saveHealth} disabled={healthOptions.length === 0}>
            {t("Speichern", "Save")}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Onboarding;
