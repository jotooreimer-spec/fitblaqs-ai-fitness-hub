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
  const [vitaminUnit, setVitaminUnit] = useState("mg");
  const [fat, setFat] = useState("");
  const [fatUnit, setFatUnit] = useState("g");
  const [sugar, setSugar] = useState("");
  const [sugarUnit, setSugarUnit] = useState("g");
  const [carbs, setCarbs] = useState("");
  const [carbsUnit, setCarbsUnit] = useState("g");
  const [water, setWater] = useState("");
  const [waterUnit, setWaterUnit] = useState("ml");
  const [spurenelemente, setSpurenelemente] = useState("");
  const [spurenelementeUnit, setSpurenelementeUnit] = useState("mg");

  const convertToGrams = (value: number, unit: string) => {
    switch (unit) {
      case "mg": return value / 1000;
      case "kg": return value * 1000;
      case "lb": return value * 453.592;
      default: return value;
    }
  };

  const convertWaterToML = (value: number, unit: string) => {
    switch (unit) {
      case "dz": return value * 100;
      case "liter": return value * 1000;
      default: return value;
    }
  };

  const handleSave = async () => {
    if (!foodName) return;

    const proteinG = convertToGrams(parseFloat(protein) || 0, proteinUnit);
    const fatG = convertToGrams(parseFloat(fat) || 0, fatUnit);
    const carbsG = convertToGrams(parseFloat(carbs) || 0, carbsUnit);
    const waterInML = water ? convertWaterToML(parseFloat(water), waterUnit) : 0;
    const calories = Math.round((proteinG * 4) + (fatG * 9) + (carbsG * 4));

    const notes = JSON.stringify({
      category: "dairy",
      protein: { value: parseFloat(protein) || 0, unit: proteinUnit },
      vitamin: { value: parseFloat(vitamin) || 0, unit: vitaminUnit },
      fat: { value: parseFloat(fat) || 0, unit: fatUnit },
      sugar: { value: parseFloat(sugar) || 0, unit: sugarUnit },
      carbs: { value: parseFloat(carbs) || 0, unit: carbsUnit },
      water: { value: parseFloat(water) || 0, unit: waterUnit, ml: waterInML },
      spurenelemente: { value: parseFloat(spurenelemente) || 0, unit: spurenelementeUnit }
    });

    const { error } = await supabase.from("nutrition_logs").insert({
      user_id: userId,
      food_name: foodName,
      meal_type: "snack",
      calories,
      protein: proteinG,
      carbs: carbsG,
      fats: fatG,
      notes
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
            <div>
              <Label>{isGerman ? "Eiweiß" : "Protein"}</Label>
              <Input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} />
            </div>
            <div>
              <Label>&nbsp;</Label>
              <Select value={proteinUnit} onValueChange={setProteinUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="mg">mg</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="lb">lb</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Vitamin</Label>
              <Input type="number" value={vitamin} onChange={(e) => setVitamin(e.target.value)} />
            </div>
            <div>
              <Label>&nbsp;</Label>
              <Select value={vitaminUnit} onValueChange={setVitaminUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mg">mg</SelectItem>
                  <SelectItem value="g">g</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>{isGerman ? "Fett" : "Fat"}</Label>
              <Input type="number" value={fat} onChange={(e) => setFat(e.target.value)} />
            </div>
            <div>
              <Label>&nbsp;</Label>
              <Select value={fatUnit} onValueChange={setFatUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="mg">mg</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="lb">lb</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Sugar</Label>
              <Input type="number" value={sugar} onChange={(e) => setSugar(e.target.value)} />
            </div>
            <div>
              <Label>&nbsp;</Label>
              <Select value={sugarUnit} onValueChange={setSugarUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="mg">mg</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Carbs</Label>
              <Input type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
            </div>
            <div>
              <Label>&nbsp;</Label>
              <Select value={carbsUnit} onValueChange={setCarbsUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="mg">mg</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="lb">lb</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>{isGerman ? "Wasser" : "Water"}</Label>
              <Input type="number" value={water} onChange={(e) => setWater(e.target.value)} />
            </div>
            <div>
              <Label>&nbsp;</Label>
              <Select value={waterUnit} onValueChange={setWaterUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ml">ml</SelectItem>
                  <SelectItem value="dz">dz</SelectItem>
                  <SelectItem value="liter">liter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>{isGerman ? "Spurenelemente" : "Trace Elements"}</Label>
              <Input type="number" value={spurenelemente} onChange={(e) => setSpurenelemente(e.target.value)} />
            </div>
            <div>
              <Label>&nbsp;</Label>
              <Select value={spurenelementeUnit} onValueChange={setSpurenelementeUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mg">mg</SelectItem>
                  <SelectItem value="g">g</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleSave} className="w-full">{isGerman ? "Speichern" : "Save"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
