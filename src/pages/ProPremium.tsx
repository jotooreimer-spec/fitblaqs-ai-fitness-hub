import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import proSubscriptionBg from "@/assets/pro-subscription-bg.png";
import fitblaqsLogoWhite from "@/assets/fitblaqs-logo-white.png";

const ProPremium = () => {
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
            <h1 className="text-3xl font-bold text-white">Fitblaqs Pro-Premium</h1>
            <p className="text-white/70">{isGerman ? "PRO - Athlete & Nutrition entdecken" : "Discover PRO - Athlete & Nutrition"}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Pro Athlete Training */}
          <Card className="bg-black/40 backdrop-blur-md border-white/10 p-6 relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full overflow-hidden">
                <img src={fitblaqsLogoWhite} alt="FitBlaq" className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Fitblaqs Power & Healthy</h2>
                <p className="text-sm text-primary">Pro-Athlete</p>
              </div>
            </div>
            
            <div className="mb-6">
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
                <span>{isGerman ? "Body-Statistik & Analyse" : "Body Statistics & Analysis"}</span>
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
                <span>{isGerman ? "KI-generierter Bodyworkout-Plan (Trainingsplan)" : "AI-generated Bodyworkout Plan (Training Plan)"}</span>
              </li>
              <li className="flex items-center gap-2 text-white">
                <Check className="w-5 h-5 text-green-400" />
                <span>{isGerman ? "Performance & Dailyplanner (alle Fitness-Stats)" : "Performance & Dailyplanner (all fitness stats)"}</span>
              </li>
              <li className="flex items-center gap-2 text-white">
                <Check className="w-5 h-5 text-green-400" />
                <span>{isGerman ? "Challenges (Intervall Fasten)" : "Challenges (Interval Fasting)"}</span>
              </li>
            </ul>

            <Button className="w-full" size="lg" onClick={() => navigate("/pro-athlete")}>
              {isGerman ? "Werde FitBlaq's Pro-Athlete" : "Become FitBlaq's Pro-Athlete"}
            </Button>
          </Card>

          {/* Pro Nutrition */}
          <Card className="bg-black/40 backdrop-blur-md border-white/10 p-6 relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full overflow-hidden">
                <img src={fitblaqsLogoWhite} alt="FitBlaq" className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Fitblaqs Power & Healthy</h2>
                <p className="text-sm text-green-400">Pro-Nutrition</p>
              </div>
            </div>
            
            <div className="mb-6">
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-white">
                <Check className="w-5 h-5 text-green-400" />
                <span>{isGerman ? "Keine Werbung" : "No-Advert"}</span>
              </li>
              <li className="flex items-center gap-2 text-white">
                <Check className="w-5 h-5 text-green-400" />
                <span>{isGerman ? "Ernährungs-Statistik & Analyse" : "Nutrition Statistics & Analysis"}</span>
              </li>
              <li className="flex items-center gap-2 text-white">
                <Check className="w-5 h-5 text-green-400" />
                <span>{isGerman ? "Foodtracker - Manuel" : "Foodtracker - Manual"}</span>
              </li>
              <li className="flex items-center gap-2 text-white">
                <Check className="w-5 h-5 text-green-400" />
                <span>{isGerman ? "Individuelle Kalorien- & Makro-Tagesansicht" : "Individual Calories & Macro Daily View"}</span>
              </li>
              <li className="flex items-center gap-2 text-white">
                <Check className="w-5 h-5 text-green-400" />
                <span>{isGerman ? "Nutrition & Calories Tagesansicht" : "Nutrition & Calories Daily View"}</span>
              </li>
              <li className="flex items-center gap-2 text-white">
                <Check className="w-5 h-5 text-green-400" />
                <span>{isGerman ? "Upload deiner Food Fotos" : "Upload your Food Photos"}</span>
              </li>
              <li className="flex items-center gap-2 text-white">
                <Check className="w-5 h-5 text-green-400" />
                <span>{isGerman ? "Performance & Dailyplanner (alle Fitness-Stats)" : "Performance & Dailyplanner (all fitness stats)"}</span>
              </li>
              <li className="flex items-center gap-2 text-white">
                <Check className="w-5 h-5 text-green-400" />
                <span>{isGerman ? "Challenges (Intervall Fasten)" : "Challenges (Interval Fasting)"}</span>
              </li>
            </ul>

            <Button className="w-full bg-green-600 hover:bg-green-700" size="lg" onClick={() => navigate("/pro-nutrition")}>
              {isGerman ? "Werde FitBlaq's Pro-Nutrition" : "Become FitBlaq's Pro-Nutrition"}
            </Button>
          </Card>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default ProPremium;