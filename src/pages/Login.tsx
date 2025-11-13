import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import logo from "@/assets/fitblaqs-logo.png";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { signInWithGoogle, signInWithEmail } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isGerman, setIsGerman] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    // Listen for auth changes
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

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error("Google login error:", error);
      toast.error(
        isGerman 
          ? "Google Login fehlgeschlagen" 
          : "Google login failed"
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-male flex items-center justify-center p-4">
      <Card className="w-full max-w-md gradient-card card-shadow border-white/10 p-8">
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
