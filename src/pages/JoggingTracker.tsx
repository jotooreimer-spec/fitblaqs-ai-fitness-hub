import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Pause, RotateCcw, Save, ArrowLeft, Trash2, ZoomIn, ZoomOut, MapPin, Flag, Timer } from "lucide-react";
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

interface RoutePoint {
  x: number;
  y: number;
}

const JoggingTracker = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGerman, setIsGerman] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [logs, setLogs] = useState<JoggingLog[]>([]);
  const [userWeight, setUserWeight] = useState(70);
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [mapZoom, setMapZoom] = useState(1);
  const [timerDialogOpen, setTimerDialogOpen] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [targetTime, setTargetTime] = useState<number | null>(null);
  const [runnerPosition, setRunnerPosition] = useState({ x: 150, y: 200 });

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate("/login");
        return;
      }

      const metadata = session.user.user_metadata;
      setIsGerman(metadata.language === "de");

      const { data: profile } = await supabase
        .from("profiles")
        .select("weight")
        .eq("user_id", session.user.id)
        .single();

      if (profile?.weight) {
        setUserWeight(profile.weight);
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

    const { data } = await supabase
      .from("jogging_logs")
      .select("*")
      .eq("user_id", session.user.id)
      .order("completed_at", { ascending: false })
      .limit(10);

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
          }
          
          // Update runner position
          if (newSeconds % 2 === 0) {
            setRoutePoints(prevPoints => {
              const lastPoint = prevPoints[prevPoints.length - 1] || { x: 150, y: 200 };
              const angle = (Math.random() - 0.3) * Math.PI / 2 - Math.PI / 4;
              const distance = 5 + Math.random() * 10;
              const newPoint = {
                x: lastPoint.x + Math.cos(angle) * distance,
                y: lastPoint.y - Math.abs(Math.sin(angle) * distance)
              };
              setRunnerPosition(newPoint);
              return [...prevPoints, newPoint];
            });
          }
          
          return newSeconds;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, targetTime]);

  const autoSaveJoggingLog = async (totalSeconds: number) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const durationMinutes = Math.floor(totalSeconds / 60);
    const distanceKm = calculateDistance();
    const estimatedCalories = calculateCalories(distanceKm);

    const { error } = await supabase
      .from("jogging_logs")
      .insert({
        user_id: session.user.id,
        duration: durationMinutes,
        distance: parseFloat(distanceKm.toFixed(2)),
        calories: estimatedCalories
      });

    if (!error) {
      toast({ title: isGerman ? "Auto-gespeichert" : "Auto-saved", description: isGerman ? "Timer beendet - Lauf gespeichert" : "Timer ended - Run saved" });
      reset();
      loadLogs();
    }
  };

  const toggle = () => setIsActive(!isActive);
  
  const reset = () => {
    setSeconds(0);
    setIsActive(false);
    setRoutePoints([]);
    setRunnerPosition({ x: 150, y: 200 });
    setTargetTime(null);
  };

  const calculateDistance = () => {
    const hours = seconds / 3600;
    const avgSpeed = 10; // 10 km/h average
    return avgSpeed * hours;
  };

  const calculateCalories = (distanceKm: number) => {
    const hours = seconds / 3600;
    const MET = 10;
    return Math.round(MET * userWeight * hours);
  };

  const saveJoggingLog = async () => {
    if (seconds < 60) {
      toast({ title: isGerman ? "Fehler" : "Error", description: isGerman ? "Mindestens 1 Minute laufen" : "Run for at least 1 minute", variant: "destructive" });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const durationMinutes = Math.floor(seconds / 60);
    const distanceKm = calculateDistance();
    const estimatedCalories = calculateCalories(distanceKm);

    const { error } = await supabase
      .from("jogging_logs")
      .insert({
        user_id: session.user.id,
        duration: durationMinutes,
        distance: parseFloat(distanceKm.toFixed(2)),
        calories: estimatedCalories
      });

    if (error) {
      toast({ title: isGerman ? "Fehler" : "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: isGerman ? "Gespeichert" : "Saved", description: isGerman ? "Lauf + Kalender gespeichert" : "Run + Calendar saved" });
    reset();
    loadLogs();
  };

  const saveToCalendar = (log: JoggingLog) => {
    toast({ title: isGerman ? "Gespeichert" : "Saved", description: isGerman ? "Im Kalender gespeichert" : "Saved to calendar" });
  };

  const deleteLog = async (id: string) => {
    const { error } = await supabase.from("jogging_logs").delete().eq("id", id);
    if (!error) {
      toast({ title: isGerman ? "Gelöscht" : "Deleted" });
      loadLogs();
    }
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const setTimer = () => {
    const totalSeconds = timerMinutes * 60 + timerSeconds;
    if (totalSeconds > 0) {
      setTargetTime(totalSeconds);
      setTimerDialogOpen(false);
      toast({ title: isGerman ? "Timer gesetzt" : "Timer set", description: `${timerMinutes}:${timerSeconds.toString().padStart(2, '0')}` });
    }
  };

  const currentDistance = calculateDistance();
  const currentCalories = calculateCalories(currentDistance);
  const startPoint = routePoints.length > 0 ? routePoints[0] : { x: 150, y: 200 };
  const endPoint = routePoints.length > 1 ? routePoints[routePoints.length - 1] : null;

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
            <p className="text-white/60 text-sm">{isGerman ? "Verfolge deine Läufe" : "Track your runs"}</p>
          </div>
        </div>

        {/* Smaller Map View */}
        <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-0 mb-4 relative overflow-hidden rounded-2xl">
          <div className="relative h-40 bg-gradient-to-br from-[#f5e6d3] to-[#e8d5c4] overflow-hidden">
            {/* Zoom Controls */}
            <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
              <Button size="icon" variant="secondary" className="w-7 h-7 bg-white/90" onClick={() => setMapZoom(prev => Math.min(prev + 0.25, 2))}>
                <ZoomIn className="w-3 h-3" />
              </Button>
              <Button size="icon" variant="secondary" className="w-7 h-7 bg-white/90" onClick={() => setMapZoom(prev => Math.max(prev - 0.25, 0.5))}>
                <ZoomOut className="w-3 h-3" />
              </Button>
            </div>

            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 160" preserveAspectRatio="xMidYMid slice" style={{ transform: `scale(${mapZoom})`, transformOrigin: 'center' }}>
              <rect width="300" height="160" fill="#f5e6d3" />
              <path d="M 0,80 L 300,80" stroke="#fff" strokeWidth="8" fill="none" />
              <path d="M 0,40 L 300,40" stroke="#fff" strokeWidth="5" fill="none" />
              <path d="M 0,120 L 300,120" stroke="#fff" strokeWidth="5" fill="none" />
              <path d="M 75,0 L 75,160" stroke="#fff" strokeWidth="5" fill="none" />
              <path d="M 150,0 L 150,160" stroke="#fff" strokeWidth="6" fill="none" />
              <path d="M 225,0 L 225,160" stroke="#fff" strokeWidth="5" fill="none" />
              <rect x="20" y="15" width="35" height="20" fill="#90EE90" rx="5" />
              <rect x="240" y="15" width="35" height="20" fill="#90EE90" rx="5" />
              
              {routePoints.length > 1 && (
                <path d={`M ${routePoints.map(p => `${p.x},${p.y}`).join(' L ')}`} stroke="#8B5CF6" strokeWidth="3" fill="none" strokeLinecap="round" />
              )}
              
              {/* Start Marker */}
              <g transform={`translate(${startPoint.x - 8}, ${startPoint.y - 20})`}>
                <path d="M8,0 C3.5,0 0,3.5 0,8 C0,14 8,22 8,22 C8,22 16,14 16,8 C16,3.5 12.5,0 8,0 Z" fill="#22C55E" />
                <circle cx="8" cy="8" r="4" fill="white" />
              </g>
              
              {/* End/Goal Marker */}
              {endPoint && (
                <g transform={`translate(${endPoint.x - 8}, ${endPoint.y - 20})`}>
                  <path d="M8,0 C3.5,0 0,3.5 0,8 C0,14 8,22 8,22 C8,22 16,14 16,8 C16,3.5 12.5,0 8,0 Z" fill="#EF4444" />
                  <circle cx="8" cy="8" r="4" fill="white" />
                </g>
              )}
              
              {/* Running figure */}
              {isActive && (
                <g transform={`translate(${runnerPosition.x - 6}, ${runnerPosition.y - 12})`}>
                  <circle cx="6" cy="3" r="3" fill="#3B82F6" />
                  <path d="M6,6 L6,10 M3,8 L9,8 M6,10 L3,14 M6,10 L9,14" stroke="#3B82F6" strokeWidth="1.5" fill="none" />
                </g>
              )}
            </svg>
            
            {/* Stats Box */}
            <div className="absolute top-2 right-2 bg-slate-800/90 rounded-lg p-2 text-white text-xs">
              <div className="flex items-center gap-1 mb-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>Start</span>
                <div className="w-2 h-2 rounded-full bg-red-500 ml-2"></div>
                <span>Ziel</span>
              </div>
              <div className="text-lg font-bold">{currentDistance.toFixed(2)} km</div>
            </div>

            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
              <Button onClick={toggle} size="sm" className={`rounded-full px-4 font-bold ${isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}>
                {isActive ? 'STOP' : 'GO'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Timer Display */}
        <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-6 mb-4">
          <div className="text-center">
            <div className="text-5xl font-bold mb-4 tabular-nums text-white">{formatTime(seconds)}</div>
            {targetTime && (
              <div className="text-sm text-white/60 mb-3">
                {isGerman ? "Ziel:" : "Target:"} {formatTime(targetTime)}
              </div>
            )}
            <div className="flex gap-2 justify-center flex-wrap">
              <Button variant="default" size="lg" onClick={toggle} className="w-16">
                {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
              <Button variant="outline" size="lg" onClick={reset} className="w-16">
                <RotateCcw className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => setTimerDialogOpen(true)} className="w-16">
                <Timer className="w-5 h-5" />
              </Button>
              <Button variant="default" size="lg" className="w-16" disabled={seconds < 60} onClick={saveJoggingLog}>
                <Save className="w-5 h-5" />
              </Button>
              <Button variant="destructive" size="lg" onClick={reset} className="w-16">
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Live Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-4">
            <div className="text-xs text-white/60 mb-1">{isGerman ? "Distanz" : "Distance"}</div>
            <div className="text-xl font-bold text-white">{currentDistance.toFixed(2)} km</div>
          </Card>
          <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-4">
            <div className="text-xs text-white/60 mb-1">{isGerman ? "Zeit" : "Time"}</div>
            <div className="text-xl font-bold text-white">{Math.floor(seconds / 60)} min</div>
          </Card>
          <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-4">
            <div className="text-xs text-white/60 mb-1">kcal</div>
            <div className="text-xl font-bold text-white">{currentCalories}</div>
          </Card>
        </div>

        {/* History */}
        <h2 className="text-xl font-bold mb-4 text-white">{isGerman ? "Verlauf" : "History"}</h2>
        <div className="space-y-3">
          {logs.map((log) => (
            <Card key={log.id} className="bg-black/40 backdrop-blur-sm border-white/10 p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-white">{log.distance.toFixed(2)} km</div>
                  <div className="text-sm text-white/60">{log.duration} min • {log.calories || 0} kcal</div>
                  <div className="text-xs text-white/40">{format(new Date(log.completed_at), "dd.MM.yyyy")}</div>
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
        </div>

        {/* Timer Dialog */}
        <Dialog open={timerDialogOpen} onOpenChange={setTimerDialogOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{isGerman ? "Timer einstellen" : "Set Timer"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{isGerman ? "Minuten" : "Minutes"}</Label>
                <Input type="number" min="0" max="120" value={timerMinutes} onChange={(e) => setTimerMinutes(parseInt(e.target.value) || 0)} />
              </div>
              <div>
                <Label>{isGerman ? "Sekunden" : "Seconds"}</Label>
                <Input type="number" min="0" max="59" value={timerSeconds} onChange={(e) => setTimerSeconds(parseInt(e.target.value) || 0)} />
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