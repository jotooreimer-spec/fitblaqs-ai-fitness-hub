import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import settingsBg from "@/assets/settings-bg.jpg";

const PrivacyPolicy = () => {
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
          <h1 className="text-3xl font-bold text-white">{isGerman ? "Datenschutzerklärung" : "Privacy Policy"}</h1>
        </div>

        <Card className="bg-black/40 backdrop-blur-md border-white/10 p-8 prose prose-invert max-w-none">
          {isGerman ? (
            <>
              <h2 className="text-white text-2xl font-bold mb-4">Datenschutzerklärung für FitBlaqs</h2>
              <p className="text-white/80 mb-4"><strong>Zuletzt aktualisiert:</strong> Dezember 2024</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">1. Verantwortlicher</h3>
              <p className="text-white/80">FitBlaq Company<br/>E-Mail: Supportservice@Fitblaq.com</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">2. Erhobene Daten</h3>
              <p className="text-white/80 mb-2">Wir erheben folgende personenbezogene Daten:</p>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li><strong>Kontodaten:</strong> Name, E-Mail-Adresse, Passwort (verschlüsselt)</li>
                <li><strong>Körperdaten:</strong> Größe, Gewicht, Körpertyp, Athletenlevel</li>
                <li><strong>Trainingsdaten:</strong> Workout-Logs, Jogging-Aktivitäten, Trainingszeiten</li>
                <li><strong>Ernährungsdaten:</strong> Mahlzeiten, Kalorien, Makronährstoffe</li>
                <li><strong>Hochgeladene Bilder:</strong> Profilbilder, Körper- und Essensfotos für KI-Analyse</li>
                <li><strong>Gerätestandort:</strong> GPS-Daten für Jogging-Tracking (nur bei aktiver Nutzung)</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">3. KI-gestützte Analyse</h3>
              <p className="text-white/80">Unsere App nutzt KI-Technologie zur Analyse von hochgeladenen Bildern:</p>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li><strong>Body Analyse:</strong> Schätzung von Körperfettanteil, Muskelmasse, Haltung</li>
                <li><strong>Essens-Analyse:</strong> Erkennung von Lebensmitteln und Berechnung von Nährwerten</li>
              </ul>
              <p className="text-white/80 mt-2">Die Bilder werden über sichere Server verarbeitet und nicht dauerhaft gespeichert.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">4. Datenverarbeitung & Speicherung</h3>
              <p className="text-white/80">Ihre Daten werden sicher auf Servern gespeichert. Wir verwenden Ende-zu-Ende-Verschlüsselung für sensible Daten. Pro-Athlete-Daten werden nach 5 Tagen automatisch gelöscht.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">5. Cookies & Lokale Speicherung</h3>
              <p className="text-white/80">Wir verwenden lokale Speicherung für Authentifizierungs-Token und Benutzereinstellungen.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">6. Drittanbieter-Dienste</h3>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li><strong>Stripe:</strong> Zahlungsabwicklung für Pro-Abonnements</li>
                <li><strong>KI-Gateway:</strong> Bildanalyse und Trainingspläne</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">7. Ihre Rechte</h3>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Auskunft über Ihre gespeicherten Daten</li>
                <li>Berichtigung unrichtiger Daten</li>
                <li>Löschung Ihrer Daten</li>
                <li>Datenübertragbarkeit</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">8. Kontakt</h3>
              <p className="text-white/80">Bei Fragen: Supportservice@Fitblaq.com</p>
            </>
          ) : (
            <>
              <h2 className="text-white text-2xl font-bold mb-4">Privacy Policy for FitBlaqs</h2>
              <p className="text-white/80 mb-4"><strong>Last updated:</strong> December 2024</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">1. Data Controller</h3>
              <p className="text-white/80">FitBlaq Company<br/>Email: Supportservice@Fitblaq.com</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">2. Data We Collect</h3>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li><strong>Account Data:</strong> Name, email address, password (encrypted)</li>
                <li><strong>Body Data:</strong> Height, weight, body type, athlete level</li>
                <li><strong>Training Data:</strong> Workout logs, jogging activities, training times</li>
                <li><strong>Nutrition Data:</strong> Meals, calories, macronutrients</li>
                <li><strong>Uploaded Images:</strong> Profile pictures, body and food photos for AI analysis</li>
                <li><strong>Device Location:</strong> GPS data for jogging tracking (only during active use)</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">3. AI-Powered Analysis</h3>
              <p className="text-white/80">Our app uses AI technology to analyze uploaded images:</p>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li><strong>Body Analysis:</strong> Estimation of body fat percentage, muscle mass, posture</li>
                <li><strong>Food Analysis:</strong> Food recognition and nutritional value calculation</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">4. Data Processing & Storage</h3>
              <p className="text-white/80">Your data is stored securely. We use end-to-end encryption for sensitive data. Pro Athlete data is automatically deleted after 5 days.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">5. Cookies & Local Storage</h3>
              <p className="text-white/80">We use local storage for authentication tokens and user preferences.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">6. Third-Party Services</h3>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li><strong>Stripe:</strong> Payment processing for Pro subscriptions</li>
                <li><strong>AI Gateway:</strong> Image analysis and training plans</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">7. Your Rights</h3>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Access your stored data</li>
                <li>Correct inaccurate data</li>
                <li>Delete your data</li>
                <li>Data portability</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">8. Contact</h3>
              <p className="text-white/80">For privacy inquiries: Supportservice@Fitblaq.com</p>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
