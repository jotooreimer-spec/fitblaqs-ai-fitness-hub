import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface HydrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  isGerman: boolean;
  onSuccess: () => void;
}

export const HydrationDialog = ({ open, onOpenChange, userId, isGerman, onSuccess }: HydrationDialogProps) => {
  const { toast } = useToast();
  const [water, setWater] = useState("");
  const [waterUnit, setWaterUnit] = useState("ml");

  const handleSave = async () => {
    if (!water) return;

    // Exakte Taschenrechner-Logik für Hydration
    // ml → keine Umrechnung
    // dz (dl) → *100 (1dl = 100ml)
    // liter → *1000 (1l = 1000ml)
    let waterInML = parseFloat(water);
    if (waterUnit === "dz" || waterUnit === "dl") waterInML *= 100;
    if (waterUnit === "liter" || waterUnit === "l") waterInML *= 1000;

    const notes = JSON.stringify({
      category: "hydration",
      water: { value: parseFloat(water), unit: waterUnit, ml: waterInML }
    });

    const { error } = await supabase.from("nutrition_logs").insert({
      user_id: userId,
      food_name: "Hydration",
      meal_type: "snack",
      calories: 0,
      protein: 0,
      notes
    });

    if (error) {
      toast({ title: isGerman ? "Fehler" : "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: isGerman ? "Gespeichert" : "Saved" });
    setWater("");
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Hydration</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>{isGerman ? "Wasser" : "Water"}</Label>
              <Input type="number" value={water} onChange={(e) => setWater(e.target.value)} placeholder="250" />
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
          <Button onClick={handleSave} className="w-full">{isGerman ? "Speichern" : "Save"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
