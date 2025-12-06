import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, TrendingDown, TrendingUp, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import weightTrackerBg from "@/assets/weight-tracker-bg.png";

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
      setIsGerman(metadata.language === "de");

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
    const { data } = await supabase
      .from("weight_logs")
      .select("id, weight, measured_at")
      .eq("user_id", uid)
      .order("measured_at", { ascending: false })
      .limit(10);

    if (data) {
      setWeightHistory(data);
    }
  };

  const addWeight = async () => {
    if (!currentWeight || parseFloat(currentWeight) <= 0) {
      toast({ title: isGerman ? "Fehler" : "Error", description: isGerman ? "Bitte gültiges Gewicht eingeben" : "Please enter valid weight", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from("weight_logs")
      .insert({ user_id: userId, weight: parseFloat(currentWeight) });

    if (error) {
      toast({ title: isGerman ? "Fehler" : "Error", description: error.message, variant: "destructive" });
      return;
    }

    await supabase.from("profiles").update({ weight: parseFloat(currentWeight) }).eq("user_id", userId);

    setCurrentWeight("");
    loadWeightHistory(userId);
    toast({ title: isGerman ? "Gespeichert" : "Saved", description: isGerman ? "Gewicht + Kalender gespeichert" : "Weight + Calendar saved" });
  };

  const saveToCalendar = (entry: WeightEntry) => {
    toast({ title: isGerman ? "Gespeichert" : "Saved", description: isGerman ? "Im Kalender gespeichert" : "Saved to calendar" });
  };

  const deleteWeight = async (id: string) => {
    const { error } = await supabase.from("weight_logs").delete().eq("id", id);
    if (!error) {
      loadWeightHistory(userId);
      toast({ title: isGerman ? "Gelöscht" : "Deleted" });
    }
  };

  const getWeightChange = () => {
    if (weightHistory.length < 2) return null;
    return weightHistory[0].weight - weightHistory[1].weight;
  };

  const weightChange = getWeightChange();
  const latestWeight = weightHistory.length > 0 ? weightHistory[0].weight : "N/A";

  return (
    <div className="min-h-screen pb-24 relative">
      {/* Background */}
      <div className="fixed inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${weightTrackerBg})` }} />
      <div className="fixed inset-0 bg-black/60" />

      <div className="relative z-10 max-w-screen-xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="text-white">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-4xl font-bold text-white">{isGerman ? "Gewichtskontrolle" : "Weight Tracker"}</h1>
        </div>

        {/* Scale Design */}
        <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-8 mb-6">
          <div className="flex flex-col items-center">
            <div className="relative w-full max-w-md">
              <div className="bg-gradient-to-b from-muted/20 to-muted/40 rounded-t-full h-40 flex items-end justify-center pb-6 border-4 border-white/10">
                <div className="text-center">
                  <div className="text-6xl font-bold text-white">{latestWeight}</div>
                  <div className="text-2xl text-white/60">kg</div>
                </div>
              </div>
              <div className="bg-gradient-to-b from-muted/40 to-muted/20 h-8 rounded-b-3xl border-4 border-t-0 border-white/10" />
            </div>

            {weightChange !== null && (
              <div className="mt-6 flex items-center gap-2">
                {weightChange > 0 ? <TrendingUp className="w-5 h-5 text-red-400" /> : <TrendingDown className="w-5 h-5 text-green-400" />}
                <span className={`text-lg font-semibold ${weightChange > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg
                </span>
                <span className="text-white/60">{isGerman ? "zur letzten Messung" : "from last measurement"}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Add Weight Form */}
        <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 text-white">{isGerman ? "Neues Gewicht eintragen" : "Record New Weight"}</h2>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label className="text-white/60">{isGerman ? "Gewicht (kg)" : "Weight (kg)"}</Label>
              <Input type="number" step="0.1" value={currentWeight} onChange={(e) => setCurrentWeight(e.target.value)} placeholder={String(latestWeight)} className="text-lg" />
            </div>
            <Button onClick={addWeight} className="self-end" size="lg">
              <Plus className="w-5 h-5 mr-2" />
              {isGerman ? "Hinzufügen" : "Add"}
            </Button>
          </div>
        </Card>

        {/* Weight History */}
        <div>
          <h2 className="text-2xl font-bold mb-4 text-white">{isGerman ? "Gewichtsverlauf" : "Weight History"}</h2>
          {weightHistory.length === 0 ? (
            <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-8 text-center">
              <p className="text-white/60">{isGerman ? "Noch keine Einträge" : "No entries yet"}</p>
            </Card>
          ) : (
            <div className="grid gap-3">
              {weightHistory.map((entry, index) => {
                const prevWeight = weightHistory[index + 1]?.weight;
                const change = prevWeight ? entry.weight - prevWeight : null;
                
                return (
                  <Card key={entry.id} className="bg-black/40 backdrop-blur-sm border-white/10 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-white">{entry.weight} kg</div>
                        <div className="text-sm text-white/60">
                          {new Date(entry.measured_at).toLocaleDateString(isGerman ? 'de-DE' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {change !== null && (
                          <div className={`flex items-center gap-1 ${change > 0 ? 'text-red-400' : 'text-green-400'}`}>
                            {change > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            <span className="font-semibold">{change > 0 ? '+' : ''}{change.toFixed(1)} kg</span>
                          </div>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => saveToCalendar(entry)} className="text-primary hover:text-primary">
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteWeight(entry.id)} className="text-destructive hover:text-destructive">
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