import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
function validateInput(data: Record<string, unknown>): { valid: boolean; error?: string } {
  const required = ["bodyType", "weight", "age", "height", "activityLevel", "trainingFrequency", "goal"];
  for (const field of required) {
    if (!data[field]) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }
  
  // Validate numeric fields
  const numericFields = ["weight", "age", "height", "trainingFrequency"];
  for (const field of numericFields) {
    const value = Number(data[field]);
    if (isNaN(value) || value <= 0) {
      return { valid: false, error: `Invalid value for ${field}` };
    }
  }
  
  // Validate trainingFrequency range
  const freq = Number(data.trainingFrequency);
  if (freq < 1 || freq > 7) {
    return { valid: false, error: "Training frequency must be between 1 and 7" };
  }
  
  // Validate string lengths to prevent prompt injection
  const stringFields = ["bodyType", "activityLevel", "goal", "healthStatus"];
  for (const field of stringFields) {
    if (data[field] && String(data[field]).length > 500) {
      return { valid: false, error: `${field} is too long` };
    }
  }
  
  return { valid: true };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client with user's token
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`User ${user.id} requesting training plan`);

    // Check for active Pro Athlete subscription
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("plan", "pro_athlete")
      .eq("status", "active")
      .single();

    if (!subscription) {
      console.log(`User ${user.id} does not have pro_athlete subscription`);
      return new Response(JSON.stringify({ error: "Pro Athlete subscription required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limiting: 5 requests per hour per user (database-backed)
    const { data: rateLimitAllowed, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_endpoint: 'generate-training-plan',
      p_max_requests: 5,
      p_window_seconds: 3600
    });

    if (rateLimitError) {
      console.error("Rate limit check error:", rateLimitError);
    }

    if (rateLimitAllowed === false) {
      console.log(`Rate limit exceeded for user ${user.id} on generate-training-plan`);
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse and validate input
    const requestData = await req.json();
    const validation = validateInput(requestData);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { bodyType, weight, targetWeight, age, height, healthStatus, activityLevel, trainingFrequency, goal } = requestData;
    
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

    // Sanitize user inputs before using in prompt
    const sanitize = (str: string) => String(str).replace(/[<>{}]/g, "").slice(0, 200);

    const userPrompt = `Erstelle einen personalisierten Trainingsplan für folgende Person:

- Körpertyp: ${sanitize(bodyType)}
- Aktuelles Gewicht: ${Number(weight)}kg
- Zielgewicht: ${targetWeight ? Number(targetWeight) + "kg" : "Nicht angegeben"}
- Alter: ${Number(age)} Jahre
- Größe: ${Number(height)}cm
- Gesundheitszustand: ${healthStatus ? sanitize(healthStatus) : "Keine Einschränkungen"}
- Aktivitätslevel: ${sanitize(activityLevel)}
- Trainingshäufigkeit: ${Number(trainingFrequency)}x pro Woche
- Ziel: ${sanitize(goal)}

Erstelle einen ${Number(trainingFrequency) <= 3 ? "4" : Number(trainingFrequency) <= 5 ? "8" : "12"}-Wochen-Plan mit:
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

    console.log(`Training plan generated for user ${user.id}`);

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
