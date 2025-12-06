import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface StripeButtonProps {
  buyButtonId: string;
  publishableKey: string;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "stripe-buy-button": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          "buy-button-id": string;
          "publishable-key": string;
          "client-reference-id"?: string;
        },
        HTMLElement
      >;
    }
  }
}

const StripeButton = ({ buyButtonId, publishableKey }: StripeButtonProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Get current user ID
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
      }
    });
  }, []);

  useEffect(() => {
    // Load Stripe Buy Button script
    const existingScript = document.querySelector('script[src="https://js.stripe.com/v3/buy-button.js"]');
    
    if (existingScript) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/buy-button.js";
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.head.appendChild(script);

    return () => {
      // Don't remove the script as it might be used by other components
    };
  }, []);

  useEffect(() => {
    if (!scriptLoaded || !containerRef.current || !userId) return;

    // Clear container and add new button
    containerRef.current.innerHTML = "";
    
    const button = document.createElement("stripe-buy-button");
    button.setAttribute("buy-button-id", buyButtonId);
    button.setAttribute("publishable-key", publishableKey);
    button.setAttribute("client-reference-id", userId);
    
    containerRef.current.appendChild(button);
  }, [scriptLoaded, buyButtonId, publishableKey, userId]);

  if (!userId) {
    return (
      <div className="text-center text-white/60 py-4">
        Loading...
      </div>
    );
  }

  return <div ref={containerRef} className="stripe-button-container" />;
};

export default StripeButton;
