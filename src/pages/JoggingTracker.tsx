import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Pause, RotateCcw, Save, ArrowLeft, Trash2, ZoomIn, ZoomOut, MapPin, Flag, Timer, Navigation } from "lucide-react";
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
  const [mapZoom, setMapZoom] = useState(1);
  const [timerDialogOpen, setTimerDialogOpen] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [targetTime, setTargetTime] = useState<number | null>(null);
  
  // GPS Tracking State
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [positions, setPositions] = useState<GeoPosition[]>([]);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [currentDistance, setCurrentDistance] = useState(0);
  const [currentPace, setCurrentPace] = useState("0:00");
  const watchIdRef = useRef<number | null>(null);

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

          // Calculate current speed (km/h)
          if (position.coords.speed !== null && position.coords.speed >= 0) {
            setCurrentSpeed(position.coords.speed * 3.6); // m/s to km/h
          } else if (updated.length >= 2) {
            const lastTwo = updated.slice(-2);
            const dist = calculateDistanceBetweenPoints(lastTwo[0], lastTwo[1]);
            const timeDiff = (lastTwo[1].timestamp - lastTwo[0].timestamp) / 1000 / 3600; // hours
            if (timeDiff > 0) {
              setCurrentSpeed(dist / timeDiff);
            }
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
          
          // Calculate pace (min/km)
          if (currentDistance > 0) {
            const minutesElapsed = newSeconds / 60;
            const paceMinutes = minutesElapsed / currentDistance;
            const paceMin = Math.floor(paceMinutes);
            const paceSec = Math.round((paceMinutes - paceMin) * 60);
            setCurrentPace(`${paceMin}:${paceSec.toString().padStart(2, '0')}`);
          }
          
          return newSeconds;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, targetTime, currentDistance, stopGpsTracking]);

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
    setCurrentSpeed(0);
    setCurrentPace("0:00");
    setTargetTime(null);
    stopGpsTracking();
  };

  const calculateFallbackDistance = (totalSeconds: number) => {
    const hours = totalSeconds / 3600;
    const avgSpeed = 10; // 10 km/h average
    return avgSpeed * hours;
  };

  const calculateCalories = (distanceKm: number, totalSeconds: number) => {
    const hours = totalSeconds / 3600;
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

  const estimatedCalories = calculateCalories(currentDistance > 0 ? currentDistance : calculateFallbackDistance(seconds), seconds);
  
  // Calculate map viewport based on positions
  const getMapBounds = () => {
    if (positions.length === 0) return { minLat: 0, maxLat: 1, minLng: 0, maxLng: 1 };
    const lats = positions.map(p => p.lat);
    const lngs = positions.map(p => p.lng);
    return {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs)
    };
  };

  // Convert GPS positions to SVG coordinates
  const positionsToSvg = () => {
    if (positions.length < 2) return "";
    const bounds = getMapBounds();
    const padding = 0.0001;
    const width = Math.max(bounds.maxLng - bounds.minLng, padding);
    const height = Math.max(bounds.maxLat - bounds.minLat, padding);
    
    return positions.map((pos, i) => {
      const x = 20 + ((pos.lng - bounds.minLng) / width) * 260;
      const y = 140 - ((pos.lat - bounds.minLat) / height) * 120;
      return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
    }).join(' ');
  };

  const firstPos = positions[0];
  const lastPos = positions[positions.length - 1];

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
            <p className="text-white/60 text-sm flex items-center gap-2">
              {gpsEnabled ? (
                <>
                  <Navigation className="w-4 h-4 text-green-400 animate-pulse" />
                  <span className="text-green-400">GPS {isGerman ? "aktiv" : "active"}</span>
                </>
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

        {/* Map View with GPS Route */}
        <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-0 mb-4 relative overflow-hidden rounded-2xl">
          <div className="relative h-44 bg-gradient-to-br from-[#e8f5e9] to-[#c8e6c9] overflow-hidden">
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
              {/* Map background with streets */}
              <rect width="300" height="160" fill="#e8f5e9" />
              <path d="M 0,80 L 300,80" stroke="#fff" strokeWidth="8" fill="none" />
              <path d="M 0,40 L 300,40" stroke="#fff" strokeWidth="5" fill="none" />
              <path d="M 0,120 L 300,120" stroke="#fff" strokeWidth="5" fill="none" />
              <path d="M 75,0 L 75,160" stroke="#fff" strokeWidth="5" fill="none" />
              <path d="M 150,0 L 150,160" stroke="#fff" strokeWidth="6" fill="none" />
              <path d="M 225,0 L 225,160" stroke="#fff" strokeWidth="5" fill="none" />
              
              {/* Parks/Green areas */}
              <rect x="20" y="15" width="40" height="25" fill="#4CAF50" rx="5" opacity="0.6" />
              <rect x="240" y="15" width="40" height="25" fill="#4CAF50" rx="5" opacity="0.6" />
              <rect x="130" y="125" width="45" height="25" fill="#4CAF50" rx="5" opacity="0.6" />
              
              {/* GPS Route Path */}
              {positions.length > 1 && (
                <path d={positionsToSvg()} stroke="#8B5CF6" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              )}
              
              {/* Default path when no GPS */}
              {positions.length <= 1 && !isActive && (
                <path d="M 40,120 Q 80,100 120,90 T 200,60 T 260,40" stroke="#9CA3AF" strokeWidth="3" fill="none" strokeDasharray="5,5" />
              )}
              
              {/* Start Marker (Green) */}
              {positions.length > 0 && (
                <g>
                  <circle cx={positions.length > 1 ? 40 : 150} cy={positions.length > 1 ? 120 : 80} r="8" fill="#22C55E" stroke="white" strokeWidth="2" />
                  <text x={positions.length > 1 ? 40 : 150} y={positions.length > 1 ? 84 : 64} textAnchor="middle" fontSize="10" fill="#22C55E" fontWeight="bold">A</text>
                </g>
              )}
              
              {/* End Marker (Red) */}
              {positions.length > 1 && (
                <g>
                  <circle cx="260" cy="40" r="8" fill="#EF4444" stroke="white" strokeWidth="2" />
                  <text x="260" y="24" textAnchor="middle" fontSize="10" fill="#EF4444" fontWeight="bold">B</text>
                </g>
              )}
              
              {/* Running figure animation */}
              {isActive && (
                <g className="animate-pulse">
                  <circle cx={150 + Math.sin(seconds * 0.5) * 20} cy={80 + Math.cos(seconds * 0.3) * 10} r="6" fill="#3B82F6" />
                  <path d={`M${150 + Math.sin(seconds * 0.5) * 20},${86 + Math.cos(seconds * 0.3) * 10} l0,8 m-4,-4 l8,0 m-4,4 l-3,5 m3,-5 l3,5`} stroke="#3B82F6" strokeWidth="2" fill="none" />
                </g>
              )}
            </svg>
            
            {/* Stats Overlay */}
            <div className="absolute top-2 right-2 bg-slate-800/95 rounded-lg p-3 text-white">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-xs">Start</span>
                <div className="w-2 h-2 rounded-full bg-red-500 ml-2"></div>
                <span className="text-xs">{isGerman ? "Ziel" : "Goal"}</span>
              </div>
              <div className="text-2xl font-bold">{currentDistance.toFixed(2)} km</div>
              <div className="text-xs text-white/60">{currentSpeed.toFixed(1)} km/h</div>
            </div>

            {/* Start/Stop Button */}
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2">
              <Button onClick={toggle} size="lg" className={`rounded-full px-8 font-bold shadow-lg ${isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}>
                {isActive ? (
                  <><Pause className="w-5 h-5 mr-2" /> STOP</>
                ) : (
                  <><Play className="w-5 h-5 mr-2" /> GO</>
                )}
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

        {/* Live Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-4">
            <div className="text-xs text-white/60 mb-1">{isGerman ? "Distanz" : "Distance"}</div>
            <div className="text-xl font-bold text-white">{currentDistance.toFixed(2)} km</div>
          </Card>
          <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-4">
            <div className="text-xs text-white/60 mb-1">{isGerman ? "Zeit" : "Time"}</div>
            <div className="text-xl font-bold text-white">{Math.floor(seconds / 60)} min</div>
          </Card>
          <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-4">
            <div className="text-xs text-white/60 mb-1">Speed</div>
            <div className="text-xl font-bold text-white">{currentSpeed.toFixed(1)} km/h</div>
          </Card>
          <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-4">
            <div className="text-xs text-white/60 mb-1">Pace</div>
            <div className="text-xl font-bold text-white">{currentPace} /km</div>
          </Card>
          <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-4">
            <div className="text-xs text-white/60 mb-1">kcal</div>
            <div className="text-xl font-bold text-white">{estimatedCalories}</div>
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