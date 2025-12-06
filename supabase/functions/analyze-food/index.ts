import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation
function validateInput(data: Record<string, unknown>): { valid: boolean; error?: string } {
  // At least one of these must be provided
  if (!data.foodName && !data.imageBase64) {
    return { valid: false, error: "Either foodName or imageBase64 must be provided" };
  }
  
  // Validate string lengths to prevent prompt injection
  if (data.foodName && String(data.foodName).length > 200) {
    return { valid: false, error: "Food name is too long" };
  }
  
  // Validate image base64 is reasonable size (max ~5MB base64)
  if (data.imageBase64 && String(data.imageBase64).length > 7000000) {
    return { valid: false, error: "Image is too large" };
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

    console.log(`User ${user.id} requesting food analysis`);

    // Check for active Pro Nutrition subscription
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("plan", "pro_nutrition")
      .eq("status", "active")
      .single();

    if (!subscription) {
      return new Response(JSON.stringify({ error: "Pro Nutrition subscription required" }), {
        status: 403,
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

    const { foodName, imageBase64 } = requestData;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Du bist ein professioneller Ernährungsberater. Analysiere Lebensmittel und gib detaillierte Nährwertinformationen zurück.
    
Antworte IMMER auf Deutsch und im folgenden JSON-Format:
{
  "foodName": "Name des Lebensmittels",
  "calories": 250,
  "protein": 15,
  "carbs": 30,
  "fats": 8,
  "fiber": 5,
  "vitamins": "Vitamin A, C, D",
  "minerals": "Eisen, Calcium, Magnesium",
  "aminoAcids": "Leucin, Isoleucin",
  "sugar": 10,
  "category": "Healthy & Power",
  "healthRating": "gut",
  "tips": ["Tipp 1", "Tipp 2", "Tipp 3"]
}`;

    // Sanitize input
    const sanitize = (str: string) => String(str).replace(/[<>{}]/g, "").slice(0, 200);

    let userPrompt = "";
    const messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }> = [
      { role: "system", content: systemPrompt }
    ];

    if (imageBase64) {
      // Use vision model for image analysis
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: "Analysiere dieses Lebensmittelbild und gib die geschätzten Nährwerte pro Portion zurück. Berechne Vitamine, Mineralstoffe, Ballaststoffe, Aminosäuren, Protein, Kohlenhydrate und Fette."
          },
          {
            type: "image_url",
            image_url: {
              url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
            }
          }
        ]
      });
    } else if (foodName) {
      userPrompt = `Analysiere das Lebensmittel: ${sanitize(foodName)}. 
Gib die geschätzten Nährwerte pro Portion (100g) zurück, inklusive Vitamine, Mineralstoffe, Ballaststoffe, Aminosäuren, Protein, Kohlenhydrate und Fette.`;
      messages.push({ role: "user", content: userPrompt });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
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

    console.log(`Food analysis completed for user ${user.id}`);

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
