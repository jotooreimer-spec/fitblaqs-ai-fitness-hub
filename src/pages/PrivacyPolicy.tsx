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
          <h1 className="text-3xl font-bold text-white">
            {isGerman ? "Datenschutzerklärung" : "Privacy Policy"}
          </h1>
        </div>

        <Card className="bg-black/40 backdrop-blur-md border-white/10 p-8 prose prose-invert max-w-none">
          {isGerman ? (
            <>
              <h2 className="text-white text-2xl font-bold mb-4">Datenschutzerklärung – FitBlaq</h2>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">1. Verantwortlicher</h3>
              <p className="text-white/80">FitBlaq Company<br/>E-Mail: Supportservice@Fitblaq.com</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">2. Erhebung und Verarbeitung personenbezogener Daten</h3>
              <p className="text-white/80 mb-2">Wir erheben und verarbeiten folgende personenbezogene Daten:</p>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Kontoinformationen (Name, E-Mail-Adresse, Passwort)</li>
                <li>Profilinformationen (Größe, Gewicht, Körpertyp, Sportlevel)</li>
                <li>Trainingsdaten (Übungen, Sätze, Wiederholungen, Gewichte)</li>
                <li>Ernährungsdaten (Mahlzeiten, Kalorien, Makronährstoffe)</li>
                <li>Jogging-Daten (Distanz, Dauer, verbrannte Kalorien)</li>
                <li>Gewichtshistorie</li>
                <li>Hochgeladene Bilder und Videos</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">3. Zweck der Datenverarbeitung</h3>
              <p className="text-white/80">Ihre Daten werden ausschließlich verwendet, um die Fitness-App-Dienste bereitzustellen, darunter:</p>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Personalisierte Trainingspläne</li>
                <li>Ernährungsanalyse und Empfehlungen</li>
                <li>Fortschrittsverfolgung</li>
                <li>KI-gestützte Körperanalyse</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">4. Datensicherheit</h3>
              <p className="text-white/80">Alle Daten werden mittels modernster Verschlüsselungstechnologien (TLS/SSL) übertragen und sicher in verschlüsselten Datenbanken gespeichert. Der Zugriff ist streng auf autorisiertes Personal beschränkt.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">5. Ihre Rechte</h3>
              <p className="text-white/80 mb-2">Sie haben folgende Rechte:</p>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li><strong>Auskunftsrecht:</strong> Sie können Informationen über Ihre gespeicherten Daten anfordern</li>
                <li><strong>Recht auf Berichtigung:</strong> Falsche Daten können korrigiert werden</li>
                <li><strong>Recht auf Löschung:</strong> Sie können die Löschung Ihrer Daten verlangen</li>
                <li><strong>Recht auf Datenübertragbarkeit:</strong> Sie können Ihre Daten in einem gängigen Format erhalten</li>
                <li><strong>Widerspruchsrecht:</strong> Sie können der Verarbeitung widersprechen</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">6. Speicherdauer</h3>
              <p className="text-white/80">Ihre Daten werden so lange gespeichert, wie Sie ein aktives Konto haben. Nach der Kontolöschung werden alle personenbezogenen Daten innerhalb von 30 Tagen gelöscht. Pro Athlete-Daten werden automatisch nach 5 Tagen gelöscht und regeneriert.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">7. Cookies und Tracking</h3>
              <p className="text-white/80">Wir verwenden nur technisch notwendige Cookies für die Authentifizierung und Sitzungsverwaltung. Es werden keine Tracking- oder Werbe-Cookies eingesetzt.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">8. Kontakt</h3>
              <p className="text-white/80">Bei Fragen zum Datenschutz kontaktieren Sie uns bitte:<br/>FitBlaq Company<br/>E-Mail: Supportservice@Fitblaq.com</p>
            </>
          ) : (
            <>
              <h2 className="text-white text-2xl font-bold mb-4">Privacy Policy – FitBlaq</h2>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">1. Data Controller</h3>
              <p className="text-white/80">FitBlaq Company<br/>Email: Supportservice@Fitblaq.com</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">2. Collection and Processing of Personal Data</h3>
              <p className="text-white/80 mb-2">We collect and process the following personal data:</p>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Account information (name, email address, password)</li>
                <li>Profile information (height, weight, body type, athletic level)</li>
                <li>Training data (exercises, sets, repetitions, weights)</li>
                <li>Nutrition data (meals, calories, macronutrients)</li>
                <li>Jogging data (distance, duration, calories burned)</li>
                <li>Weight history</li>
                <li>Uploaded images and videos</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">3. Purpose of Data Processing</h3>
              <p className="text-white/80">Your data is used exclusively to provide fitness app services, including:</p>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Personalized training plans</li>
                <li>Nutrition analysis and recommendations</li>
                <li>Progress tracking</li>
                <li>AI-powered body analysis</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">4. Data Security</h3>
              <p className="text-white/80">All data is transmitted using state-of-the-art encryption technologies (TLS/SSL) and stored securely in encrypted databases. Access is strictly limited to authorized personnel.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">5. Your Rights</h3>
              <p className="text-white/80 mb-2">You have the following rights:</p>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li><strong>Right to access:</strong> You can request information about your stored data</li>
                <li><strong>Right to rectification:</strong> Incorrect data can be corrected</li>
                <li><strong>Right to erasure:</strong> You can request deletion of your data</li>
                <li><strong>Right to data portability:</strong> You can receive your data in a common format</li>
                <li><strong>Right to object:</strong> You can object to processing</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">6. Data Retention</h3>
              <p className="text-white/80">Your data is stored as long as you have an active account. After account deletion, all personal data will be deleted within 30 days. Pro Athlete data is automatically deleted and regenerated after 5 days.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">7. Cookies and Tracking</h3>
              <p className="text-white/80">We only use technically necessary cookies for authentication and session management. No tracking or advertising cookies are used.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">8. Contact</h3>
              <p className="text-white/80">For privacy inquiries, please contact us:<br/>FitBlaq Company<br/>Email: Supportservice@Fitblaq.com</p>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy;