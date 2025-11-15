import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Play, Pause, RotateCcw, Save, ArrowLeft, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface JoggingLog {
  id: string;
  duration: number;
  distance: number;
  calories: number | null;
  completed_at: string;
  notes: string | null;
}

const JoggingTracker = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGerman, setIsGerman] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [distance, setDistance] = useState("");
  const [notes, setNotes] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [logs, setLogs] = useState<JoggingLog[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate("/login");
        return;
      }

      const metadata = session.user.user_metadata;
      setIsGerman(metadata.language === "de");

      const theme = metadata.gender === "female" ? "theme-female" : "";
      if (theme) {
        document.documentElement.classList.add(theme);
      }

      loadLogs();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadLogs = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("jogging_logs")
      .select("*")
      .eq("user_id", session.user.id)
      .order("completed_at", { ascending: false });

    if (error) {
      console.error("Error loading logs:", error);
      return;
    }

    if (data) {
      setLogs(data);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive) {
      interval = setInterval(() => {
        setSeconds((seconds) => seconds + 1);
      }, 1000);
    } else if (!isActive && seconds !== 0 && interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, seconds]);

  const toggle = () => setIsActive(!isActive);
  
  const reset = () => {
    setSeconds(0);
    setIsActive(false);
    setDistance("");
    setNotes("");
  };

  const saveJoggingLog = async () => {
    if (!distance || parseFloat(distance) <= 0) {
      toast({
        title: isGerman ? "Fehler" : "Error",
        description: isGerman ? "Bitte Distanz eingeben" : "Please enter distance",
        variant: "destructive"
      });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const durationMinutes = Math.floor(seconds / 60);
    const distanceKm = parseFloat(distance);
    
    // Simple calorie calculation: ~60 calories per km
    const estimatedCalories = Math.round(distanceKm * 60);

    const { error } = await supabase
      .from("jogging_logs")
      .insert({
        user_id: session.user.id,
        duration: durationMinutes,
        distance: distanceKm,
        calories: estimatedCalories,
        notes: notes || null
      });

    if (error) {
      toast({
        title: isGerman ? "Fehler" : "Error",
        description: isGerman ? "Lauf konnte nicht gespeichert werden" : "Could not save run",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: isGerman ? "Gespeichert" : "Saved",
      description: isGerman ? "Lauf erfolgreich gespeichert" : "Run saved successfully"
    });

    setIsDialogOpen(false);
    reset();
    loadLogs();
  };

  const deleteLog = async (id: string) => {
    const { error } = await supabase
      .from("jogging_logs")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: isGerman ? "Fehler" : "Error",
        description: isGerman ? "Lauf konnte nicht gelöscht werden" : "Could not delete run",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: isGerman ? "Gelöscht" : "Deleted",
      description: isGerman ? "Lauf erfolgreich gelöscht" : "Run deleted successfully"
    });

    loadLogs();
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getTotalStats = () => {
    const totalDistance = logs.reduce((sum, log) => sum + parseFloat(log.distance.toString()), 0);
    const totalDuration = logs.reduce((sum, log) => sum + log.duration, 0);
    const totalCalories = logs.reduce((sum, log) => sum + (log.calories || 0), 0);
    return { totalDistance, totalDuration, totalCalories };
  };

  const stats = getTotalStats();

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
          <div>
            <h1 className="text-4xl font-bold">
              {isGerman ? "Jogging Tracker" : "Jogging Tracker"}
            </h1>
            <p className="text-muted-foreground">
              {isGerman ? "Verfolge deine Läufe" : "Track your runs"}
            </p>
          </div>
        </div>

        {/* Timer Display */}
        <Card className="gradient-card card-shadow border-white/10 p-12 mb-8">
          <div className="text-center">
            <div className="text-7xl font-bold mb-8 tabular-nums glow">
              {formatTime(seconds)}
            </div>
            <div className="flex gap-4 justify-center">
              <Button
                variant="default"
                size="lg"
                onClick={toggle}
                className="w-32"
              >
                {isActive ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={reset}
                className="w-32"
              >
                <RotateCcw className="w-6 h-6" />
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="default" size="lg" className="w-32" disabled={seconds === 0}>
                    <Save className="w-6 h-6" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {isGerman ? "Lauf speichern" : "Save Run"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>{isGerman ? "Zeit" : "Time"}</Label>
                      <Input value={formatTime(seconds)} disabled />
                    </div>
                    <div>
                      <Label>{isGerman ? "Distanz (km)" : "Distance (km)"}</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={distance}
                        onChange={(e) => setDistance(e.target.value)}
                        placeholder="5.0"
                      />
                    </div>
                    <div>
                      <Label>{isGerman ? "Notizen" : "Notes"}</Label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={isGerman ? "Optional..." : "Optional..."}
                      />
                    </div>
                    <Button onClick={saveJoggingLog} className="w-full">
                      {isGerman ? "Speichern" : "Save"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="gradient-card card-shadow border-white/10 p-6">
            <div className="text-sm text-muted-foreground mb-2">
              {isGerman ? "Gesamte Distanz" : "Total Distance"}
            </div>
            <div className="text-3xl font-bold">{stats.totalDistance.toFixed(1)} km</div>
          </Card>
          <Card className="gradient-card card-shadow border-white/10 p-6">
            <div className="text-sm text-muted-foreground mb-2">
              {isGerman ? "Gesamte Zeit" : "Total Time"}
            </div>
            <div className="text-3xl font-bold">{stats.totalDuration} min</div>
          </Card>
          <Card className="gradient-card card-shadow border-white/10 p-6">
            <div className="text-sm text-muted-foreground mb-2">
              {isGerman ? "Kalorien" : "Calories"}
            </div>
            <div className="text-3xl font-bold">{stats.totalCalories}</div>
          </Card>
        </div>

        {/* History */}
        <div>
          <h2 className="text-2xl font-bold mb-4">
            {isGerman ? "Verlauf" : "History"}
          </h2>
          <div className="space-y-4">
            {logs.map((log) => (
              <Card key={log.id} className="gradient-card card-shadow border-white/10 p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {format(new Date(log.completed_at), "dd.MM.yyyy HH:mm")}
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-2">
                      <div>
                        <div className="text-xs text-muted-foreground">
                          {isGerman ? "Distanz" : "Distance"}
                        </div>
                        <div className="text-lg font-bold">{log.distance} km</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">
                          {isGerman ? "Zeit" : "Time"}
                        </div>
                        <div className="text-lg font-bold">{log.duration} min</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">
                          {isGerman ? "Kalorien" : "Calories"}
                        </div>
                        <div className="text-lg font-bold">{log.calories || 0}</div>
                      </div>
                    </div>
                    {log.notes && (
                      <div className="text-sm text-muted-foreground">{log.notes}</div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteLog(log.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default JoggingTracker;
