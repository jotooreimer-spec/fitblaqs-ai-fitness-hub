import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  RadioGroup,
  RadioGroupItem
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dumbbell, Zap, Heart, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  completeOnboarding,
  checkOnboardingStatus
} from "@/lib/auth";
import { toast } from "sonner";
import onboardingBg from "@/assets/onboarding-bg.jpg";
import fitblaqsLogo from "@/assets/fitblaqs-logo.png";

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

  // ---------- SESSION ----------
  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          navigate("/login");
          return;
        }

        const id = session.user.id;
        setUserId(id);
        setIsGerman(session.user.user_metadata.language === "de");

        await checkPurchase();

        const done = await checkOnboardingStatus(id);
        if (done) {
          navigate("/dashboard");
          return;
        }

        const { data } = await supabase
          .from("profiles")
          .select("athlete_level, body_type")
          .eq("user_id", id)
          .single();

        if (data) {
          setLevel(data.athlete_level || "");
          setBodyType(data.body_type || "");
        }

      } catch (e) {
        navigate("/login");
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  // ---------- PREMIUM ----------
  const checkPurchase = async () => {
    try {
      if (!window.getDigitalGoodsService) return;

      const service = await window.getDigitalGoodsService(
        "https://play.google.com/billing"
      );

      const purchases = await service.listPurchases();

      setHasPremium(purchases?.length > 0);
    } catch (e) {
      console.error(e);
    }
  };

  const buyPremium = async () => {
    try {
      setIsPremiumLoading(true);

      const service = await window.getDigitalGoodsService(
        "https://play.google.com/billing"
      );

      await service.launchBillingFlow("fitblaqspremium");

      await checkPurchase();

      toast.success(isGerman ? "Premium aktiv" : "Premium active");
    } catch {
      toast.error(isGerman ? "Fehler beim Kauf" : "Purchase failed");
    } finally {
      setIsPremiumLoading(false);
    }
  };

  // ---------- SAVE ----------
  const saveLevel = async () => {
    await supabase
      .from("profiles")
      .update({ athlete_level: level })
      .eq("user_id", userId);

    setLevelDialogOpen(false);
  };

  const savePower = async () => {
    await supabase
      .from("profiles")
      .update({ body_type: bodyType })
      .eq("user_id", userId);

    setPowerDialogOpen(false);
  };

  const saveHealth = () => {
    setHealthyDialogOpen(false);
  };

  // ---------- START ----------
  const start = async () => {
    if (!level || !bodyType || healthOptions.length === 0) {
      toast.error("Bitte alles ausfüllen");
      return;
    }

    if (!hasPremium) {
      await buyPremium();
      return;
    }

    const success = await completeOnboarding(userId);

    if (success) {
      navigate("/loading");
    }
  };

  const toggleHealth = (value: string) => {
    setHealthOptions((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <img src={fitblaqsLogo} className="w-20 animate-pulse" />
      </div>
    );
  }

  const allCompleted =
    level && bodyType && healthOptions.length > 0;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative"
      style={{ backgroundImage: `url(${onboardingBg})` }}
    >
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 w-full max-w-lg">

        {/* HEADER */}
        <div className="text-center mb-6">
          <img src={fitblaqsLogo} className="w-16 mx-auto" />
          <h1 className="text-white text-3xl">FitBlaqs</h1>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-2 gap-3">

          <Card onClick={() => setLevelDialogOpen(true)} className="p-4">
            <Dumbbell /> Level
          </Card>

          <Card onClick={() => setPowerDialogOpen(true)} className="p-4">
            <Zap /> Power
          </Card>

          <Card onClick={() => setHealthyDialogOpen(true)} className="p-4">
            <Heart /> Healthy
          </Card>

          <Card onClick={start} className="p-4">
            <Play />
            {hasPremium ? "Start" : "Premium"}
          </Card>
        </div>

        {/* HEALTH OPTIONS */}
        <div className="mt-4 text-white">
          <label className="flex gap-2">
            <Checkbox
              checked={healthOptions.includes("sleep")}
              onCheckedChange={() => toggleHealth("sleep")}
            />
            Sleep
          </label>
        </div>

        {/* LEVEL DIALOG */}
        <Dialog open={levelDialogOpen} onOpenChange={setLevelDialogOpen}>
          <DialogContent>
            <DialogTitle>Level</DialogTitle>

            <RadioGroup value={level} onValueChange={setLevel}>
              <RadioGroupItem value="beginner" /> Beginner
              <RadioGroupItem value="pro" /> Pro
            </RadioGroup>

            <Button onClick={saveLevel}>Save</Button>
          </DialogContent>
        </Dialog>

        {/* POWER DIALOG */}
        <Dialog open={powerDialogOpen} onOpenChange={setPowerDialogOpen}>
          <DialogContent>
            <DialogTitle>Power</DialogTitle>
            <Button onClick={savePower}>Save</Button>
          </DialogContent>
        </Dialog>

        {/* HEALTH DIALOG */}
        <Dialog open={healthyDialogOpen} onOpenChange={setHealthyDialogOpen}>
          <DialogContent>
            <DialogTitle>Healthy</DialogTitle>
            <Button onClick={saveHealth}>Save</Button>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
};

export default Onboarding;
