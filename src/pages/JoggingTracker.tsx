import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Pause, RotateCcw, Save, ArrowLeft, Trash2, Timer, Square } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import joggingBg from "@/assets/jogging-bg.png";

interface JoggingLog {
  id: string;
  duration: number;
  distance: number;
  calories: number | null;
  completed_at: string;
}

const JoggingTracker = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGerman, setIsGerman] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [logs, setLogs] = useState<JoggingLog[]>([]);
  const [userWeight, setUserWeight] = useState(70);
  const [timerDialogOpen, setTimerDialogOpen] = useState(false);
  const [timerHours, setTimerHours] = useState(0);
  const [timerMinutes, setTimerMinutes] = useState(0);
  const [targetTime, setTargetTime] = useState<number | null>(null);
  const [userId, setUserId] = useState<string>("");
  
  // Circle animation angle
  const [circleAngle, setCircleAngle] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate("/login");
        return;
      }

      const metadata = session.user.user_metadata;
      setIsGerman(metadata.language === "de");
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
        setSeconds((prev) => {
          const newSeconds = prev + 1;
          
          // Check if target time reached
          if (targetTime && newSeconds >= targetTime) {
            setIsActive(false);
            autoSaveJoggingLog(newSeconds);
            setSeconds(0);
            setTargetTime(null);
          }
          
          return newSeconds;
        });
        
        // Animate the circle
        setCircleAngle(prev => (prev + 3) % 360);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, targetTime]);

  const autoSaveJoggingLog = async (totalSeconds: number) => {
    if (!userId) return;

    const distanceKm = calculateFallbackDistance(totalSeconds);
    const estimatedCalories = calculateCalories(distanceKm, totalSeconds);

    const { error } = await supabase
      .from("jogging_logs")
      .insert({
        user_id: userId,
        duration: totalSeconds, // Store as seconds for precision
        distance: parseFloat(distanceKm.toFixed(2)),
        calories: estimatedCalories
      });

    if (!error) {
      toast({ title: isGerman ? "Auto-gespeichert" : "Auto-saved", description: isGerman ? "Timer beendet - Lauf gespeichert" : "Timer ended - Run saved" });
      loadLogs(userId);
    }
  };

  const toggle = () => {
    setIsActive(!isActive);
  };
  
  const reset = () => {
    setSeconds(0);
    setIsActive(false);
    setCircleAngle(0);
    setTargetTime(null);
  };

  // Stop and save to history - always saves current values
  const handleStop = async () => {
    if (seconds === 0) {
      return;
    }
    
    setIsActive(false);
    
    // Calculate final values
    const distanceKm = calculateFallbackDistance(seconds);
    const estimatedCalories = calculateCalories(distanceKm, seconds);

    if (!userId) {
      reset();
      return;
    }

    // Save to database - duration in seconds
    const { error } = await supabase
      .from("jogging_logs")
      .insert({
        user_id: userId,
        duration: seconds, // Store seconds directly
        distance: parseFloat(distanceKm.toFixed(2)),
        calories: estimatedCalories
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

  // Calculate fallback distance based on average jogging speed
  const calculateFallbackDistance = useCallback((totalSeconds: number) => {
    const hours = totalSeconds / 3600;
    const avgSpeed = 8; // 8 km/h average jogging speed
    return avgSpeed * hours;
  }, []);

  // Calculate calories based on MET value for jogging
  const calculateCalories = useCallback((distanceKm: number, totalSeconds: number) => {
    if (totalSeconds === 0) return 0;
    const hours = totalSeconds / 3600;
    const MET = 9.8; // MET for jogging at ~8 km/h
    return Math.round(MET * userWeight * hours);
  }, [userWeight]);

  // Calculate speed in km/h - starts at 8.0, live updates
  // Logic: Start at 8.0 km/h, updates live based on distance/time
  const calculateSpeed = useCallback((totalSeconds: number, distanceKm: number) => {
    // Default start value
    if (totalSeconds === 0) return 8.0;
    
    // When activity is running, calculate live: speed = distance / time
    const hours = totalSeconds / 3600;
    if (hours === 0) return 8.0;
    
    const speed = distanceKm / hours;
    return speed > 0 ? speed : 8.0;
  }, []);

  const saveToCalendar = (log: JoggingLog) => {
    toast({ title: isGerman ? "Gespeichert" : "Saved", description: isGerman ? "Im Kalender gespeichert" : "Saved to calendar" });
  };

  const deleteLog = async (id: string) => {
    const { error } = await supabase.from("jogging_logs").delete().eq("id", id);
    if (!error) {
      toast({ title: isGerman ? "Gelöscht" : "Deleted" });
      loadLogs(userId);
    }
  };

  // Format time as HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Format duration from stored value (could be seconds or minutes)
  const formatDuration = (duration: number) => {
    // If duration is large (>100), assume it's in seconds
    if (duration > 100) {
      return formatTime(duration);
    }
    // Otherwise assume minutes (legacy data)
    const hours = Math.floor(duration / 60);
    const mins = duration % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:00`;
  };

  const setTimer = () => {
    const totalSeconds = timerHours * 3600 + timerMinutes * 60;
    if (totalSeconds > 0) {
      setTargetTime(totalSeconds);
      setTimerDialogOpen(false);
      toast({ title: isGerman ? "Timer gesetzt" : "Timer set", description: `${timerHours}h ${timerMinutes}min` });
    }
  };

  // Real-time calculated values - speed starts at 8.0 km/h
  const liveDistance = calculateFallbackDistance(seconds);
  const liveCalories = calculateCalories(liveDistance, seconds);
  const liveSpeed = calculateSpeed(seconds, liveDistance);

  // Calculate animated circle position
  const circleRadius = 80;
  const circleX = 100 + Math.cos((circleAngle - 90) * Math.PI / 180) * circleRadius;
  const circleY = 100 + Math.sin((circleAngle - 90) * Math.PI / 180) * circleRadius;

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
            <h1 className="text-3xl font-bold text-white">Jogging Tracker</h1>
            <p className="text-white/60 text-sm">
              {isActive ? (
                <span className="text-green-400">{isGerman ? "Läuft..." : "Running..."}</span>
              ) : (
                <span>{isGerman ? "Drücke Play zum Starten" : "Press Play to start"}</span>
              )}
            </p>
          </div>
        </div>

        {/* Compact Square Map View */}
        <Card className="bg-gradient-to-br from-green-900/80 to-green-700/60 backdrop-blur-sm border-white/10 p-4 mb-4 rounded-2xl">
          <div className="flex gap-4 items-center">
            {/* Square animated map */}
            <div className="relative w-40 h-40 flex-shrink-0">
              <svg className="w-full h-full" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet">
                {/* Background */}
                <defs>
                  <radialGradient id="mapBg" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#2d5016" />
                    <stop offset="100%" stopColor="#1a3409" />
                  </radialGradient>
                  <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#16a34a" />
                  </linearGradient>
                </defs>
                
                <rect width="200" height="200" rx="16" fill="url(#mapBg)" />
                
                {/* Grid lines */}
                {[...Array(8)].map((_, i) => (
                  <line key={`h${i}`} x1="0" y1={i * 25} x2="200" y2={i * 25} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                ))}
                {[...Array(8)].map((_, i) => (
                  <line key={`v${i}`} x1={i * 25} y1="0" x2={i * 25} y2="200" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                ))}
                
                {/* Circular track outline */}
                <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
                
                {/* Progress arc - animated when running */}
                {isActive && (
                  <circle 
                    cx="100" 
                    cy="100" 
                    r="80" 
                    fill="none" 
                    stroke="url(#routeGradient)" 
                    strokeWidth="6" 
                    strokeLinecap="round"
                    strokeDasharray={`${circleAngle * 1.4} 504`}
                    transform="rotate(-90 100 100)"
                  />
                )}
                
                {/* Runner indicator - animated circle */}
                {isActive && (
                  <g>
                    <circle cx={circleX} cy={circleY} r="10" fill="#22c55e" className="animate-pulse" />
                    <circle cx={circleX} cy={circleY} r="5" fill="white" />
                  </g>
                )}
                
                {/* Start marker */}
                <circle cx="100" cy="20" r="6" fill="#22c55e" stroke="white" strokeWidth="2" />
                <text x="100" y="18" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">A</text>
              </svg>
            </div>
            
            {/* Stats display - HH:MM:SS format */}
            <div className="flex-1 text-white">
              <div className="text-3xl font-bold tabular-nums mb-2">{formatTime(seconds)}</div>
              <div className="text-xl font-semibold text-green-400 mb-2">{liveDistance.toFixed(2)} km</div>
              {targetTime && (
                <div className="text-sm text-white/60">
                  {isGerman ? "Ziel:" : "Target:"} {Math.floor(targetTime / 3600)}h {Math.floor((targetTime % 3600) / 60)}min
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Control Buttons - Play/Stop only */}
        <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-4 mb-4">
          <div className="flex gap-3 justify-center flex-wrap">
            <Button variant="outline" size="lg" onClick={reset} className="w-14">
              <RotateCcw className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => setTimerDialogOpen(true)} className="w-14">
              <Timer className="w-5 h-5" />
            </Button>
            {/* Play Button */}
            <Button 
              size="lg" 
              onClick={toggle}
              className={`w-16 ${isActive ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'}`}
            >
              {isActive ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </Button>
            {/* Stop Button - Red - Always clickable when seconds > 0 */}
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

        {/* Live Stats - Distance (km), Time (HH:MM:SS), kcal / kmh */}
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

        {/* History - Shows all values with units */}
        <h2 className="text-xl font-bold mb-4 text-white">{isGerman ? "Verlauf" : "History"}</h2>
        <div className="space-y-3">
          {logs.map((log) => (
            <Card key={log.id} className="bg-black/40 backdrop-blur-sm border-white/10 p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-white">{log.distance.toFixed(2)} km</div>
                  <div className="text-sm text-white/60">
                    {formatDuration(log.duration)} • {log.calories || 0} kcal • {(log.distance / (log.duration > 100 ? log.duration / 3600 : log.duration / 60)).toFixed(1)} km/h
                  </div>
                  <div className="text-xs text-white/40">{format(new Date(log.completed_at), "dd.MM.yyyy HH:mm")}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => saveToCalendar(log)} className="text-primary">
                    <Save className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteLog(log.id)} className="text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          {logs.length === 0 && (
            <div className="text-center text-white/50 py-8">{isGerman ? "Keine Einträge" : "No entries"}</div>
          )}
        </div>

        {/* Timer Dialog - Hours & Minutes */}
        <Dialog open={timerDialogOpen} onOpenChange={setTimerDialogOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{isGerman ? "Timer einstellen" : "Set Timer"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{isGerman ? "Stunden" : "Hours"}</Label>
                <Input type="number" min="0" max="24" value={timerHours} onChange={(e) => setTimerHours(parseInt(e.target.value) || 0)} />
              </div>
              <div>
                <Label>{isGerman ? "Minuten" : "Minutes"}</Label>
                <Input type="number" min="0" max="59" value={timerMinutes} onChange={(e) => setTimerMinutes(parseInt(e.target.value) || 0)} />
              </div>
            </div>
            <Button onClick={setTimer} className="w-full mt-4">{isGerman ? "Timer setzen" : "Set Timer"}</Button>
          </DialogContent>
        </Dialog>
      </div>

      <BottomNav />
    </div>
  );
};

export default JoggingTracker;