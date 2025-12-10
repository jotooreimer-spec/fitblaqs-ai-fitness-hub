import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface MilchprodukteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  isGerman: boolean;
  onSuccess: () => void;
}

export const MilchprodukteDialog = ({ open, onOpenChange, userId, isGerman, onSuccess }: MilchprodukteDialogProps) => {
  const { toast } = useToast();
  const [foodName, setFoodName] = useState("");
  const [protein, setProtein] = useState("");
  const [proteinUnit, setProteinUnit] = useState("g");
  const [vitamin, setVitamin] = useState("");
  const [fat, setFat] = useState("");
  const [sugar, setSugar] = useState("");
  const [carbs, setCarbs] = useState("");
  const [water, setWater] = useState("");
  const [spurenelemente, setSpurenelemente] = useState("");

  const handleSave = async () => {
    if (!foodName) return;

    const proteinG = parseFloat(protein) || 0;
    const fatG = parseFloat(fat) || 0;
    const carbsG = parseFloat(carbs) || 0;
    const calories = Math.round((proteinG * 4) + (fatG * 9) + (carbsG * 4));

    const { error } = await supabase.from("nutrition_logs").insert({
      user_id: userId,
      food_name: foodName,
      meal_type: "snack",
      calories,
      protein: proteinG,
      carbs: carbsG,
      fats: fatG,
      notes: `Vitamin: ${vitamin || 0}, Sugar: ${sugar || 0}, Water: ${water || 0}, Spurenelemente: ${spurenelemente || 0}`
    });

    if (error) {
      toast({ title: isGerman ? "Fehler" : "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: isGerman ? "Gespeichert" : "Saved" });
    setFoodName("");
    setProtein("");
    setVitamin("");
    setFat("");
    setSugar("");
    setCarbs("");
    setWater("");
    setSpurenelemente("");
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isGerman ? "Milchprodukte" : "Dairy Products"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Name</Label>
            <Input value={foodName} onChange={(e) => setFoodName(e.target.value)} placeholder={isGerman ? "z.B. Milch" : "e.g. Milk"} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>{isGerman ? "Eiweiß" : "Protein"}</Label><Input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} /></div>
            <div><Label>Vitamin</Label><Input type="number" value={vitamin} onChange={(e) => setVitamin(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>{isGerman ? "Fett" : "Fat"}</Label><Input type="number" value={fat} onChange={(e) => setFat(e.target.value)} /></div>
            <div><Label>Sugar</Label><Input type="number" value={sugar} onChange={(e) => setSugar(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Carbs</Label><Input type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} /></div>
            <div><Label>{isGerman ? "Wasser" : "Water"}</Label><Input type="number" value={water} onChange={(e) => setWater(e.target.value)} /></div>
          </div>
          <div>
            <Label>{isGerman ? "Spurenelemente" : "Trace Elements"}</Label>
            <Input type="number" value={spurenelemente} onChange={(e) => setSpurenelemente(e.target.value)} />
          </div>
          <Button onClick={handleSave} className="w-full">{isGerman ? "Speichern" : "Save"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
