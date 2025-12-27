import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import DashboardStats from "@/components/DashboardStats";
import { AvatarUpload } from "@/components/AvatarUpload";
import { TrainingLogDialog } from "@/components/TrainingLogDialog";
import { TrainingHistory } from "@/components/TrainingHistory";
import { UpdateNotification, useUpdateNotification } from "@/components/UpdateNotification";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dumbbell, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import upperbodyImg from "@/assets/upperbody-bg.png";
import middlebodyImg from "@/assets/middlebody.png";
import lowerbodyImg from "@/assets/lowerbody.png";
import fitblaqsLogo from "@/assets/fitblaqs-logo.png";
import fitblaqsLogoSmall from "@/assets/fitblaqs-logo-small.png";
import dashboardBg from "@/assets/dashboard-bg.png";

type BodyPartType = "lower_body" | "upper_body" | "middle_body" | "fullbody" | null;

const Dashboard = () => {
  const navigate = useNavigate();
  const { isGerman } = useLanguage();
  const { showNotification, dismiss: dismissNotification } = useUpdateNotification();
  const [userData, setUserData] = useState<any>(null);
  const [userId, setUserId] = useState<string>("");
  const [profileData, setProfileData] = useState<any>(null);
  const [isTrainingDialogOpen, setIsTrainingDialogOpen] = useState(false);
  const [selectedBodyPart, setSelectedBodyPart] = useState<BodyPartType>(null);
  const [refreshHistory, setRefreshHistory] = useState(0);
  const [monthlyProgress, setMonthlyProgress] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate("/login");
        return;
      }

      const user = session.user;
      const metadata = user.user_metadata;
      
      setUserId(user.id);
      setUserData({
        name: metadata.name || metadata.full_name || "User",
        age: metadata.age || "N/A",
        gender: metadata.gender || "male",
        language: metadata.language || "de"
      });

      const theme = metadata.gender === "female" ? "theme-female" : "";
      if (theme) {
        document.documentElement.classList.add(theme);
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        setProfileData(profile);
      }

      // Calculate monthly workout progress
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { count } = await supabase
        .from("workout_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("completed_at", startOfMonth.toISOString());

      const progress = Math.min(((count || 0) / 30) * 100, 100);
      setMonthlyProgress(progress);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, refreshHistory]);

  const handleModuleClick = (bodyPart: BodyPartType) => {
    setSelectedBodyPart(bodyPart);
    setIsTrainingDialogOpen(true);
  };

  const trainingModules = [
    { 
      image: upperbodyImg,
      title: "Upper Body",
      description: isGerman ? "Brust, Rücken, Schultern, Arme" : "Chest, Back, Shoulders, Arms",
      bodyPart: "upper_body" as BodyPartType,
    },
    { 
      image: middlebodyImg,
      title: "Core",
      description: isGerman ? "Core, Bauch" : "Core, Abs",
      bodyPart: "middle_body" as BodyPartType,
    },
    { 
      image: lowerbodyImg,
      title: "Lower Body",
      description: isGerman ? "Beine, Po, Waden" : "Legs, Glutes, Calves",
      bodyPart: "lower_body" as BodyPartType,
    },
    { 
      image: dashboardBg,
      title: "Fullbody",
      description: isGerman ? "Ganzkörper Training" : "Full Body Workout",
      bodyPart: "fullbody" as BodyPartType,
    }
  ];

  if (!userData) return null;

  return (
    <div className="min-h-screen pb-24 relative">
      {/* Update Notification */}
      {showNotification && <UpdateNotification onDismiss={dismissNotification} />}
      
      {/* Background Image */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${dashboardBg})` }}
      />
      <div className="fixed inset-0 bg-black/60" />

      <div className="relative z-10 max-w-screen-xl mx-auto p-6">
        {/* Header with Logo and Avatar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <img src={fitblaqsLogo} alt="FitBlaqs" className="w-12 h-12 object-contain" />
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                {isGerman ? `Starte dein Training, ${userData.name}` : `Start your Workout, ${userData.name}`}
              </h1>
            </div>
            <AvatarUpload 
              userId={userId} 
              currentAvatarUrl={profileData?.avatar_url} 
              onUploadSuccess={(url) => setProfileData({ ...profileData, avatar_url: url })} 
              isGerman={isGerman} 
            />
          </div>
          
          {/* Quick Access Buttons */}
          <div className="flex items-center gap-3 mb-4">
            {/* Performance Button */}
            <button
              onClick={() => navigate("/performance")}
              className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/20 hover:border-primary/50 hover:scale-105 transition-all group"
            >
              <img 
                src={fitblaqsLogoSmall} 
                alt="Performance" 
                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <BarChart3 className="w-4 h-4 text-primary mb-0.5" />
                <span className="text-[8px] font-bold text-white text-center leading-tight">Performance</span>
              </div>
            </button>
            
            {/* Bodyworkout Plan Button */}
            <button
              onClick={() => navigate("/bodyworkout-plan")}
              className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/20 hover:border-primary/50 hover:scale-105 transition-all group"
            >
              <img 
                src={fitblaqsLogoSmall} 
                alt="Bodyworkout" 
                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Dumbbell className="w-4 h-4 text-primary mb-0.5" />
                <span className="text-[7px] font-bold text-white text-center leading-tight">Bodyworkout<br/>Plan</span>
              </div>
            </button>
          </div>
          
          <p className="text-white/70">
            {isGerman ? "Wähle deine Trainingseinheit" : "Choose your training session"}
          </p>
        </div>

        {/* Statistics Dashboard */}
        <div className="mb-8">
          {userId && <DashboardStats isGerman={isGerman} userId={userId} />}
        </div>

        {/* Training Modules - Each opens dialog with specific body part */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 text-white">{isGerman ? "Trainingsmodule" : "Training Modules"}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trainingModules.map((module, index) => (
              <Card 
                key={index} 
                onClick={() => handleModuleClick(module.bodyPart)} 
                className="relative overflow-hidden border-white/10 hover:scale-105 transition-all duration-300 cursor-pointer hover:border-primary/50 h-48 md:h-56"
              >
                <img src={module.image} alt={module.title} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <Dumbbell className="w-4 h-4 text-primary" />
                    <h3 className="text-lg font-bold">{module.title}</h3>
                  </div>
                  <p className="text-xs text-white/80">{module.description}</p>
                  <p className="text-xs text-primary mt-1">
                    {isGerman ? `Körperbereich: ${module.title}` : `Body Part: ${module.title}`}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Workout Activity Progress - Monthly */}
        <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-6 mb-8">
          <h3 className="text-lg font-bold mb-4 text-white">{isGerman ? "Workout Aktivitäten" : "Workout Activities"}</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">{isGerman ? "Monatlicher Fortschritt" : "Monthly Progress"}</span>
              <span className="font-bold text-white">{Math.round(monthlyProgress)}%</span>
            </div>
            <Progress value={monthlyProgress} className="h-3" />
            <div className="flex justify-between text-xs text-white/40">
              <span>0</span>
              <span>5</span>
              <span>10</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100</span>
            </div>
            <p className="text-xs text-white/50 text-center mt-2">Hours</p>
          </div>
        </Card>

        {/* Training History */}
        <div>
          <h2 className="text-2xl font-bold mb-6 text-white">{isGerman ? "Trainingsverlauf" : "Training History"}</h2>
          <TrainingHistory userId={userId} isGerman={isGerman} refreshTrigger={refreshHistory} maxEntries={10} />
        </div>
      </div>

      <TrainingLogDialog 
        open={isTrainingDialogOpen} 
        onOpenChange={setIsTrainingDialogOpen} 
        userId={userId} 
        isGerman={isGerman} 
        onSuccess={() => setRefreshHistory(prev => prev + 1)}
        defaultBodyPart={selectedBodyPart}
      />
      <BottomNav />
    </div>
  );
};

export default Dashboard;