import { useEffect, useState } from "react";
import { X, Bell } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import fitblaqsLogo from "@/assets/fitblaqs-logo.png";

interface UpdateNotificationProps {
  onDismiss: () => void;
}

// App version - increment this when releasing new features
const APP_VERSION = "2.1.0";
const STORAGE_KEY = "fitblaqs_last_seen_version";

// Current update features
const updateFeatures = {
  de: [
    "Live-Synchronisation auf allen Seiten",
    "Verbesserte Performance-Statistiken",
    "4 Sätze pro Übung eintragen",
    "Challenges mit Countdown"
  ],
  en: [
    "Live synchronization across all pages",
    "Improved performance statistics",
    "Log 4 sets per exercise",
    "Challenges with countdown"
  ]
};

export const UpdateNotification = ({ onDismiss }: UpdateNotificationProps) => {
  const { isGerman } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has seen this version
    const lastSeenVersion = localStorage.getItem(STORAGE_KEY);
    if (lastSeenVersion !== APP_VERSION) {
      // Show notification after a brief delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, APP_VERSION);
    setIsVisible(false);
    onDismiss();
  };

  if (!isVisible) return null;

  const features = isGerman ? updateFeatures.de : updateFeatures.en;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-in slide-in-from-top duration-500">
      <Card className="relative overflow-hidden border-primary/50 p-4 shadow-xl">
        {/* FitBlaqs Logo Background */}
        <div className="absolute inset-0 bg-black">
          <img 
            src={fitblaqsLogo} 
            alt="FitBlaqs" 
            className="absolute inset-0 w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/80" />
        </div>
        
        <div className="relative z-10 flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/20">
            <img src={fitblaqsLogo} alt="FitBlaqs" className="w-8 h-8 object-contain" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                {isGerman ? "Neues Update!" : "New Update!"}
              </h3>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white/80 hover:text-white hover:bg-white/10 h-6 w-6"
                onClick={handleDismiss}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-white/90 text-sm mb-2">
              v{APP_VERSION} - {isGerman ? "Neue Features verfügbar:" : "New features available:"}
            </p>
            <ul className="text-white/80 text-xs space-y-1">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-1">
                  <span className="text-primary">•</span> {feature}
                </li>
              ))}
            </ul>
            <Button 
              variant="secondary" 
              size="sm" 
              className="mt-3 w-full bg-primary/20 hover:bg-primary/30 text-white border border-primary/30"
              onClick={handleDismiss}
            >
              {isGerman ? "Verstanden" : "Got it"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export const useUpdateNotification = () => {
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const lastSeenVersion = localStorage.getItem(STORAGE_KEY);
    if (lastSeenVersion !== APP_VERSION) {
      setShowNotification(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, APP_VERSION);
    setShowNotification(false);
  };

  return { showNotification, dismiss };
};