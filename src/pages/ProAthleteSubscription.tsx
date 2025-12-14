import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Dumbbell, Utensils, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import StripeButton from "@/components/StripeButton";
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
              <div>
                <h2 className="text-xl font-bold text-white">Fitblaqs Power & Healthy</h2>
                <p className="text-sm text-primary">Pro-Athlete Abo</p>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="text-4xl font-bold text-white mb-1">€9,99<span className="text-lg font-normal text-white/60">/{isGerman ? "12 Monate" : "12 monthly"}</span></div>
              <p className="text-sm text-white/60">{isGerman ? "Nach 6 Monaten kündbar" : "Cancellable after 6 months"}</p>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-white">
                <Check className="w-5 h-5 text-green-400" />
                <span>{isGerman ? "Keine Werbung" : "No-Advert"}</span>
              </li>
              <li className="flex items-center gap-2 text-white">
                <Check className="w-5 h-5 text-green-400" />
                <span>{isGerman ? "Upload deiner Body Fotos" : "Upload your Photo Body"}</span>
              </li>
              <li className="flex items-center gap-2 text-white">
                <Check className="w-5 h-5 text-green-400" />
                <span>{isGerman ? "Statistik & Analyse" : "Stastic & Analyse"}</span>
              </li>
              <li className="flex items-center gap-2 text-white">
                <Check className="w-5 h-5 text-green-400" />
                <span>{isGerman ? "Trainingspläne" : "Training plans"}</span>
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

            <a 
              href="https://buy.stripe.com/bJe00lgJIabj4uA2KB2Fa02" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full"
            >
              <Button className="w-full" size="lg">
                Pro Athlete
              </Button>
            </a>
          </Card>

          {/* Pro Nutrition */}
          <Card className="bg-black/40 backdrop-blur-md border-white/10 p-6 relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <img src={fitblaqsLogo} alt="FitBlaq" className="w-8 h-8 object-contain" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <Utensils className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Fitblaqs Power & Healthy</h2>
                <p className="text-sm text-green-400">Pro-Nutrition Abo</p>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="text-4xl font-bold text-white mb-1">€9,99<span className="text-lg font-normal text-white/60">/{isGerman ? "12 Monate" : "12 monthly"}</span></div>
              <p className="text-sm text-white/60">{isGerman ? "Nach 6 Monaten kündbar" : "Cancellable after 6 months"}</p>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-white">
                <Check className="w-5 h-5 text-green-400" />
                <span>{isGerman ? "Keine Werbung" : "No-Advert"}</span>
              </li>
              <li className="flex items-center gap-2 text-white">
                <Check className="w-5 h-5 text-green-400" />
                <span>{isGerman ? "Ernährungs-Statistik & Analyse" : "Nutrition Stastic & Analysis"}</span>
              </li>
              <li className="flex items-center gap-2 text-white">
                <Check className="w-5 h-5 text-green-400" />
                <span>{isGerman ? "Food Tracker" : "Food Tracker"}</span>
              </li>
              <li className="flex items-center gap-2 text-white">
                <Check className="w-5 h-5 text-green-400" />
                <span>{isGerman ? "Individuelle Kalorien- & Makroempfehlungen, KI-generiert" : "Individual Calories & macro recommendations, AI-generated"}</span>
              </li>
              <li className="flex items-center gap-2 text-white">
                <Check className="w-5 h-5 text-green-400" />
                <span>{isGerman ? "Supplements & Kalorien Historie" : "Supplements & Calorieris History"}</span>
              </li>
              <li className="flex items-center gap-2 text-white">
                <Check className="w-5 h-5 text-green-400" />
                <span>{isGerman ? "Foto Upload" : "Photo upload"}</span>
              </li>
              <li className="flex items-center gap-2 text-white">
                <Check className="w-5 h-5 text-green-400" />
                <span>{isGerman ? "Performance & Dailyplanner (alle Fitness-Stats)" : "Performance & Dailyplanner (all fitness stats)"}</span>
              </li>
            </ul>

            <a 
              href="https://buy.stripe.com/cNi4gBdxwbfnd16fxn2Fa03" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full"
            >
              <Button className="w-full bg-green-600 hover:bg-green-700" size="lg">
                Pro Nutrition
              </Button>
            </a>
          </Card>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default ProAthleteSubscription;
