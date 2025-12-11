import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import logo from "@/assets/fitblaqs-logo.png";
import loginBg from "@/assets/login-bg.jpg";
import { toast } from "sonner";
import { signInWithEmail, checkOnboardingStatus } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { loginSchema, getValidationErrors } from "@/lib/validations";
import { PasswordChangeDialog } from "@/components/PasswordChangeDialog";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isGerman, setIsGerman] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  useEffect(() => {
    const checkSessionAndRedirect = async (userId: string) => {
      try {
        const hasCompletedOnboarding = await checkOnboardingStatus(userId);
        if (hasCompletedOnboarding) {
          navigate("/dashboard", { replace: true });
        } else {
          navigate("/onboarding", { replace: true });
        }
      } catch (e) {
        navigate("/onboarding", { replace: true });
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        checkSessionAndRedirect(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session && event === "SIGNED_IN") {
        checkSessionAndRedirect(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setErrors(getValidationErrors(result.error));
      return;
    }

    setLoading(true);

    try {
      const data = await signInWithEmail(email, password);
      toast.success(isGerman ? "Anmeldung erfolgreich!" : "Login successful!");
      
      // Check onboarding status and redirect
      if (data.user) {
        const hasCompletedOnboarding = await checkOnboardingStatus(data.user.id);
        if (hasCompletedOnboarding) {
          navigate("/dashboard", { replace: true });
        } else {
          navigate("/onboarding", { replace: true });
        }
      }
    } catch (error: any) {
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
      <div className="absolute inset-0 bg-black/60" />
      
      <Card className="w-full max-w-md bg-background/80 backdrop-blur-xl border-white/10 p-8 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="FitBlaqs" className="w-24 h-24 mb-4" />
          <h1 className="text-3xl font-bold">{isGerman ? "Anmelden" : "Login"}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label>E-Mail</Label>
            <Input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              maxLength={255}
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
          </div>

          <div>
            <Label>{isGerman ? "Passwort" : "Password"}</Label>
            <Input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              maxLength={100}
              className={errors.password ? "border-destructive" : ""}
            />
            {errors.password && <p className="text-sm text-destructive mt-1">{errors.password}</p>}
          </div>

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
              onClick={() => setPasswordDialogOpen(true)}
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              {isGerman ? "Passwort vergessen / ändern?" : "Forgot / Change password?"}
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

      <PasswordChangeDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
        userEmail={email}
      />
    </div>
  );
};

export default Login;
