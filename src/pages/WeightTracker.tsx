import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";

interface WeightEntry {
  id: string;
  weight: number;
  date: string;
}

const WeightTracker = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGerman, setIsGerman] = useState(true);
  const [currentWeight, setCurrentWeight] = useState("");
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
        return;
      }

      const user = session.user;
      const metadata = user.user_metadata;
      
      const userInfo = {
        name: metadata.name || metadata.full_name || "User",
        weight: metadata.weight || "N/A",
        gender: metadata.gender || "male",
        language: metadata.language || "de"
      };

      setUserData(userInfo);
      setIsGerman(metadata.language === "de");

      // Apply theme
      const theme = metadata.gender === "female" ? "theme-female" : "";
      if (theme) {
        document.documentElement.classList.add(theme);
      }

      // Load weight history
      const savedHistory = localStorage.getItem("weight_history");
      if (savedHistory) {
        setWeightHistory(JSON.parse(savedHistory));
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const addWeight = () => {
    if (!currentWeight || parseFloat(currentWeight) <= 0) {
      toast({
        title: isGerman ? "Fehler" : "Error",
        description: isGerman ? "Bitte gültiges Gewicht eingeben" : "Please enter valid weight",
        variant: "destructive",
      });
      return;
    }

    const entry: WeightEntry = {
      id: Date.now().toString(),
      weight: parseFloat(currentWeight),
      date: new Date().toISOString(),
    };

    const updatedHistory = [entry, ...weightHistory];
    setWeightHistory(updatedHistory);
    localStorage.setItem("weight_history", JSON.stringify(updatedHistory));

    // Update user weight
    if (userData) {
      const updatedUser = { ...userData, weight: currentWeight };
      localStorage.setItem("fitblaqs_user", JSON.stringify(updatedUser));
      setUserData(updatedUser);
    }

    setCurrentWeight("");
    toast({
      title: isGerman ? "Gewicht gespeichert" : "Weight saved",
      description: isGerman ? "Dein Gewicht wurde erfolgreich eingetragen" : "Your weight has been recorded successfully",
    });
  };

  const getWeightChange = () => {
    if (weightHistory.length < 2) return null;
    const latest = weightHistory[0].weight;
    const previous = weightHistory[1].weight;
    return latest - previous;
  };

  const weightChange = getWeightChange();

  if (!userData) return null;

  return (
    <div className="min-h-screen pb-24 gradient-male">
      <div className="max-w-screen-xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="text-foreground"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-4xl font-bold">
            {isGerman ? "Gewichtskontrolle" : "Weight Tracker"}
          </h1>
        </div>

        {/* Scale Design */}
        <Card className="gradient-card card-shadow border-white/10 p-8 mb-6">
          <div className="flex flex-col items-center">
            {/* Scale Display */}
            <div className="relative w-full max-w-md">
              {/* Scale Body */}
              <div className="bg-gradient-to-b from-muted/20 to-muted/40 rounded-t-full h-40 flex items-end justify-center pb-6 border-4 border-white/10">
                <div className="text-center">
                  <div className="text-6xl font-bold glow">
                    {userData.weight}
                  </div>
                  <div className="text-2xl text-muted-foreground">kg</div>
                </div>
              </div>
              
              {/* Scale Platform */}
              <div className="bg-gradient-to-b from-muted/40 to-muted/20 h-8 rounded-b-3xl border-4 border-t-0 border-white/10" />
              
              {/* Scale Feet */}
              <div className="flex justify-between px-8 mt-2">
                <div className="w-12 h-3 bg-muted/30 rounded-full" />
                <div className="w-12 h-3 bg-muted/30 rounded-full" />
              </div>
            </div>

            {/* Weight Change Indicator */}
            {weightChange !== null && (
              <div className="mt-6 flex items-center gap-2">
                {weightChange > 0 ? (
                  <TrendingUp className="w-5 h-5 text-red-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-green-400" />
                )}
                <span className={`text-lg font-semibold ${weightChange > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg
                </span>
                <span className="text-muted-foreground">
                  {isGerman ? "zur letzten Messung" : "from last measurement"}
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Add Weight Form */}
        <Card className="gradient-card card-shadow border-white/10 p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">
            {isGerman ? "Neues Gewicht eintragen" : "Record New Weight"}
          </h2>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="weight">
                {isGerman ? "Gewicht (kg)" : "Weight (kg)"}
              </Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={currentWeight}
                onChange={(e) => setCurrentWeight(e.target.value)}
                placeholder={userData.weight}
                className="text-lg"
              />
            </div>
            <Button onClick={addWeight} className="self-end" size="lg">
              <Plus className="w-5 h-5 mr-2" />
              {isGerman ? "Hinzufügen" : "Add"}
            </Button>
          </div>
        </Card>

        {/* Weight History */}
        <div>
          <h2 className="text-2xl font-bold mb-4">
            {isGerman ? "Gewichtsverlauf" : "Weight History"}
          </h2>
          {weightHistory.length === 0 ? (
            <Card className="gradient-card card-shadow border-white/10 p-8 text-center">
              <p className="text-muted-foreground">
                {isGerman ? "Noch keine Einträge" : "No entries yet"}
              </p>
            </Card>
          ) : (
            <div className="grid gap-3">
              {weightHistory.map((entry, index) => {
                const prevWeight = weightHistory[index + 1]?.weight;
                const change = prevWeight ? entry.weight - prevWeight : null;
                
                return (
                  <Card
                    key={entry.id}
                    className="gradient-card card-shadow border-white/10 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">{entry.weight} kg</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(entry.date).toLocaleDateString(isGerman ? 'de-DE' : 'en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>
                      </div>
                      {change !== null && (
                        <div className={`flex items-center gap-1 ${change > 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {change > 0 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          <span className="font-semibold">
                            {change > 0 ? '+' : ''}{change.toFixed(1)} kg
                          </span>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default WeightTracker;
