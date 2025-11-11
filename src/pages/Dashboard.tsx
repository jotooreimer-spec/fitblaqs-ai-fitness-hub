import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { 
  Dumbbell, Heart, Zap, Target, 
  Bike, PersonStanding, Armchair, TrendingUp,
  Activity, Award
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);
  const [isGerman, setIsGerman] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("fitblaqs_user");
    if (!storedUser) {
      navigate("/login");
      return;
    }

    const user = JSON.parse(storedUser);
    setUserData(user);
    setIsGerman(user.language === "de");

    // Apply theme
    const theme = user.gender === "female" ? "theme-female" : "";
    if (theme) {
      document.documentElement.classList.add(theme);
    }
  }, [navigate]);

  const muscleGroups = [
    { icon: Dumbbell, label: isGerman ? "Brust" : "Chest", color: "text-blue-400" },
    { icon: TrendingUp, label: isGerman ? "Rücken" : "Back", color: "text-green-400" },
    { icon: Zap, label: isGerman ? "Schultern" : "Shoulders", color: "text-yellow-400" },
    { icon: Target, label: isGerman ? "Bizeps" : "Biceps", color: "text-red-400" },
    { icon: Activity, label: isGerman ? "Trizeps" : "Triceps", color: "text-purple-400" },
    { icon: Heart, label: isGerman ? "Beine" : "Legs", color: "text-pink-400" },
    { icon: Bike, label: isGerman ? "Waden" : "Calves", color: "text-indigo-400" },
    { icon: PersonStanding, label: isGerman ? "Bauch" : "Abs", color: "text-orange-400" },
    { icon: Armchair, label: isGerman ? "Cardio" : "Cardio", color: "text-cyan-400" },
    { icon: Award, label: isGerman ? "Ganzkörper" : "Full Body", color: "text-emerald-400" },
  ];

  if (!userData) return null;

  return (
    <div className="min-h-screen pb-24 gradient-male">
      <div className="max-w-screen-xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {isGerman ? `Willkommen, ${userData.name}!` : `Welcome, ${userData.name}!`}
          </h1>
          <p className="text-muted-foreground">
            {isGerman ? "Wähle deine Muskelgruppe" : "Choose your muscle group"}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card 
            className="gradient-card card-shadow border-white/10 p-4 cursor-pointer hover:scale-105 transition-all duration-300"
            onClick={() => navigate("/weight-tracker")}
          >
            <div className="text-sm text-muted-foreground mb-1">
              {isGerman ? "Gewicht" : "Weight"}
            </div>
            <div className="text-2xl font-bold">{userData.weight} kg</div>
          </Card>
          <Card className="gradient-card card-shadow border-white/10 p-4">
            <div className="text-sm text-muted-foreground mb-1">
              {isGerman ? "Größe" : "Height"}
            </div>
            <div className="text-2xl font-bold">{userData.height} cm</div>
          </Card>
          <Card className="gradient-card card-shadow border-white/10 p-4">
            <div className="text-sm text-muted-foreground mb-1">BMI</div>
            <div className="text-2xl font-bold">
              {(parseFloat(userData.weight) / Math.pow(parseFloat(userData.height) / 100, 2)).toFixed(1)}
            </div>
          </Card>
          <Card className="gradient-card card-shadow border-white/10 p-4">
            <div className="text-sm text-muted-foreground mb-1">
              {isGerman ? "Alter" : "Age"}
            </div>
            <div className="text-2xl font-bold">{userData.age}</div>
          </Card>
        </div>

        {/* Training Modules */}
        <div>
          <h2 className="text-2xl font-bold mb-6">
            {isGerman ? "Trainingsmodule" : "Training Modules"}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {muscleGroups.map((group, index) => {
              const Icon = group.icon;
              return (
                <Card
                  key={index}
                  onClick={() => navigate(`/training/${group.label.toLowerCase()}`)}
                  className="gradient-card card-shadow border-white/10 p-6 hover:scale-105 transition-all duration-300 cursor-pointer hover:border-primary/50"
                >
                  <div className="flex flex-col items-center gap-3">
                    <Icon className={`w-12 h-12 ${group.color}`} />
                    <span className="text-sm font-semibold text-center">
                      {group.label}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Dashboard;
