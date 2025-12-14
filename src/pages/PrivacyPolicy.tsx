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
              <p className="text-white/80 mb-4"><strong>Zuletzt aktualisiert:</strong> Dezember 2024</p>
              <p className="text-white/80 mb-4">FitBlaq („wir", „uns" oder „unser") betreibt die FitBlaq Mobile-Anwendung (der „Dienst"). Diese Datenschutzerklärung informiert Sie über unsere Richtlinien bezüglich der Erhebung, Nutzung und Offenlegung personenbezogener Daten bei der Nutzung unseres Dienstes.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">1. Verantwortlicher</h3>
              <p className="text-white/80">FitBlaq Company<br/>E-Mail: Supportservice@Fitblaq.com</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">2. Erhobene Daten</h3>
              <p className="text-white/80 mb-2">Wir erheben die folgenden Datenkategorien:</p>
              
              <h4 className="text-white text-lg font-medium mt-4 mb-2">2.1 Kontoinformationen</h4>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Name und E-Mail-Adresse (zur Kontoerstellung und Kommunikation)</li>
                <li>Passwort (verschlüsselt gespeichert zur Authentifizierung)</li>
              </ul>

              <h4 className="text-white text-lg font-medium mt-4 mb-2">2.2 Gesundheits- und Fitnessdaten</h4>
              <p className="text-white/80 mb-2"><strong>Wichtig:</strong> Wir erheben sensible gesundheitsbezogene Daten, die einer besonderen Behandlung unterliegen:</p>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li><strong>Körperdaten:</strong> Größe, Gewicht, Körpertyp, Sportlevel</li>
                <li><strong>Trainingsdaten:</strong> Übungen, Sätze, Wiederholungen, Gewichte, Trainingsdauer</li>
                <li><strong>Ernährungsdaten:</strong> Mahlzeiten, Kalorien, Makronährstoffe (Protein, Kohlenhydrate, Fette), Wasseraufnahme</li>
                <li><strong>Jogging-Daten:</strong> Distanz, Dauer, Tempo, verbrannte Kalorien</li>
                <li><strong>Gewichtsverlauf:</strong> Historische Gewichtsmessungen und Ziele</li>
              </ul>

              <h4 className="text-white text-lg font-medium mt-4 mb-2">2.3 Vom Nutzer hochgeladene Inhalte</h4>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li><strong>Profilbilder:</strong> Freiwillig hochgeladene Avatar-Bilder</li>
                <li><strong>Analysebilder:</strong> Körper- und Essensbilder für KI-Analyse (nur Pro-Nutzer)</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">3. Zweck der Datenerhebung</h3>
              <p className="text-white/80 mb-2">Wir nutzen Ihre Daten ausschließlich für:</p>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Bereitstellung personalisierter Fitness- und Ernährungsverfolgung</li>
                <li>Erstellung individueller Trainingspläne und Empfehlungen</li>
                <li>Berechnung von Kalorien, Makronährstoffen und Fitnessmetriken</li>
                <li>KI-gestützte Körper- und Essensanalyse (nur Pro-Abonnement)</li>
                <li>Anzeige von Fortschrittsdiagrammen und Leistungsanalysen</li>
                <li>Kontoverwaltung und technischer Support</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">4. Datenweitergabe</h3>
              <p className="text-white/80 mb-2"><strong>Wir verkaufen, handeln oder übertragen Ihre personenbezogenen Daten NICHT an Dritte.</strong></p>
              <p className="text-white/80 mb-2">Ihre Daten können nur geteilt werden mit:</p>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li><strong>Dienstleistern:</strong> Sichere Cloud-Infrastruktur (Supabase) zur Datenspeicherung</li>
                <li><strong>KI-Verarbeitung:</strong> Anonymisierte Bildverarbeitung für Körper-/Essensanalyse</li>
                <li><strong>Gesetzliche Anforderungen:</strong> Wenn gesetzlich vorgeschrieben</li>
              </ul>
              <p className="text-white/80 mt-2">Wir verwenden KEINE Daten für Werbezwecke und teilen keine Daten mit Werbetreibenden.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">5. Datensicherheit</h3>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Alle Daten werden mit TLS/SSL-Verschlüsselung übertragen</li>
                <li>Passwörter werden mit branchenüblichen Algorithmen gehasht</li>
                <li>Datenbank-Zugriff ist durch Row-Level-Security geschützt</li>
                <li>Bilder werden sicher in verschlüsseltem Cloud-Speicher gespeichert</li>
                <li>Regelmäßige Sicherheitsaudits und Updates</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">6. Speicherdauer</h3>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li><strong>Aktive Konten:</strong> Daten werden aufbewahrt, solange Ihr Konto aktiv ist</li>
                <li><strong>Nach Kontolöschung:</strong> Alle personenbezogenen Daten werden innerhalb von 30 Tagen dauerhaft gelöscht</li>
                <li><strong>Pro-Analysedaten:</strong> KI-Analyseergebnisse werden nach 5 Tagen automatisch gelöscht und regeneriert</li>
                <li><strong>Backups:</strong> Verschlüsselte Backups werden nach 90 Tagen gelöscht</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">7. Ihre Rechte (DSGVO)</h3>
              <p className="text-white/80 mb-2">Sie haben folgende Rechte bezüglich Ihrer Daten:</p>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li><strong>Zugriff:</strong> Kopie Ihrer Daten anfordern</li>
                <li><strong>Berichtigung:</strong> Falsche oder unvollständige Daten korrigieren</li>
                <li><strong>Löschung:</strong> Löschung Ihres Kontos und aller Daten beantragen</li>
                <li><strong>Datenübertragbarkeit:</strong> Ihre Daten in einem maschinenlesbaren Format erhalten</li>
                <li><strong>Widerspruch:</strong> Der Datenverarbeitung widersprechen</li>
                <li><strong>Einschränkung:</strong> Bestimmte Verarbeitungen einschränken</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">8. Kontolöschung</h3>
              <p className="text-white/80 mb-2">Sie können Ihr Konto und alle zugehörigen Daten auf zwei Wegen löschen:</p>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li><strong>In-App:</strong> Gehen Sie zu Einstellungen → Profil bearbeiten → Konto löschen</li>
                <li><strong>E-Mail:</strong> Senden Sie eine Löschanfrage an Supportservice@Fitblaq.com</li>
              </ul>
              <p className="text-white/80 mt-2">Nach der Löschung werden alle Ihre personenbezogenen Daten, einschließlich Gesundheits- und Fitnessdaten, dauerhaft innerhalb von 30 Tagen aus unseren Systemen entfernt.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">9. Kinderdatenschutz & Altersfreigabe</h3>
              <p className="text-white/80"><strong>Altersfreigabe: 12+</strong></p>
              <p className="text-white/80 mt-2">Diese App ist für Nutzer ab 12 Jahren geeignet. Wir erheben wissentlich keine personenbezogenen Daten von Kindern unter 12 Jahren. Eltern sollten die Nutzung ihrer Kinder im Alter von 12-16 Jahren beaufsichtigen.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">10. Cookies und Tracking</h3>
              <p className="text-white/80">Wir verwenden nur technisch notwendige Cookies zur Authentifizierung und Sitzungsverwaltung. Wir verwenden KEINE:</p>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Werbe-Cookies</li>
                <li>Tracking-Cookies</li>
                <li>Drittanbieter-Analysen</li>
                <li>Verhaltens-Tracking</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">11. Änderungen dieser Richtlinie</h3>
              <p className="text-white/80">Wir können diese Datenschutzerklärung von Zeit zu Zeit aktualisieren. Wesentliche Änderungen werden über eine In-App-Benachrichtigung oder E-Mail mitgeteilt. Die weitere Nutzung nach Änderungen bedeutet die Annahme der aktualisierten Richtlinie.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">12. Kontakt</h3>
              <p className="text-white/80">Bei Fragen zu dieser Datenschutzerklärung oder um Ihre Rechte auszuüben, kontaktieren Sie uns bitte:</p>
              <p className="text-white/80 mt-2"><strong>FitBlaq Company</strong><br/>E-Mail: Supportservice@Fitblaq.com<br/>Antwortzeit: Innerhalb von 48 Stunden</p>
            </>
          ) : (
            <>
              <h2 className="text-white text-2xl font-bold mb-4">Privacy Policy – FitBlaq</h2>
              <p className="text-white/80 mb-4"><strong>Last Updated:</strong> December 2024</p>
              <p className="text-white/80 mb-4">FitBlaq ("we," "us," or "our") operates the FitBlaq mobile application (the "Service"). This Privacy Policy informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">1. Data Controller</h3>
              <p className="text-white/80">FitBlaq Company<br/>Email: Supportservice@Fitblaq.com</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">2. Data We Collect</h3>
              <p className="text-white/80 mb-2">We collect the following categories of data:</p>
              
              <h4 className="text-white text-lg font-medium mt-4 mb-2">2.1 Account Information</h4>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Name and email address (for account creation and communication)</li>
                <li>Password (stored encrypted for authentication)</li>
              </ul>

              <h4 className="text-white text-lg font-medium mt-4 mb-2">2.2 Health and Fitness Data</h4>
              <p className="text-white/80 mb-2"><strong>Important:</strong> We collect sensitive health-related data that receives special treatment:</p>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li><strong>Body metrics:</strong> Height, weight, body type, athletic level</li>
                <li><strong>Training data:</strong> Exercises, sets, repetitions, weights, workout duration</li>
                <li><strong>Nutrition data:</strong> Meals, calories, macronutrients (protein, carbs, fats), water intake</li>
                <li><strong>Jogging data:</strong> Distance, duration, pace, calories burned</li>
                <li><strong>Weight history:</strong> Historical weight measurements and goals</li>
              </ul>

              <h4 className="text-white text-lg font-medium mt-4 mb-2">2.3 User-Uploaded Content</h4>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li><strong>Profile photos:</strong> Voluntarily uploaded avatar images</li>
                <li><strong>Analysis images:</strong> Body and food images for AI analysis (Pro users only)</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">3. Purpose of Data Collection</h3>
              <p className="text-white/80 mb-2">We use your data exclusively for:</p>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Providing personalized fitness and nutrition tracking</li>
                <li>Generating customized training plans and recommendations</li>
                <li>Calculating calories, macronutrients, and fitness metrics</li>
                <li>AI-powered body and food analysis (Pro subscription only)</li>
                <li>Displaying progress charts and performance analytics</li>
                <li>Account management and technical support</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">4. Data Sharing</h3>
              <p className="text-white/80 mb-2"><strong>We DO NOT sell, trade, or transfer your personal data to third parties.</strong></p>
              <p className="text-white/80 mb-2">Your data may only be shared with:</p>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li><strong>Service providers:</strong> Secure cloud infrastructure (Supabase) for data storage</li>
                <li><strong>AI processing:</strong> Anonymized image processing for body/food analysis</li>
                <li><strong>Legal requirements:</strong> If required by law</li>
              </ul>
              <p className="text-white/80 mt-2">We do NOT use your data for advertising purposes and do not share data with advertisers.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">5. Data Security</h3>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>All data is transmitted using TLS/SSL encryption</li>
                <li>Passwords are hashed using industry-standard algorithms</li>
                <li>Database access is protected by Row-Level Security</li>
                <li>Images are stored securely in encrypted cloud storage</li>
                <li>Regular security audits and updates</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">6. Data Retention</h3>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li><strong>Active accounts:</strong> Data is retained as long as your account is active</li>
                <li><strong>After account deletion:</strong> All personal data is permanently deleted within 30 days</li>
                <li><strong>Pro analysis data:</strong> AI analysis results are automatically deleted after 5 days and regenerated</li>
                <li><strong>Backups:</strong> Encrypted backups are deleted after 90 days</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">7. Your Rights (GDPR)</h3>
              <p className="text-white/80 mb-2">You have the following rights regarding your data:</p>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li><strong>Access:</strong> Request a copy of your data</li>
                <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
                <li><strong>Erasure:</strong> Request deletion of your account and all data</li>
                <li><strong>Portability:</strong> Receive your data in a machine-readable format</li>
                <li><strong>Object:</strong> Object to data processing</li>
                <li><strong>Restriction:</strong> Request limitation of certain processing</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">8. Account Deletion</h3>
              <p className="text-white/80 mb-2">You can delete your account and all associated data through two methods:</p>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li><strong>In-App:</strong> Go to Settings → Edit Profile → Delete Account</li>
                <li><strong>Email:</strong> Send a deletion request to Supportservice@Fitblaq.com</li>
              </ul>
              <p className="text-white/80 mt-2">Upon deletion, all your personal data including health and fitness data will be permanently removed from our systems within 30 days.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">9. Children's Privacy & Age Rating</h3>
              <p className="text-white/80"><strong>Age Rating: 12+</strong></p>
              <p className="text-white/80 mt-2">This app is suitable for users aged 12 and above. We do not knowingly collect personal data from children under 12. Parents should supervise their children's usage for ages 12-16.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">10. Cookies and Tracking</h3>
              <p className="text-white/80">We only use technically necessary cookies for authentication and session management. We do NOT use:</p>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Advertising cookies</li>
                <li>Tracking cookies</li>
                <li>Third-party analytics</li>
                <li>Behavioral tracking</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">11. Changes to This Policy</h3>
              <p className="text-white/80">We may update this Privacy Policy from time to time. Any material changes will be communicated via in-app notification or email. Continued use after changes constitutes acceptance of the updated policy.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">12. Contact Us</h3>
              <p className="text-white/80">For questions about this Privacy Policy or to exercise your rights, please contact us:</p>
              <p className="text-white/80 mt-2"><strong>FitBlaq Company</strong><br/>Email: Supportservice@Fitblaq.com<br/>Response time: Within 48 hours</p>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy;