import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("analyze-food-ai: Starting request processing");
    
    const authHeader = req.headers.get("Authorization");
    console.log("analyze-food-ai: Auth header present:", !!authHeader);
    
    if (!authHeader) {
      console.error("analyze-food-ai: No authorization header");
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    console.log("analyze-food-ai: Creating Supabase client");
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log("analyze-food-ai: User fetch result - User:", !!user, "Error:", userError?.message);
    
    if (userError || !user) {
      console.error("analyze-food-ai: User authentication failed:", userError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized", details: userError?.message }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("analyze-food-ai: User authenticated:", user.id);
    
    const { imageBase64, category } = await req.json();

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "Image is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      console.error("analyze-food-ai: OPENAI_API_KEY not configured");
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a professional nutritionist analyzing food images. 

IMPORTANT: First verify this is a food image. If the image does NOT show food, respond with:
{"error": "not_food_image", "message": "Bitte ein Essensbild hochladen"}

If it IS a valid food image, identify all food items and provide detailed nutritional information including:
- Calories, protein, carbohydrates, fat for each item
- Total nutritional values
- Supplement and nutrition plan recommendations

Respond in JSON format:
{
  "items": [
    {
      "name": "Food item name",
      "portion": "estimated portion size",
      "calories": number,
      "protein": number (grams),
      "carbs": number (grams),
      "fat": number (grams)
    }
  ],
  "total_calories": number,
  "total_protein": number,
  "total_carbs": number,
  "total_fat": number,
  "category": "meat", "protein", "supplements", "vegetarian", or "vegan",
  "notes": "Brief nutritional advice or observations",
  "nutrition_plan": {
    "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"],
    "supplements": ["Supplement suggestion 1", "Supplement suggestion 2"],
    "meal_timing": "Best time to consume this meal",
    "hydration": "Recommended water intake with this meal"
  }
}
Be accurate and provide realistic nutritional estimates. Only respond with valid JSON.`;

    console.log("Calling OpenAI API for food analysis...");

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
              { type: "text", text: `Analyze this food image and provide detailed nutritional breakdown. Category hint: ${category || 'unknown'}` },
              { type: "image_url", image_url: { url: imageBase64 } },
            ],
          },
        ],
        max_tokens: 1500,
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
      
      // Check if it's not a food image
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
      .from("food_analysis")
      .insert({
        user_id: user.id,
        image_url: imageBase64.substring(0, 100) + "...",
        items: analysisData.items,
        total_calories: analysisData.total_calories,
        category: analysisData.category,
        notes: analysisData.notes,
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
