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
    const { bodyType, weight, targetWeight, age, height, healthStatus, activityLevel, trainingFrequency, goal } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Du bist ein professioneller Fitness-Trainer und Ernährungsberater. Erstelle personalisierte Trainingspläne basierend auf den Benutzerdaten.
    
Antworte IMMER auf Deutsch und im folgenden JSON-Format:
{
  "duration": "X Wochen",
  "weeklyPlan": [
    {
      "day": "Tag 1",
      "type": "Push/Pull/Legs/Cardio/Rest",
      "exercises": [
        {
          "name": "Übungsname",
          "sets": 3,
          "reps": "10-12",
          "weight": "40-60% RM",
          "rest": "60-90 Sek",
          "minutes": 5
        }
      ],
      "totalMinutes": 45,
      "muscleGroups": ["Brust", "Trizeps"]
    }
  ],
  "nutrition": {
    "dailyCalories": 2500,
    "protein": "150g",
    "carbs": "250g",
    "fats": "80g"
  },
  "recovery": {
    "sleepHours": "7-8 Stunden",
    "restDays": 2,
    "tips": ["Tipp 1", "Tipp 2"]
  },
  "progression": "2.5-5% wöchentliche Steigerung"
}`;

    const userPrompt = `Erstelle einen personalisierten Trainingsplan für folgende Person:

- Körpertyp: ${bodyType}
- Aktuelles Gewicht: ${weight}
- Zielgewicht: ${targetWeight}
- Alter: ${age}
- Größe: ${height}
- Gesundheitszustand: ${healthStatus || "Keine Einschränkungen"}
- Aktivitätslevel: ${activityLevel}
- Trainingshäufigkeit: ${trainingFrequency}x pro Woche
- Ziel: ${goal}

Erstelle einen ${trainingFrequency <= 3 ? "4" : trainingFrequency <= 5 ? "8" : "12"}-Wochen-Plan mit:
1. Täglichen Trainingseinheiten mit Übungen, Sets, Reps, Gewichtsempfehlungen
2. Kalorien- und Makronährstoffempfehlungen basierend auf dem Ziel
3. Regenerations- und Schlafempfehlungen
4. Progressionsplan

Berücksichtige gesundheitliche Einschränkungen und passe den Plan entsprechend an.`;

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
    let trainingPlan;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        trainingPlan = JSON.parse(jsonMatch[0]);
      } else {
        trainingPlan = { rawContent: content };
      }
    } catch {
      trainingPlan = { rawContent: content };
    }

    return new Response(JSON.stringify({ trainingPlan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-training-plan:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
