import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, TrendingDown, TrendingUp, Trash2 } from "lucide-react";
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
  measured_at: string;
}

const WeightTracker = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGerman, setIsGerman] = useState(true);
  const [currentWeight, setCurrentWeight] = useState("");
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [userId, setUserId] = useState<string>("");

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
        weight: metadata.weight || "N/A",
        gender: metadata.gender || "male",
        language: metadata.language || "de"
      });
      setIsGerman(metadata.language === "de");

      const theme = metadata.gender === "female" ? "theme-female" : "";
      if (theme) {
        document.documentElement.classList.add(theme);
      }

      loadWeightHistory(user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadWeightHistory = async (uid: string) => {
    const { data, error } = await supabase
      .from("weight_logs")
      .select("id, weight, measured_at")
      .eq("user_id", uid)
      .order("measured_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error loading weight history:", error);
      return;
    }

    if (data) {
      setWeightHistory(data);
    }
  };

  const addWeight = async () => {
    if (!currentWeight || parseFloat(currentWeight) <= 0) {
      toast({
        title: isGerman ? "Fehler" : "Error",
        description: isGerman ? "Bitte gültiges Gewicht eingeben" : "Please enter valid weight",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("weight_logs")
      .insert({
        user_id: userId,
        weight: parseFloat(currentWeight),
      });

    if (error) {
      toast({
        title: isGerman ? "Fehler" : "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Update profile weight
    await supabase
      .from("profiles")
      .update({ weight: parseFloat(currentWeight) })
      .eq("user_id", userId);

    setCurrentWeight("");
    loadWeightHistory(userId);
    
    toast({
      title: isGerman ? "Gewicht gespeichert" : "Weight saved",
      description: isGerman ? "Dein Gewicht wurde erfolgreich eingetragen" : "Your weight has been recorded successfully",
    });
  };

  const deleteWeight = async (id: string) => {
    const { error } = await supabase
      .from("weight_logs")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: isGerman ? "Fehler" : "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    loadWeightHistory(userId);
    toast({
      title: isGerman ? "Gelöscht" : "Deleted",
      description: isGerman ? "Eintrag gelöscht" : "Entry deleted",
    });
  };

  const getWeightChange = () => {
    if (weightHistory.length < 2) return null;
    const latest = weightHistory[0].weight;
    const previous = weightHistory[1].weight;
    return latest - previous;
  };

  const weightChange = getWeightChange();
  const latestWeight = weightHistory.length > 0 ? weightHistory[0].weight : (userData?.weight || "N/A");

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
            <div className="relative w-full max-w-md">
              <div className="bg-gradient-to-b from-muted/20 to-muted/40 rounded-t-full h-40 flex items-end justify-center pb-6 border-4 border-white/10">
                <div className="text-center">
                  <div className="text-6xl font-bold glow">
                    {latestWeight}
                  </div>
                  <div className="text-2xl text-muted-foreground">kg</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-b from-muted/40 to-muted/20 h-8 rounded-b-3xl border-4 border-t-0 border-white/10" />
              
              <div className="flex justify-between px-8 mt-2">
                <div className="w-12 h-3 bg-muted/30 rounded-full" />
                <div className="w-12 h-3 bg-muted/30 rounded-full" />
              </div>
            </div>

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
                placeholder={String(latestWeight)}
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
                          {new Date(entry.measured_at).toLocaleDateString(isGerman ? 'de-DE' : 'en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteWeight(entry.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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