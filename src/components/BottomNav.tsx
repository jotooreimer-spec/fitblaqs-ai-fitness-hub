import { useLocation, useNavigate } from "react-router-dom";
import { Dumbbell, Apple, MapPin, Calendar, Settings, Scale } from "lucide-react";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { icon: Dumbbell, label: "Training", path: "/dashboard" },
    { icon: Apple, label: "Nutrition", path: "/nutrition" },
    { icon: MapPin, label: "Jogging", path: "/jogging-tracker" },
    { icon: Scale, label: "Weight", path: "/weight-tracker" },
    { icon: Calendar, label: "Performance", path: "/calendar" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 gradient-card border-t border-white/10 backdrop-blur-xl z-50">
      <div className="flex items-center justify-around h-16 max-w-screen-xl mx-auto px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 px-4 py-2 transition-all duration-300 ${
                isActive 
                  ? "text-primary scale-110" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? "glow" : ""}`} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
