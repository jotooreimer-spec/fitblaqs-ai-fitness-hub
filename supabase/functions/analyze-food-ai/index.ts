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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract token from header
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error("Auth error:", userError?.message || "No user found");
      return new Response(JSON.stringify({ error: "Unauthorized", details: userError?.message }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    console.log("User authenticated:", user.id);

    const { imageBase64, category, manualData } = await req.json();

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "Image is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Du bist ein professioneller Ernährungsberater und Food-Tracker-Analyst.
Der Benutzer lädt ein Bild eines Lebensmittels hoch.

${manualData ? `Manuelle Werte vom Benutzer:
- Name: ${manualData.name || 'unbekannt'}
- Category: ${manualData.category || category || 'unbekannt'}
- Protein: ${manualData.protein || 'unbekannt'} g
- Calories: ${manualData.calories || 'unbekannt'} kcal
- Carbs: ${manualData.carbs || 'unbekannt'} g
- Fat: ${manualData.fat || 'unbekannt'} g
- Sugar: ${manualData.sugar || 'unbekannt'} g
- Water: ${manualData.water || 'unbekannt'} ml
- Spurenelemente: ${manualData.traceElements || 'unbekannt'}` : 'Keine manuellen Werte - analysiere das Bild vollständig.'}

WICHTIG: Prüfe zuerst, ob es ein Essensbild ist. Falls NICHT, antworte mit:
{"error": "not_food_image", "message": "Bitte ein Essensbild hochladen"}

Falls es ein gültiges Essensbild ist:

1. Analysiere das Bild (erkenne Lebensmittel) und gleiche es mit den angegebenen Werten ab.
2. Berechne die genauen Kalorien und Makronährstoffverteilung.
3. Gib in Prozent an, wie viel des Tagesbedarfs (basierend auf 2000 kcal) abgedeckt ist.
4. Erstelle ein optimiertes Gericht, das ähnliche Makros liefert, aber weniger Kalorien hat.
5. Berechne Kalorien: Protein×4 + Carbs×4 + Fat×9

Antworte NUR mit validem JSON in diesem Format:
{
  "FoodName": "Erkanntes Lebensmittel",
  "Category": "${category || 'protein'}",
  "Calories": number,
  "Protein_g": number,
  "Carbs_g": number,
  "Fat_g": number,
  "Sugar_g": number,
  "Fiber_g": number,
  "Water_ml": number,
  "TraceElements": {
    "Vitamin_A": "Menge + Einheit",
    "Vitamin_C": "Menge + Einheit",
    "Iron": "Menge + Einheit",
    "Calcium": "Menge + Einheit"
  },
  "DailyPercent": {
    "Calories": number (% von 2000 kcal),
    "Protein": number (% von 50g),
    "Carbs": number (% von 250g),
    "Fat": number (% von 65g)
  },
  "MacroDistribution": {
    "Protein_pct": number,
    "Carbs_pct": number,
    "Fat_pct": number
  },
  "HealthRating": "sehr_gesund" | "mittel" | "ungünstig",
  "SuggestedDish": {
    "Name": "Alternatives Gericht",
    "Calories": number (weniger als Original),
    "Protein_g": number,
    "Carbs_g": number,
    "Fat_g": number,
    "CaloriesSaved": number,
    "WhyBetter": "Begründung"
  },
  "items": [
    {
      "name": "Einzelnes Lebensmittel",
      "portion": "geschätzte Portion",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number
    }
  ],
  "total_calories": number,
  "total_protein": number,
  "total_carbs": number,
  "total_fat": number,
  "notes": "Zusammenfassung und Ernährungstipps",
  "NutritionTips": "Konkrete Empfehlungen"
}`;

    console.log("Calling Lovable AI for food analysis...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Analysiere dieses Essensbild und erstelle eine komplette Nährwertanalyse mit Verbesserungsvorschlägen." },
              { type: "image_url", image_url: { url: imageBase64 } },
            ],
          },
        ],
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);
      
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
    console.log("Lovable AI response received:", content?.substring(0, 500));

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

    // Map to standard format for UI
    const mappedAnalysis = {
      ...analysisData,
      items: analysisData.items || [{
        name: analysisData.FoodName,
        portion: "1 serving",
        calories: analysisData.Calories,
        protein: analysisData.Protein_g,
        carbs: analysisData.Carbs_g,
        fat: analysisData.Fat_g
      }],
      total_calories: analysisData.total_calories || analysisData.Calories,
      total_protein: analysisData.total_protein || analysisData.Protein_g,
      total_carbs: analysisData.total_carbs || analysisData.Carbs_g,
      total_fat: analysisData.total_fat || analysisData.Fat_g,
      total_sugar: analysisData.Sugar_g,
      total_fiber: analysisData.Fiber_g,
      category: analysisData.Category || category || "protein",
      notes: analysisData.notes || analysisData.NutritionTips,
      macro_distribution: analysisData.MacroDistribution ? {
        protein_pct: analysisData.MacroDistribution.Protein_pct,
        carbs_pct: analysisData.MacroDistribution.Carbs_pct,
        fat_pct: analysisData.MacroDistribution.Fat_pct
      } : null,
      health_evaluation: {
        rating: analysisData.HealthRating || "mittel",
        calorie_density: analysisData.DailyPercent?.Calories > 25 ? "hoch" : "mittel",
        nutrient_density: "mittel",
        satiety_score: 7,
        sugar_risk: analysisData.Sugar_g > 15 ? "hoch" : analysisData.Sugar_g > 5 ? "mittel" : "niedrig",
        fat_quality: "mittel"
      },
      alternative_meal: analysisData.SuggestedDish ? {
        name: analysisData.SuggestedDish.Name,
        calories: analysisData.SuggestedDish.Calories,
        protein: analysisData.SuggestedDish.Protein_g,
        carbs: analysisData.SuggestedDish.Carbs_g,
        fat: analysisData.SuggestedDish.Fat_g,
        calories_saved: analysisData.SuggestedDish.CaloriesSaved,
        why_better: analysisData.SuggestedDish.WhyBetter
      } : null,
      trace_elements: analysisData.TraceElements,
      daily_percent: analysisData.DailyPercent
    };

    // Save to database
    const { data: saved, error: saveError } = await supabase
      .from("food_analysis")
      .insert({
        user_id: user.id,
        image_url: imageBase64.substring(0, 100) + "...",
        items: mappedAnalysis.items,
        total_calories: mappedAnalysis.total_calories,
        category: mappedAnalysis.category,
        notes: JSON.stringify({
          summary: mappedAnalysis.notes,
          health_evaluation: mappedAnalysis.health_evaluation,
          alternative: mappedAnalysis.alternative_meal,
          trace_elements: mappedAnalysis.trace_elements,
          daily_percent: mappedAnalysis.daily_percent
        }),
      })
      .select()
      .single();

    if (saveError) {
      console.error("Save error:", saveError);
    }

    return new Response(JSON.stringify({ success: true, analysis: mappedAnalysis, saved }), {
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
