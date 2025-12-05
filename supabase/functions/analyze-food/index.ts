import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { foodName, barcode, imageBase64 } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Du bist ein professioneller Ernährungsberater. Analysiere Lebensmittel und gib Nährwertinformationen zurück.
    
Antworte IMMER auf Deutsch und im folgenden JSON-Format:
{
  "foodName": "Name des Lebensmittels",
  "calories": 250,
  "protein": 15,
  "carbs": 30,
  "fats": 8,
  "fiber": 5,
  "sugar": 10,
  "category": "Healthy & Power / Gesundheitssicherheit / Ernährung",
  "healthRating": "gut/mittel/schlecht",
  "tips": ["Tipp 1", "Tipp 2"]
}`;

    let userPrompt = "";
    if (barcode) {
      userPrompt = `Analysiere das Lebensmittel mit dem Barcode: ${barcode}. 
Gib die geschätzten Nährwerte pro Portion (100g) zurück.`;
    } else if (foodName) {
      userPrompt = `Analysiere das Lebensmittel: ${foodName}. 
Gib die geschätzten Nährwerte pro Portion (100g) zurück.`;
    } else if (imageBase64) {
      userPrompt = `Basierend auf der Beschreibung eines Lebensmittelbildes, schätze die Nährwerte.
Gib die geschätzten Nährwerte pro Portion zurück.`;
    } else {
      throw new Error("Keine Lebensmittelinformationen bereitgestellt");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit erreicht, bitte versuche es später erneut." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Zahlungspflichtig, bitte füge Credits hinzu." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Try to parse JSON from the response
    let nutritionData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        nutritionData = JSON.parse(jsonMatch[0]);
      } else {
        nutritionData = { rawContent: content };
      }
    } catch {
      nutritionData = { rawContent: content };
    }

    return new Response(JSON.stringify({ nutritionData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-food:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
