import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dumbbell, Zap, Heart, Play, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { completeOnboarding, checkOnboardingStatus } from "@/lib/auth";
import { toast } from "sonner";
import onboardingBg from "@/assets/onboarding-bg.jpg";
import fitblaqsLogo from "@/assets/fitblaqs-logo.png";

const Onboarding = () => {

  const navigate = useNavigate();

  const [isGerman, setIsGerman] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // PREMIUM STATES
  const [hasPremium, setHasPremium] = useState(false);
  const [isPremiumLoading, setIsPremiumLoading] = useState(false);

  // DIALOG STATES
  const [levelDialogOpen, setLevelDialogOpen] = useState(false);
  const [powerDialogOpen, setPowerDialogOpen] = useState(false);
  const [healthyDialogOpen, setHealthyDialogOpen] = useState(false);

  // SELECTED VALUES
  const [level, setLevel] = useState<string>("");
  const [bodyType, setBodyType] = useState<string>("");
  const [healthOptions, setHealthOptions] = useState<string[]>([]);

  // CHECK PURCHASE
  const checkPurchase = async () => {

    try {

      if (!window.getDigitalGoodsService) {
        return;
      }

      const service =
        await window.getDigitalGoodsService(
          "https://play.google.com/billing"
        );

      const purchases =
        await service.listPurchases();

      if (purchases.length > 0) {

        setHasPremium(true);

      }

    } catch (error) {

      console.error(error);

    }
  };

  // BUY PREMIUM
  const buyPremium = async () => {

    try {

      setIsPremiumLoading(true);

      if (!window.getDigitalGoodsService) {

        toast.error(
          isGerman
            ? "Google Play Billing nicht verfügbar"
            : "Google Play Billing not available"
        );

        return;
      }

      const service =
        await window.getDigitalGoodsService(
          "https://play.google.com/billing"
        );

      await service.launchBillingFlow(
        "fitblaqspremium"
      );

      await checkPurchase();

      toast.success(
        isGerman
          ? "Premium aktiviert"
          : "Premium activated"
      );

    } catch (error) {

      console.error(error);

      toast.error(
        isGerman
          ? "Kauf fehlgeschlagen"
          : "Purchase failed"
      );

    } finally {

      setIsPremiumLoading(false);

    }
  };

  useEffect(() => {

    const checkSession = async () => {

      try {

        const { data: { session } } =
          await supabase.auth.getSession();

        if (!session) {

          navigate("/login", { replace: true });

          return;
        }

        setUserId(session.user.id);

        const metadata =
          session.user.user_metadata;

        setIsGerman(metadata.language === "de");

        // CHECK PREMIUM
        await checkPurchase();

        // CHECK ONBOARDING
        const hasCompleted =
          await checkOnboardingStatus(session.user.id);

        if (hasCompleted) {

          navigate("/dashboard", { replace: true });

          return;
        }

        // LOAD PROFILE
        const { data: profile } =
          await supabase
            .from("profiles")
            .select("athlete_level, body_type")
            .eq("user_id", session.user.id)
            .single();

        if (profile) {

          if (profile.athlete_level) {
            setLevel(profile.athlete_level);
          }

          if (profile.body_type) {
            setBodyType(profile.body_type);
          }
        }

        setIsLoading(false);

      } catch (e) {

        navigate("/login", { replace: true });

      }
    };

    checkSession();

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((event, session) => {

        if (!session) {

          navigate("/login", { replace: true });

        }
      });

    return () => subscription.unsubscribe();

  }, [navigate]);

  // SAVE LEVEL
  const handleLevelSave = async () => {

    if (!level || !userId) return;

    try {

      await supabase
        .from("profiles")
        .update({
          athlete_level: level
        })
        .eq("user_id", userId);

      setLevelDialogOpen(false);

      toast.success(
        isGerman
          ? "Level gespeichert"
          : "Level saved"
      );

    } catch (e) {

      toast.error(
        isGerman
          ? "Fehler beim Speichern"
          : "Error saving"
      );
    }
  };

  // SAVE POWER
  const handlePowerSave = async () => {

    if (!bodyType || !userId) return;

    try {

      await supabase
        .from("profiles")
        .update({
          body_type: bodyType
        })
        .eq("user_id", userId);

      setPowerDialogOpen(false);

      toast.success(
        isGerman
          ? "Körpertyp gespeichert"
          : "Body type saved"
      );

    } catch (e) {

      toast.error(
        isGerman
          ? "Fehler beim Speichern"
          : "Error saving"
      );
    }
  };

  // SAVE HEALTHY
  const handleHealthySave = () => {

    setHealthyDialogOpen(false);

    toast.success(
      isGerman
        ? "Gesundheitsdaten gespeichert"
        : "Health data saved"
    );
  };

  // START WORKOUT
  const handleStartWorkout = async () => {

    // CHECK FIELDS
    if (!level || !bodyType || healthOptions.length === 0) {

      toast.error(
        isGerman
          ? "Bitte fülle alle Felder aus"
          : "Please complete all fields"
      );

      return;
    }

    // CHECK PREMIUM
    if (!hasPremium) {

      await buyPremium();

      return;
    }

    // CHECK SESSION
    if (!userId) {

      toast.error(
        isGerman
          ? "Sitzung abgelaufen"
          : "Session expired"
      );

      navigate("/login", { replace: true });

      return;
    }

    try {

      // COMPLETE ONBOARDING
      const success =
        await completeOnboarding(userId);

      if (success) {

        toast.success(
          isGerman
            ? "Willkommen bei FitBlaqs!"
            : "Welcome to FitBlaqs!"
        );

        navigate("/loading", { replace: true });

      } else {

        toast.error(
          isGerman
            ? "Fehler beim Speichern"
            : "Error saving"
        );
      }

    } catch (e) {

      toast.error(
        isGerman
          ? "Fehler beim Speichern"
          : "Error saving"
      );
    }
  };

  // CHECK COMPLETED
  const allCompleted =
    level &&
    bodyType &&
    healthOptions.length > 0;

  // LOADING SCREEN
  if (isLoading) {

    return (

      <div className="min-h-screen flex items-center justify-center bg-background">

        <div className="animate-pulse">

          <img
            src={fitblaqsLogo}
            alt="FitBlaqs"
            className="w-20 h-20"
          />

        </div>

      </div>
    );
  }

  return (

    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 relative"
      style={{
        backgroundImage: `url(${onboardingBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}
    >

      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 w-full max-w-lg">

        {/* LOGO */}
        <div className="text-center mb-6">

          <img
            src={fitblaqsLogo}
            alt="FitBlaqs"
            className="w-16 h-16 mx-auto mb-3"
          />

          <h1 className="text-3xl font-bold text-white mb-1">
            FitBlaqs
          </h1>

          <p className="text-lg text-blue-400">
            Power & Healthy
          </p>

        </div>

        {/* PREMIUM BANNER */}
        {!hasPremium && (

          <div className="mb-4 bg-yellow-500/20 border border-yellow-500/40 rounded-xl p-4 backdrop-blur-sm">

            <div className="flex items-center justify-center gap-2 mb-2">

              <Crown className="w-5 h-5 text-yellow-400" />

              <h2 className="text-white font-bold">
                Premium Required
              </h2>

            </div>

            <p className="text-white/80 text-sm text-center">

              {isGerman
                ? "Aktiviere Premium um fortzufahren"
                : "Activate premium to continue"}

            </p>

          </div>

        )}

        {/* GRID */}
        <div className="grid grid-cols-2 gap-3">

          {/* LEVEL */}
          <Card
            onClick={() => setLevelDialogOpen(true)}
            className={`p-4 cursor-pointer transition-all duration-300 hover:scale-105 ${
              level
                ? "bg-green-600/80 border-green-500/50"
                : "bg-black/60 backdrop-blur-sm border-white/10 hover:border-primary/50"
            }`}
          >

            <div className="flex flex-col items-center text-center">

              <Dumbbell className="w-6 h-6 mb-2 text-primary" />

              <h3 className="font-bold text-white text-sm mb-0.5">
                Level
              </h3>

              <p className="text-xs text-white/70">

                {isGerman
                  ? "Fitness-Level"
                  : "Fitness level"}

              </p>

            </div>

          </Card>

          {/* POWER */}
          <Card
            onClick={() => setPowerDialogOpen(true)}
            className={`p-4 cursor-pointer transition-all duration-300 hover:scale-105 ${
              bodyType
                ? "bg-green-600/80 border-green-500/50"
                : "bg-black/60 backdrop-blur-sm border-white/10 hover:border-primary/50"
            }`}
          >

            <div className="flex flex-col items-center text-center">

              <Zap className="w-6 h-6 mb-2 text-primary" />

              <h3 className="font-bold text-white text-sm mb-0.5">
                Power
              </h3>

              <p className="text-xs text-white/70">

                {isGerman
                  ? "Körpertyp"
                  : "Body type"}

              </p>

            </div>

          </Card>

          {/* HEALTHY */}
          <Card
            onClick={() => setHealthyDialogOpen(true)}
            className={`p-4 cursor-pointer transition-all duration-300 hover:scale-105 ${
              healthOptions.length > 0
                ? "bg-green-600/80 border-green-500/50"
                : "bg-black/60 backdrop-blur-sm border-white/10 hover:border-primary/50"
            }`}
          >

            <div className="flex flex-col items-center text-center">

              <Heart className="w-6 h-6 mb-2 text-primary" />

              <h3 className="font-bold text-white text-sm mb-0.5">
                Healthy
              </h3>

              <p className="text-xs text-white/70">

                {isGerman
                  ? "Gesundheit"
                  : "Health info"}

              </p>

            </div>

          </Card>

          {/* START / PREMIUM */}
          <Card
            onClick={handleStartWorkout}
            className={`p-4 cursor-pointer transition-all duration-300 hover:scale-105 ${
              allCompleted
                ? "bg-primary/90 hover:bg-primary border-primary"
                : "bg-gray-600/50 border-gray-500/30"
            }`}
          >

            <div className="flex flex-col items-center text-center">

              <Play className="w-6 h-6 mb-2 text-white" />

              <h3 className="font-bold text-sm mb-0.5 text-white">

                {!hasPremium
                  ? "Premium"
                  : "Start"}

              </h3>

              <p className="text-xs text-white/70">

                {!hasPremium
                  ? (
                    isGerman
                      ? "Aktivieren"
                      : "Activate"
                  )
                  : (
                    isGerman
                      ? "Workout"
                      : "Workout"
                  )}

              </p>

              {isPremiumLoading && (

                <div className="mt-2 text-xs text-white/60">
                  Loading...
                </div>

              )}

            </div>

          </Card>

        </div>

        {!allCompleted && (

          <p className="text-center text-white/60 text-xs mt-4">

            {isGerman
              ? "Fülle alle Felder aus um fortzufahren"
              : "Complete all fields to continue"}

          </p>

        )}

      </div>

      {/* LEVEL DIALOG */}
      <Dialog
        open={levelDialogOpen}
        onOpenChange={setLevelDialogOpen}
      >

        <DialogContent className="sm:max-w-md">

          <DialogHeader>

            <DialogTitle>

              {isGerman
                ? "Wähle dein Level"
                : "Choose your Level"}

            </DialogTitle>

          </DialogHeader>

          <RadioGroup
            value={level}
            onValueChange={setLevel}
            className="space-y-4"
          >

            <div className="flex items-center space-x-3 p-4 rounded-lg bg-muted/50">

              <RadioGroupItem
                value="beginner"
                id="beginner"
              />

              <Label
                htmlFor="beginner"
                className="flex-1 cursor-pointer"
              >

                <div className="font-semibold">

                  {isGerman
                    ? "Anfänger"
                    : "Beginner"}

                </div>

              </Label>

            </div>

            <div className="flex items-center space-x-3 p-4 rounded-lg bg-muted/50">

              <RadioGroupItem
                value="professional"
                id="professional"
              />

              <Label
                htmlFor="professional"
                className="flex-1 cursor-pointer"
              >

                <div className="font-semibold">

                  {isGerman
                    ? "Profi"
                    : "Professional"}

                </div>

              </Label>

            </div>

          </RadioGroup>

          <Button
            onClick={handleLevelSave}
            className="w-full mt-4"
          >

            {isGerman ? "Speichern" : "Save"}

          </Button>

        </DialogContent>

      </Dialog>

    </div>
  );
};

export default Onboarding;
