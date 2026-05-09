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
import { Dumbbell, Zap, Heart, Play, Crown } from "lucide-react";
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

  // ---------- PURCHASE ----------
  const checkPurchase = async () => {
    try {
      if (!window.getDigitalGoodsService) return;

      const service = await window.getDigitalGoodsService(
        "https://play.google.com/billing"
      );

      const purchases = await service.listPurchases();

      if (purchases?.length > 0) {
        setHasPremium(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const buyPremium = async () => {
    try {
      setIsPremiumLoading(true);

      if (!window.getDigitalGoodsService) {
        toast.error(
          isGerman
            ? "Google Play Billing nicht verfügbar"
            : "Billing not available"
        );
        return;
      }

      const service = await window.getDigitalGoodsService(
        "https://play.google.com/billing"
      );

      await service.launchBillingFlow("fitblaqspremium");

      await checkPurchase();

      toast.success(
        isGerman ? "Premium aktiviert" : "Premium activated"
      );
    } catch (err) {
      console.error(err);
      toast.error(isGerman ? "Fehler beim Kauf" : "Purchase failed");
    } finally {
      setIsPremiumLoading(false);
    }
  };

  // ---------- SESSION ----------
  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) return navigate("/login");

        setUserId(session.user.id);
        setIsGerman(session.user.user_metadata.language === "de");

        await checkPurchase();

        const done = await checkOnboardingStatus(session.user.id);
        if (done) return navigate("/dashboard");

        const { data } = await supabase
          .from("profiles")
          .select("athlete_level, body_type")
          .eq("user_id", session.user.id)
          .single();

        if (data) {
          setLevel(data.athlete_level || "");
          setBodyType(data.body_type || "");
        }

        setIsLoading(false);
      } catch {
        navigate("/login");
      }
    };

    init();
  }, [navigate]);

  // ---------- SAVE ----------
  const handleLevelSave = async () => {
    if (!level || !userId) return;

    await supabase
      .from("profiles")
      .update({ athlete_level: level })
      .eq("user_id", userId);

    setLevelDialogOpen(false);
    toast.success(isGerman ? "Gespeichert" : "Saved");
  };

  const handlePowerSave = async () => {
    if (!bodyType || !userId) return;

    await supabase
      .from("profiles")
      .update({ body_type: bodyType })
      .eq("user_id", userId);

    setPowerDialogOpen(false);
    toast.success(isGerman ? "Gespeichert" : "Saved");
  };

  const handleHealthySave = () => {
    setHealthyDialogOpen(false);
    toast.success(isGerman ? "Gespeichert" : "Saved");
  };

  // ---------- START ----------
  const handleStart = async () => {
    if (!level || !bodyType || healthOptions.length === 0) {
      toast.error(isGerman ? "Felder fehlen" : "Missing fields");
      return;
    }

    if (!hasPremium) return buyPremium();

    const success = await completeOnboarding(userId);

    if (success) {
      toast.success("Welcome!");
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

  const allCompleted =
    !!level && !!bodyType && healthOptions.length > 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <img src={fitblaqsLogo} className="w-20 animate-pulse" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundImage: `url(${onboardingBg})` }}
    >
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 w-full max-w-lg">

        {/* HEADER */}
        <div className="text-center mb-6">
          <img src={fitblaqsLogo} className="w-16 mx-auto" />
          <h1 className="text-white text-3xl">FitBlaqs</h1>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-2 gap-3">

          <Card onClick={() => setLevelDialogOpen(true)} className="p-4">
            <Dumbbell />
            Level
          </Card>

          <Card onClick={() => setPowerDialogOpen(true)} className="p-4">
            <Zap />
            Power
          </Card>

          <Card onClick={() => setHealthyDialogOpen(true)} className="p-4">
            <Heart />
            Healthy
          </Card>

          <Card onClick={handleStart} className="p-4">
            <Play />
            {hasPremium ? "Start" : "Premium"}
          </Card>
        </div>

        {/* HEALTH OPTIONS FIX */}
        <div className="mt-4 text-white">
          <Checkbox
            checked={healthOptions.includes("sleep")}
            onCheckedChange={() => toggleHealth("sleep")}
          />
          Sleep
        </div>

        {/* LEVEL DIALOG */}
        <Dialog open={levelDialogOpen} onOpenChange={setLevelDialogOpen}>
          <DialogContent>
            <DialogTitle>Level</DialogTitle>

            <RadioGroup value={level} onValueChange={setLevel}>
              <RadioGroupItem value="beginner" />
              Beginner

              <RadioGroupItem value="pro" />
              Pro
            </RadioGroup>

            <Button onClick={handleLevelSave}>Save</Button>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
};

export default Onboarding;
