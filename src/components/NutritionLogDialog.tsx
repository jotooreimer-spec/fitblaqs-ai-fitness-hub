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
  // Extended nutrition fields
  const [aminoacids, setAminoacids] = useState("");
  const [aminoacidsUnit, setAminoacidsUnit] = useState("g");
  const [minerals, setMinerals] = useState("");
  const [mineralsUnit, setMineralsUnit] = useState("mg");
  const [fiber, setFiber] = useState("");
  const [fiberUnit, setFiberUnit] = useState("g");
  const [sugar, setSugar] = useState("");
  const [sugarUnit, setSugarUnit] = useState("g");
  const [spurenelemente, setSpurenelemente] = useState("");
  const [spurenelementeUnit, setSpurenelementeUnit] = useState("mg");
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
      return amount ? Math.round(parseFloat(amount) * 0.5) : 0;
    }
    
    // For vegetarian/vegan: use fiber as protein, minerals as fats
    if (category === "vegetarian" || category === "vegan") {
      const fiberInG = fiber ? convertToGrams(parseFloat(fiber), fiberUnit) : 0;
      const mineralsInG = minerals ? convertToGrams(parseFloat(minerals), mineralsUnit) : 0;
      const carbsInG = carbs ? convertToGrams(parseFloat(carbs), carbsUnit) : 0;
      return Math.round((carbsInG * 4) + (mineralsInG * 9) + (fiberInG * 4));
    }
    
    // For protein category
    if (category === "protein") {
      const proteinInG = protein ? convertToGrams(parseFloat(protein), proteinUnit) : 0;
      const carbsInG = carbs ? convertToGrams(parseFloat(carbs), carbsUnit) : 0; // Iron
      const fatsInG = fats ? convertToGrams(parseFloat(fats), fatsUnit) : 0;
      return Math.round((carbsInG * 4) + (fatsInG * 9) + (proteinInG * 4));
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

    // Build notes with original values AND units for display
    if (category === "supplements") {
      const waterInML = water ? convertWaterToML(parseFloat(water), waterUnit) : 0;
      const liquidInML = liquid ? convertWaterToML(parseFloat(liquid), liquidUnit) : 0;
      notes = JSON.stringify({
        category: "supplements",
        amount: { value: parseFloat(amount) || 0, unit: amountUnit },
        water: { value: parseFloat(water) || 0, unit: waterUnit, ml: waterInML },
        liquid: { value: parseFloat(liquid) || 0, unit: liquidUnit, ml: liquidInML },
        sugar: { value: parseFloat(sugar) || 0, unit: sugarUnit }
      });
    } else if (category === "vegetarian" || category === "vegan") {
      proteinInG = fiber ? convertToGrams(parseFloat(fiber), fiberUnit) : 0;
      fatsInG = minerals ? convertToGrams(parseFloat(minerals), mineralsUnit) : 0;
      carbsInG = carbs ? convertToGrams(parseFloat(carbs), carbsUnit) : 0;
      const waterInML = water ? convertWaterToML(parseFloat(water), waterUnit) : 0;
      notes = JSON.stringify({
        category: category,
        carbs: { value: parseFloat(carbs) || 0, unit: carbsUnit },
        minerals: { value: parseFloat(minerals) || 0, unit: mineralsUnit },
        fiber: { value: parseFloat(fiber) || 0, unit: fiberUnit },
        water: { value: parseFloat(water) || 0, unit: waterUnit, ml: waterInML },
        vitamin: { value: parseFloat(vitamin) || 0, unit: vitaminUnit },
        aminoacids: { value: parseFloat(aminoacids) || 0, unit: aminoacidsUnit },
        spurenelemente: { value: parseFloat(spurenelemente) || 0, unit: spurenelementeUnit },
        sugar: { value: parseFloat(sugar) || 0, unit: sugarUnit }
      });
    } else if (category === "protein") {
      proteinInG = protein ? convertToGrams(parseFloat(protein), proteinUnit) : 0;
      carbsInG = carbs ? convertToGrams(parseFloat(carbs), carbsUnit) : 0;
      fatsInG = fats ? convertToGrams(parseFloat(fats), fatsUnit) : 0;
      notes = JSON.stringify({
        category: "protein",
        protein: { value: parseFloat(protein) || 0, unit: proteinUnit },
        iron: { value: parseFloat(carbs) || 0, unit: carbsUnit },
        aminoacids: { value: parseFloat(aminoacids) || 0, unit: aminoacidsUnit },
        fats: { value: parseFloat(fats) || 0, unit: fatsUnit },
        calcium: { value: parseFloat(vitamin) || 0, unit: vitaminUnit },
        spurenelemente: { value: parseFloat(spurenelemente) || 0, unit: spurenelementeUnit },
        sugar: { value: parseFloat(sugar) || 0, unit: sugarUnit }
      });
    } else {
      proteinInG = protein ? convertToGrams(parseFloat(protein), proteinUnit) : 0;
      carbsInG = carbs ? convertToGrams(parseFloat(carbs), carbsUnit) : 0;
      fatsInG = fats ? convertToGrams(parseFloat(fats), fatsUnit) : 0;
      const waterInML = water ? convertWaterToML(parseFloat(water), waterUnit) : 0;
      notes = JSON.stringify({
        category: category,
        carbs: { value: parseFloat(carbs) || 0, unit: carbsUnit },
        fats: { value: parseFloat(fats) || 0, unit: fatsUnit },
        protein: { value: parseFloat(protein) || 0, unit: proteinUnit },
        water: { value: parseFloat(water) || 0, unit: waterUnit, ml: waterInML },
        vitamin: { value: parseFloat(vitamin) || 0, unit: vitaminUnit },
        aminoacids: { value: parseFloat(aminoacids) || 0, unit: aminoacidsUnit },
        minerals: { value: parseFloat(minerals) || 0, unit: mineralsUnit },
        fiber: { value: parseFloat(fiber) || 0, unit: fiberUnit },
        spurenelemente: { value: parseFloat(spurenelemente) || 0, unit: spurenelementeUnit },
        sugar: { value: parseFloat(sugar) || 0, unit: sugarUnit }
      });
    }

    const mealTypeMap = {
      vegetarian: "breakfast" as const,
      vegan: "lunch" as const,
      protein: "dinner" as const,
      supplements: "snack" as const
    };

    const { error } = await supabase
      .from("nutrition_logs")
      .insert({
        user_id: userId,
        food_name: foodName,
        meal_type: mealTypeMap[category],
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
      description: isGerman ? "Ernährungseintrag gespeichert - Werte automatisch berechnet" : "Nutrition entry saved - Values auto-calculated"
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
    setSpurenelemente("");
    setAmount("");
    setLiquid("");
    onOpenChange(false);
    onSuccess();
  };

  if (!category) return null;

  // Render different form for supplements
  if (category === "supplements") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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
                <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div>
                <Label>&nbsp;</Label>
                <Select value={amountUnit} onValueChange={setAmountUnit}>
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
                <Label htmlFor="water">{isGerman ? "Wasser" : "Water"}</Label>
                <Input id="water" type="number" value={water} onChange={(e) => setWater(e.target.value)} />
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
                <Label htmlFor="liquid">{isGerman ? "Flüssigkeit" : "Liquid"}</Label>
                <Input id="liquid" type="number" value={liquid} onChange={(e) => setLiquid(e.target.value)} />
              </div>
              <div>
                <Label>&nbsp;</Label>
                <Select value={liquidUnit} onValueChange={setLiquidUnit}>
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
                <Label htmlFor="sugar">Sugar</Label>
                <Input id="sugar" type="number" value={sugar} onChange={(e) => setSugar(e.target.value)} />
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
            <Button onClick={handleSave} className="w-full">
              {isGerman ? "Speichern" : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Vegetarian/Vegan form - Fats → Mineralstoffe, Protein → Ballaststoffe
  if (category === "vegetarian" || category === "vegan") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isGerman ? categoryLabels[category].de : categoryLabels[category].en}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="foodName">{isGerman ? "Name" : "Name"}</Label>
              <Input id="foodName" value={foodName} onChange={(e) => setFoodName(e.target.value)} placeholder={isGerman ? "z.B. Gemüsepfanne" : "e.g. Veggie Bowl"} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="carbs">Carbs</Label>
                <Input id="carbs" type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
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
                <Label htmlFor="minerals">{isGerman ? "Mineralstoffe" : "Minerals"}</Label>
                <Input id="minerals" type="number" value={minerals} onChange={(e) => setMinerals(e.target.value)} />
              </div>
              <div>
                <Label>&nbsp;</Label>
                <Select value={mineralsUnit} onValueChange={setMineralsUnit}>
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
                <Label htmlFor="fiber">{isGerman ? "Ballaststoffe" : "Fiber"}</Label>
                <Input id="fiber" type="number" value={fiber} onChange={(e) => setFiber(e.target.value)} />
              </div>
              <div>
                <Label>&nbsp;</Label>
                <Select value={fiberUnit} onValueChange={setFiberUnit}>
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
                <Label htmlFor="water">{isGerman ? "Wasser" : "Water"}</Label>
                <Input id="water" type="number" value={water} onChange={(e) => setWater(e.target.value)} />
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
                <Label htmlFor="vitamin">Vitamin</Label>
                <Input id="vitamin" type="number" value={vitamin} onChange={(e) => setVitamin(e.target.value)} />
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
                <Label htmlFor="aminoacids">{isGerman ? "Aminosäuren" : "Amino Acids"}</Label>
                <Input id="aminoacids" type="number" value={aminoacids} onChange={(e) => setAminoacids(e.target.value)} />
              </div>
              <div>
                <Label>&nbsp;</Label>
                <Select value={aminoacidsUnit} onValueChange={setAminoacidsUnit}>
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
                <Label htmlFor="spurenelemente">{isGerman ? "Spurenelemente" : "Trace Elements"}</Label>
                <Input id="spurenelemente" type="number" value={spurenelemente} onChange={(e) => setSpurenelemente(e.target.value)} />
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
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="sugar">Sugar</Label>
                <Input id="sugar" type="number" value={sugar} onChange={(e) => setSugar(e.target.value)} />
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
            <Button onClick={handleSave} className="w-full">
              {isGerman ? "Speichern" : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Protein form - Carbs → Eisen, Water → Aminosäuren, plus Spurenelemente
  if (category === "protein") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isGerman ? categoryLabels[category].de : categoryLabels[category].en}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="foodName">{isGerman ? "Name" : "Name"}</Label>
              <Input id="foodName" value={foodName} onChange={(e) => setFoodName(e.target.value)} placeholder={isGerman ? "z.B. Hähnchenbrust" : "e.g. Chicken Breast"} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="protein">Protein</Label>
                <Input id="protein" type="number" value={protein} onChange={(e) => setProtein(e.target.value)} />
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
                <Label htmlFor="carbs">{isGerman ? "Eisen" : "Iron"}</Label>
                <Input id="carbs" type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
              </div>
              <div>
                <Label>&nbsp;</Label>
                <Select value={carbsUnit} onValueChange={setCarbsUnit}>
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
                <Label htmlFor="aminoacids">{isGerman ? "Aminosäuren" : "Amino Acids"}</Label>
                <Input id="aminoacids" type="number" value={aminoacids} onChange={(e) => setAminoacids(e.target.value)} />
              </div>
              <div>
                <Label>&nbsp;</Label>
                <Select value={aminoacidsUnit} onValueChange={setAminoacidsUnit}>
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
                <Label htmlFor="fats">{isGerman ? "Fette" : "Fats"}</Label>
                <Input id="fats" type="number" value={fats} onChange={(e) => setFats(e.target.value)} />
              </div>
              <div>
                <Label>&nbsp;</Label>
                <Select value={fatsUnit} onValueChange={setFatsUnit}>
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
                <Label htmlFor="vitamin">Calcium</Label>
                <Input id="vitamin" type="number" value={vitamin} onChange={(e) => setVitamin(e.target.value)} />
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
                <Label htmlFor="minerals">{isGerman ? "Spurenelemente" : "Trace Elements"}</Label>
                <Input id="minerals" type="number" value={minerals} onChange={(e) => setMinerals(e.target.value)} />
              </div>
              <div>
                <Label>&nbsp;</Label>
                <Select value={mineralsUnit} onValueChange={setMineralsUnit}>
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
                <Label htmlFor="sugar">Sugar</Label>
                <Input id="sugar" type="number" value={sugar} onChange={(e) => setSugar(e.target.value)} />
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
            <Button onClick={handleSave} className="w-full">
              {isGerman ? "Speichern" : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
};