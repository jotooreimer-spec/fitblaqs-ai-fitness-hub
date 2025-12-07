import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import settingsBg from "@/assets/settings-bg.jpg";

const TermsOfService = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isGerman = language === "de";

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="fixed inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${settingsBg})` }} />
      <div className="fixed inset-0 bg-black/70" />

      <div className="relative z-10 max-w-4xl mx-auto p-6 pb-24">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-white">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-3xl font-bold text-white">{isGerman ? "Nutzungsbedingungen" : "Terms of Service"}</h1>
        </div>

        <Card className="bg-black/40 backdrop-blur-md border-white/10 p-8 prose prose-invert max-w-none">
          {isGerman ? (
            <>
              <h2 className="text-white text-2xl font-bold mb-4">Nutzungsbedingungen für FitBlaqs</h2>
              <p className="text-white/80 mb-4"><strong>Zuletzt aktualisiert:</strong> Dezember 2024</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">1. Geltungsbereich</h3>
              <p className="text-white/80">Diese Nutzungsbedingungen gelten für die Nutzung der FitBlaqs-App und aller damit verbundenen Dienste.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">2. Nutzerkonto</h3>
              <p className="text-white/80">Zur Nutzung der App ist ein Benutzerkonto erforderlich. Sie sind verantwortlich für die Geheimhaltung Ihrer Zugangsdaten.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">3. Pro-Abonnements</h3>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li><strong>Pro Athlete:</strong> €19,99 für 12 Monate – KI-Trainingspläne, Body-Analyse</li>
                <li><strong>Pro Nutrition:</strong> €14,99 für 12 Monate – KI-Essensanalyse, Food Tracker</li>
              </ul>
              <p className="text-white/80 mt-2">Abonnements können nach 6 Monaten per E-Mail gekündigt werden.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">4. KI-Funktionen</h3>
              <p className="text-white/80">Die KI-gestützte Analyse dient nur zu Informationszwecken und ersetzt keine professionelle Beratung.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">5. Nutzungsregeln</h3>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Keine illegalen oder unangemessenen Inhalte hochladen</li>
                <li>Die App nicht missbrauchen oder hacken</li>
                <li>Keine falschen Informationen angeben</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">6. Haftungsausschluss</h3>
              <p className="text-white/80">FitBlaqs wird "wie besehen" bereitgestellt. Konsultieren Sie vor Beginn eines Trainingsprogramms einen Arzt.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">7. Kündigung</h3>
              <p className="text-white/80">Sie können Ihr Konto jederzeit in den Einstellungen löschen. Abonnements nach 6 Monaten per E-Mail kündbar: Supportservice@Fitblaq.com</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">8. Kontakt</h3>
              <p className="text-white/80">Supportservice@Fitblaq.com</p>
            </>
          ) : (
            <>
              <h2 className="text-white text-2xl font-bold mb-4">Terms of Service for FitBlaqs</h2>
              <p className="text-white/80 mb-4"><strong>Last updated:</strong> December 2024</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">1. Scope</h3>
              <p className="text-white/80">These Terms of Service apply to the use of the FitBlaqs app and all related services.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">2. User Account</h3>
              <p className="text-white/80">A user account is required to use the app. You are responsible for maintaining the confidentiality of your credentials.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">3. Pro Subscriptions</h3>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li><strong>Pro Athlete:</strong> €19.99 for 12 months – AI training plans, body analysis</li>
                <li><strong>Pro Nutrition:</strong> €14.99 for 12 months – AI food analysis, food tracker</li>
              </ul>
              <p className="text-white/80 mt-2">Subscriptions can be cancelled after 6 months by email.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">4. AI Features</h3>
              <p className="text-white/80">AI-powered analysis is for informational purposes only and does not replace professional advice.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">5. Usage Rules</h3>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Not upload illegal or inappropriate content</li>
                <li>Not misuse or hack the app</li>
                <li>Not provide false information</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">6. Disclaimer</h3>
              <p className="text-white/80">FitBlaqs is provided "as is." Consult a physician before starting any training program.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">7. Termination</h3>
              <p className="text-white/80">You may delete your account at any time in Settings. Subscriptions cancellable after 6 months via: Supportservice@Fitblaq.com</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">8. Contact</h3>
              <p className="text-white/80">Supportservice@Fitblaq.com</p>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TermsOfService;
