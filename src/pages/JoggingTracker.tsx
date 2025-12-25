import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Pause, RotateCcw, Trash2, Square, ArrowLeft, Bike, PersonStanding, Timer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import joggingBg from "@/assets/jogging-bg.png";
import bicycleBg from "@/assets/bicycle-bg.jpg";
import joggingImg from "@/assets/jogging-bg.jpg";
import laufenBg from "@/assets/laufen-bg.jpg";

interface JoggingLog {
  id: string;
  duration: number;
  distance: number;
  calories: number | null;
  completed_at: string;
  notes: string | null;
}

type ActivityType = "bicycle" | "running" | "jogging";

interface ActivitySession {
  type: ActivityType;
  city: string;
  destination: string;
  participants: number;
}

// Removed MapUpdater - no live tracking needed, just static location display

const JoggingTracker = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isGerman } = useLanguage();
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [logs, setLogs] = useState<JoggingLog[]>([]);
  const [userWeight, setUserWeight] = useState(70);
  const [userId, setUserId] = useState<string>("");
  // Activity dialog state
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityType | null>(null);
  const [city, setCity] = useState("");
  const [destination, setDestination] = useState("");
  const [participants, setParticipants] = useState(1);
  
  // Active session
  const [activeSession, setActiveSession] = useState<ActivitySession | null>(null);
  
  // Live speed that increases during activity
  const [liveSpeed, setLiveSpeed] = useState(8.0);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate("/login");
        return;
      }

      setUserId(session.user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("weight")
        .eq("user_id", session.user.id)
        .single();

      if (profile?.weight) {
        setUserWeight(profile.weight);
      }

      loadLogs(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/login");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const loadLogs = async (uid: string) => {
    const { data } = await supabase
      .from("jogging_logs")
      .select("*")
      .eq("user_id", uid)
      .order("completed_at", { ascending: false })
      .limit(30);

    if (data) {
      setLogs(data);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
        // Speed increases live from 8.0
        setLiveSpeed((prev) => Math.min(prev + 0.01, 25));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive]);

  const getBaseSpeed = (type: ActivityType) => {
    switch (type) {
      case "bicycle": return 20;
      case "running": return 12;
      case "jogging": return 8;
      default: return 8;
    }
  };

  const calculateDistance = useCallback((totalSeconds: number, type: ActivityType) => {
    const hours = totalSeconds / 3600;
    const baseSpeed = getBaseSpeed(type);
    return baseSpeed * hours;
  }, []);

  const calculateCalories = useCallback((distanceKm: number, totalSeconds: number, type: ActivityType) => {
    if (totalSeconds === 0) return 0;
    const hours = totalSeconds / 3600;
    const MET = type === "bicycle" ? 8.0 : type === "running" ? 11.5 : 9.8;
    return Math.round(MET * userWeight * hours);
  }, [userWeight]);

  const handleActivityClick = (type: ActivityType) => {
    setSelectedActivity(type);
    setCity("");
    setDestination("");
    setParticipants(1);
    setActivityDialogOpen(true);
  };

  const handleStartActivity = () => {
    if (!selectedActivity || !city) {
      toast({ title: isGerman ? "Fehler" : "Error", description: isGerman ? "Bitte gib deinen Standort an" : "Please enter your location", variant: "destructive" });
      return;
    }

    setActiveSession({
      type: selectedActivity,
      city,
      destination,
      participants
    });
    setSeconds(0);
    setLiveSpeed(getBaseSpeed(selectedActivity));
    setIsActive(true);
    setActivityDialogOpen(false);
  };

  const toggle = () => {
    setIsActive(!isActive);
  };

  const reset = () => {
    setSeconds(0);
    setIsActive(false);
    setActiveSession(null);
    setLiveSpeed(8.0);
  };

  const handleStop = async () => {
    if (seconds === 0 || !activeSession) return;
    
    setIsActive(false);
    
    const distanceKm = calculateDistance(seconds, activeSession.type);
    const estimatedCalories = calculateCalories(distanceKm, seconds, activeSession.type);

    if (!userId) {
      reset();
      return;
    }

    const activityLabels = {
      bicycle: isGerman ? "Fahrrad" : "Bicycle",
      running: isGerman ? "Laufen" : "Running",
      jogging: "Jogging"
    };

    const notes = JSON.stringify({
      type: activeSession.type,
      label: activityLabels[activeSession.type],
      city: activeSession.city,
      destination: activeSession.destination,
      participants: activeSession.participants,
      speed: liveSpeed.toFixed(1)
    });

    const { error } = await supabase
      .from("jogging_logs")
      .insert({
        user_id: userId,
        duration: seconds,
        distance: parseFloat(distanceKm.toFixed(2)),
        calories: estimatedCalories,
        notes
      });

    if (error) {
      toast({ title: isGerman ? "Fehler" : "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ 
        title: isGerman ? "Gespeichert" : "Saved", 
        description: `${activityLabels[activeSession.type]} • ${distanceKm.toFixed(2)} km • ${formatTime(seconds)} • ${estimatedCalories} kcal` 
      });
      loadLogs(userId);
    }
    
    reset();
  };

  const deleteLog = async (id: string) => {
    const { error } = await supabase.from("jogging_logs").delete().eq("id", id);
    if (!error) {
      toast({ title: isGerman ? "Gelöscht" : "Deleted" });
      loadLogs(userId);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDuration = (duration: number) => {
    if (duration > 100) {
      return formatTime(duration);
    }
    const hours = Math.floor(duration / 60);
    const mins = duration % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:00`;
  };

  const parseLogNotes = (notes: string | null) => {
    if (!notes) return null;
    try {
      return JSON.parse(notes);
    } catch {
      return null;
    }
  };

  // Live calculated values
  const liveDistance = activeSession ? calculateDistance(seconds, activeSession.type) : 0;
  const liveCalories = activeSession ? calculateCalories(liveDistance, seconds, activeSession.type) : 0;

  const activityTypes = [
    { type: "bicycle" as ActivityType, label: isGerman ? "Fahrrad" : "Bicycle", icon: Bike, bgImage: bicycleBg },
    { type: "running" as ActivityType, label: isGerman ? "Laufen" : "Running", icon: PersonStanding, bgImage: laufenBg },
    { type: "jogging" as ActivityType, label: "Jogging", icon: Timer, bgImage: joggingImg },
  ];

  return (
    <div className="min-h-screen pb-24 relative">
      {/* Background */}
      <div className="fixed inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${joggingBg})` }} />
      <div className="fixed inset-0 bg-black/60" />

      <div className="relative z-10 max-w-screen-xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="text-white">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">{isGerman ? "Aktivitäts-Tracker" : "Activity Tracker"}</h1>
            <p className="text-white/60 text-sm">
              {activeSession ? (
                <span className="text-green-400">{isGerman ? "Läuft..." : "Running..."}</span>
              ) : (
                <span>{isGerman ? "Wähle eine Aktivität" : "Choose an activity"}</span>
              )}
            </p>
          </div>
        </div>

        {/* Activity Type Boxes */}
        {!activeSession && (
          <section aria-label={isGerman ? "Aktivität auswählen" : "Choose activity"} className="mb-6">
            <div className="grid grid-cols-3 gap-3">
              {activityTypes.map((activity) => (
                <Card
                  key={activity.type}
                  onClick={() => handleActivityClick(activity.type)}
                  className="relative overflow-hidden border-white/10 hover:scale-105 transition-all duration-300 cursor-pointer hover:border-primary/50 aspect-square"
                >
                  <img
                    src={activity.bgImage}
                    alt={activity.label}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                  <div className="absolute inset-0 flex flex-col items-center justify-end pb-4 text-white">
                    <activity.icon className="w-8 h-8 mb-2 text-primary drop-shadow-lg" />
                    <span className="text-sm font-bold drop-shadow-lg">{activity.label}</span>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Active Session Display */}
        {activeSession && (
          <>
            {/* Session Info Card */}
            <Card className="bg-gradient-to-br from-green-900/80 to-green-700/60 backdrop-blur-sm border-white/10 p-4 mb-4 rounded-2xl">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  {activityTypes.find(a => a.type === activeSession.type)?.icon && (
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      {(() => {
                        const Icon = activityTypes.find(a => a.type === activeSession.type)?.icon;
                        return Icon ? <Icon className="w-5 h-5 text-white" /> : null;
                      })()}
                    </div>
                  )}
                  <div>
                    <div className="text-lg font-bold text-white">
                      {activityTypes.find(a => a.type === activeSession.type)?.label}
                    </div>
                    <div className="text-xs text-white/70">
                      {activeSession.city} → {activeSession.destination || (isGerman ? "Keine Angabe" : "Not specified")}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white tabular-nums">{formatTime(seconds)}</div>
                  <div className="text-xs text-white/60">{activeSession.participants} {isGerman ? "Personen" : "people"}</div>
                </div>
              </div>
            </Card>

            {/* Control Buttons */}
            <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-4 mb-4">
              <div className="flex gap-3 justify-center flex-wrap">
                <Button variant="outline" size="lg" onClick={reset} className="w-14">
                  <RotateCcw className="w-5 h-5" />
                </Button>
                <Button 
                  size="lg" 
                  onClick={toggle}
                  className={`w-16 ${isActive ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'}`}
                >
                  {isActive ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </Button>
                <Button 
                  size="lg" 
                  onClick={handleStop}
                  className="w-16 bg-red-500 hover:bg-red-600"
                  disabled={seconds === 0}
                >
                  <Square className="w-6 h-6" />
                </Button>
              </div>
            </Card>
          </>
        )}

        {/* Live Stats - Distance, Time, kcal/kmh */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-4">
            <div className="text-xs text-white/60 mb-1">{isGerman ? "Distanz" : "Distance"}</div>
            <div className="text-lg font-bold text-white">{liveDistance.toFixed(2)} km</div>
          </Card>
          <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-4">
            <div className="text-xs text-white/60 mb-1">{isGerman ? "Zeit" : "Time"}</div>
            <div className="text-lg font-bold text-white">{formatTime(seconds)}</div>
          </Card>
          <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-4">
            <div className="text-xs text-white/60 mb-1">kcal / km/h</div>
            <div className="text-lg font-bold text-white">{liveCalories} / {liveSpeed.toFixed(1)}</div>
          </Card>
        </div>

        {/* History */}
        <h2 className="text-xl font-bold mb-4 text-white">{isGerman ? "Verlauf" : "History"}</h2>
        <div className="space-y-3">
          {logs.map((log) => {
            const parsed = parseLogNotes(log.notes);
            return (
              <Card key={log.id} className="bg-black/40 backdrop-blur-sm border-white/10 p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {parsed && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-primary">{parsed.label || "Activity"}</span>
                        {parsed.city && (
                          <span className="text-xs text-white/50">
                            {parsed.city} {parsed.destination ? `→ ${parsed.destination}` : ""}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="font-medium text-white">{log.distance.toFixed(2)} km</div>
                    <div className="text-sm text-white/60">
                      {formatDuration(log.duration)} • {log.calories || 0} kcal • {parsed?.speed || (log.distance / (log.duration > 100 ? log.duration / 3600 : log.duration / 60)).toFixed(1)} km/h
                    </div>
                    {parsed?.participants && parsed.participants > 1 && (
                      <div className="text-xs text-white/40 mt-1">{parsed.participants} {isGerman ? "Personen" : "people"}</div>
                    )}
                    <div className="text-xs text-white/40">{format(new Date(log.completed_at), "dd.MM.yyyy HH:mm")}</div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteLog(log.id)} className="text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
          {logs.length === 0 && (
            <div className="text-center text-white/50 py-8">{isGerman ? "Keine Einträge" : "No entries"}</div>
          )}
        </div>

        {/* Activity Start Dialog */}
        <Dialog open={activityDialogOpen} onOpenChange={setActivityDialogOpen}>
          <DialogContent className="sm:max-w-md bg-black/90 backdrop-blur-lg border-white/20">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white">
                {selectedActivity && activityTypes.find(a => a.type === selectedActivity)?.icon && (
                  (() => {
                    const Icon = activityTypes.find(a => a.type === selectedActivity)?.icon;
                    return Icon ? <Icon className="w-5 h-5 text-primary" /> : null;
                  })()
                )}
                {selectedActivity && activityTypes.find(a => a.type === selectedActivity)?.label}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-white">{isGerman ? "Dein Standort / Stadt" : "Your Location / City"} *</Label>
                <Input 
                  value={city} 
                  onChange={(e) => setCity(e.target.value)} 
                  placeholder={isGerman ? "z.B. Berlin" : "e.g. Berlin"}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              <div>
                <Label className="text-white">{isGerman ? "Ziel (optional)" : "Destination (optional)"}</Label>
                <Input 
                  value={destination} 
                  onChange={(e) => setDestination(e.target.value)} 
                  placeholder={isGerman ? "z.B. München" : "e.g. Munich"}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              <div>
                <Label className="text-white">{isGerman ? "Anzahl Personen" : "Number of People"}</Label>
                <Input 
                  type="number" 
                  min={1}
                  value={participants} 
                  onChange={(e) => setParticipants(parseInt(e.target.value) || 1)} 
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              <Button onClick={handleStartActivity} className="w-full bg-green-500 hover:bg-green-600">
                <Play className="w-4 h-4 mr-2" />
                {isGerman ? "Starten" : "Start"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <BottomNav />
    </div>
  );
};

export default JoggingTracker;
