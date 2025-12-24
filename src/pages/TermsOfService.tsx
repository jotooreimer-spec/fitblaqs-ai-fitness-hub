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
              <h2 className="text-white text-2xl font-bold mb-4">FitBlaqs – Power & Healthy: Nutzungsbedingungen</h2>
              <p className="text-white/80 mb-4"><strong>Zuletzt aktualisiert:</strong> Dezember 2025</p>
              <p className="text-white/80 mb-4">Bitte lesen Sie diese Nutzungsbedingungen sorgfältig durch, bevor Sie die FitBlaqs – Power & Healthy Anwendung nutzen.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">1. Annahme der Bedingungen</h3>
              <p className="text-white/80">Durch den Zugriff auf oder die Nutzung von FitBlaqs – Power & Healthy stimmen Sie diesen Nutzungsbedingungen zu. Wenn Sie nicht einverstanden sind, nutzen Sie die App bitte nicht.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">2. Beschreibung des Dienstes</h3>
              <p className="text-white/80 mb-2">FitBlaqs – Power & Healthy ist eine Fitness- und Gesundheitsanwendung, die Folgendes bietet:</p>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Trainingslogging und -tracking</li>
                <li>Ernährungs- und Kalorien-Tracking</li>
                <li>Jogging/Lauf-Tracking</li>
                <li>Gewichtsverlauf und Zielverfolgung</li>
                <li>KI-gestützte Körper- und Essensanalyse (Pro-Funktionen)</li>
                <li>Personalisierte Fitnesspläne und Empfehlungen</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">3. Nutzerkonten & Altersanforderung</h3>
              <p className="text-white/80 mb-2"><strong>Altersanforderung: 12+</strong></p>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Sie sind für die Sicherheit Ihres Kontos verantwortlich</li>
                <li>Genaue und wahrheitsgemäße Informationen müssen angegeben werden</li>
                <li>Ein Konto pro Person ist erlaubt</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">4. Gesundheitshinweis</h3>
              <p className="text-white/80 mb-2">FitBlaqs – Power & Healthy bietet allgemeine Fitness- und Ernährungsberatung. Es ist kein Ersatz für professionelle medizinische Beratung.</p>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Konsultieren Sie einen Arzt, bevor Sie neue Trainingsprogramme beginnen</li>
                <li>KI-Analysen dienen nur zu Informationszwecken</li>
                <li>Trainings- und Ernährungsvorschläge sind allgemeine Richtlinien</li>
                <li>Beenden Sie die Aktivität und suchen Sie medizinische Hilfe, wenn Sie Beschwerden haben</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">5. Pro-Funktionen & Zahlungen</h3>
              <h4 className="text-white text-lg font-medium mt-4 mb-2">5.1 Kostenlose Funktionen</h4>
              <p className="text-white/80">Basis-Tracking-Funktionen sind kostenlos verfügbar.</p>
              
              <h4 className="text-white text-lg font-medium mt-4 mb-2">5.2 Pro-Zugang</h4>
              <p className="text-white/80">Pro-Zugang kann über unsere Website aktiviert werden. Kontakt: Supportservice@FitBlaqs.com</p>

              <h4 className="text-white text-lg font-medium mt-4 mb-2">5.3 Zahlungsmethoden</h4>
              <p className="text-white/80 mb-2">Pro-Abonnements können bezahlt werden per:</p>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Kreditkarte</li>
                <li>Lastschrift</li>
                <li>PayPal</li>
                <li>Vorkasse / Rechnung</li>
                <li>Ratenzahlung (falls angeboten)</li>
              </ul>

              <h4 className="text-white text-lg font-medium mt-4 mb-2">5.4 Zahlungsverzug</h4>
              <p className="text-white/80">Verspätete Zahlungen können Verzugszinsen von 5% über dem Basiszinssatz der Deutschen Bundesbank nach sich ziehen. Kunden bleiben für alle Inkassokosten verantwortlich.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">6. Lieferung & Eigentumsvorbehalt (für physische Produkte, falls zutreffend)</h3>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Die Lieferung erfolgt an die vom Nutzer angegebene Adresse</li>
                <li>Das Eigentum verbleibt bei FitBlaqs bis zur vollständigen Zahlung</li>
                <li>Rücksendungen sollten in Originalverpackung erfolgen; unnötige Versandkosten können dem Kunden in Rechnung gestellt werden</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">7. Gewährleistung / Mängelhaftung</h3>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Für physische Produkte gilt die gesetzliche Gewährleistung von 2 Jahren ab Lieferung</li>
                <li>Ansprüche umfassen Reparatur oder Ersatz nach Ermessen von FitBlaqs</li>
                <li>Keine Gewährleistung für Schäden durch unsachgemäße Verwendung oder äußere Faktoren</li>
                <li>FitBlaqs haftet nicht für Datenverlust bei Rücksendungen von Geräten oder Software</li>
                <li>Gewährleistungsansprüche für Softwaremängel beschränken sich auf Behebung des Mangels oder Ersatz der Lizenz nach Ermessen von FitBlaqs</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">8. Nutzerverhalten</h3>
              <p className="text-white/80 mb-2">Sie erklären sich einverstanden, Folgendes NICHT zu tun:</p>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Illegale oder unangemessene Inhalte hochladen</li>
                <li>Die App hacken oder manipulieren</li>
                <li>Konten anderer Nutzer verwenden</li>
                <li>Die App für nicht autorisierte kommerzielle Zwecke nutzen</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">9. Geistiges Eigentum</h3>
              <p className="text-white/80">Alle Inhalte, Funktionen und das Design von FitBlaqs – Power & Healthy sind Eigentum der FitBlaqs Company.</p>
              <p className="text-white/80 mt-2">Nutzer behalten die Rechte an ihren hochgeladenen Inhalten. Durch das Einreichen von Inhalten gewähren Sie FitBlaqs das Recht, diese für rechtmäßige Zwecke zu nutzen.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">10. Datenschutz & Datensicherheit</h3>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Die Nutzung von FitBlaqs – Power & Healthy unterliegt unserer Datenschutzerklärung</li>
                <li>Datenspeicherung erfolgt in Deutschland</li>
                <li>Nutzer unter 16 Jahren benötigen elterliche Zustimmung</li>
                <li>Persönliche und Gesundheitsdaten werden gemäß DSGVO verarbeitet</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">11. Haftungsbeschränkung</h3>
              <p className="text-white/80">FitBlaqs – Power & Healthy wird „wie besehen" bereitgestellt.</p>
              <p className="text-white/80 mt-2">FitBlaqs haftet nicht für Gesundheitsprobleme, Verletzungen oder Datenverlust, die aus der App-Nutzung oder dem Befolgen von Trainings-/Ernährungsberatung resultieren.</p>
              <p className="text-white/80 mt-2">Die Haftung für grobe Fahrlässigkeit, vorsätzliches Fehlverhalten oder Verletzung von Leben, Körper oder Gesundheit bleibt unberührt.</p>
              <p className="text-white/80 mt-2">FitBlaqs ist nicht verantwortlich für indirekte oder Folgeschäden.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">12. Kontokündigung</h3>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Nutzer können Konten jederzeit in den Einstellungen löschen</li>
                <li>FitBlaqs kann Konten bei Verstoß gegen diese Bedingungen sperren oder löschen</li>
                <li>Bei Kündigung werden Daten gemäß Datenschutzerklärung gelöscht</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">13. Änderungen der Bedingungen</h3>
              <p className="text-white/80">Wir können diese Bedingungen jederzeit aktualisieren. Die weitere Nutzung nach Änderungen bedeutet die Annahme der neuen Bedingungen.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">14. Anwendbares Recht & Gerichtsstand</h3>
              <p className="text-white/80">Es gilt deutsches Recht (unter Ausschluss des UN-Kaufrechts).</p>
              <p className="text-white/80 mt-2">Für Verbraucher in Deutschland ist der Sitz von FitBlaqs zuständig.</p>
              <p className="text-white/80 mt-2">Vor Rechtsstreitigkeiten ist eine informelle Verhandlung erforderlich; Schlichtung kann in Köln erfolgen.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">15. Kontakt</h3>
              <p className="text-white/80">
                FitBlaqs Company<br/>
                E-Mail: Supportservice@FitBlaqs.com
              </p>
            </>
          ) : (
            <>
              <h2 className="text-white text-2xl font-bold mb-4">FitBlaqs – Power & Healthy: Terms of Service</h2>
              <p className="text-white/80 mb-4"><strong>Last Updated:</strong> December 2025</p>
              <p className="text-white/80 mb-4">Please read these Terms of Service carefully before using the FitBlaqs – Power & Healthy application.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">1. Acceptance of Terms</h3>
              <p className="text-white/80">By accessing or using FitBlaqs – Power & Healthy, you agree to be bound by these Terms of Service. If you do not agree, please do not use the app.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">2. Service Description</h3>
              <p className="text-white/80 mb-2">FitBlaqs – Power & Healthy is a fitness and health application providing:</p>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Workout logging and tracking</li>
                <li>Nutrition and calorie tracking</li>
                <li>Jogging/running tracking</li>
                <li>Weight history and goal tracking</li>
                <li>AI-powered body and food analysis (Pro features)</li>
                <li>Personalized fitness plans and recommendations</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">3. User Accounts & Age Requirement</h3>
              <p className="text-white/80 mb-2"><strong>Age Requirement: 12+</strong></p>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>You are responsible for maintaining account security</li>
                <li>Accurate and truthful information must be provided</li>
                <li>One account per person is allowed</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">4. Health Disclaimer</h3>
              <p className="text-white/80 mb-2">FitBlaqs – Power & Healthy provides general fitness and nutrition guidance. It is not a substitute for professional medical advice.</p>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Consult a physician before starting new exercise programs</li>
                <li>AI analyses are for informational purposes only</li>
                <li>Training and nutrition suggestions are general guidelines</li>
                <li>Stop activity and seek medical help if you experience discomfort</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">5. Pro Features & Payments</h3>
              <h4 className="text-white text-lg font-medium mt-4 mb-2">5.1 Free Features</h4>
              <p className="text-white/80">Basic tracking features are available for free.</p>
              
              <h4 className="text-white text-lg font-medium mt-4 mb-2">5.2 Pro Access</h4>
              <p className="text-white/80">Pro access can be activated via our website. Contact: Supportservice@FitBlaqs.com</p>

              <h4 className="text-white text-lg font-medium mt-4 mb-2">5.3 Payment Methods</h4>
              <p className="text-white/80 mb-2">Pro subscriptions may be paid via:</p>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Credit card</li>
                <li>Direct debit</li>
                <li>PayPal</li>
                <li>Prepayment / Invoice</li>
                <li>Installments (if offered)</li>
              </ul>

              <h4 className="text-white text-lg font-medium mt-4 mb-2">5.4 Late Payment & Default</h4>
              <p className="text-white/80">Late payments may incur a default interest of 5% above the base rate of the German Bundesbank. Customers remain responsible for all collection costs.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">6. Delivery & Retention of Title (for physical products, if applicable)</h3>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Delivery is made to the address provided by the user</li>
                <li>Ownership remains with FitBlaqs until full payment is received</li>
                <li>Returns should be in original packaging; unnecessary shipping costs may be charged to the customer</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">7. Warranty / Liability for Defects</h3>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>For physical products, statutory warranty of 2 years applies from delivery</li>
                <li>Claims include repair or replacement at FitBlaqs' discretion</li>
                <li>No warranty for damage caused by improper use or external factors</li>
                <li>FitBlaqs is not responsible for data loss during returns of devices or software</li>
                <li>Warranty claims for software defects are limited to correcting the defect or replacing the license, at FitBlaqs' discretion</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">8. User Conduct</h3>
              <p className="text-white/80 mb-2">You agree not to:</p>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Upload illegal or inappropriate content</li>
                <li>Hack or manipulate the app</li>
                <li>Use other users' accounts</li>
                <li>Use the app for unauthorized commercial purposes</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">9. Intellectual Property</h3>
              <p className="text-white/80">All content, features, and design of FitBlaqs – Power & Healthy are property of FitBlaqs Company.</p>
              <p className="text-white/80 mt-2">Users retain rights to their uploaded content. By submitting content, you grant FitBlaqs the right to use it for lawful purposes.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">10. Privacy & Data Protection</h3>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Use of FitBlaqs – Power & Healthy is governed by our Privacy Policy</li>
                <li>Data storage is in Germany</li>
                <li>Users under 16 require parental consent</li>
                <li>Personal and health data are processed in accordance with GDPR</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">11. Limitation of Liability</h3>
              <p className="text-white/80">FitBlaqs – Power & Healthy is provided "as is."</p>
              <p className="text-white/80 mt-2">FitBlaqs is not liable for health issues, injuries, or data loss resulting from app use or following training/nutrition guidance.</p>
              <p className="text-white/80 mt-2">Liability for gross negligence, intentional misconduct, or injury to life, body, or health remains unaffected.</p>
              <p className="text-white/80 mt-2">FitBlaqs is not responsible for indirect or consequential damages.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">12. Account Termination</h3>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Users may delete accounts at any time in Settings</li>
                <li>FitBlaqs may suspend or delete accounts for violation of these terms</li>
                <li>Upon termination, data will be deleted according to the Privacy Policy</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">13. Changes to Terms</h3>
              <p className="text-white/80">We may update these Terms at any time. Continued use after changes constitutes acceptance of the new Terms.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">14. Governing Law & Jurisdiction</h3>
              <p className="text-white/80">German law applies (excluding the UN Sales Convention).</p>
              <p className="text-white/80 mt-2">For consumers in Germany, FitBlaqs headquarters has jurisdiction.</p>
              <p className="text-white/80 mt-2">Informal negotiation is required before legal disputes; arbitration may follow in Cologne.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">15. Contact</h3>
              <p className="text-white/80">
                FitBlaqs Company<br/>
                Email: Supportservice@FitBlaqs.com
              </p>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TermsOfService;
