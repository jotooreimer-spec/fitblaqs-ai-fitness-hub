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
import { Dumbbell, Zap, Heart, Play, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { completeOnboarding, checkOnboardingStatus } from "@/lib/auth";
import { toast } from "sonner";
import onboardingBg from "@/assets/onboarding-bg.jpg";
import levelImg from "@/assets/upperbody.png";
import powerImg from "@/assets/middlebody.png";
import healthyImg from "@/assets/protein.jpg";
import startImg from "@/assets/bodyworkout-bg.png";

const HEALTH_KEYS = ["sleep", "stress", "diet", "activity"];

const healthLabels = {
  sleep: { de: "Schlaf", en: "Sleep" },
  stress: { de: "Stress", en: "Stress" },
  diet: { de: "Ernährung", en: "Diet" },
  activity: { de: "Aktivität", en: "Activity" },
};

const Onboarding = () => {
  const navigate = useNavigate();

  const [isGerman, setIsGerman] = useState(true);
  const [userId, setUserId] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [isSaving, setIsSaving] = useState(false);

  const [levelDialogOpen, setLevelDialogOpen] = useState(false);
  const [powerDialogOpen, setPowerDialogOpen] = useState(false);
  const [healthyDialogOpen, setHealthyDialogOpen] = useState(false);

  const [level, setLevel] = useState("");
  const [bodyType, setBodyType] = useState("");
  const [healthOptions, setHealthOptions] = useState<string[]>([]);

  const t = (de: string, en: string) => (isGerman ? de : en);

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

  const saveProfileField = async (values: { athlete_level?: string; body_type?: string }) => {
    if (!userId) {
      navigate("/login", { replace: true });
      return false;
    }

    const { error } = await supabase
      .from("profiles")
      .upsert({ user_id: userId, ...values }, { onConflict: "user_id" });

    if (error) {
      toast.error(t("Fehler beim Speichern", "Error saving"));
      return false;
    }

    return true;
  };

  const saveLevel = async () => {
    if (!level || !userId) return;
    const saved = await saveProfileField({ athlete_level: level });
    if (saved) {
      setLevelDialogOpen(false);
      toast.success(t("Level gespeichert", "Level saved"));
    }
  };

  const savePower = async () => {
    if (!bodyType || !userId) return;
    const saved = await saveProfileField({ body_type: bodyType });
    if (saved) {
      setPowerDialogOpen(false);
      toast.success(t("Körpertyp gespeichert", "Body type saved"));
    }
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
    setIsSaving(true);
    const profileSaved = await saveProfileField({ athlete_level: level, body_type: bodyType });
    if (!profileSaved) {
      setIsSaving(false);
      return;
    }
    const success = await completeOnboarding(userId);
    if (success) {
      navigate("/loading", { replace: true });
    } else {
      toast.error(t("Fehler beim Speichern", "Error saving"));
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <h1 className="text-3xl font-bold text-white animate-pulse">FitBlaqs</h1>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative bg-cover bg-bottom"
      style={{ backgroundImage: `url(${onboardingBg})` }}
    >
      <div className="absolute inset-0 bg-black/70" />

      <div className="relative z-10 w-full max-w-lg space-y-4 pb-28 sm:pb-0">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-4xl font-bold text-white">FitBlaqs</h1>
          <p className="text-white/70 text-sm">{t("Power & Healthy", "Power & Healthy")}</p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card
            onClick={() => setLevelDialogOpen(true)}
            className={`relative overflow-hidden p-4 h-36 cursor-pointer transition hover:scale-105 border bg-cover bg-center ${
              level ? "border-green-400/70 ring-2 ring-green-400/60" : "border-white/10"
            }`}
          >
            <img src={levelImg} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/55" />
            <div className="relative z-10">
              <Dumbbell className="w-8 h-8 text-white mb-2" />
              <h3 className="text-white font-semibold">Level</h3>
              <p className="text-white/70 text-xs">{t("Fitness-Level", "Fitness level")}</p>
              {level && <CheckCircle2 className="absolute right-0 top-0 h-5 w-5 text-green-300" />}
            </div>
          </Card>

          <Card
            onClick={() => setPowerDialogOpen(true)}
            className={`relative overflow-hidden p-4 h-36 cursor-pointer transition hover:scale-105 border bg-cover bg-center ${
              bodyType ? "border-green-400/70 ring-2 ring-green-400/60" : "border-white/10"
            }`}
          >
            <img src={powerImg} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/55" />
            <div className="relative z-10">
              <Zap className="w-8 h-8 text-white mb-2" />
              <h3 className="text-white font-semibold">Power</h3>
              <p className="text-white/70 text-xs">{t("Körpertyp", "Body type")}</p>
              {bodyType && <CheckCircle2 className="absolute right-0 top-0 h-5 w-5 text-green-300" />}
            </div>
          </Card>

          <Card
            onClick={() => setHealthyDialogOpen(true)}
            className={`relative overflow-hidden p-4 h-36 cursor-pointer transition hover:scale-105 border bg-cover bg-center ${
              healthOptions.length > 0 ? "border-green-400/70 ring-2 ring-green-400/60" : "border-white/10"
            }`}
          >
            <img src={healthyImg} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/55" />
            <div className="relative z-10">
              <Heart className="w-8 h-8 text-white mb-2" />
              <h3 className="text-white font-semibold">Healthy</h3>
              <p className="text-white/70 text-xs">{t("Gesundheit", "Health info")}</p>
              {healthOptions.length > 0 && <CheckCircle2 className="absolute right-0 top-0 h-5 w-5 text-green-300" />}
            </div>
          </Card>

          <Card
            onClick={() => !isSaving && handleStart()}
            className="relative overflow-hidden p-4 h-36 cursor-pointer transition hover:scale-105 border border-primary/60 bg-cover bg-center"
          >
            <img src={startImg} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/70 to-black/70" />
            <div className="relative z-10">
              <Play className="w-8 h-8 text-white mb-2" />
              <h3 className="text-white font-semibold">
                {t("Start", "Start")}
              </h3>
              <p className="text-white/80 text-xs">
                {t("Workout", "Workout")}
              </p>
              {isSaving && (
                <Loader2 className="w-4 h-4 text-white animate-spin mt-2" />
              )}
            </div>
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
              { v: "professional", de: "Profi", en: "Professional" },
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
              { v: "ectomorph", de: "Fett", en: "Fat" },
              { v: "mesomorph", de: "Schlank", en: "Slim" },
              { v: "endomorph", de: "Muskulös", en: "Muscular" },
              { v: "defined", de: "Definiert", en: "Defined" },
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
                <span>{t(healthLabels[k as keyof typeof healthLabels].de, healthLabels[k as keyof typeof healthLabels].en)}</span>
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
