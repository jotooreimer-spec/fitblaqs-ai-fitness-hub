import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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

  const onboardingBoxes = [
    {
      icon: Dumbbell,
      title: "Level",
      description: isGerman ? "Wähle dein Fitness-Level" : "Choose your fitness level",
      onClick: () => setLevelDialogOpen(true),
      completed: !!level
    },
    {
      icon: Zap,
      title: "Power",
      description: isGerman ? "Wähle deinen Körpertyp" : "Choose your body type",
      onClick: () => setPowerDialogOpen(true),
      completed: !!bodyType
    },
    {
      icon: Heart,
      title: "Healthy",
      description: isGerman ? "Gesundheitsinformationen" : "Health information",
      onClick: () => setHealthyDialogOpen(true),
      completed: healthOptions.length > 0
    },
    {
      icon: Play,
      title: isGerman ? "Starte dein Workout" : "Start your Workout",
      description: isGerman ? "Zum Dashboard" : "Go to Dashboard",
      onClick: () => navigate("/dashboard"),
      isStart: true
    }
  ];

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
        <div className="text-center mb-8">
          <img src={fitblaqsLogo} alt="FitBlaqs" className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-2">FitBlaqs</h1>
          <p className="text-xl text-blue-400">Power & Healthy</p>
        </div>

        {/* Onboarding Boxes */}
        <div className="grid grid-cols-2 gap-4">
          {onboardingBoxes.map((box, index) => {
            const Icon = box.icon;
            return (
              <Card
                key={index}
                onClick={box.onClick}
                className={`p-6 cursor-pointer transition-all duration-300 hover:scale-105 ${
                  box.isStart 
                    ? 'bg-primary/90 hover:bg-primary border-primary col-span-2' 
                    : box.completed 
                      ? 'bg-green-600/80 border-green-500/50' 
                      : 'bg-black/60 backdrop-blur-sm border-white/10 hover:border-primary/50'
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <Icon className={`w-8 h-8 mb-3 ${box.isStart ? 'text-white' : 'text-primary'}`} />
                  <h3 className="font-bold text-white text-lg mb-1">{box.title}</h3>
                  <p className="text-sm text-white/70">{box.description}</p>
                </div>
              </Card>
            );
          })}
        </div>
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
