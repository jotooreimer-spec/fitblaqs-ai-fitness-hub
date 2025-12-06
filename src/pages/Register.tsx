import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import logo from "@/assets/fitblaqs-logo.png";
import authBackground from "@/assets/auth-background.png";
import { toast } from "sonner";
import { signUpWithEmail } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { registerSchema, getValidationErrors } from "@/lib/validations";

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    weight: "",
    height: "",
    gender: "",
    language: "de",
    email: "",
    password: "",
  });

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
    setErrors({});

    const result = registerSchema.safeParse(formData);
    if (!result.success) {
      setErrors(getValidationErrors(result.error));
      return;
    }

    setLoading(true);

    try {
      await signUpWithEmail(formData.email, formData.password, {
        name: formData.name,
        age: formData.age,
        weight: formData.weight,
        height: formData.height,
        gender: formData.gender,
        language: formData.language,
      });
      
      toast.success(formData.language === "de" ? "Registrierung erfolgreich!" : "Registration successful!");
    } catch (error: any) {
      const message = error?.message?.toLowerCase() || "";
      if (message.includes("already registered") || message.includes("already exists")) {
        toast.error(
          formData.language === "de"
            ? "Diese E-Mail ist bereits registriert."
            : "This email is already registered."
        );
      } else {
        toast.error(
          formData.language === "de" 
            ? "Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut." 
            : "Registration failed. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const isGerman = formData.language === "de";

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: `url(${authBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black/60" />
      
      <Card className="w-full max-w-2xl bg-background/80 backdrop-blur-xl border-white/10 p-8 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="FitBlaqs" className="w-24 h-24 mb-4" />
          <h1 className="text-3xl font-bold">{isGerman ? "Registrierung" : "Registration"}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label>{isGerman ? "Sprache" : "Language"}</Label>
            <Select value={formData.language} onValueChange={(value) => updateField("language", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{isGerman ? "Name" : "Name"}</Label>
            <Input 
              type="text"
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder={isGerman ? "Ihr vollständiger Name" : "Your full name"}
              maxLength={100}
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>{isGerman ? "Alter" : "Age"}</Label>
              <Input 
                type="number"
                value={formData.age}
                onChange={(e) => updateField("age", e.target.value)}
                placeholder="25"
                min={13}
                max={120}
                className={errors.age ? "border-destructive" : ""}
              />
              {errors.age && <p className="text-sm text-destructive mt-1">{errors.age}</p>}
            </div>
            <div>
              <Label>{isGerman ? "Gewicht (kg)" : "Weight (kg)"}</Label>
              <Input 
                type="number"
                value={formData.weight}
                onChange={(e) => updateField("weight", e.target.value)}
                placeholder="70"
                min={1}
                max={500}
                className={errors.weight ? "border-destructive" : ""}
              />
              {errors.weight && <p className="text-sm text-destructive mt-1">{errors.weight}</p>}
            </div>
            <div>
              <Label>{isGerman ? "Größe (cm)" : "Height (cm)"}</Label>
              <Input 
                type="number"
                value={formData.height}
                onChange={(e) => updateField("height", e.target.value)}
                placeholder="175"
                min={1}
                max={300}
                className={errors.height ? "border-destructive" : ""}
              />
              {errors.height && <p className="text-sm text-destructive mt-1">{errors.height}</p>}
            </div>
          </div>

          <div>
            <Label>{isGerman ? "Geschlecht" : "Gender"}</Label>
            <Select value={formData.gender} onValueChange={(value) => updateField("gender", value)}>
              <SelectTrigger className={errors.gender ? "border-destructive" : ""}>
                <SelectValue placeholder={isGerman ? "Wählen Sie Ihr Geschlecht" : "Select your gender"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">{isGerman ? "Männlich" : "Male"}</SelectItem>
                <SelectItem value="female">{isGerman ? "Weiblich" : "Female"}</SelectItem>
              </SelectContent>
            </Select>
            {errors.gender && <p className="text-sm text-destructive mt-1">{errors.gender}</p>}
          </div>

          <div>
            <Label>E-Mail</Label>
            <Input 
              type="email"
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
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
              value={formData.password}
              onChange={(e) => updateField("password", e.target.value)}
              placeholder="••••••••"
              maxLength={100}
              className={errors.password ? "border-destructive" : ""}
            />
            {errors.password && <p className="text-sm text-destructive mt-1">{errors.password}</p>}
            <p className="text-xs text-muted-foreground mt-1">
              {isGerman ? "Mindestens 8 Zeichen" : "At least 8 characters"}
            </p>
          </div>

          <div className="flex flex-col gap-4 pt-4">
            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
              {loading ? (isGerman ? "Lädt..." : "Loading...") : (isGerman ? "Konto erstellen" : "Create Account")}
            </Button>
            
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isGerman ? "Bereits ein Konto? Anmelden" : "Already have an account? Login"}
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

export default Register;
