import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("analyze-food-ai: Starting request processing");
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { imageBase64, category } = await req.json();

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "Image is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Du bist ein hochpräziser Ernährungs-Analyse-Assistent für Sportwissenschaft und Gesundheitsdaten.
Deine Aufgabe ist es, anhand des Bildes eine EXTREM DETAILLIERTE Analyse durchzuführen.

WICHTIG: Prüfe zuerst, ob es ein Essensbild ist. Falls NICHT, antworte mit:
{"error": "not_food_image", "message": "Bitte ein Essensbild hochladen"}

Falls es ein gültiges Essensbild ist, liefere folgende Analyse:

1. VALIDIERUNG: Prüfe ob alle Makros erkennbar sind
2. EXAKTE NÄHRWERTE: Kalorien pro Makro (Protein×4, Carbs×4, Fat×9)
3. MAKROVERTEILUNG: Prozentanteile berechnen
4. DETAILANALYSE: Zucker, Wasser, Bioverfügbarkeit, Mikronährstoffe
5. GESUNDHEITSBEWERTUNG: Sehr gesund / Mittel / Ungünstig
6. VERBESSERUNGEN: Konkrete Zahlen zum Optimieren
7. ALTERNATIVE: Ähnliches Gericht mit weniger kcal

Antworte NUR mit validem JSON in diesem Format:
{
  "items": [
    {
      "name": "Lebensmittelname",
      "portion": "geschätzte Portion",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "sugar": number,
      "fiber": number
    }
  ],
  "total_calories": number,
  "total_protein": number,
  "total_carbs": number,
  "total_fat": number,
  "total_sugar": number,
  "total_fiber": number,
  "category": "meat" | "protein" | "supplements" | "vegetarian" | "vegan",
  "macro_distribution": {
    "protein_pct": number,
    "carbs_pct": number,
    "fat_pct": number
  },
  "calculated_calories": {
    "from_protein": number,
    "from_carbs": number,
    "from_fat": number,
    "total_calculated": number,
    "deviation_pct": number
  },
  "health_evaluation": {
    "rating": "sehr_gesund" | "mittel" | "ungünstig",
    "calorie_density": "niedrig" | "mittel" | "hoch",
    "nutrient_density": "niedrig" | "mittel" | "hoch",
    "satiety_score": number,
    "sugar_risk": "niedrig" | "mittel" | "hoch",
    "fat_quality": "gut" | "mittel" | "schlecht"
  },
  "improvements": [
    {
      "action": "Beschreibung der Verbesserung",
      "impact": "Auswirkung in kcal oder Gramm",
      "reason": "Begründung"
    }
  ],
  "alternative_meal": {
    "name": "Alternativgericht",
    "calories": number,
    "protein": number,
    "carbs": number,
    "fat": number,
    "calories_saved": number,
    "why_better": "Begründung"
  },
  "nutrition_plan": {
    "recommendations": ["Empfehlung 1", "Empfehlung 2", "Empfehlung 3"],
    "supplements": ["Supplement 1", "Supplement 2"],
    "meal_timing": "Optimale Essenszeit",
    "hydration": "Empfohlene Wasserzufuhr"
  },
  "trace_elements": {
    "vitamin_a": "geschätzt",
    "vitamin_c": "geschätzt",
    "iron": "geschätzt",
    "calcium": "geschätzt"
  },
  "notes": "Zusammenfassung und Empfehlungen",
  "history_summary": "3-4 Sätze über das Gericht für die History"
}`;

    console.log("Calling OpenAI API for detailed food analysis...");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: `Analysiere dieses Essensbild EXTREM DETAILLIERT. Kategorie-Hinweis: ${category || 'unknown'}. Berechne alle Makros, Mikronährstoffe, Gesundheitsbewertung und liefere Verbesserungsvorschläge.` },
              { type: "image_url", image_url: { url: imageBase64 } },
            ],
          },
        ],
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    console.log("OpenAI response received:", content?.substring(0, 300));

    if (!content) {
      return new Response(JSON.stringify({ error: "No analysis generated" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let analysisData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
      
      if (analysisData.error === "not_food_image") {
        return new Response(JSON.stringify({ 
          error: "invalid_image", 
          message: analysisData.message || "Bitte ein passendes Essensbild hochladen" 
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "parse_error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save to database
    const { data: saved, error: saveError } = await supabase
      .from("food_analysis")
      .insert({
        user_id: user.id,
        image_url: imageBase64.substring(0, 100) + "...",
        items: analysisData.items,
        total_calories: analysisData.total_calories,
        category: analysisData.category,
        notes: JSON.stringify({
          summary: analysisData.notes,
          health_evaluation: analysisData.health_evaluation,
          improvements: analysisData.improvements,
          alternative: analysisData.alternative_meal,
          trace_elements: analysisData.trace_elements,
          macro_distribution: analysisData.macro_distribution
        }),
      })
      .select()
      .single();

    if (saveError) {
      console.error("Save error:", saveError);
    }

    return new Response(JSON.stringify({ success: true, analysis: analysisData, saved }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("analyze-food-ai error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
