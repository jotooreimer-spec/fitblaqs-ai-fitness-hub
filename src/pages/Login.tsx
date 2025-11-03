import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import logo from "@/assets/fitblaqs-logo.png";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Get language from localStorage if user exists
  const storedUser = localStorage.getItem("fitblaqs_user");
  const userLanguage = storedUser ? JSON.parse(storedUser).language : "de";
  const isGerman = userLanguage === "de";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation (will be replaced with Lovable Cloud auth)
    const storedUser = localStorage.getItem("fitblaqs_user");
    
    if (!storedUser) {
      toast.error(isGerman ? "Kein Konto gefunden. Bitte registrieren Sie sich zuerst." : "No account found. Please register first.");
      return;
    }

    const user = JSON.parse(storedUser);
    
    if (user.email === email && user.password === password) {
      localStorage.setItem("fitblaqs_theme", user.gender === "female" ? "theme-female" : "");
      toast.success(isGerman ? "Anmeldung erfolgreich!" : "Login successful!");
      navigate("/dashboard");
    } else {
      toast.error(isGerman ? "Ungültige Anmeldedaten" : "Invalid credentials");
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
            <Button type="submit" variant="hero" size="lg" className="w-full">
              {isGerman ? "Anmelden" : "Login"}
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
