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

    const { imageBase64, gender } = await req.json();

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "Image is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY not configured");
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a professional fitness and body composition analyst. Analyze the provided body/fitness image and provide detailed metrics. 

IMPORTANT: First verify this is a fitness/body image showing a human body. If the image does NOT show a human body suitable for fitness analysis, respond with:
{"error": "not_body_image", "message": "Bitte ein Körper-/Fitnessbild hochladen"}

If it IS a valid body image, be professional and encouraging. Analyze body composition including:
- Body type differentiation (muscular, fat, defined, symmetry)
- Estimated measurements and metrics
- Generate a personalized 4-12 week training plan

Respond in JSON format with these exact fields:
{
  "gender": "male" or "female",
  "age_estimate": number (estimated age),
  "body_fat_pct": number (estimated body fat percentage, e.g., 15.5),
  "muscle_mass_pct": number (estimated muscle mass percentage),
  "posture": "excellent", "good", "fair", or "needs_improvement",
  "symmetry": "excellent", "good", "fair", or "asymmetric",
  "waist_hip_ratio": number (estimated ratio, e.g., 0.85),
  "fitness_level": number (1-10 scale),
  "health_notes": "Brief health observations and recommendations",
  "training_tips": "Personalized training recommendations based on body analysis",
  "training_plan": {
    "weeks": number (4-12),
    "focus": "muscle_gain" or "fat_loss" or "definition" or "maintenance",
    "weekly_schedule": [
      {"day": "Monday", "workout": "Push - Chest/Shoulders/Triceps", "duration": "60 min"},
      {"day": "Tuesday", "workout": "Pull - Back/Biceps", "duration": "60 min"},
      {"day": "Wednesday", "workout": "Rest/Cardio", "duration": "30 min"},
      {"day": "Thursday", "workout": "Legs - Quads/Hamstrings/Calves", "duration": "60 min"},
      {"day": "Friday", "workout": "Upper Body", "duration": "60 min"},
      {"day": "Saturday", "workout": "Full Body/HIIT", "duration": "45 min"},
      {"day": "Sunday", "workout": "Rest", "duration": "0 min"}
    ]
  }
}
Only respond with valid JSON, no additional text.`;

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
              { type: "text", text: `Analyze this body/fitness image. Gender hint: ${gender || 'unknown'}. Provide detailed body composition analysis and training plan.` },
              { type: "image_url", image_url: { url: imageBase64 } },
            ],
          },
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
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
    console.log("OpenAI response received:", content?.substring(0, 200));

    if (!content) {
      return new Response(JSON.stringify({ error: "No analysis generated" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse JSON response
    let analysisData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
      
      // Check if it's not a body image
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
      return new Response(JSON.stringify({ 
        error: "parse_error", 
        message: "AI response could not be parsed" 
      }), {
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
        training_tips: analysisData.training_tips,
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
