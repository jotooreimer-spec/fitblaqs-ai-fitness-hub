import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Trash2, Check, X, Droplets, Leaf, Apple, Beef, Pill } from "lucide-react";
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

// Get category icon based on meal type
const getCategoryIcon = (mealType: string) => {
  switch (mealType) {
    case "breakfast": // Vegetarian
      return <Leaf className="w-4 h-4 text-green-400" />;
    case "lunch": // Vegan
      return <Apple className="w-4 h-4 text-lime-400" />;
    case "dinner": // Protein
      return <Beef className="w-4 h-4 text-red-400" />;
    case "snack": // Supplements
      return <Pill className="w-4 h-4 text-purple-400" />;
    default:
      return <Droplets className="w-4 h-4 text-blue-400" />;
  }
};

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
      description: isGerman ? "Änderungen gespeichert" : "Changes saved"
    });

    setEditingId(null);
    onRefresh();
  };

  const handleSaveToCalendar = (log: NutritionLog) => {
    setSavedItems(prev => new Set(prev).add(log.id));
    toast({
      title: isGerman ? "Gespeichert" : "Saved",
      description: isGerman ? "Im Kalender gespeichert" : "Saved to calendar"
    });
  };

  // Render nutrition value with name, value, and unit
  const renderNutritionValue = (name: string, data: any) => {
    if (!data || data.value === 0 || data.value === undefined) return null;
    return (
      <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded">
        {name}: {data.value}{data.unit}
      </span>
    );
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
    <div className="space-y-3">
      {logs.map((log) => {
        const isSaved = savedItems.has(log.id);
        const isEditing = editingId === log.id;
        const parsed = parseNutritionNotes(log.notes);
        const categoryName = getCategoryName(log.meal_type);
        
        return (
          <Card 
            key={log.id} 
            className={`bg-black/40 backdrop-blur-sm border-white/10 p-3 ${!isSaved && !isEditing ? 'cursor-pointer hover:border-primary/30' : ''}`}
            onClick={() => !isEditing && !isSaved && startEditing(log)}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                {/* Category with Icon */}
                <div className="flex items-center gap-2 mb-1">
                  {getCategoryIcon(log.meal_type)}
                  <span className="text-xs font-semibold text-primary">{categoryName}</span>
                </div>
                
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
                        <label className="text-xs text-white/60">Protein</label>
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
                        <label className="text-xs text-white/60">Carbs</label>
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
                        <label className="text-xs text-white/60">Fats</label>
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
                        <Save className="w-3 h-3 mr-1" /> {isGerman ? "Speichern" : "Save"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEditing}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Food Name */}
                    <div className="font-semibold text-white text-sm">{log.food_name}</div>
                    
                    {/* All nutrition values from notes */}
                    {parsed && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {/* Hydration - only for hydration category */}
                        {parsed.water?.value > 0 && (
                          <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Droplets className="w-3 h-3" />
                            {parsed.water.value}{parsed.water.unit}
                          </span>
                        )}
                        {/* Carbs */}
                        {renderNutritionValue("Carbs", parsed.carbs)}
                        {/* Protein */}
                        {renderNutritionValue("Protein", parsed.protein)}
                        {/* Fats */}
                        {renderNutritionValue("Fats", parsed.fats)}
                        {/* Fiber */}
                        {renderNutritionValue(isGerman ? "Ballaststoffe" : "Fiber", parsed.fiber)}
                        {/* Minerals */}
                        {renderNutritionValue(isGerman ? "Mineralstoffe" : "Minerals", parsed.minerals)}
                        {/* Vitamins */}
                        {renderNutritionValue(isGerman ? "Vitamine" : "Vitamins", parsed.vitamin)}
                        {/* Sugar */}
                        {renderNutritionValue("Sugar", parsed.sugar)}
                        {/* Aminoacids */}
                        {renderNutritionValue(isGerman ? "Aminosäuren" : "Aminoacids", parsed.aminoacids)}
                        {/* Spurenelemente */}
                        {renderNutritionValue(isGerman ? "Spurenelemente" : "Trace Elements", parsed.spurenelemente)}
                        {/* Iron (for protein category) */}
                        {renderNutritionValue(isGerman ? "Eisen" : "Iron", parsed.iron)}
                        {/* Calcium */}
                        {renderNutritionValue("Calcium", parsed.calcium)}
                        {/* Amount (supplements) */}
                        {renderNutritionValue(isGerman ? "Menge" : "Amount", parsed.amount)}
                        {/* Liquid (supplements) */}
                        {renderNutritionValue(isGerman ? "Flüssigkeit" : "Liquid", parsed.liquid)}
                      </div>
                    )}
                    
                    {/* Total kcal */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm font-bold text-orange-400">
                        kcal {log.calories}
                      </span>
                    </div>
                    
                    {/* Date and Time */}
                    <div className="text-xs text-white/40 mt-1">
                      {format(new Date(log.completed_at), "dd.MM.yyyy HH:mm")}
                    </div>
                    
                    {isSaved && (
                      <div className="text-xs text-green-500 mt-1">
                        ✓ {isGerman ? "Gespeichert" : "Saved"}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {!isEditing && (
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  {!isSaved && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-primary hover:text-primary h-7 w-7"
                      onClick={() => handleSaveToCalendar(log)}
                    >
                      <Save className="w-3 h-3" />
                    </Button>
                  )}
                  {isSaved && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-green-500 h-7 w-7"
                      disabled
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive h-7 w-7"
                    onClick={() => onDelete(log.id)}
                  >
                    <Trash2 className="w-3 h-3" />
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