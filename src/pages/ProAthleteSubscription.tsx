import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Dumbbell, Utensils, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import proSubscriptionBg from "@/assets/pro-subscription-bg.png";
import fitblaqsLogo from "@/assets/fitblaqs-logo.png";

const ProAthleteSubscription = () => {
  const navigate = useNavigate();
  const [isGerman, setIsGerman] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate("/login");
        return;
      }
      const metadata = session.user.user_metadata;
      setIsGerman(metadata.language === "de");
    });
  }, [navigate]);

  return (
    <div className="min-h-screen pb-24 relative">
      {/* Background Image */}
      <div className="fixed inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${proSubscriptionBg})` }} />
      <div className="fixed inset-0 bg-black/60" />
      
      <div className="relative z-10 max-w-screen-xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="text-white">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-white">Pro Subscriptions</h1>
            <p className="text-white/70">{isGerman ? "Wähle dein Abo" : "Choose your subscription"}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Pro Athlete Training */}
          <Card className="bg-black/40 backdrop-blur-md border-white/10 p-6 relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <img src={fitblaqsLogo} alt="FitBlaq" className="w-8 h-8 object-contain" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Dumbbell className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-white">Pro Athlete</h2>
            </div>
            
            <div className="mb-6">
              <div className="text-4xl font-bold text-white mb-1">€19,99<span className="text-lg font-normal text-white/60">/{isGerman ? "Jahr" : "year"}</span></div>
              <p className="text-sm text-white/60">{isGerman ? "12 Monate Abo • nach 6 Monaten kündbar" : "12 months • cancellable after 6 months"}</p>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-white">
                <Check className="w-5 h-5 text-green-400" />
                <span>{isGerman ? "Upload deiner Fitness-Bilder" : "Upload your fitness photos"}</span>
              </li>
              <li className="flex items-center gap-2 text-white">
                <Check className="w-5 h-5 text-green-400" />
                <span>{isGerman ? "Body Analyse mit KI" : "Body analysis with AI"}</span>
              </li>
              <li className="flex items-center gap-2 text-white">
                <Check className="w-5 h-5 text-green-400" />
                <span>{isGerman ? "Persönliche Trainingspläne (4-12 Wochen)" : "Personal training plans (4-12 weeks)"}</span>
              </li>
              <li className="flex items-center gap-2 text-white">
                <Check className="w-5 h-5 text-green-400" />
                <span>{isGerman ? "Vollständige Tagesansichten (Sets, Reps, Gewichte)" : "Complete daily views (Sets, Reps, Weights)"}</span>
              </li>
              <li className="flex items-center gap-2 text-white">
                <Check className="w-5 h-5 text-green-400" />
                <span>{isGerman ? "KI-generierte Übungsauswahl" : "AI-generated exercise selection"}</span>
              </li>
              <li className="flex items-center gap-2 text-white">
                <Check className="w-5 h-5 text-green-400" />
                <span>{isGerman ? "Performance & Dailyplanner (alle Fitness-Stats)" : "Performance & Dailyplanner (all fitness stats)"}</span>
              </li>
            </ul>

            <Button onClick={() => navigate("/pro-athlete")} className="w-full" size="lg">
              Pro Athlete
            </Button>
          </Card>

          {/* Pro Athlete Nutrition */}
          <Card className="bg-black/40 backdrop-blur-md border-white/10 p-6 relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <img src={fitblaqsLogo} alt="FitBlaq" className="w-8 h-8 object-contain" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <Utensils className="w-6 h-6 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Pro Nutrition</h2>
            </div>
            
            <div className="mb-6">
              <div className="text-4xl font-bold text-white mb-1">€14,99<span className="text-lg font-normal text-white/60">/{isGerman ? "Jahr" : "year"}</span></div>
              <p className="text-sm text-white/60">{isGerman ? "12 Monate Abo • nach 6 Monaten kündbar" : "12 months • cancellable after 6 months"}</p>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-white">
                <Check className="w-5 h-5 text-green-400" />
                <span>{isGerman ? "Ernährungsauswertung & Makro-Berechnung" : "Nutrition analysis & macro calculation"}</span>
              </li>
              <li className="flex items-center gap-2 text-white">
                <Check className="w-5 h-5 text-green-400" />
                <span>{isGerman ? "Individuelle Kalorien- & Makroempfehlungen" : "Individual calorie & macro recommendations"}</span>
              </li>
              <li className="flex items-center gap-2 text-white">
                <Check className="w-5 h-5 text-green-400" />
                <span>{isGerman ? "Automatische Prozentberechnung" : "Automatic percentage calculation"}</span>
              </li>
              <li className="flex items-center gap-2 text-white">
                <Check className="w-5 h-5 text-green-400" />
                <span>{isGerman ? "Foto Upload & Speicherung" : "Photo upload & storage"}</span>
              </li>
              <li className="flex items-center gap-2 text-white">
                <Check className="w-5 h-5 text-green-400" />
                <span>{isGerman ? "Performance & Dailyplanner (alle Fitness-Stats)" : "Performance & Dailyplanner (all fitness stats)"}</span>
              </li>
            </ul>

            <Button onClick={() => navigate("/pro-nutrition")} className="w-full bg-green-600 hover:bg-green-700" size="lg">
              Pro Nutrition
            </Button>
          </Card>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default ProAthleteSubscription;
