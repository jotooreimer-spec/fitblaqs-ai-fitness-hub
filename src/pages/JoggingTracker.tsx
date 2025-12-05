import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Save, ArrowLeft, Trash2, ZoomIn, ZoomOut, MapPin, Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from "recharts";

interface JoggingLog {
  id: string;
  duration: number;
  distance: number;
  calories: number | null;
  completed_at: string;
  notes: string | null;
}

interface ChartDataPoint {
  time: number;
  speed: number;
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
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [mapZoom, setMapZoom] = useState(1);
  const speedRef = useRef(0);

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

    const { data, error } = await supabase
      .from("jogging_logs")
      .select("*")
      .eq("user_id", session.user.id)
      .order("completed_at", { ascending: false })
      .limit(10);

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
        setSeconds((prev) => {
          const newSeconds = prev + 1;
          
          const baseSpeed = 15;
          const variation = Math.sin(newSeconds / 10) * 5 + (Math.random() - 0.5) * 5;
          const newSpeed = Math.max(0, Math.min(100, baseSpeed + variation));
          speedRef.current = newSpeed;
          setCurrentSpeed(newSpeed);
          
          if (newSeconds % 5 === 0) {
            setChartData(prevData => [...prevData, { 
              time: Math.floor(newSeconds / 60), 
              speed: parseFloat(newSpeed.toFixed(1)) 
            }]);
            
            setRoutePoints(prev => {
              const lastPoint = prev[prev.length - 1] || { x: 150, y: 200 };
              const angle = (Math.random() - 0.3) * Math.PI / 2 - Math.PI / 4;
              const distance = 5 + Math.random() * 10;
              return [...prev, {
                x: lastPoint.x + Math.cos(angle) * distance,
                y: lastPoint.y - Math.abs(Math.sin(angle) * distance)
              }];
            });
          }
          
          return newSeconds;
        });
      }, 1000);
    } else if (!isActive && interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive]);

  const toggle = () => setIsActive(!isActive);
  
  const reset = () => {
    setSeconds(0);
    setIsActive(false);
    setChartData([]);
    setCurrentSpeed(0);
    setRoutePoints([]);
    speedRef.current = 0;
  };

  const calculateDistance = () => {
    if (chartData.length === 0) return 0;
    const avgSpeed = chartData.reduce((sum, d) => sum + d.speed, 0) / chartData.length;
    const hours = seconds / 3600;
    return avgSpeed * hours;
  };

  const calculateCalories = (distanceKm: number) => {
    const hours = seconds / 3600;
    const avgSpeed = hours > 0 ? distanceKm / hours : 0;
    const MET = avgSpeed < 8 ? 8 : avgSpeed < 12 ? 10 : avgSpeed < 16 ? 12 : 14;
    return Math.round(MET * userWeight * hours);
  };

  const saveJoggingLog = async () => {
    if (seconds < 60) {
      toast({
        title: isGerman ? "Fehler" : "Error",
        description: isGerman ? "Mindestens 1 Minute laufen" : "Run for at least 1 minute",
        variant: "destructive"
      });
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
        calories: estimatedCalories,
        notes: null
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

  const currentDistance = calculateDistance();
  const currentCalories = calculateCalories(currentDistance);

  const startPoint = routePoints.length > 0 ? routePoints[0] : { x: 150, y: 200 };
  const endPoint = routePoints.length > 1 ? routePoints[routePoints.length - 1] : null;

  return (
    <div className="min-h-screen pb-24 gradient-male">
      <div className="max-w-screen-xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="text-foreground"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Jogging Tracker</h1>
            <p className="text-muted-foreground text-sm">
              {isGerman ? "Verfolge deine Läufe" : "Track your runs"}
            </p>
          </div>
        </div>

        {/* Map View - Smaller */}
        <Card className="gradient-card card-shadow border-white/10 p-0 mb-4 relative overflow-hidden rounded-2xl">
          <div className="relative h-48 bg-gradient-to-br from-[#f5e6d3] to-[#e8d5c4] overflow-hidden">
            {/* Zoom Controls */}
            <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
              <Button
                size="icon"
                variant="secondary"
                className="w-8 h-8 bg-white/90 hover:bg-white shadow"
                onClick={() => setMapZoom(prev => Math.min(prev + 0.25, 2))}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="w-8 h-8 bg-white/90 hover:bg-white shadow"
                onClick={() => setMapZoom(prev => Math.max(prev - 0.25, 0.5))}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
            </div>

            <svg 
              className="absolute inset-0 w-full h-full" 
              viewBox="0 0 300 200" 
              preserveAspectRatio="xMidYMid slice"
              style={{ transform: `scale(${mapZoom})`, transformOrigin: 'center' }}
            >
              <rect width="300" height="200" fill="#f5e6d3" />
              
              {/* Streets */}
              <path d="M 0,100 L 300,100" stroke="#fff" strokeWidth="8" fill="none" />
              <path d="M 0,50 L 300,50" stroke="#fff" strokeWidth="5" fill="none" />
              <path d="M 0,150 L 300,150" stroke="#fff" strokeWidth="5" fill="none" />
              <path d="M 75,0 L 75,200" stroke="#fff" strokeWidth="5" fill="none" />
              <path d="M 150,0 L 150,200" stroke="#fff" strokeWidth="6" fill="none" />
              <path d="M 225,0 L 225,200" stroke="#fff" strokeWidth="5" fill="none" />
              
              {/* Green Areas */}
              <rect x="20" y="20" width="40" height="25" fill="#90EE90" rx="5" />
              <rect x="240" y="20" width="40" height="25" fill="#90EE90" rx="5" />
              <rect x="120" y="130" width="40" height="25" fill="#90EE90" rx="5" />
              
              {/* Route Path */}
              {routePoints.length > 1 && (
                <path 
                  d={`M ${routePoints.map(p => `${p.x},${p.y}`).join(' L ')}`} 
                  stroke="#8B5CF6" 
                  strokeWidth="4" 
                  fill="none" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              )}
              
              {/* Start Marker */}
              <g transform={`translate(${startPoint.x - 10}, ${startPoint.y - 28})`}>
                <ellipse cx="10" cy="28" rx="4" ry="2" fill="rgba(0,0,0,0.3)" />
                <path d="M10,0 C4.5,0 0,4.5 0,10 C0,17.5 10,28 10,28 C10,28 20,17.5 20,10 C20,4.5 15.5,0 10,0 Z" fill="#22C55E" />
                <circle cx="10" cy="10" r="5" fill="white" />
                <MapPin className="w-3 h-3" style={{ transform: 'translate(6px, 6px)' }} />
              </g>
              
              {/* End/Goal Marker */}
              {endPoint && (
                <g transform={`translate(${endPoint.x - 10}, ${endPoint.y - 28})`}>
                  <ellipse cx="10" cy="28" rx="4" ry="2" fill="rgba(0,0,0,0.3)" />
                  <path d="M10,0 C4.5,0 0,4.5 0,10 C0,17.5 10,28 10,28 C10,28 20,17.5 20,10 C20,4.5 15.5,0 10,0 Z" fill="#EF4444" />
                  <circle cx="10" cy="10" r="5" fill="white" />
                  <Flag className="w-3 h-3 text-red-500" style={{ transform: 'translate(6px, 6px)' }} />
                </g>
              )}
            </svg>
            
            {/* Stats Box */}
            <div className="absolute top-2 right-2 bg-slate-800/90 rounded-lg p-2 text-white shadow-lg backdrop-blur-sm">
              <div className="flex items-center gap-1 text-xs mb-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>Start</span>
                <div className="w-2 h-2 rounded-full bg-red-500 ml-2"></div>
                <span>Ziel</span>
              </div>
              <div className="text-xl font-bold">{currentDistance.toFixed(2)} km</div>
            </div>

            {/* GO/STOP Button */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
              <Button 
                onClick={toggle}
                size="sm"
                className={`rounded-full px-6 font-bold shadow-lg ${isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
              >
                {isActive ? 'STOP' : 'GO'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Live Line Chart */}
        <Card className="gradient-card card-shadow border-white/10 p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-bold">Live Speed</h3>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.length > 0 ? chartData : [{ time: 0, speed: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                <XAxis 
                  dataKey="time" 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 10 }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  domain={[0, 100]}
                  ticks={[25, 50, 75, 100]}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="speed" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Timer Display */}
        <Card className="gradient-card card-shadow border-white/10 p-6 mb-4">
          <div className="text-center">
            <div className="text-5xl font-bold mb-4 tabular-nums glow">
              {formatTime(seconds)}
            </div>
            <div className="flex gap-3 justify-center mb-4">
              <Button variant="default" size="lg" onClick={toggle} className="w-20">
                {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
              <Button variant="outline" size="lg" onClick={reset} className="w-20">
                <RotateCcw className="w-5 h-5" />
              </Button>
              <Button variant="default" size="lg" className="w-20" disabled={seconds < 60} onClick={saveJoggingLog}>
                <Save className="w-5 h-5" />
              </Button>
              <Button variant="destructive" size="lg" onClick={reset} className="w-20">
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Live Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="gradient-card card-shadow border-white/10 p-4">
            <div className="text-xs text-muted-foreground mb-1">
              {isGerman ? "Distanz" : "Distance"}
            </div>
            <div className="text-xl font-bold">{currentDistance.toFixed(2)} km</div>
          </Card>
          <Card className="gradient-card card-shadow border-white/10 p-4">
            <div className="text-xs text-muted-foreground mb-1">
              {isGerman ? "Zeit" : "Time"}
            </div>
            <div className="text-xl font-bold">{Math.floor(seconds / 60)} min</div>
          </Card>
          <Card className="gradient-card card-shadow border-white/10 p-4">
            <div className="text-xs text-muted-foreground mb-1">
              {isGerman ? "Kalorien" : "Calories"}
            </div>
            <div className="text-xl font-bold">{currentCalories} kcal</div>
          </Card>
        </div>

        {/* History */}
        <h2 className="text-xl font-bold mb-4">{isGerman ? "Verlauf" : "History"}</h2>
        <div className="space-y-3">
          {logs.map((log) => (
            <Card key={log.id} className="gradient-card card-shadow border-white/10 p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{log.distance.toFixed(2)} km</div>
                  <div className="text-sm text-muted-foreground">
                    {log.duration} min • {log.calories || 0} kcal
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(log.completed_at), "dd.MM.yyyy")}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteLog(log.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </Card>
          ))}
          {logs.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              {isGerman ? "Noch keine Läufe gespeichert" : "No runs saved yet"}
            </p>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default JoggingTracker;