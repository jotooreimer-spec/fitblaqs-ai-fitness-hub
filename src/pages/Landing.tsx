import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/fitblaqs-logo.png";
import heroImage from "@/assets/hero-fitness.jpg";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-male flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-12 px-4">
        {/* Logo */}
        <div className="flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <img 
            src={logo} 
            alt="FitBlaqs Logo" 
            className="w-48 h-48 object-contain drop-shadow-2xl glow"
          />
          <div className="text-center">
            <h1 className="text-6xl font-black mb-4">FitBlaqs</h1>
            <p className="text-xl text-muted-foreground max-w-md">
              Your AI-powered fitness & nutrition companion
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <Button 
          variant="hero" 
          size="xl"
          onClick={() => navigate("/register")}
          className="animate-in fade-in slide-in-from-bottom-8 duration-1000"
        >
          Start Your Journey
        </Button>

        {/* Login Link */}
        <button
          onClick={() => navigate("/login")}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
        >
          Already have an account? Login
        </button>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
    </div>
  );
};

export default Landing;
