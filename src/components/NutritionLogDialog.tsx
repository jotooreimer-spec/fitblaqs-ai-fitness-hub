import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface NutritionLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: "vegetarian" | "vegan" | "protein" | "supplements" | null;
  userId: string;
  isGerman: boolean;
  onSuccess: () => void;
}

export const NutritionLogDialog = ({
  open,
  onOpenChange,
  category,
  userId,
  isGerman,
  onSuccess
}: NutritionLogDialogProps) => {
  const { toast } = useToast();
  const [foodName, setFoodName] = useState("");
  const [carbs, setCarbs] = useState("");
  const [carbsUnit, setCarbsUnit] = useState("g");
  const [vitamin, setVitamin] = useState("");
  const [vitaminUnit, setVitaminUnit] = useState("mg");
  const [fats, setFats] = useState("");
  const [fatsUnit, setFatsUnit] = useState("g");
  const [water, setWater] = useState("");
  const [waterUnit, setWaterUnit] = useState("ml");
  const [protein, setProtein] = useState("");
  const [proteinUnit, setProteinUnit] = useState("g");
  // New extended nutrition fields
  const [aminoacids, setAminoacids] = useState("");
  const [aminoacidsUnit, setAminoacidsUnit] = useState("g");
  const [minerals, setMinerals] = useState("");
  const [mineralsUnit, setMineralsUnit] = useState("mg");
  const [fiber, setFiber] = useState("");
  const [fiberUnit, setFiberUnit] = useState("g");
  const [sugar, setSugar] = useState("");
  const [sugarUnit, setSugarUnit] = useState("g");
  // Supplements specific fields
  const [amount, setAmount] = useState("");
  const [amountUnit, setAmountUnit] = useState("g");
  const [liquid, setLiquid] = useState("");
  const [liquidUnit, setLiquidUnit] = useState("ml");

  const categoryLabels = {
    vegetarian: { de: "Vegetarisch", en: "Vegetarian" },
    vegan: { de: "Vegan", en: "Vegan" },
    protein: { de: "Fleisch & Protein", en: "Meat & Protein" },
    supplements: { de: "Supplements", en: "Supplements" }
  };

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

  const calculateCalories = () => {
    if (category === "supplements") {
      // Supplements have minimal calories
      return amount ? Math.round(parseFloat(amount) * 0.5) : 0;
    }
    const carbsInG = carbs ? convertToGrams(parseFloat(carbs), carbsUnit) : 0;
    const fatsInG = fats ? convertToGrams(parseFloat(fats), fatsUnit) : 0;
    const proteinInG = protein ? convertToGrams(parseFloat(protein), proteinUnit) : 0;
    
    return Math.round((carbsInG * 4) + (fatsInG * 9) + (proteinInG * 4));
  };

  const handleSave = async () => {
    if (!category || !foodName.trim()) {
      toast({
        title: isGerman ? "Fehler" : "Error",
        description: isGerman ? "Bitte Namen eingeben" : "Please enter food name",
        variant: "destructive"
      });
      return;
    }

    const calories = calculateCalories();
    let proteinInG = 0;
    let carbsInG = 0;
    let fatsInG = 0;
    let notes = "";

    if (category === "supplements") {
      notes = `Menge: ${amount || 0}${amountUnit}, Wasser: ${water || 0}${waterUnit}, Flüssigkeit: ${liquid || 0}${liquidUnit}, Sugar: ${sugar || 0}${sugarUnit}`;
    } else if (category === "vegetarian" || category === "vegan") {
      // Vegetarian/Vegan: Fats → Mineralstoffe, Protein → Ballaststoffe
      proteinInG = fiber ? convertToGrams(parseFloat(fiber), fiberUnit) : 0;
      fatsInG = minerals ? convertToGrams(parseFloat(minerals), mineralsUnit) : 0;
      carbsInG = carbs ? convertToGrams(parseFloat(carbs), carbsUnit) : 0;
      notes = `Water: ${water || 0}${waterUnit}, Vitamin: ${vitamin || 0}${vitaminUnit}, Minerals: ${minerals || 0}${mineralsUnit}, Fiber: ${fiber || 0}${fiberUnit}`;
    } else if (category === "protein") {
      // Protein Detail: Carbs → Eisen, Water → Aminosäuren
      proteinInG = protein ? convertToGrams(parseFloat(protein), proteinUnit) : 0;
      carbsInG = carbs ? convertToGrams(parseFloat(carbs), carbsUnit) : 0;
      fatsInG = fats ? convertToGrams(parseFloat(fats), fatsUnit) : 0;
      notes = `Aminoacids: ${aminoacids || 0}${aminoacidsUnit}, Iron: ${carbs || 0}${carbsUnit}, Calcium: ${vitamin || 0}${vitaminUnit}`;
    } else {
      proteinInG = protein ? convertToGrams(parseFloat(protein), proteinUnit) : 0;
      carbsInG = carbs ? convertToGrams(parseFloat(carbs), carbsUnit) : 0;
      fatsInG = fats ? convertToGrams(parseFloat(fats), fatsUnit) : 0;
      notes = `Water: ${water || 0}${waterUnit}, Vitamin: ${vitamin || 0}${vitaminUnit}, Aminoacids: ${aminoacids || 0}${aminoacidsUnit}, Minerals: ${minerals || 0}${mineralsUnit}, Fiber: ${fiber || 0}${fiberUnit}, Sugar: ${sugar || 0}${sugarUnit}`;
    }

    const { error } = await supabase
      .from("nutrition_logs")
      .insert({
        user_id: userId,
        food_name: foodName,
        meal_type: category === "vegetarian" ? "breakfast" : category === "vegan" ? "lunch" : category === "protein" ? "dinner" : "snack",
        calories,
        protein: proteinInG,
        carbs: carbsInG,
        fats: fatsInG,
        notes
      });

    if (error) {
      toast({
        title: isGerman ? "Fehler" : "Error",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    toast({
      title: isGerman ? "Gespeichert" : "Saved",
      description: isGerman ? "Ernährungseintrag gespeichert" : "Nutrition entry saved"
    });

    // Reset form
    setFoodName("");
    setCarbs("");
    setVitamin("");
    setFats("");
    setWater("");
    setProtein("");
    setAminoacids("");
    setMinerals("");
    setFiber("");
    setSugar("");
    setAmount("");
    setLiquid("");
    onOpenChange(false);
    onSuccess();
  };

  // Get category-specific field labels
  const getFieldLabels = () => {
    if (category === "vegetarian" || category === "vegan") {
      return {
        fats: isGerman ? "Mineralstoffe" : "Minerals",
        protein: isGerman ? "Ballaststoffe" : "Fiber"
      };
    }
    if (category === "protein") {
      return {
        carbs: isGerman ? "Eisen" : "Iron",
        water: isGerman ? "Aminosäuren" : "Amino Acids"
      };
    }
    return {};
  };

  const fieldLabels = getFieldLabels();

  if (!category) return null;

  // Render different form for supplements
  if (category === "supplements") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isGerman ? categoryLabels[category].de : categoryLabels[category].en}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="foodName">{isGerman ? "Name" : "Name"}</Label>
              <Input
                id="foodName"
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                placeholder={isGerman ? "z.B. Whey Protein" : "e.g. Whey Protein"}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="amount">{isGerman ? "Menge" : "Amount"}</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div>
                <Label>&nbsp;</Label>
                <Select value={amountUnit} onValueChange={setAmountUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                <Label htmlFor="water">{isGerman ? "Wasser" : "Water"}</Label>
                <Input
                  id="water"
                  type="number"
                  value={water}
                  onChange={(e) => setWater(e.target.value)}
                />
              </div>
              <div>
                <Label>&nbsp;</Label>
                <Select value={waterUnit} onValueChange={setWaterUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                <Label htmlFor="liquid">{isGerman ? "Flüssigkeit" : "Liquid"}</Label>
                <Input
                  id="liquid"
                  type="number"
                  value={liquid}
                  onChange={(e) => setLiquid(e.target.value)}
                />
              </div>
              <div>
                <Label>&nbsp;</Label>
                <Select value={liquidUnit} onValueChange={setLiquidUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ml">ml</SelectItem>
                    <SelectItem value="dz">dz</SelectItem>
                    <SelectItem value="liter">liter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Sugar field for supplements */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="sugar">Sugar</Label>
                <Input
                  id="sugar"
                  type="number"
                  value={sugar}
                  onChange={(e) => setSugar(e.target.value)}
                />
              </div>
              <div>
                <Label>&nbsp;</Label>
                <Select value={sugarUnit} onValueChange={setSugarUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="mg">mg</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleSave} className="w-full">
              {isGerman ? "Speichern" : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isGerman ? categoryLabels[category].de : categoryLabels[category].en}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="foodName">{isGerman ? "Name" : "Name"}</Label>
            <Input
              id="foodName"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              placeholder={isGerman ? "z.B. Haferflocken" : "e.g. Oatmeal"}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="carbs">{isGerman ? "Carbs" : "Carbs"}</Label>
              <Input
                id="carbs"
                type="number"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
              />
            </div>
            <div>
              <Label>&nbsp;</Label>
              <Select value={carbsUnit} onValueChange={setCarbsUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
              <Label htmlFor="vitamin">{isGerman ? "Vitamin" : "Vitamin"}</Label>
              <Input
                id="vitamin"
                type="number"
                value={vitamin}
                onChange={(e) => setVitamin(e.target.value)}
              />
            </div>
            <div>
              <Label>&nbsp;</Label>
              <Select value={vitaminUnit} onValueChange={setVitaminUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mg">mg</SelectItem>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="lb">lb</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="fats">{isGerman ? "Fette" : "Fats"}</Label>
              <Input
                id="fats"
                type="number"
                value={fats}
                onChange={(e) => setFats(e.target.value)}
              />
            </div>
            <div>
              <Label>&nbsp;</Label>
              <Select value={fatsUnit} onValueChange={setFatsUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
              <Label htmlFor="water">{isGerman ? "Wasser" : "Water"}</Label>
              <Input
                id="water"
                type="number"
                value={water}
                onChange={(e) => setWater(e.target.value)}
              />
            </div>
            <div>
              <Label>&nbsp;</Label>
              <Select value={waterUnit} onValueChange={setWaterUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
              <Label htmlFor="protein">{isGerman ? "Protein" : "Protein"}</Label>
              <Input
                id="protein"
                type="number"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
              />
            </div>
            <div>
              <Label>&nbsp;</Label>
              <Select value={proteinUnit} onValueChange={setProteinUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="mg">mg</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="lb">lb</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleSave} className="w-full">
            {isGerman ? "Speichern" : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};