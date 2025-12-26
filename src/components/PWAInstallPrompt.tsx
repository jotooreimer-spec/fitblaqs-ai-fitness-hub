import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if running on iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isInStandaloneMode = window.matchMedia("(display-mode: standalone)").matches;
    
    setIsIOS(isIOSDevice);

    // Don't show if already installed
    if (isInStandaloneMode) {
      return;
    }

    // Show iOS prompt after a delay
    if (isIOSDevice) {
      const dismissed = localStorage.getItem("pwa-ios-dismissed");
      if (!dismissed) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
      return;
    }

    // Handle Android/Chrome install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      const dismissed = localStorage.getItem("pwa-prompt-dismissed");
      if (!dismissed) {
        setTimeout(() => setShowPrompt(true), 2000);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem(isIOS ? "pwa-ios-dismissed" : "pwa-prompt-dismissed", "true");
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-4">
      <div className="bg-card border border-border rounded-xl p-4 shadow-lg">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Download className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm">
              Install FitBlaqs Studio
            </h3>
            {isIOS ? (
              <p className="text-xs text-muted-foreground mt-1">
                Tap <span className="inline-flex items-center"><svg className="w-4 h-4 inline mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg></span> then "Add to Home Screen"
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                Install the app for quick access and offline use
              </p>
            )}
          </div>
        </div>

        {!isIOS && (
          <Button
            onClick={handleInstall}
            className="w-full mt-3"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Install App
          </Button>
        )}
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
