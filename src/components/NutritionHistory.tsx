import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Trash2, Check, X, Edit2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";

interface NutritionLog {
  id: string;
  food_name: string;
  calories: number;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
  meal_type: string;
  completed_at: string;
  notes: string | null;
}

interface NutritionHistoryProps {
  logs: NutritionLog[];
  onRefresh: () => void;
  onDelete: (id: string) => void;
}

export const NutritionHistory = ({ logs, onRefresh, onDelete }: NutritionHistoryProps) => {
  const { toast } = useToast();
  const { isGerman } = useLanguage();
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    food_name: "",
    calories: "",
    protein: "",
    carbs: "",
    fats: ""
  });

  const getCategoryName = (mealType: string) => {
    const categories: Record<string, string> = {
      breakfast: isGerman ? "Vegetarisch" : "Vegetarian",
      lunch: "Vegan",
      dinner: isGerman ? "Fleisch & Protein" : "Meat & Protein",
      snack: "Supplements"
    };
    return categories[mealType] || mealType;
  };

  const parseNutritionNotes = (notes: string | null) => {
    if (!notes) return null;
    try {
      return JSON.parse(notes);
    } catch {
      return null;
    }
  };

  const startEditing = (log: NutritionLog) => {
    if (savedItems.has(log.id)) {
      toast({
        title: isGerman ? "Nicht bearbeitbar" : "Not editable",
        description: isGerman ? "Gespeicherte Einträge können nicht bearbeitet werden" : "Saved entries cannot be edited",
        variant: "destructive"
      });
      return;
    }
    
    setEditingId(log.id);
    setEditForm({
      food_name: log.food_name,
      calories: log.calories.toString(),
      protein: log.protein?.toString() || "0",
      carbs: log.carbs?.toString() || "0",
      fats: log.fats?.toString() || "0"
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({ food_name: "", calories: "", protein: "", carbs: "", fats: "" });
  };

  const saveEditing = async (id: string) => {
    const { error } = await supabase
      .from('nutrition_logs')
      .update({
        food_name: editForm.food_name,
        calories: parseInt(editForm.calories) || 0,
        protein: parseFloat(editForm.protein) || 0,
        carbs: parseFloat(editForm.carbs) || 0,
        fats: parseFloat(editForm.fats) || 0
      })
      .eq('id', id);

    if (error) {
      toast({
        title: isGerman ? "Fehler" : "Error",
        description: isGerman ? "Speichern fehlgeschlagen" : "Save failed",
        variant: "destructive"
      });
      return;
    }

    setSavedItems(prev => new Set(prev).add(id));
    
    toast({
      title: isGerman ? "Gespeichert" : "Saved",
      description: isGerman ? "Änderungen gespeichert - Keine weiteren Änderungen möglich" : "Changes saved - No more changes allowed"
    });

    setEditingId(null);
    onRefresh();
  };

  const handleSaveToCalendar = (log: NutritionLog) => {
    setSavedItems(prev => new Set(prev).add(log.id));
    toast({
      title: isGerman ? "Gespeichert" : "Saved",
      description: isGerman ? "Im Kalender gespeichert - Keine Änderungen mehr möglich" : "Saved to calendar - No more changes possible"
    });
  };

  if (logs.length === 0) {
    return (
      <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-8 text-center">
        <p className="text-white/60">
          {isGerman ? "Keine Einträge heute - Füge Mahlzeiten hinzu" : "No entries today - Add meals to start"}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => {
        const isSaved = savedItems.has(log.id);
        const isEditing = editingId === log.id;
        const parsed = parseNutritionNotes(log.notes);
        
        return (
          <Card 
            key={log.id} 
            className={`bg-black/40 backdrop-blur-sm border-white/10 p-4 ${!isSaved && !isEditing ? 'cursor-pointer hover:border-primary/30' : ''}`}
            onClick={() => !isEditing && !isSaved && startEditing(log)}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="text-xs font-semibold text-primary mb-1">{getCategoryName(log.meal_type)}</div>
                
                {isEditing ? (
                  <div className="space-y-2 mt-2" onClick={(e) => e.stopPropagation()}>
                    <div>
                      <label className="text-xs text-white/60">{isGerman ? "Name" : "Name"}</label>
                      <Input
                        value={editForm.food_name}
                        onChange={(e) => setEditForm({...editForm, food_name: e.target.value})}
                        className="h-8 bg-zinc-800/50 border-zinc-700 text-white"
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="text-xs text-white/60">kcal</label>
                        <Input
                          type="number"
                          min="0"
                          value={editForm.calories}
                          onChange={(e) => setEditForm({...editForm, calories: e.target.value})}
                          className="h-8 bg-zinc-800/50 border-zinc-700 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-white/60">Protein (g)</label>
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          value={editForm.protein}
                          onChange={(e) => setEditForm({...editForm, protein: e.target.value})}
                          className="h-8 bg-zinc-800/50 border-zinc-700 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-white/60">Carbs (g)</label>
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          value={editForm.carbs}
                          onChange={(e) => setEditForm({...editForm, carbs: e.target.value})}
                          className="h-8 bg-zinc-800/50 border-zinc-700 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-white/60">Fats (g)</label>
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          value={editForm.fats}
                          onChange={(e) => setEditForm({...editForm, fats: e.target.value})}
                          className="h-8 bg-zinc-800/50 border-zinc-700 text-white"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" onClick={() => saveEditing(log.id)} className="flex-1">
                        <Save className="w-4 h-4 mr-1" /> {isGerman ? "Speichern" : "Save"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEditing}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="font-semibold text-white">{log.food_name}</div>
                    <div className="text-sm text-white/60 mt-1">
                      {log.calories} kcal • {Math.round(log.protein || 0)}g Protein
                      {log.carbs ? ` • ${Math.round(log.carbs)}g Carbs` : ""}
                      {log.fats ? ` • ${Math.round(log.fats)}g Fats` : ""}
                    </div>
                    
                    {/* Show additional nutrition values with units */}
                    {parsed && (
                      <div className="text-xs text-white/70 mt-2 flex flex-wrap gap-2">
                        {parsed.category === "hydration" && parsed.water?.value > 0 && (
                          <span className="text-blue-400">💧 {parsed.water.value}{parsed.water.unit}</span>
                        )}
                        {parsed.vitamin?.value > 0 && (
                          <span>💊 {parsed.vitamin.value}{parsed.vitamin.unit}</span>
                        )}
                        {parsed.minerals?.value > 0 && (
                          <span>⚗️ {parsed.minerals.value}{parsed.minerals.unit}</span>
                        )}
                        {parsed.fiber?.value > 0 && (
                          <span>🥬 {parsed.fiber.value}{parsed.fiber.unit}</span>
                        )}
                      </div>
                    )}
                    
                    <div className="text-xs text-white/40 mt-2">
                      {format(new Date(log.completed_at), "dd.MM.yyyy HH:mm")}
                    </div>
                    
                    {isSaved && (
                      <div className="text-xs text-green-500 mt-1">
                        ✓ {isGerman ? "Gespeichert - Keine Änderungen möglich" : "Saved - No changes allowed"}
                      </div>
                    )}
                    {!isSaved && (
                      <div className="text-xs text-primary/60 mt-1">
                        {isGerman ? "Klicken zum Bearbeiten" : "Click to edit"}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {!isEditing && (
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  {!isSaved && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-primary hover:text-primary"
                      onClick={() => handleSaveToCalendar(log)}
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                  )}
                  {isSaved && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-green-500"
                      disabled
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onDelete(log.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};