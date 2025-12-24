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
              <h2 className="text-white text-2xl font-bold mb-4">Datenschutzerklärung – FitBlaqs Power & Healthy</h2>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">1. Verantwortlicher</h3>
              <p className="text-white/80">
                FitBlaqs Power & Healthy ist ein junges Fitness-Unternehmen, das digitale Fitness-, Ernährungs- und Kalorienlösungen sowie Healthy-Health-Funktionen anbietet.
              </p>
              <p className="text-white/80 mt-2">
                Unter der Leitung von CEO John Daniel Otoo bietet FitBlaqs Power & Healthy eine sichere, nutzerfreundliche Fitness-App mit Analysen, Statistiken und gesundheitsbezogenen Funktionen.
              </p>
              <p className="text-white/80 mt-2">
                Kontakt: supportservice@fitblaqs.com
              </p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">2. Altersbeschränkung</h3>
              <p className="text-white/80">
                Die App ist für Nutzer ab 12 Jahren bestimmt. Nutzer unter 12 Jahren dürfen die App nur mit Zustimmung der Eltern oder eines Erziehungsberechtigten nutzen.
              </p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">3. Verhaltensregeln</h3>
              <p className="text-white/80">
                Rassistische, diskriminierende, hasserfüllte oder beleidigende Inhalte sind strikt untersagt.
              </p>
              <p className="text-white/80 mt-2">
                Verstöße können zur sofortigen Sperrung oder Löschung des Kontos führen. Inhalte können ohne Vorankündigung entfernt werden, um ein sicheres Umfeld zu gewährleisten.
              </p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">4. Erhobene Daten</h3>
              <h4 className="text-white text-lg font-medium mt-4 mb-2">Von Ihnen bereitgestellte Daten:</h4>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Kontoinformationen (Name, E-Mail, Passwort)</li>
                <li>Profilinformationen: Größe, Gewicht, Körpertyp, Fitnesslevel</li>
                <li>Trainingsdaten: Übungen, Sätze, Wiederholungen, Gewichte</li>
                <li>Ernährungsdaten: Mahlzeiten, Kalorien, Makronährstoffe</li>
                <li>Jogging-Daten: Distanz, Dauer, verbrannte Kalorien</li>
                <li>Gewichtsverlauf</li>
                <li>Hochgeladene Bilder/Videos</li>
              </ul>

              <h4 className="text-white text-lg font-medium mt-4 mb-2">Automatisch erhobene Daten:</h4>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Geräteinformationen (Betriebssystem, Modell)</li>
                <li>IP-Adresse und Nutzungszeitstempel</li>
                <li>App-Nutzungsdaten (z. B. Anzahl der Sitzungen, Dauer)</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">5. Zweck der Datenverarbeitung</h3>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Trainingsplanung & -tracking</li>
                <li>Ernährungsübersicht</li>
                <li>Fortschrittsanzeige (Gewicht, Trainingserfolge)</li>
                <li>Sicherung & Wiederherstellung des Kontos</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">6. Rechtsgrundlage (DSGVO)</h3>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Art. 6 Abs. 1 lit. b: Vertragserfüllung (Nutzung der App)</li>
                <li>Art. 6 Abs. 1 lit. c: Rechtliche Verpflichtungen</li>
                <li>Art. 6 Abs. 1 lit. f: Berechtigtes Interesse (z. B. Datensicherheit)</li>
              </ul>
              <p className="text-white/80 mt-2">
                Daten werden nur innerhalb der EU oder in Ländern mit angemessenem Datenschutz verarbeitet.
              </p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">7. Datensicherheit</h3>
              <p className="text-white/80">
                TLS/SSL-Verschlüsselung bei der Übertragung und sichere Serverspeicherung. Zugriff nur durch autorisiertes Personal.
              </p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">8. Nutzerrechte</h3>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Auskunftsrecht</li>
                <li>Recht auf Berichtigung</li>
                <li>Recht auf Löschung</li>
                <li>Recht auf Einschränkung der Verarbeitung</li>
                <li>Recht auf Datenübertragbarkeit</li>
                <li>Widerspruchsrecht</li>
                <li>Beschwerderecht bei einer Aufsichtsbehörde</li>
              </ul>
              <p className="text-white/80 mt-4">
                Kontakt: supportservice@fitblaqs.com
              </p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">9. Speicherdauer</h3>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Kontodaten: bis zur Kontolöschung</li>
                <li>Nach Löschung: Daten werden innerhalb von 30 Tagen entfernt</li>
                <li>Premium/Pro-Daten: bis zu 6 Monate</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">10. Änderungen der Richtlinie</h3>
              <p className="text-white/80">
                Änderungen werden in der App angezeigt oder per E-Mail mitgeteilt.
              </p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">11. Cookies & Lokaler Speicher</h3>
              <p className="text-white/80">
                Nur essentieller lokaler Speicher (z. B. Sitzungsdaten, Backups). Keine Tracking- oder Marketing-Cookies.
              </p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">12. Dritte Parteien</h3>
              <p className="text-white/80">
                Aktuell keine externen Anbieter für Werbung, Affiliate-Programme oder Newsletter. Zukünftige Änderungen werden transparent kommuniziert.
              </p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">13. Definitionen</h3>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li><strong>Personenbezogene Daten:</strong> Identifizierbare Informationen über eine Person</li>
                <li><strong>Verarbeitung:</strong> Erhebung, Speicherung, Nutzung oder Löschung von Daten</li>
                <li><strong>Profiling:</strong> Automatisierte Auswertung (z. B. Tracking des Trainingsfortschritts)</li>
                <li><strong>IP-Maskierung:</strong> Teilweise Pseudonymisierung der IP aus Sicherheitsgründen</li>
              </ul>
            </>
          ) : (
            <>
              <h2 className="text-white text-2xl font-bold mb-4">Privacy Policy – FitBlaqs Power & Healthy</h2>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">1. Data Controller</h3>
              <p className="text-white/80">
                FitBlaqs Power & Healthy is a young fitness company offering digital fitness, nutrition, and calorie solutions as well as Healthy-Health features.
              </p>
              <p className="text-white/80 mt-2">
                Under the leadership of CEO John Daniel Otoo, FitBlaqs Power & Healthy provides a secure, user-friendly fitness app with analytics, statistics, and health-related functions.
              </p>
              <p className="text-white/80 mt-2">
                Contact: supportservice@fitblaqs.com
              </p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">2. Age Restriction</h3>
              <p className="text-white/80">
                The app is intended for users aged 12 and above. Users under 12 years may not use the app without parental or guardian consent.
              </p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">3. Code of Conduct</h3>
              <p className="text-white/80">
                Racist, discriminatory, hateful, or offensive content is strictly prohibited.
              </p>
              <p className="text-white/80 mt-2">
                Violations may result in immediate account suspension or deletion. Content may be removed without prior notice to ensure a safe environment.
              </p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">4. Collected Data</h3>
              <h4 className="text-white text-lg font-medium mt-4 mb-2">Data you provide:</h4>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Account information (name, email, password)</li>
                <li>Profile info: height, weight, body type, fitness level</li>
                <li>Training data: exercises, sets, repetitions, weights</li>
                <li>Nutrition data: meals, calories, macronutrients</li>
                <li>Jogging data: distance, duration, calories burned</li>
                <li>Weight history</li>
                <li>Uploaded images/videos</li>
              </ul>

              <h4 className="text-white text-lg font-medium mt-4 mb-2">Automatically collected data:</h4>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Device information (OS, model)</li>
                <li>IP address and usage timestamps</li>
                <li>App usage data (e.g., number of sessions, duration)</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">5. Purpose of Data Processing</h3>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Training planning & tracking</li>
                <li>Nutrition overview</li>
                <li>Progress display (weight, training achievements)</li>
                <li>Backup & recovery of account</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">6. Legal Basis (GDPR)</h3>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Art. 6(1)(b): Contract fulfillment (use of app)</li>
                <li>Art. 6(1)(c): Legal obligations</li>
                <li>Art. 6(1)(f): Legitimate interest (e.g., data security)</li>
              </ul>
              <p className="text-white/80 mt-2">
                Data is processed only within the EU or in countries with adequate data protection.
              </p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">7. Data Security</h3>
              <p className="text-white/80">
                TLS/SSL encryption during transmission and secure server storage. Access only by authorized personnel.
              </p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">8. User Rights</h3>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Right of access</li>
                <li>Right to rectification</li>
                <li>Right to erasure</li>
                <li>Right to restrict processing</li>
                <li>Right to data portability</li>
                <li>Right to object</li>
                <li>Right to complain to a supervisory authority</li>
              </ul>
              <p className="text-white/80 mt-4">
                Contact: supportservice@fitblaqs.com
              </p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">9. Storage Duration</h3>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Account data: until account deletion</li>
                <li>After deletion: data removed within 30 days</li>
                <li>Premium/Pro data: up to 6 months</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">10. Policy Changes</h3>
              <p className="text-white/80">
                Changes will be displayed in the app or communicated via email.
              </p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">11. Cookies & Local Storage</h3>
              <p className="text-white/80">
                Only essential local storage (e.g., session data, backups). No tracking or marketing cookies.
              </p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">12. Third Parties</h3>
              <p className="text-white/80">
                No external providers for ads, affiliate programs, or newsletters currently. Future changes will be communicated transparently.
              </p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">13. Definitions</h3>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li><strong>Personal data:</strong> Identifiable information about a person</li>
                <li><strong>Processing:</strong> Collection, storage, use, or deletion of data</li>
                <li><strong>Profiling:</strong> Automated evaluation (e.g., tracking training progress)</li>
                <li><strong>IP-Masking:</strong> Partial pseudonymization of IP for security</li>
              </ul>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
