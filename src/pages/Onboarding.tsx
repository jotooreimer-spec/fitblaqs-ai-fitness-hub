import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dumbbell, Zap, Heart, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import onboardingBg from "@/assets/onboarding-bg.jpg";
import fitblaqsLogo from "@/assets/fitblaqs-logo.png";

const Onboarding = () => {
  const navigate = useNavigate();
  const [isGerman, setIsGerman] = useState(true);
  
  // Dialog states
  const [levelDialogOpen, setLevelDialogOpen] = useState(false);
  const [powerDialogOpen, setPowerDialogOpen] = useState(false);
  const [healthyDialogOpen, setHealthyDialogOpen] = useState(false);
  
  // Selected values
  const [level, setLevel] = useState<string>("");
  const [bodyType, setBodyType] = useState<string>("");
  const [healthOptions, setHealthOptions] = useState<string[]>([]);

  // Check language from session
  useState(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
        return;
      }
      const metadata = session.user.user_metadata;
      setIsGerman(metadata.language === "de");
    });
  });

  const handleLevelSave = async () => {
    if (!level) return;
    
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from("profiles").update({
        athlete_level: level
      }).eq("user_id", session.user.id);
    }
    
    setLevelDialogOpen(false);
    toast.success(isGerman ? "Level gespeichert" : "Level saved");
  };

  const handlePowerSave = async () => {
    if (!bodyType) return;
    
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from("profiles").update({
        body_type: bodyType
      }).eq("user_id", session.user.id);
    }
    
    setPowerDialogOpen(false);
    toast.success(isGerman ? "Körpertyp gespeichert" : "Body type saved");
  };

  const handleHealthySave = () => {
    setHealthyDialogOpen(false);
    toast.success(isGerman ? "Gesundheitsdaten gespeichert" : "Health data saved");
  };

  const handleStartWorkout = () => {
    // Check if all required fields are filled
    if (!level || !bodyType || healthOptions.length === 0) {
      toast.error(isGerman ? "Bitte fülle alle Felder aus" : "Please complete all fields");
      return;
    }
    navigate("/dashboard");
  };

  // Check if all boxes are completed
  const allCompleted = level && bodyType && healthOptions.length > 0;

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-6 relative"
      style={{
        backgroundImage: `url(${onboardingBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black/50" />
      
      <div className="relative z-10 w-full max-w-lg">
        {/* Logo and Title */}
        <div className="text-center mb-6">
          <img src={fitblaqsLogo} alt="FitBlaqs" className="w-16 h-16 mx-auto mb-3" />
          <h1 className="text-3xl font-bold text-white mb-1">FitBlaqs</h1>
          <p className="text-lg text-blue-400">Power & Healthy</p>
        </div>

        {/* Onboarding Boxes - 2x2 Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Level Box */}
          <Card
            onClick={() => setLevelDialogOpen(true)}
            className={`p-4 cursor-pointer transition-all duration-300 hover:scale-105 ${
              level 
                ? 'bg-green-600/80 border-green-500/50' 
                : 'bg-black/60 backdrop-blur-sm border-white/10 hover:border-primary/50'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <Dumbbell className="w-6 h-6 mb-2 text-primary" />
              <h3 className="font-bold text-white text-sm mb-0.5">Level</h3>
              <p className="text-xs text-white/70">{isGerman ? "Fitness-Level" : "Fitness level"}</p>
            </div>
          </Card>

          {/* Power Box */}
          <Card
            onClick={() => setPowerDialogOpen(true)}
            className={`p-4 cursor-pointer transition-all duration-300 hover:scale-105 ${
              bodyType 
                ? 'bg-green-600/80 border-green-500/50' 
                : 'bg-black/60 backdrop-blur-sm border-white/10 hover:border-primary/50'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <Zap className="w-6 h-6 mb-2 text-primary" />
              <h3 className="font-bold text-white text-sm mb-0.5">Power</h3>
              <p className="text-xs text-white/70">{isGerman ? "Körpertyp" : "Body type"}</p>
            </div>
          </Card>

          {/* Healthy Box */}
          <Card
            onClick={() => setHealthyDialogOpen(true)}
            className={`p-4 cursor-pointer transition-all duration-300 hover:scale-105 ${
              healthOptions.length > 0 
                ? 'bg-green-600/80 border-green-500/50' 
                : 'bg-black/60 backdrop-blur-sm border-white/10 hover:border-primary/50'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <Heart className="w-6 h-6 mb-2 text-primary" />
              <h3 className="font-bold text-white text-sm mb-0.5">Healthy</h3>
              <p className="text-xs text-white/70">{isGerman ? "Gesundheit" : "Health info"}</p>
            </div>
          </Card>

          {/* Start Workout Box - Same size as others */}
          <Card
            onClick={handleStartWorkout}
            className={`p-4 cursor-pointer transition-all duration-300 hover:scale-105 ${
              allCompleted 
                ? 'bg-primary/90 hover:bg-primary border-primary' 
                : 'bg-gray-600/50 border-gray-500/30 cursor-not-allowed'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <Play className={`w-6 h-6 mb-2 ${allCompleted ? 'text-white' : 'text-gray-400'}`} />
              <h3 className={`font-bold text-sm mb-0.5 ${allCompleted ? 'text-white' : 'text-gray-400'}`}>
                {isGerman ? "Start" : "Start"}
              </h3>
              <p className={`text-xs ${allCompleted ? 'text-white/70' : 'text-gray-500'}`}>
                {isGerman ? "Workout" : "Workout"}
              </p>
            </div>
          </Card>
        </div>

        {!allCompleted && (
          <p className="text-center text-white/60 text-xs mt-4">
            {isGerman ? "Fülle alle Felder aus um fortzufahren" : "Complete all fields to continue"}
          </p>
        )}
      </div>

      {/* Level Dialog */}
      <Dialog open={levelDialogOpen} onOpenChange={setLevelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isGerman ? "Wähle dein Level" : "Choose your Level"}</DialogTitle>
          </DialogHeader>
          <RadioGroup value={level} onValueChange={setLevel} className="space-y-4">
            <div className="flex items-center space-x-3 p-4 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted">
              <RadioGroupItem value="beginner" id="beginner" />
              <Label htmlFor="beginner" className="flex-1 cursor-pointer">
                <div className="font-semibold">{isGerman ? "Anfänger" : "Beginner"}</div>
                <div className="text-sm text-muted-foreground">{isGerman ? "Neu im Fitness" : "New to fitness"}</div>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-4 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted">
              <RadioGroupItem value="professional" id="professional" />
              <Label htmlFor="professional" className="flex-1 cursor-pointer">
                <div className="font-semibold">{isGerman ? "Profi" : "Professional"}</div>
                <div className="text-sm text-muted-foreground">{isGerman ? "Erfahrener Athlet" : "Experienced athlete"}</div>
              </Label>
            </div>
          </RadioGroup>
          <Button onClick={handleLevelSave} className="w-full mt-4">
            {isGerman ? "Speichern" : "Save"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Power Dialog */}
      <Dialog open={powerDialogOpen} onOpenChange={setPowerDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isGerman ? "Wähle deinen Körpertyp" : "Choose your Body Type"}</DialogTitle>
          </DialogHeader>
          <RadioGroup value={bodyType} onValueChange={setBodyType} className="space-y-3">
            {[
              { value: "fat", label: { de: "Fett", en: "Fat" } },
              { value: "small", label: { de: "Schlank", en: "Slim" } },
              { value: "muscular", label: { de: "Muskulös", en: "Muscular" } },
              { value: "definition", label: { de: "Definiert", en: "Defined" } }
            ].map((type) => (
              <div key={type.value} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted">
                <RadioGroupItem value={type.value} id={type.value} />
                <Label htmlFor={type.value} className="flex-1 cursor-pointer font-medium">
                  {isGerman ? type.label.de : type.label.en}
                </Label>
              </div>
            ))}
          </RadioGroup>
          <Button onClick={handlePowerSave} className="w-full mt-4">
            {isGerman ? "Speichern" : "Save"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Healthy Dialog */}
      <Dialog open={healthyDialogOpen} onOpenChange={setHealthyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isGerman ? "Gesundheitsinformationen" : "Health Information"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {[
              { value: "weight", label: { de: "Gewichtskontrolle", en: "Weight Control" } },
              { value: "medical", label: { de: "Medizinische Betreuung", en: "Medical Care" } },
              { value: "pain", label: { de: "Schmerzmanagement", en: "Pain Management" } }
            ].map((option) => (
              <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                <Checkbox
                  id={option.value}
                  checked={healthOptions.includes(option.value)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setHealthOptions([...healthOptions, option.value]);
                    } else {
                      setHealthOptions(healthOptions.filter(h => h !== option.value));
                    }
                  }}
                />
                <Label htmlFor={option.value} className="flex-1 cursor-pointer font-medium">
                  {isGerman ? option.label.de : option.label.en}
                </Label>
              </div>
            ))}
          </div>
          <Button onClick={handleHealthySave} className="w-full mt-4">
            {isGerman ? "Speichern" : "Save"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Onboarding;
