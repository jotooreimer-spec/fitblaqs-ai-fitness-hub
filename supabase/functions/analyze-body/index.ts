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

    // Get user profile data
    const { data: profile } = await supabase
      .from("profiles")
      .select("weight, height, body_type, athlete_level")
      .eq("user_id", user.id)
      .single();

    const weight = userData?.weight || profile?.weight || 75;
    const targetWeight = userData?.targetWeight || weight;
    const age = userData?.age || 30;
    const height = userData?.height || profile?.height || 175;
    const activityLevel = userData?.activityLevel || "Moderate";
    const trainingHours = userData?.trainingFrequency || 4;
    const bodyType = userData?.bodyType || profile?.body_type || "Normal";
    const goal = userData?.goal || "Maintain Weight";

    const systemPrompt = `Du bist ein professioneller Personal Trainer und Body-Analysis-Coach.
Der Benutzer lädt ein Körperbild hoch mit folgenden Werten:

- Weight: ${weight} kg
- Target Weight: ${targetWeight} kg
- Age: ${age}
- Height: ${height} cm
- Activity Level: ${activityLevel}
- Training/Week: ${trainingHours} Stunden
- Body Type: ${bodyType}
- Goal: ${goal}

WICHTIG: Prüfe zuerst, ob es ein Körper-/Fitnessbild ist. Falls NICHT, antworte mit:
{"error": "not_body_image", "message": "Bitte ein Körper-/Fitnessbild hochladen"}

Falls es ein gültiges Körperbild ist:

1. Analysiere das Bild und kombiniere es mit den manuellen Werten.
2. Berechne genau den Körperfettanteil, den Muskelanteil und die Kalorien pro Tag, um das Zielgewicht zu erreichen.
3. Gib Empfehlungen für Training und Ernährung:
   - Proteinbedarf (1.6-2.2g pro kg Körpergewicht)
   - Makronährstoffverteilung
   - Cardio/Strength Training
4. Berechne BMR mit Mifflin-St Jeor: BMR = 10×Gewicht + 6.25×Größe - 5×Alter + 5 (Männer) oder -161 (Frauen)
5. TDEE = BMR × Aktivitätsfaktor (Sedentary: 1.2, Light: 1.375, Moderate: 1.55, Active: 1.725, Very Active: 1.9)
6. Für Fettabbau: TDEE - 500 kcal, für Muskelaufbau: TDEE + 300 kcal

Antworte NUR mit validem JSON in diesem Format:
{
  "Weight_kg": ${weight},
  "Target_kg": ${targetWeight},
  "Age": ${age},
  "Height_cm": ${height},
  "ActivityLevel": "${activityLevel}",
  "TrainingHoursPerWeek": ${trainingHours},
  "BodyType": "geschätzt aus Bild",
  "CurrentFatPercent": number (geschätzt 10-35),
  "MuscleMassPercent": number (geschätzt 25-50),
  "BMR": number,
  "TDEE": number,
  "DailyCalories": number (Zielkalorien),
  "WeeksToGoal": number,
  "Macros": {
    "Protein_g": number,
    "Carbs_g": number,
    "Fat_g": number
  },
  "TrainingPlan": {
    "Cardio": "z.B. 3x30min HIIT oder 4x45min moderate",
    "Strength": "z.B. 4x Push/Pull/Legs Split",
    "WeeklySchedule": [
      {"day": "Montag", "workout": "Push", "duration": "60 min"},
      {"day": "Dienstag", "workout": "Pull", "duration": "60 min"},
      {"day": "Mittwoch", "workout": "Cardio/Rest", "duration": "30 min"},
      {"day": "Donnerstag", "workout": "Legs", "duration": "60 min"},
      {"day": "Freitag", "workout": "Upper Body", "duration": "55 min"},
      {"day": "Samstag", "workout": "HIIT", "duration": "45 min"},
      {"day": "Sonntag", "workout": "Rest", "duration": "0 min"}
    ]
  },
  "NutritionTips": "Konkrete Ernährungstipps",
  "GoalAdvice": "Konkrete Empfehlung zum Erreichen des Ziels",
  "gender": "male" oder "female",
  "age_estimate": number,
  "body_fat_pct": number,
  "muscle_mass_pct": number,
  "posture": "excellent/good/fair/needs_improvement",
  "symmetry": "excellent/good/fair/asymmetric",
  "waist_hip_ratio": number,
  "fitness_level": number (1-10),
  "health_notes": "Gesundheitshinweise",
  "training_tips": "Trainingstipps basierend auf Analyse"
}`;

    console.log("Calling OpenAI API for body analysis...");

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
              { type: "text", text: "Analysiere dieses Körperbild und erstelle eine komplette Analyse mit Trainings- und Ernährungsplan." },
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
    console.log("OpenAI response received:", content?.substring(0, 500));

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

    // Map to standard format for UI
    const mappedAnalysis = {
      ...analysisData,
      body_fat_pct: analysisData.CurrentFatPercent || analysisData.body_fat_pct,
      muscle_mass_pct: analysisData.MuscleMassPercent || analysisData.muscle_mass_pct,
      fitness_level: analysisData.fitness_level || 7,
      training_plan: {
        weeks: analysisData.WeeksToGoal || 12,
        focus: goal === "Lose Fat" ? "fat_loss" : goal === "Gain Muscle" ? "muscle_gain" : "maintenance",
        weekly_schedule: analysisData.TrainingPlan?.WeeklySchedule || []
      },
      nutrition_plan: {
        daily_calories: analysisData.DailyCalories,
        protein_g: analysisData.Macros?.Protein_g,
        carbs_g: analysisData.Macros?.Carbs_g,
        fat_g: analysisData.Macros?.Fat_g
      },
      tdee: { total: analysisData.TDEE, bmr: analysisData.BMR }
    };

    // Save to database
    const { data: saved, error: saveError } = await supabase
      .from("body_analysis")
      .insert({
        user_id: user.id,
        image_url: imageBase64.substring(0, 100) + "...",
        gender: analysisData.gender || "unknown",
        age_estimate: analysisData.age_estimate || analysisData.Age,
        body_fat_pct: analysisData.CurrentFatPercent || analysisData.body_fat_pct,
        muscle_mass_pct: analysisData.MuscleMassPercent || analysisData.muscle_mass_pct,
        posture: analysisData.posture || "good",
        symmetry: analysisData.symmetry || "good",
        waist_hip_ratio: analysisData.waist_hip_ratio || 0.85,
        fitness_level: analysisData.fitness_level || 7,
        health_notes: analysisData.health_notes || analysisData.NutritionTips,
        training_tips: JSON.stringify({
          tips: analysisData.training_tips || analysisData.GoalAdvice,
          macros: analysisData.Macros,
          training_plan: analysisData.TrainingPlan,
          daily_calories: analysisData.DailyCalories,
          weeks_to_goal: analysisData.WeeksToGoal
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
    console.error("analyze-body error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
