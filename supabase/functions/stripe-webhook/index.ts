import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const event = JSON.parse(body);

    console.log("Received Stripe event:", event.type);

    // Create Supabase admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.client_reference_id;
      const plan = session.metadata?.plan as "pro_athlete" | "pro_nutrition";

      if (!userId || !plan) {
        console.error("Missing user_id or plan in session:", session);
        return new Response(JSON.stringify({ error: "Missing required data" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Calculate end date (12 months subscription)
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 12);

      const { error } = await supabase.from("subscriptions").upsert({
        user_id: userId,
        plan: plan,
        status: "active",
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      }, {
        onConflict: "user_id,plan",
      });

      if (error) {
        console.error("Error upserting subscription:", error);
        return new Response(JSON.stringify({ error: "Database error" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`Subscription activated for user ${userId}, plan ${plan}`);
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      
      const { error } = await supabase
        .from("subscriptions")
        .update({ 
          status: "cancelled",
          cancelled_at: new Date().toISOString()
        })
        .eq("stripe_subscription_id", subscription.id);

      if (error) {
        console.error("Error cancelling subscription:", error);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Webhook processing failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
