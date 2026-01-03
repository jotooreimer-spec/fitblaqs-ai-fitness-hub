import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Target, Calendar, TrendingDown, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ChallengesBoxProps {
  isGerman: boolean;
  userId: string;
  currentWeight?: number;
}

export const ChallengesBox = ({ isGerman, userId, currentWeight = 0 }: ChallengesBoxProps) => {
  const { toast } = useToast();
  const [goalWeight, setGoalWeight] = useState("");
  const [months, setMonths] = useState("");
  const [savedGoal, setSavedGoal] = useState<{ goal: number; months: number; startWeight: number; startDate: string } | null>(null);
  const [daysDialogOpen, setDaysDialogOpen] = useState(false);
  
  // Algorithmus-berechnete Statistiken
  const [algorithmStats, setAlgorithmStats] = useState({
    weeklyLoss: 0,
    monthlyLoss: 0,
    projectedDaysToGoal: 0,
    onTrack: false,
    recommendedDailyDeficit: 0,
  });

  useEffect(() => {
    // Load saved challenge from localStorage
    const saved = localStorage.getItem(`challenge_${userId}`);
    if (saved) {
      setSavedGoal(JSON.parse(saved));
    }
  }, [userId]);

  // Algorithmus zur Berechnung von Fortschritts-Prognosen
  useEffect(() => {
    if (!savedGoal || !currentWeight) return;

    const startDate = new Date(savedGoal.startDate);
    const now = new Date();
    const daysPassed = Math.max(1, Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    const totalToLose = savedGoal.startWeight - savedGoal.goal;
    const alreadyLost = savedGoal.startWeight - currentWeight;
    const remaining = Math.max(0, totalToLose - alreadyLost);
    
    // Durchschnittlicher täglicher Gewichtsverlust
    const dailyLoss = alreadyLost / daysPassed;
    const weeklyLoss = dailyLoss * 7;
    const monthlyLoss = dailyLoss * 30;
    
    // Prognostizierte Tage bis zum Ziel
    const projectedDaysToGoal = dailyLoss > 0 ? Math.ceil(remaining / dailyLoss) : 9999;
    
    // Verbleibende Tage bis Ende
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + savedGoal.months);
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Ist der Nutzer auf Kurs?
    const onTrack = projectedDaysToGoal <= daysRemaining;
    
    // Empfohlenes tägliches Kaloriendefizit (ca. 7700 kcal = 1kg Fett)
    const requiredDailyLoss = remaining / Math.max(1, daysRemaining);
    const recommendedDailyDeficit = Math.round(requiredDailyLoss * 7700);
    
    setAlgorithmStats({
      weeklyLoss: Math.round(weeklyLoss * 100) / 100,
      monthlyLoss: Math.round(monthlyLoss * 100) / 100,
      projectedDaysToGoal,
      onTrack,
      recommendedDailyDeficit: Math.min(1000, Math.max(250, recommendedDailyDeficit)), // Zwischen 250-1000 kcal
    });
  }, [savedGoal, currentWeight]);

  const handleSaveChallenge = () => {
    if (!goalWeight || !months) {
      toast({
        title: isGerman ? "Fehler" : "Error",
        description: isGerman ? "Bitte alle Felder ausfüllen" : "Please fill all fields",
        variant: "destructive"
      });
      return;
    }

    const challenge = {
      goal: parseFloat(goalWeight),
      months: parseInt(months),
      startWeight: currentWeight,
      startDate: new Date().toISOString()
    };

    localStorage.setItem(`challenge_${userId}`, JSON.stringify(challenge));
    setSavedGoal(challenge);
    setGoalWeight("");
    setMonths("");

    toast({
      title: isGerman ? "Challenge gespeichert!" : "Challenge saved!",
      description: isGerman ? "Viel Erfolg!" : "Good luck!"
    });
  };

  const calculateDaysRemaining = () => {
    if (!savedGoal) return 0;
    const startDate = new Date(savedGoal.startDate);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + savedGoal.months);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const calculateProgress = () => {
    if (!savedGoal || !currentWeight) return 0;
    const totalToLose = savedGoal.startWeight - savedGoal.goal;
    const lost = savedGoal.startWeight - currentWeight;
    if (totalToLose <= 0) return 100;
    return Math.min(100, Math.max(0, (lost / totalToLose) * 100));
  };

  const daysRemaining = calculateDaysRemaining();
  const progress = calculateProgress();

  return (
    <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold text-white">{isGerman ? "Body Weight Challenge" : "Body Weight Challenge"}</h3>
      </div>

      {savedGoal ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-white/60 mb-1">{isGerman ? "Zielgewicht" : "Goal Weight"}</div>
              <div className="text-2xl font-bold text-green-400">{savedGoal.goal} kg</div>
            </div>
            <div>
              <div className="text-xs text-white/60 mb-1">{isGerman ? "Aktuell" : "Current"}</div>
              <div className="text-2xl font-bold text-white">{currentWeight} kg</div>
            </div>
            <div 
              className="cursor-pointer hover:scale-105 transition-transform"
              onClick={(e) => { e.stopPropagation(); setDaysDialogOpen(true); }}
            >
              <div className="text-xs text-white/60 mb-1">{isGerman ? "Verbleibend" : "Remaining"}</div>
              <div className="text-2xl font-bold text-primary flex items-center justify-center gap-1">
                <Calendar className="w-4 h-4" />
                {daysRemaining}
              </div>
              <div className="text-xs text-white/40">{isGerman ? "Tage" : "days"}</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">{isGerman ? "Fortschritt" : "Progress"}</span>
              <span className="font-bold text-white">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          {currentWeight < savedGoal.startWeight && (
            <div className="flex items-center justify-center gap-2 text-green-400 text-sm">
              <TrendingDown className="w-4 h-4" />
              <span>{(savedGoal.startWeight - currentWeight).toFixed(1)} kg {isGerman ? "verloren" : "lost"}</span>
            </div>
          )}

          {/* Algorithmus-Statistiken */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10">
            <div className="text-center p-2 bg-white/5 rounded-lg">
              <div className="text-xs text-white/60">{isGerman ? "Wöchentlich" : "Weekly"}</div>
              <div className="text-sm font-bold text-emerald-400">-{algorithmStats.weeklyLoss} kg</div>
            </div>
            <div className="text-center p-2 bg-white/5 rounded-lg">
              <div className="text-xs text-white/60">{isGerman ? "Monatlich" : "Monthly"}</div>
              <div className="text-sm font-bold text-emerald-400">-{algorithmStats.monthlyLoss} kg</div>
            </div>
            <div className="text-center p-2 bg-white/5 rounded-lg col-span-2">
              <div className="text-xs text-white/60">{isGerman ? "Empf. Defizit" : "Rec. Deficit"}</div>
              <div className={`text-sm font-bold ${algorithmStats.onTrack ? 'text-green-400' : 'text-orange-400'}`}>
                {algorithmStats.recommendedDailyDeficit} kcal/{isGerman ? "Tag" : "day"}
              </div>
              <div className={`text-xs ${algorithmStats.onTrack ? 'text-green-400' : 'text-orange-400'}`}>
                {algorithmStats.onTrack 
                  ? (isGerman ? "✓ Auf Kurs" : "✓ On Track") 
                  : (isGerman ? "⚠ Tempo erhöhen" : "⚠ Speed up")}
              </div>
            </div>
          </div>

          <Button
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => {
              localStorage.removeItem(`challenge_${userId}`);
              setSavedGoal(null);
            }}
          >
            {isGerman ? "Challenge zurücksetzen" : "Reset Challenge"}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white/60">{isGerman ? "Zielgewicht (kg)" : "Goal Weight (kg)"}</Label>
              <Input
                type="number"
                step="0.1"
                value={goalWeight}
                onChange={(e) => setGoalWeight(e.target.value)}
                placeholder="65"
              />
            </div>
            <div>
              <Label className="text-white/60">{isGerman ? "Zeitraum (Monate)" : "Duration (Months)"}</Label>
              <Input
                type="number"
                min="1"
                max="24"
                value={months}
                onChange={(e) => setMonths(e.target.value)}
                placeholder="3"
              />
            </div>
          </div>
          <Button onClick={handleSaveChallenge} className="w-full">
            {isGerman ? "Challenge starten" : "Start Challenge"}
          </Button>
        </div>
      )}
      
      {/* Days Remaining Dialog */}
      <Dialog open={daysDialogOpen} onOpenChange={setDaysDialogOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              {isGerman ? "Verbleibende Tage" : "Days Remaining"}
              <Button variant="ghost" size="icon" onClick={() => setDaysDialogOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <div className="text-6xl font-bold text-primary mb-2">{daysRemaining}</div>
            <div className="text-lg text-muted-foreground">{isGerman ? "Tage verbleibend" : "Days remaining"}</div>
            {savedGoal && (
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isGerman ? "Zielgewicht:" : "Goal weight:"}</span>
                  <span className="font-semibold">{savedGoal.goal} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isGerman ? "Noch abzunehmen:" : "To lose:"}</span>
                  <span className="font-semibold text-orange-400">{Math.max(0, currentWeight - savedGoal.goal).toFixed(1)} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isGerman ? "Zeitraum:" : "Duration:"}</span>
                  <span className="font-semibold">{savedGoal.months} {isGerman ? "Monate" : "months"}</span>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
