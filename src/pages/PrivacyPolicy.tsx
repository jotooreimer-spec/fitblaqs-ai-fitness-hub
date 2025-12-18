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
              <p className="text-white/80">
                FitBlaq Company<br/>
                CEO: John Otoo<br/>
                E-Mail: Supportservice@fitblaqs.com
              </p>
              <p className="text-white/80 mt-2">
                FitBlaq ist ein Unternehmen, das sich auf digitale Fitnesslösungen spezialisiert hat. Unter der Leitung von John Otoo verfolgt FitBlaq das Ziel, effiziente, sichere und benutzerfreundliche Fitness-Apps bereitzustellen.
              </p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">2. Verhaltensregeln</h3>
              <p className="text-white/80">
                In der FitBlaq App sind rassistische, diskriminierende, hasserfüllte oder beleidigende Inhalte strikt untersagt.
              </p>
              <p className="text-white/80 mt-2">
                Verstöße können zum sofortigen Block oder zur Löschung des Accounts führen.
              </p>
              <p className="text-white/80 mt-2">
                Wir behalten uns das Recht vor, Inhalte ohne Vorwarnung zu entfernen, um ein sicheres und respektvolles Umfeld für alle Nutzer zu gewährleisten.
              </p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">3. Erhebung und Verarbeitung personenbezogener Daten</h3>
              <p className="text-white/80 mb-2">Wir erheben und verarbeiten folgende personenbezogene Daten, um die Funktionen der App bereitzustellen:</p>
              
              <h4 className="text-white text-lg font-medium mt-4 mb-2">Von Ihnen bereitgestellte Daten:</h4>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Kontoinformationen (Name, E-Mail-Adresse, Passwort)</li>
                <li>Profilinformationen (Größe, Gewicht, Körpertyp, Sportlevel)</li>
                <li>Trainingsdaten (Übungen, Sätze, Wiederholungen, Gewichte)</li>
                <li>Ernährungsdaten (Mahlzeiten, Kalorien, Makronährstoffe)</li>
                <li>Jogging-Daten (Distanz, Dauer, verbrannte Kalorien)</li>
                <li>Gewichtshistorie</li>
                <li>Hochgeladene Bilder und Videos</li>
              </ul>

              <h4 className="text-white text-lg font-medium mt-4 mb-2">Automatisch erhobene Daten:</h4>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Geräteinformationen (Betriebssystem, Modell)</li>
                <li>IP-Adresse und Zeitpunkt der Nutzung</li>
                <li>App-Nutzungsdaten (z. B. Anzahl Trainingseinheiten, Dauer der Nutzung)</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">4. Zweck der Datenverarbeitung</h3>
              <p className="text-white/80 mb-2">Ihre Daten werden ausschließlich verwendet, um Ihnen die Funktionen der Fitness-App bereitzustellen, z. B.:</p>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Trainingsplanung und -tracking</li>
                <li>Ernährungsübersicht</li>
                <li>Fortschrittsdarstellung (z. B. Gewicht, Trainingserfolge)</li>
                <li>Sicherung und Wiederherstellung Ihres Kontos</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">5. Rechtsgrundlage & DSGVO</h3>
              <p className="text-white/80 mb-2">Die Verarbeitung Ihrer Daten erfolgt gemäß der EU-Datenschutz-Grundverordnung (DSGVO):</p>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Art. 6 Abs. 1 lit. b DSGVO: Verarbeitung zur Erfüllung des Vertrages (Nutzung der App)</li>
                <li>Art. 6 Abs. 1 lit. c DSGVO: Verarbeitung zur Erfüllung gesetzlicher Verpflichtungen</li>
                <li>Art. 6 Abs. 1 lit. f DSGVO: Berechtigtes Interesse (z. B. Datensicherheit)</li>
              </ul>
              <p className="text-white/80 mt-2">
                Ihre personenbezogenen Daten werden nur innerhalb der EU oder in Ländern mit angemessenem Datenschutzniveau verarbeitet.
              </p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">6. Datensicherheit</h3>
              <p className="text-white/80">
                Wir sichern Ihre Daten durch TLS/SSL-Verschlüsselung bei der Übertragung und durch sichere Speicherung auf unseren Servern. Nur autorisierte Personen haben Zugriff auf Ihre Daten.
              </p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">7. Rechte der Nutzer (DSGVO-konform)</h3>
              <p className="text-white/80 mb-2">Sie haben folgende Rechte gemäß DSGVO:</p>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li><strong>Auskunftsrecht:</strong> Sie können jederzeit erfahren, welche Daten wir über Sie speichern.</li>
                <li><strong>Recht auf Berichtigung:</strong> Ungenaue Daten können korrigiert werden.</li>
                <li><strong>Recht auf Löschung („Recht auf Vergessenwerden"):</strong> Ihre personenbezogenen Daten können gelöscht werden.</li>
                <li><strong>Recht auf Einschränkung der Verarbeitung:</strong> Sie können die Verarbeitung einzelner Daten einschränken.</li>
                <li><strong>Recht auf Datenübertragbarkeit:</strong> Sie können Ihre Daten in einem gängigen Format erhalten.</li>
                <li><strong>Widerspruchsrecht:</strong> Sie können der Verarbeitung widersprechen.</li>
                <li><strong>Beschwerderecht:</strong> Sie können sich bei einer Datenschutzaufsichtsbehörde beschweren.</li>
              </ul>
              <p className="text-white/80 mt-4">
                Zur Ausübung Ihrer Rechte, bei Fragen zu Fitness, Trainingsplan, Übungen oder zur Account-Löschung kontaktieren Sie uns:<br/>
                E-Mail: Supportservice@fitblaqs.com
              </p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">8. Speicherdauer</h3>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Ihre Daten werden so lange gespeichert, wie Sie ein Konto bei uns haben.</li>
                <li>Nach Kontolöschung werden Ihre Daten innerhalb von 30 Tagen gelöscht.</li>
                <li>Trainings- oder Ernährungsdaten einzelner Nutzer (Pro Athlete-Daten) werden nach 5 Tagen gelöscht, sofern sie nicht Teil Ihres Profils sind.</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">9. Änderungen der Datenschutzerklärung</h3>
              <p className="text-white/80">
                Wir behalten uns das Recht vor, diese Datenschutzerklärung bei Bedarf anzupassen. Änderungen werden in der App angezeigt oder per E-Mail bekannt gegeben.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-white text-2xl font-bold mb-4">Privacy Policy – FitBlaq</h2>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">1. Data Controller</h3>
              <p className="text-white/80">
                FitBlaq Company<br/>
                CEO: John Otoo<br/>
                Email: Supportservice@fitblaqs.com
              </p>
              <p className="text-white/80 mt-2">
                FitBlaq is a company specializing in digital fitness solutions. Under the leadership of John Otoo, FitBlaq aims to provide efficient, secure, and user-friendly fitness apps.
              </p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">2. Code of Conduct</h3>
              <p className="text-white/80">
                Racist, discriminatory, hateful, or offensive content is strictly prohibited in the FitBlaq App.
              </p>
              <p className="text-white/80 mt-2">
                Violations may result in immediate blocking or deletion of the account.
              </p>
              <p className="text-white/80 mt-2">
                We reserve the right to remove content without warning to ensure a safe and respectful environment for all users.
              </p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">3. Collection and Processing of Personal Data</h3>
              <p className="text-white/80 mb-2">We collect and process the following personal data to provide the app's functions:</p>
              
              <h4 className="text-white text-lg font-medium mt-4 mb-2">Data provided by you:</h4>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Account information (name, email address, password)</li>
                <li>Profile information (height, weight, body type, athletic level)</li>
                <li>Training data (exercises, sets, repetitions, weights)</li>
                <li>Nutrition data (meals, calories, macronutrients)</li>
                <li>Jogging data (distance, duration, calories burned)</li>
                <li>Weight history</li>
                <li>Uploaded images and videos</li>
              </ul>

              <h4 className="text-white text-lg font-medium mt-4 mb-2">Automatically collected data:</h4>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Device information (operating system, model)</li>
                <li>IP address and time of use</li>
                <li>App usage data (e.g., number of training sessions, duration of use)</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">4. Purpose of Data Processing</h3>
              <p className="text-white/80 mb-2">Your data is used exclusively to provide the fitness app functions, such as:</p>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Training planning and tracking</li>
                <li>Nutrition overview</li>
                <li>Progress display (e.g., weight, training achievements)</li>
                <li>Backup and recovery of your account</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">5. Legal Basis & GDPR</h3>
              <p className="text-white/80 mb-2">The processing of your data is carried out in accordance with the EU General Data Protection Regulation (GDPR):</p>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Art. 6(1)(b) GDPR: Processing to fulfill the contract (use of the app)</li>
                <li>Art. 6(1)(c) GDPR: Processing to fulfill legal obligations</li>
                <li>Art. 6(1)(f) GDPR: Legitimate interest (e.g., data security)</li>
              </ul>
              <p className="text-white/80 mt-2">
                Your personal data is only processed within the EU or in countries with an adequate level of data protection.
              </p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">6. Data Security</h3>
              <p className="text-white/80">
                We secure your data through TLS/SSL encryption during transmission and through secure storage on our servers. Only authorized persons have access to your data.
              </p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">7. User Rights (GDPR-compliant)</h3>
              <p className="text-white/80 mb-2">You have the following rights under GDPR:</p>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li><strong>Right of access:</strong> You can find out at any time what data we store about you.</li>
                <li><strong>Right to rectification:</strong> Inaccurate data can be corrected.</li>
                <li><strong>Right to erasure ("Right to be forgotten"):</strong> Your personal data can be deleted.</li>
                <li><strong>Right to restriction of processing:</strong> You can restrict the processing of certain data.</li>
                <li><strong>Right to data portability:</strong> You can receive your data in a common format.</li>
                <li><strong>Right to object:</strong> You can object to the processing.</li>
                <li><strong>Right to complain:</strong> You can complain to a data protection supervisory authority.</li>
              </ul>
              <p className="text-white/80 mt-4">
                To exercise your rights, for questions about fitness, training plans, exercises, or account deletion, contact us:<br/>
                Email: Supportservice@fitblaqs.com
              </p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">8. Storage Duration</h3>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Your data is stored as long as you have an account with us.</li>
                <li>After account deletion, your data will be deleted within 30 days.</li>
                <li>Training or nutrition data of individual users (Pro Athlete data) will be deleted after 5 days if they are not part of your profile.</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">9. Changes to this Privacy Policy</h3>
              <p className="text-white/80">
                We reserve the right to adjust this privacy policy as needed. Changes will be displayed in the app or announced by email.
              </p>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy;