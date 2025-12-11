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

    const { imageBase64, userData } = await req.json();

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

    // Get user profile data for calculations
    const { data: profile } = await supabase
      .from("profiles")
      .select("weight, height, body_type, athlete_level")
      .eq("user_id", user.id)
      .single();

    const systemPrompt = `Du bist ein hochpräziser Body-Analyse-Assistent für Sportwissenschaft und Gesundheitsdaten.
Deine Aufgabe ist es, anhand des Körperbildes eine EXTREM DETAILLIERTE Analyse durchzuführen.

Du darfst NICHT diagnostizieren. Du darfst KEINE medizinischen Erkrankungen ableiten.
Das Bild dient zur visuellen Einschätzung und Speicherung in der History.

WICHTIG: Prüfe zuerst, ob es ein Körper-/Fitnessbild ist. Falls NICHT, antworte mit:
{"error": "not_body_image", "message": "Bitte ein Körper-/Fitnessbild hochladen"}

Falls es ein gültiges Körperbild ist, liefere folgende Analyse:

1. VALIDIERUNG: Prüfe welche Körperpartien sichtbar sind
2. BMI: Standardformel (falls Gewicht/Größe bekannt)
3. KÖRPERFETT %: Schätzung basierend auf sichtbaren Merkmalen
4. MUSKELMASSE: Schätzung (Unterdurchschnittlich/Normal/Überdurchschnittlich/Athletisch)
5. TDEE: Kalorienbedarf über Mifflin-St Jeor + Aktivitätsfaktor
6. ZIELKALORIEN: Für Gewichtsziel
7. ZEIT BIS ZIEL: In Wochen
8. TRAININGSPLAN: 4-12 Wochen mit Push/Pull/Legs/Cardio
9. ERNÄHRUNGSPLAN: Protein/Carbs/Fette pro Tag
10. STRATEGIE: Konkrete Schritte zum Ziel

${userData ? `
Benutzerdaten:
- Körpertyp: ${userData.bodyType || 'unbekannt'}
- Gewicht: ${userData.weight || profile?.weight || 'unbekannt'} kg
- Zielgewicht: ${userData.targetWeight || 'unbekannt'} kg
- Alter: ${userData.age || 'unbekannt'}
- Größe: ${userData.height || profile?.height || 'unbekannt'} cm
- Aktivitätslevel: ${userData.activityLevel || 'moderat'}
- Training/Woche: ${userData.trainingFrequency || '3-4'}x
- Ziel: ${userData.goal || 'Fitness verbessern'}
` : `Profildaten: Gewicht ${profile?.weight || 'unbekannt'}kg, Größe ${profile?.height || 'unbekannt'}cm`}

Antworte NUR mit validem JSON:
{
  "gender": "male" | "female",
  "age_estimate": number,
  "body_fat_pct": number,
  "muscle_mass_pct": number,
  "muscle_category": "unterdurchschnittlich" | "normal" | "überdurchschnittlich" | "athletisch",
  "posture": "excellent" | "good" | "fair" | "needs_improvement",
  "symmetry": "excellent" | "good" | "fair" | "asymmetric",
  "waist_hip_ratio": number,
  "fitness_level": number,
  "bmi": {
    "value": number,
    "category": "Untergewicht" | "Normalgewicht" | "Übergewicht" | "Adipositas"
  },
  "tdee": {
    "bmr": number,
    "activity_factor": number,
    "total": number,
    "formula": "Mifflin-St Jeor"
  },
  "target_calories": {
    "daily": number,
    "deficit_surplus": number,
    "goal": "Fettabbau" | "Muskelaufbau" | "Erhaltung",
    "weekly_change_kg": number
  },
  "time_to_goal": {
    "weeks": number,
    "days": number,
    "weight_to_lose_gain": number
  },
  "training_plan": {
    "weeks": number,
    "focus": "muscle_gain" | "fat_loss" | "definition" | "maintenance",
    "weekly_schedule": [
      {"day": "Montag", "workout": "Push - Brust/Schultern/Trizeps", "duration": "60 min", "exercises": ["Bankdrücken 4x8-12", "Schulterdrücken 3x10-12", "Seitheben 3x12-15", "Trizeps Dips 3x12"]},
      {"day": "Dienstag", "workout": "Pull - Rücken/Bizeps", "duration": "60 min", "exercises": ["Klimmzüge 4x8-12", "Rudern 3x10-12", "Face Pulls 3x15", "Bizeps Curls 3x12"]},
      {"day": "Mittwoch", "workout": "Cardio/Regeneration", "duration": "30 min", "exercises": ["LISS Cardio", "Mobility Work"]},
      {"day": "Donnerstag", "workout": "Legs - Beine/Gesäß", "duration": "60 min", "exercises": ["Kniebeugen 4x8-12", "Beinpresse 3x12", "Ausfallschritte 3x10", "Wadenheben 4x15"]},
      {"day": "Freitag", "workout": "Upper Body", "duration": "55 min", "exercises": ["Schrägbankdrücken 3x10", "Latzug 3x12", "Arnold Press 3x12", "Kabelzug 3x15"]},
      {"day": "Samstag", "workout": "HIIT/Full Body", "duration": "45 min", "exercises": ["Burpees 4x12", "Kettlebell Swings 4x15", "Mountain Climbers 3x20", "Box Jumps 3x10"]},
      {"day": "Sonntag", "workout": "Ruhetag", "duration": "0 min", "exercises": ["Aktive Erholung", "Stretching"]}
    ],
    "progression": "2.5-5% wöchentliche Steigerung"
  },
  "nutrition_plan": {
    "daily_calories": number,
    "protein_g": number,
    "carbs_g": number,
    "fat_g": number,
    "protein_per_kg": number,
    "meal_plan": {
      "breakfast": {"meal": "Beschreibung", "calories": number, "protein": number},
      "lunch": {"meal": "Beschreibung", "calories": number, "protein": number},
      "dinner": {"meal": "Beschreibung", "calories": number, "protein": number},
      "snacks": {"meal": "Beschreibung", "calories": number, "protein": number}
    },
    "hydration_liters": number,
    "supplements": ["Creatin 5g", "Vitamin D 2000IU", "Omega-3"]
  },
  "strategy": {
    "weekly_workouts": number,
    "cardio_sessions": number,
    "sleep_hours": number,
    "water_liters": number,
    "key_focus": "Hauptfokus der nächsten Wochen",
    "mistakes_to_avoid": ["Fehler 1", "Fehler 2", "Fehler 3"],
    "progress_markers": ["Nach 2 Wochen", "Nach 4 Wochen", "Nach 8 Wochen"]
  },
  "health_notes": "Gesundheitshinweise und Empfehlungen",
  "training_tips": "Personalisierte Trainingstipps basierend auf Körperanalyse",
  "history_summary": "3-4 Sätze Zusammenfassung für History-Eintrag"
}`;

    console.log("Calling OpenAI API for detailed body analysis...");

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
              { type: "text", text: "Analysiere dieses Körper-/Fitnessbild EXTREM DETAILLIERT. Berechne BMI, TDEE, Körperfett%, erstelle einen kompletten Trainingsplan und Ernährungsplan mit konkreten Zahlen." },
              { type: "image_url", image_url: { url: imageBase64 } },
            ],
          },
        ],
        max_tokens: 4000,
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
    console.log("OpenAI response received:", content?.substring(0, 400));

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
      
      if (analysisData.error === "not_body_image") {
        return new Response(JSON.stringify({ 
          error: "invalid_image", 
          message: analysisData.message || "Bitte ein passendes Körperbild hochladen" 
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
      .from("body_analysis")
      .insert({
        user_id: user.id,
        image_url: imageBase64.substring(0, 100) + "...",
        gender: analysisData.gender,
        age_estimate: analysisData.age_estimate,
        body_fat_pct: analysisData.body_fat_pct,
        muscle_mass_pct: analysisData.muscle_mass_pct,
        posture: analysisData.posture,
        symmetry: analysisData.symmetry,
        waist_hip_ratio: analysisData.waist_hip_ratio,
        fitness_level: analysisData.fitness_level,
        health_notes: analysisData.health_notes,
        training_tips: JSON.stringify({
          tips: analysisData.training_tips,
          bmi: analysisData.bmi,
          tdee: analysisData.tdee,
          target_calories: analysisData.target_calories,
          time_to_goal: analysisData.time_to_goal,
          training_plan: analysisData.training_plan,
          nutrition_plan: analysisData.nutrition_plan,
          strategy: analysisData.strategy
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
    console.error("analyze-body error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
