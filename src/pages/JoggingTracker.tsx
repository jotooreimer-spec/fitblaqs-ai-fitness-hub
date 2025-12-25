import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Pause, RotateCcw, Trash2, Square, ArrowLeft, Timer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import joggingBg from "@/assets/jogging-bg.png";

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
  const { isGerman } = useLanguage();
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [logs, setLogs] = useState<JoggingLog[]>([]);
  const [userWeight, setUserWeight] = useState(70);
  const [userId, setUserId] = useState<string>("");
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
        setLiveSpeed((prev) => Math.min(prev + 0.01, 25));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive]);

  const calculateDistance = useCallback((totalSeconds: number) => {
    const hours = totalSeconds / 3600;
    return 8 * hours; // 8 km/h jogging speed
  }, []);

  const calculateCalories = useCallback((distanceKm: number, totalSeconds: number) => {
    if (totalSeconds === 0) return 0;
    const hours = totalSeconds / 3600;
    const MET = 9.8; // jogging MET
    return Math.round(MET * userWeight * hours);
  }, [userWeight]);

  const toggle = () => {
    setIsActive(!isActive);
  };

  const reset = () => {
    setSeconds(0);
    setIsActive(false);
    setLiveSpeed(8.0);
  };

  const handleStop = async () => {
    if (seconds === 0) return;
    
    setIsActive(false);
    
    const distanceKm = calculateDistance(seconds);
    const estimatedCalories = calculateCalories(distanceKm, seconds);

    if (!userId) {
      reset();
      return;
    }

    const { error } = await supabase
      .from("jogging_logs")
      .insert({
        user_id: userId,
        duration: seconds,
        distance: parseFloat(distanceKm.toFixed(2)),
        calories: estimatedCalories,
        notes: JSON.stringify({ speed: liveSpeed.toFixed(1) })
      });

    if (error) {
      toast({ title: isGerman ? "Fehler" : "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ 
        title: isGerman ? "Gespeichert" : "Saved", 
        description: `${distanceKm.toFixed(2)} km • ${formatTime(seconds)} • ${estimatedCalories} kcal` 
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

  const liveDistance = calculateDistance(seconds);
  const liveCalories = calculateCalories(liveDistance, seconds);

  return (
    <div className="min-h-screen pb-24 relative">
      {/* Background */}
      <div className="fixed inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${joggingBg})` }} />
      <div className="fixed inset-0 bg-black/70" />

      <div className="relative z-10 max-w-md mx-auto p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="text-white p-0">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">Jogging Tracker</h1>
            <p className="text-white/60 text-sm">
              {isActive ? (isGerman ? "Läuft..." : "Running...") : (isGerman ? "Drücke Play zum Starten" : "Press Play to start")}
            </p>
          </div>
        </div>

        {/* Map Area with Grid and Animated Arc */}
        <Card className="bg-[#1a2e1a]/90 border-green-900/50 rounded-2xl p-4 mb-4 relative overflow-hidden min-h-[160px]">
          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-30">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#22c55e" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          
          {/* Animated Arc Path with Moving Dot */}
          <svg 
            className="absolute inset-0 w-full h-full" 
            viewBox="0 0 200 120" 
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Arc Path - curved line */}
            <path
              d="M 30 20 Q 50 80, 90 90"
              fill="none"
              stroke="#22c55e"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="100"
              strokeDashoffset={100 - Math.min((seconds / 600) * 100, 100)}
              style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
            />
            
            {/* Start Point */}
            <circle 
              cx="30" 
              cy="20" 
              r="5" 
              fill="#22c55e" 
              className="drop-shadow-lg"
            />
            
            {/* Moving Dot along arc */}
            {(() => {
              // Calculate position along the quadratic bezier curve
              const progress = Math.min(seconds / 600, 1); // 10 minutes = full arc
              const t = progress;
              // Quadratic Bezier: P = (1-t)²P0 + 2(1-t)tP1 + t²P2
              const x = Math.pow(1 - t, 2) * 30 + 2 * (1 - t) * t * 50 + Math.pow(t, 2) * 90;
              const y = Math.pow(1 - t, 2) * 20 + 2 * (1 - t) * t * 80 + Math.pow(t, 2) * 90;
              
              return (
                <circle 
                  cx={x} 
                  cy={y} 
                  r="6" 
                  fill="#4ade80" 
                  className="drop-shadow-lg"
                  style={{ 
                    filter: 'drop-shadow(0 0 6px rgba(74, 222, 128, 0.8))',
                    transition: 'cx 0.5s ease-out, cy 0.5s ease-out'
                  }}
                />
              );
            })()}
            
            {/* End Point (visible when approaching) */}
            <circle 
              cx="90" 
              cy="90" 
              r="5" 
              fill="#22c55e" 
              opacity={seconds > 300 ? 0.8 : 0.3}
              className="drop-shadow-lg"
            />
          </svg>

          {/* Time and Distance Display */}
          <div className="relative z-10 flex flex-col items-end justify-center min-h-[120px] pr-2">
            <div className="text-4xl font-bold text-white tabular-nums tracking-wider">
              {formatTime(seconds)}
            </div>
            <div className="text-xl font-semibold text-green-400 tabular-nums">
              {liveDistance.toFixed(2)} km
            </div>
          </div>
        </Card>

        {/* Control Buttons */}
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="flex gap-3 justify-center">
            <Button 
              variant="outline" 
              size="lg" 
              onClick={reset} 
              className="w-16 h-14 rounded-xl bg-background/10 border-border/30 hover:bg-background/20"
            >
              <RotateCcw className="w-6 h-6 text-white" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="w-16 h-14 rounded-xl bg-background/10 border-border/30 hover:bg-background/20"
            >
              <Timer className="w-6 h-6 text-white" />
            </Button>
            <Button 
              size="lg" 
              onClick={toggle}
              className="w-20 h-14 rounded-xl bg-green-600 hover:bg-green-700 border-0"
            >
              {isActive ? <Pause className="w-7 h-7 text-white" /> : <Play className="w-7 h-7 text-white" />}
            </Button>
          </div>
          <Button 
            size="lg" 
            onClick={handleStop}
            disabled={seconds === 0}
            className="w-16 h-14 rounded-xl bg-red-600/80 hover:bg-red-700 border-0 disabled:opacity-50"
          >
            <Square className="w-6 h-6 text-white" />
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-4 rounded-xl">
            <div className="text-white/60 text-xs mb-1">{isGerman ? "Distanz" : "Distance"}</div>
            <div className="text-2xl font-bold text-white tabular-nums">{liveDistance.toFixed(2)}</div>
            <div className="text-white/60 text-sm">km</div>
          </Card>
          <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-4 rounded-xl">
            <div className="text-white/60 text-xs mb-1">{isGerman ? "Zeit" : "Time"}</div>
            <div className="text-lg font-bold text-white tabular-nums">{formatTime(seconds)}</div>
          </Card>
          <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-4 rounded-xl">
            <div className="text-white/60 text-xs mb-1">kcal / km/h</div>
            <div className="text-xl font-bold text-white tabular-nums">
              {liveCalories} / {liveSpeed.toFixed(1)}
            </div>
          </Card>
        </div>

        {/* History */}
        <h2 className="text-xl font-bold mb-4 text-white">{isGerman ? "Verlauf" : "History"}</h2>
        <div className="space-y-3">
          {logs.map((log) => (
            <Card key={log.id} className="bg-black/40 backdrop-blur-sm border-white/10 p-4 rounded-xl">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-medium text-white">{log.distance.toFixed(2)} km</div>
                  <div className="text-sm text-white/60">
                    {formatDuration(log.duration)} • {log.calories || 0} kcal
                  </div>
                  <div className="text-xs text-white/40">{format(new Date(log.completed_at), "dd.MM.yyyy HH:mm")}</div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteLog(log.id)} className="text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
          {logs.length === 0 && (
            <div className="text-center text-white/50 py-8">{isGerman ? "Keine Einträge" : "No entries"}</div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default JoggingTracker;
