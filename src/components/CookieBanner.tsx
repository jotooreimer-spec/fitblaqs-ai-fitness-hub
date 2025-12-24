import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Cookie, X, Settings2, Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const COOKIE_CONSENT_KEY = "fitblaqs_cookie_consent";

interface CookieConsent {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  timestamp: string;
}

export const CookieBanner = () => {
  const { language } = useLanguage();
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [consent, setConsent] = useState<CookieConsent>({
    essential: true,
    functional: false,
    analytics: false,
    timestamp: "",
  });

  const translations = {
    title: {
      de: "Cookie-Einstellungen",
      en: "Cookie Settings",
      es: "Configuración de cookies",
      fr: "Paramètres des cookies",
      pt: "Configurações de cookies",
      ru: "Настройки файлов cookie",
      tr: "Çerez Ayarları",
      it: "Impostazioni dei cookie",
    },
    description: {
      de: "Wir verwenden Cookies, um Ihre Erfahrung zu verbessern. Essentielle Cookies sind für die Grundfunktionen erforderlich.",
      en: "We use cookies to enhance your experience. Essential cookies are required for basic functionality.",
      es: "Usamos cookies para mejorar su experiencia. Las cookies esenciales son necesarias para la funcionalidad básica.",
      fr: "Nous utilisons des cookies pour améliorer votre expérience. Les cookies essentiels sont nécessaires pour les fonctionnalités de base.",
      pt: "Usamos cookies para melhorar sua experiência. Cookies essenciais são necessários para funcionalidade básica.",
      ru: "Мы используем файлы cookie для улучшения вашего опыта. Основные файлы cookie необходимы для базовой функциональности.",
      tr: "Deneyiminizi geliştirmek için çerezler kullanıyoruz. Temel çerezler temel işlevsellik için gereklidir.",
      it: "Utilizziamo i cookie per migliorare la tua esperienza. I cookie essenziali sono necessari per le funzionalità di base.",
    },
    acceptAll: {
      de: "Alle akzeptieren",
      en: "Accept All",
      es: "Aceptar todo",
      fr: "Tout accepter",
      pt: "Aceitar tudo",
      ru: "Принять все",
      tr: "Tümünü kabul et",
      it: "Accetta tutto",
    },
    acceptEssential: {
      de: "Nur Essentielle",
      en: "Essential Only",
      es: "Solo esenciales",
      fr: "Essentiels uniquement",
      pt: "Apenas essenciais",
      ru: "Только необходимые",
      tr: "Sadece gerekli",
      it: "Solo essenziali",
    },
    settings: {
      de: "Einstellungen",
      en: "Settings",
      es: "Configuración",
      fr: "Paramètres",
      pt: "Configurações",
      ru: "Настройки",
      tr: "Ayarlar",
      it: "Impostazioni",
    },
    save: {
      de: "Speichern",
      en: "Save",
      es: "Guardar",
      fr: "Enregistrer",
      pt: "Salvar",
      ru: "Сохранить",
      tr: "Kaydet",
      it: "Salva",
    },
    essential: {
      de: "Essentielle Cookies",
      en: "Essential Cookies",
      es: "Cookies esenciales",
      fr: "Cookies essentiels",
      pt: "Cookies essenciais",
      ru: "Основные файлы cookie",
      tr: "Temel çerezler",
      it: "Cookie essenziali",
    },
    essentialDesc: {
      de: "Erforderlich für Login, Sicherheit und Grundfunktionen. Können nicht deaktiviert werden.",
      en: "Required for login, security, and basic functions. Cannot be disabled.",
      es: "Requerido para inicio de sesión, seguridad y funciones básicas. No se puede desactivar.",
      fr: "Requis pour la connexion, la sécurité et les fonctions de base. Ne peut pas être désactivé.",
      pt: "Necessário para login, segurança e funções básicas. Não pode ser desativado.",
      ru: "Требуется для входа, безопасности и основных функций. Нельзя отключить.",
      tr: "Giriş, güvenlik ve temel işlevler için gereklidir. Devre dışı bırakılamaz.",
      it: "Richiesto per login, sicurezza e funzioni di base. Non può essere disabilitato.",
    },
    functional: {
      de: "Funktionale Cookies",
      en: "Functional Cookies",
      es: "Cookies funcionales",
      fr: "Cookies fonctionnels",
      pt: "Cookies funcionais",
      ru: "Функциональные файлы cookie",
      tr: "İşlevsel çerezler",
      it: "Cookie funzionali",
    },
    functionalDesc: {
      de: "Speichern Ihre Einstellungen wie Sprache und Theme.",
      en: "Store your preferences like language and theme.",
      es: "Almacenan sus preferencias como idioma y tema.",
      fr: "Enregistrent vos préférences comme la langue et le thème.",
      pt: "Armazenam suas preferências como idioma e tema.",
      ru: "Сохраняют ваши предпочтения, такие как язык и тема.",
      tr: "Dil ve tema gibi tercihlerinizi saklar.",
      it: "Memorizzano le tue preferenze come lingua e tema.",
    },
    analytics: {
      de: "Analyse Cookies",
      en: "Analytics Cookies",
      es: "Cookies de análisis",
      fr: "Cookies d'analyse",
      pt: "Cookies de análise",
      ru: "Аналитические файлы cookie",
      tr: "Analitik çerezler",
      it: "Cookie di analisi",
    },
    analyticsDesc: {
      de: "Helfen uns zu verstehen, wie Sie die App nutzen.",
      en: "Help us understand how you use the app.",
      es: "Nos ayudan a entender cómo usa la aplicación.",
      fr: "Nous aident à comprendre comment vous utilisez l'application.",
      pt: "Nos ajudam a entender como você usa o aplicativo.",
      ru: "Помогают нам понять, как вы используете приложение.",
      tr: "Uygulamayı nasıl kullandığınızı anlamamıza yardımcı olur.",
      it: "Ci aiutano a capire come usi l'app.",
    },
    privacyLink: {
      de: "Mehr in unserer Datenschutzerklärung",
      en: "Learn more in our Privacy Policy",
      es: "Más información en nuestra Política de Privacidad",
      fr: "En savoir plus dans notre Politique de Confidentialité",
      pt: "Saiba mais em nossa Política de Privacidade",
      ru: "Подробнее в нашей Политике конфиденциальности",
      tr: "Gizlilik Politikamızda daha fazla bilgi edinin",
      it: "Scopri di più nella nostra Informativa sulla Privacy",
    },
  };

  const t = (key: keyof typeof translations) => {
    const lang = language as keyof typeof translations.title;
    return translations[key][lang] || translations[key].en;
  };

  useEffect(() => {
    const storedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!storedConsent) {
      setShowBanner(true);
    } else {
      try {
        const parsed = JSON.parse(storedConsent);
        setConsent(parsed);
      } catch {
        setShowBanner(true);
      }
    }
  }, []);

  const saveConsent = (newConsent: CookieConsent) => {
    const consentWithTimestamp = {
      ...newConsent,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentWithTimestamp));
    setConsent(consentWithTimestamp);
    setShowBanner(false);
    setShowSettings(false);
  };

  const handleAcceptAll = () => {
    saveConsent({
      essential: true,
      functional: true,
      analytics: true,
      timestamp: "",
    });
  };

  const handleAcceptEssential = () => {
    saveConsent({
      essential: true,
      functional: false,
      analytics: false,
      timestamp: "",
    });
  };

  const handleSaveSettings = () => {
    saveConsent(consent);
  };

  if (!showBanner) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-5 duration-300">
        <Card className="max-w-2xl mx-auto bg-background/95 backdrop-blur-md border-border shadow-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-primary/10 rounded-lg shrink-0">
              <Cookie className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-1">{t("title")}</h3>
                <p className="text-sm text-muted-foreground">{t("description")}</p>
                <a 
                  href="/privacy-policy" 
                  className="text-xs text-primary hover:underline mt-1 inline-block"
                >
                  {t("privacyLink")}
                </a>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={handleAcceptAll}
                  className="gap-2"
                >
                  <Check className="w-4 h-4" />
                  {t("acceptAll")}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleAcceptEssential}
                >
                  {t("acceptEssential")}
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setShowSettings(true)}
                  className="gap-2"
                >
                  <Settings2 className="w-4 h-4" />
                  {t("settings")}
                </Button>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleAcceptEssential}
              className="shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cookie className="w-5 h-5 text-primary" />
              {t("title")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Essential Cookies */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Label className="font-medium">{t("essential")}</Label>
                <p className="text-xs text-muted-foreground mt-1">{t("essentialDesc")}</p>
              </div>
              <Switch checked={true} disabled />
            </div>

            {/* Functional Cookies */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Label className="font-medium">{t("functional")}</Label>
                <p className="text-xs text-muted-foreground mt-1">{t("functionalDesc")}</p>
              </div>
              <Switch 
                checked={consent.functional} 
                onCheckedChange={(checked) => setConsent({ ...consent, functional: checked })}
              />
            </div>

            {/* Analytics Cookies */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Label className="font-medium">{t("analytics")}</Label>
                <p className="text-xs text-muted-foreground mt-1">{t("analyticsDesc")}</p>
              </div>
              <Switch 
                checked={consent.analytics} 
                onCheckedChange={(checked) => setConsent({ ...consent, analytics: checked })}
              />
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={handleSaveSettings} className="flex-1">
                {t("save")}
              </Button>
              <Button variant="outline" onClick={handleAcceptAll} className="flex-1">
                {t("acceptAll")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CookieBanner;
