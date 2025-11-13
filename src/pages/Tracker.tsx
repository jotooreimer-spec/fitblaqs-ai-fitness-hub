import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Tracker = () => {
  const navigate = useNavigate();
  const [isGerman, setIsGerman] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
        return;
      }

      const metadata = session.user.user_metadata;
      setIsGerman(metadata.language === "de");
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen pb-24 gradient-male">
      <div className="max-w-screen-xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {isGerman ? "Workout Timer" : "Workout Timer"}
          </h1>
          <p className="text-muted-foreground">
            {isGerman ? "Verfolge deine Trainingszeit" : "Track your workout time"}
          </p>
        </div>

        {/* Timer Display */}
        <Card className="gradient-card card-shadow border-white/10 p-12 mb-8">
          <div className="text-center">
            <div className="text-7xl font-bold mb-8 tabular-nums glow">
              {formatTime(seconds)}
            </div>
            <div className="flex gap-4 justify-center">
              <Button
                variant="hero"
                size="xl"
                onClick={toggle}
                className="w-32"
              >
                {isActive ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </Button>
              <Button
                variant="glass"
                size="xl"
                onClick={reset}
                className="w-32"
              >
                <RotateCcw className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Workout Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="gradient-card card-shadow border-white/10 p-6">
            <div className="text-sm text-muted-foreground mb-2">
              {isGerman ? "Heutiges Training" : "Today's Workout"}
            </div>
            <div className="text-3xl font-bold">45 min</div>
          </Card>
          <Card className="gradient-card card-shadow border-white/10 p-6">
            <div className="text-sm text-muted-foreground mb-2">
              {isGerman ? "Diese Woche" : "This Week"}
            </div>
            <div className="text-3xl font-bold">3.5 hrs</div>
          </Card>
          <Card className="gradient-card card-shadow border-white/10 p-6">
            <div className="text-sm text-muted-foreground mb-2">
              {isGerman ? "Verbrannte Kalorien" : "Calories Burned"}
            </div>
            <div className="text-3xl font-bold text-orange-400">420</div>
          </Card>
        </div>

        {/* Recent Workouts */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-6">
            {isGerman ? "Letzte Trainingseinheiten" : "Recent Workouts"}
          </h2>
          <div className="space-y-4">
            {[
              { date: "2025-03-10", duration: "45 min", type: isGerman ? "Brust & Trizeps" : "Chest & Triceps" },
              { date: "2025-03-08", duration: "60 min", type: isGerman ? "Rücken & Bizeps" : "Back & Biceps" },
              { date: "2025-03-06", duration: "30 min", type: isGerman ? "Beine" : "Legs" },
            ].map((workout, index) => (
              <Card
                key={index}
                className="gradient-card card-shadow border-white/10 p-4"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{workout.type}</div>
                    <div className="text-sm text-muted-foreground">{workout.date}</div>
                  </div>
                  <div className="text-primary font-bold">{workout.duration}</div>
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

export default Tracker;
