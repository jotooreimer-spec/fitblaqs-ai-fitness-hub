import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import logo from "@/assets/fitblaqs-logo.png";
import loginBg from "@/assets/login-bg.jpg";
import { toast } from "sonner";
import { signInWithGoogle, signInWithEmail } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isGerman, setIsGerman] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signInWithEmail(email, password);
      toast.success(isGerman ? "Anmeldung erfolgreich!" : "Login successful!");
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(
        isGerman 
          ? "Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Daten." 
          : "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: `url(${loginBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60" />
      
      <Card className="w-full max-w-md bg-background/80 backdrop-blur-xl border-white/10 p-8 relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="FitBlaqs" className="w-24 h-24 mb-4" />
          <h1 className="text-3xl font-bold">{isGerman ? "Anmelden" : "Login"}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <Label>E-Mail</Label>
            <Input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
            />
          </div>

          {/* Password */}
          <div>
            <Label>{isGerman ? "Passwort" : "Password"}</Label>
            <Input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {/* Submit */}
          <div className="flex flex-col gap-4 pt-4">
            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
              {loading ? (isGerman ? "Lädt..." : "Loading...") : (isGerman ? "Anmelden" : "Login")}
            </Button>
            
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isGerman ? "Noch kein Konto? Registrieren" : "No account? Register"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isGerman ? "Zurück" : "Back"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Login;