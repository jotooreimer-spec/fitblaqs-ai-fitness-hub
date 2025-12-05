import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Save, ArrowLeft, Trash2, MapPin } from "lucide-react";
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
          
          // Simulate speed variation (5-40 km/h typical jogging/running)
          const baseSpeed = 15;
          const variation = Math.sin(newSeconds / 10) * 5 + (Math.random() - 0.5) * 5;
          const newSpeed = Math.max(0, Math.min(100, baseSpeed + variation));
          speedRef.current = newSpeed;
          setCurrentSpeed(newSpeed);
          
          // Add data point every 5 seconds
          if (newSeconds % 5 === 0) {
            setChartData(prevData => [...prevData, { 
              time: Math.floor(newSeconds / 60), 
              speed: parseFloat(newSpeed.toFixed(1)) 
            }]);
            
            // Add route point for map
            setRoutePoints(prev => {
              const lastPoint = prev[prev.length - 1] || { x: 150, y: 280 };
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

  // Calculate distance based on average speed and time
  const calculateDistance = () => {
    if (chartData.length === 0) return 0;
    const avgSpeed = chartData.reduce((sum, d) => sum + d.speed, 0) / chartData.length;
    const hours = seconds / 3600;
    return avgSpeed * hours;
  };

  // Calculate calories: MET value * weight * time (hours)
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

  // Generate SVG path from route points
  const routePath = routePoints.length > 1 
    ? `M ${routePoints.map(p => `${p.x},${p.y}`).join(' L ')}`
    : '';

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
            <h1 className="text-4xl font-bold">Jogging Tracker</h1>
            <p className="text-muted-foreground">
              {isGerman ? "Verfolge deine Läufe" : "Track your runs"}
            </p>
          </div>
        </div>

        {/* Map View */}
        <Card className="gradient-card card-shadow border-white/10 p-4 mb-6 relative overflow-hidden">
          <div className="relative h-64 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg overflow-hidden">
            {/* Simplified Map Background */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 200">
              {/* Roads */}
              <path d="M 0,100 L 300,100" stroke="#fff" strokeWidth="8" fill="none" />
              <path d="M 150,0 L 150,200" stroke="#fff" strokeWidth="8" fill="none" />
              <path d="M 50,50 L 250,150" stroke="#fff" strokeWidth="6" fill="none" />
              <path d="M 250,50 L 50,150" stroke="#fff" strokeWidth="6" fill="none" />
              
              {/* Green areas */}
              <rect x="20" y="20" width="40" height="30" fill="#90EE90" rx="5" />
              <rect x="240" y="20" width="40" height="30" fill="#90EE90" rx="5" />
              <rect x="130" y="150" width="40" height="30" fill="#90EE90" rx="5" />
              
              {/* Route Path */}
              {routePath && (
                <path d={routePath} stroke="#8B5CF6" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              )}
              
              {/* Start Marker */}
              {routePoints.length > 0 && (
                <g transform={`translate(${routePoints[0].x - 10}, ${routePoints[0].y - 25})`}>
                  <path d="M10,0 C4.5,0 0,4.5 0,10 C0,17.5 10,25 10,25 C10,25 20,17.5 20,10 C20,4.5 15.5,0 10,0 Z" fill="#EF4444" />
                  <text x="10" y="14" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">A</text>
                </g>
              )}
              
              {/* End Marker */}
              {routePoints.length > 1 && (
                <g transform={`translate(${routePoints[routePoints.length - 1].x - 10}, ${routePoints[routePoints.length - 1].y - 25})`}>
                  <path d="M10,0 C4.5,0 0,4.5 0,10 C0,17.5 10,25 10,25 C10,25 20,17.5 20,10 C20,4.5 15.5,0 10,0 Z" fill="#EF4444" />
                  <text x="10" y="14" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">B</text>
                </g>
              )}
            </svg>
            
            {/* Stats Overlay */}
            <div className="absolute top-4 right-4 bg-slate-800/90 rounded-lg p-3 text-white">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold">{currentDistance.toFixed(1)}km</div>
              <div className="text-lg">{currentSpeed.toFixed(0)} km/h</div>
            </div>
          </div>
        </Card>

        {/* Live Line Chart */}
        <Card className="gradient-card card-shadow border-white/10 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Jogging Tracker</h3>
            <div className="text-2xl font-bold text-primary">
              {currentSpeed.toFixed(1)} km/h
            </div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.length > 0 ? chartData : [{ time: 0, speed: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                <XAxis 
                  dataKey="time" 
                  stroke="hsl(var(--muted-foreground))"
                  label={{ value: isGerman ? 'Zeit (min)' : 'Time (min)', position: 'bottom', fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  domain={[0, 100]}
                  ticks={[5, 25, 50, 75, 100]}
                  label={{ value: 'km/h', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="speed" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Timer Display */}
        <Card className="gradient-card card-shadow border-white/10 p-8 mb-6">
          <div className="text-center">
            <div className="text-6xl font-bold mb-6 tabular-nums glow">
              {formatTime(seconds)}
            </div>
            <div className="flex gap-4 justify-center mb-6">
              <Button
                variant="default"
                size="lg"
                onClick={toggle}
                className="w-24"
              >
                {isActive ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={reset}
                className="w-24"
              >
                <RotateCcw className="w-6 h-6" />
              </Button>
              <Button 
                variant="default" 
                size="lg" 
                className="w-24" 
                disabled={seconds < 60}
                onClick={saveJoggingLog}
              >
                <Save className="w-6 h-6" />
              </Button>
              <Button
                variant="destructive"
                size="lg"
                onClick={reset}
                className="w-24"
              >
                <Trash2 className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Live Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="gradient-card card-shadow border-white/10 p-6">
            <div className="text-sm text-muted-foreground mb-2">
              {isGerman ? "Gesamte Distanz" : "Total Distance"}
            </div>
            <div className="text-3xl font-bold">{currentDistance.toFixed(2)} km</div>
          </Card>
          <Card className="gradient-card card-shadow border-white/10 p-6">
            <div className="text-sm text-muted-foreground mb-2">
              {isGerman ? "Gesamte Zeit" : "Total Time"}
            </div>
            <div className="text-3xl font-bold">{Math.floor(seconds / 60)} min</div>
          </Card>
          <Card className="gradient-card card-shadow border-white/10 p-6">
            <div className="text-sm text-muted-foreground mb-2">
              {isGerman ? "Kalorien" : "Calories"}
            </div>
            <div className="text-3xl font-bold">{currentCalories}</div>
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
                  <div className="flex-1">
                    <div className="text-sm text-muted-foreground mb-2">
                      {format(new Date(log.completed_at), "dd.MM.yyyy")}
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-2">
                      <div>
                        <div className="text-xs text-muted-foreground">KM</div>
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
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteLog(log.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
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