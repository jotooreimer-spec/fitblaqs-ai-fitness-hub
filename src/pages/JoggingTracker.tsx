import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Pause, RotateCcw, Save, ArrowLeft, Trash2, Timer } from "lucide-react";
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

interface GeoPosition {
  lat: number;
  lng: number;
  timestamp: number;
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
  const [timerMinutes, setTimerMinutes] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [targetTime, setTargetTime] = useState<number | null>(null);
  
  // GPS Tracking State
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [positions, setPositions] = useState<GeoPosition[]>([]);
  const [currentDistance, setCurrentDistance] = useState(0);
  const watchIdRef = useRef<number | null>(null);
  
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

    return () => {
      subscription.unsubscribe();
      stopGpsTracking();
    };
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

  // Calculate distance between two GPS coordinates using Haversine formula
  const calculateDistanceBetweenPoints = (pos1: GeoPosition, pos2: GeoPosition): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (pos2.lat - pos1.lat) * Math.PI / 180;
    const dLon = (pos2.lng - pos1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(pos1.lat * Math.PI / 180) * Math.cos(pos2.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Start GPS tracking
  const startGpsTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError(isGerman ? "GPS nicht verfügbar" : "GPS not available");
      return;
    }

    setGpsEnabled(true);
    setGpsError(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newPos: GeoPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: position.timestamp
        };

        setPositions(prev => {
          const updated = [...prev, newPos];
          
          // Calculate total distance
          if (updated.length >= 2) {
            let totalDist = 0;
            for (let i = 1; i < updated.length; i++) {
              totalDist += calculateDistanceBetweenPoints(updated[i-1], updated[i]);
            }
            setCurrentDistance(totalDist);
          }

          return updated;
        });
      },
      (error) => {
        console.error("GPS Error:", error);
        setGpsError(error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, [isGerman]);

  // Stop GPS tracking
  const stopGpsTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setGpsEnabled(false);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive) {
      interval = setInterval(() => {
        setSeconds((prev) => {
          const newSeconds = prev + 1;
          
          // Check if target time reached
          if (targetTime && newSeconds >= targetTime) {
            setIsActive(false);
            stopGpsTracking();
            autoSaveJoggingLog(newSeconds);
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
  }, [isActive, targetTime, stopGpsTracking]);

  const autoSaveJoggingLog = async (totalSeconds: number) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const durationMinutes = Math.floor(totalSeconds / 60);
    const distanceKm = currentDistance > 0 ? currentDistance : calculateFallbackDistance(totalSeconds);
    const estimatedCalories = calculateCalories(distanceKm, totalSeconds);

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

  const toggle = () => {
    if (!isActive) {
      startGpsTracking();
    } else {
      stopGpsTracking();
    }
    setIsActive(!isActive);
  };
  
  const reset = () => {
    setSeconds(0);
    setIsActive(false);
    setPositions([]);
    setCurrentDistance(0);
    setCircleAngle(0);
    setTargetTime(null);
    stopGpsTracking();
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

  const saveJoggingLog = async () => {
    if (seconds < 60) {
      toast({ title: isGerman ? "Fehler" : "Error", description: isGerman ? "Mindestens 1 Minute laufen" : "Run for at least 1 minute", variant: "destructive" });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const durationMinutes = Math.floor(seconds / 60);
    const distanceKm = currentDistance > 0 ? currentDistance : calculateFallbackDistance(seconds);
    const estimatedCalories = calculateCalories(distanceKm, seconds);

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

  // Real-time calculated values
  const liveDistance = currentDistance > 0 ? currentDistance : calculateFallbackDistance(seconds);
  const liveCalories = calculateCalories(liveDistance, seconds);
  
  // Convert GPS positions to SVG coordinates
  const positionsToSvg = () => {
    if (positions.length < 2) return "";
    const lats = positions.map(p => p.lat);
    const lngs = positions.map(p => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const padding = 0.0001;
    const width = Math.max(maxLng - minLng, padding);
    const height = Math.max(maxLat - minLat, padding);
    
    return positions.map((pos, i) => {
      const x = 50 + ((pos.lng - minLng) / width) * 200;
      const y = 150 - ((pos.lat - minLat) / height) * 100;
      return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
    }).join(' ');
  };

  // Calculate animated circle position
  const circleRadius = 120;
  const circleX = 150 + Math.cos((circleAngle - 90) * Math.PI / 180) * circleRadius;
  const circleY = 150 + Math.sin((circleAngle - 90) * Math.PI / 180) * circleRadius;

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
              {gpsEnabled ? (
                <span className="text-green-400">GPS {isGerman ? "aktiv" : "active"}</span>
              ) : (
                <span>{isGerman ? "GPS startet automatisch" : "GPS starts automatically"}</span>
              )}
            </p>
          </div>
        </div>

        {gpsError && (
          <Card className="bg-red-500/20 border-red-500/50 p-3 mb-4">
            <p className="text-red-400 text-sm">{gpsError}</p>
          </Card>
        )}

        {/* Circular Map View - Like Adidas Running App */}
        <Card className="bg-gradient-to-br from-green-900/80 to-green-700/60 backdrop-blur-sm border-white/10 p-0 mb-4 relative overflow-hidden rounded-3xl">
          <div className="relative h-80 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 300" preserveAspectRatio="xMidYMid slice">
              {/* Background gradient */}
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
              
              <rect width="300" height="300" fill="url(#mapBg)" />
              
              {/* Grid lines for map effect */}
              {[...Array(10)].map((_, i) => (
                <line key={`h${i}`} x1="0" y1={i * 30} x2="300" y2={i * 30} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              ))}
              {[...Array(10)].map((_, i) => (
                <line key={`v${i}`} x1={i * 30} y1="0" x2={i * 30} y2="300" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              ))}
              
              {/* Circular track outline */}
              <circle cx="150" cy="150" r="120" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="20" />
              
              {/* Progress arc - animated when running */}
              {isActive && (
                <circle 
                  cx="150" 
                  cy="150" 
                  r="120" 
                  fill="none" 
                  stroke="url(#routeGradient)" 
                  strokeWidth="8" 
                  strokeLinecap="round"
                  strokeDasharray={`${circleAngle * 2.1} 756`}
                  transform="rotate(-90 150 150)"
                />
              )}
              
              {/* GPS Route Path if available */}
              {positions.length > 1 && (
                <path d={positionsToSvg()} stroke="#22c55e" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              )}
              
              {/* Runner indicator - animated circle */}
              {isActive && (
                <g>
                  <circle cx={circleX} cy={circleY} r="12" fill="#22c55e" className="animate-pulse" />
                  <circle cx={circleX} cy={circleY} r="6" fill="white" />
                </g>
              )}
              
              {/* Start marker */}
              <circle cx="150" cy="30" r="8" fill="#22c55e" stroke="white" strokeWidth="2" />
              <text x="150" y="20" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">A</text>
            </svg>
            
            {/* Center stats display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10">
              <div className="text-6xl font-bold tabular-nums mb-2">{formatTime(seconds)}</div>
              <div className="text-3xl font-semibold text-green-400">{liveDistance.toFixed(2)} km</div>
              {targetTime && (
                <div className="text-sm text-white/60 mt-2">
                  {isGerman ? "Ziel:" : "Target:"} {formatTime(targetTime)}
                </div>
              )}
            </div>
            
            {/* GO/STOP Button at bottom */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <Button 
                onClick={toggle} 
                size="lg" 
                className={`rounded-full px-10 py-6 font-bold text-lg shadow-lg transition-all ${
                  isActive 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                {isActive ? (
                  <><Pause className="w-6 h-6 mr-2" /> STOP</>
                ) : (
                  <><Play className="w-6 h-6 mr-2" /> GO</>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Control Buttons */}
        <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-4 mb-4">
          <div className="flex gap-2 justify-center flex-wrap">
            <Button variant="outline" size="lg" onClick={reset} className="w-14">
              <RotateCcw className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => setTimerDialogOpen(true)} className="w-14">
              <Timer className="w-5 h-5" />
            </Button>
            <Button variant="default" size="lg" className="w-14" disabled={seconds < 60} onClick={saveJoggingLog}>
              <Save className="w-5 h-5" />
            </Button>
            <Button variant="destructive" size="lg" onClick={reset} className="w-14">
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
        </Card>

        {/* Live Stats - Only Distance, Time, kcal */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-4">
            <div className="text-xs text-white/60 mb-1">{isGerman ? "Distanz" : "Distance"}</div>
            <div className="text-xl font-bold text-white">{liveDistance.toFixed(2)} km</div>
          </Card>
          <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-4">
            <div className="text-xs text-white/60 mb-1">{isGerman ? "Zeit" : "Time"}</div>
            <div className="text-xl font-bold text-white">{Math.floor(seconds / 60)} min</div>
          </Card>
          <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-4">
            <div className="text-xs text-white/60 mb-1">kcal</div>
            <div className="text-xl font-bold text-white">{liveCalories}</div>
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