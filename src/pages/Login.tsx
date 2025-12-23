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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && event === "SIGNED_IN") {
        setTimeout(() => {
          checkSessionAndRedirect(session.user.id);
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const getErrorMessage = (error: any): string => {
    const message = error?.message?.toLowerCase() || "";
    
    if (message.includes("invalid login credentials") || message.includes("invalid_credentials")) {
      return isGerman 
        ? "E-Mail oder Passwort ist falsch. Bitte überprüfen Sie Ihre Eingaben."
        : "Email or password is incorrect. Please check your entries.";
    }
    if (message.includes("email not confirmed")) {
      return isGerman 
        ? "Ihre E-Mail wurde noch nicht bestätigt. Bitte überprüfen Sie Ihren Posteingang."
        : "Your email has not been confirmed yet. Please check your inbox.";
    }
    if (message.includes("user not found") || message.includes("no user")) {
      return isGerman 
        ? "Kein Konto mit dieser E-Mail gefunden. Bitte registrieren Sie sich."
        : "No account found with this email. Please register.";
    }
    if (message.includes("too many requests") || message.includes("rate limit")) {
      return isGerman 
        ? "Zu viele Anmeldeversuche. Bitte warten Sie einige Minuten."
        : "Too many login attempts. Please wait a few minutes.";
    }
    if (message.includes("network") || message.includes("fetch")) {
      return isGerman 
        ? "Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung."
        : "Network error. Please check your internet connection.";
    }
    if (message.includes("refresh token") || message.includes("session")) {
      return isGerman 
        ? "Sitzung abgelaufen. Bitte melden Sie sich erneut an."
        : "Session expired. Please log in again.";
    }
    
    return isGerman 
      ? "Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Daten."
      : "Login failed. Please check your credentials.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const validationErrors = getValidationErrors(result.error);
      // Translate validation errors
      const translatedErrors: Record<string, string> = {};
      Object.entries(validationErrors).forEach(([key, value]) => {
        if (isGerman) {
          if (value.includes("Email is required")) translatedErrors[key] = "E-Mail ist erforderlich";
          else if (value.includes("Invalid email")) translatedErrors[key] = "Ungültige E-Mail-Adresse";
          else if (value.includes("Password is required")) translatedErrors[key] = "Passwort ist erforderlich";
          else if (value.includes("at least 8 characters")) translatedErrors[key] = "Passwort muss mindestens 8 Zeichen haben";
          else translatedErrors[key] = value;
        } else {
          translatedErrors[key] = value;
        }
      });
      setErrors(translatedErrors);
      return;
    }

    setLoading(true);

    try {
      const data = await signInWithEmail(email, password);
      toast.success(isGerman ? "Anmeldung erfolgreich!" : "Login successful!");
      
      if (data.user) {
        const hasCompletedOnboarding = await checkOnboardingStatus(data.user.id);
        if (hasCompletedOnboarding) {
          navigate("/dashboard", { replace: true });
        } else {
          navigate("/onboarding", { replace: true });
        }
      }
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
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
      
      {/* Login Card with Icon Background */}
      <Card className="w-full max-w-md bg-background/80 backdrop-blur-xl border-white/10 p-8 relative z-10 overflow-hidden">
        {/* Icon as Card Background */}
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `url(${logo})`,
            backgroundSize: '200px',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        
        <div className="relative z-10">
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
                className={`bg-background/50 ${errors.email ? "border-destructive" : ""}`}
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
                className={`bg-background/50 ${errors.password ? "border-destructive" : ""}`}
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
        </div>
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
