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
              <h2 className="text-white text-2xl font-bold mb-4">Nutzungsbedingungen – FitBlaq</h2>
              <p className="text-white/80 mb-4"><strong>Zuletzt aktualisiert:</strong> Dezember 2024</p>
              <p className="text-white/80 mb-4">Bitte lesen Sie diese Nutzungsbedingungen sorgfältig durch, bevor Sie die FitBlaq-Anwendung nutzen.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">1. Annahme der Bedingungen</h3>
              <p className="text-white/80">Durch den Zugriff auf oder die Nutzung von FitBlaq stimmen Sie diesen Nutzungsbedingungen zu. Wenn Sie nicht einverstanden sind, nutzen Sie die App bitte nicht.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">2. Beschreibung des Dienstes</h3>
              <p className="text-white/80 mb-2">FitBlaq ist eine Fitness- und Gesundheits-Tracking-Anwendung, die Folgendes bietet:</p>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Trainingslogging und -tracking</li>
                <li>Ernährungs- und Kalorien-Tracking</li>
                <li>Jogging/Lauf-Tracking</li>
                <li>Gewichtsverlauf und Zielverfolgung</li>
                <li>KI-gestützte Körper- und Essensanalyse (Pro-Funktionen)</li>
                <li>Personalisierte Fitnesspläne und Empfehlungen</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">3. Nutzerkonten & Altersfreigabe</h3>
              <p className="text-white/80 mb-2"><strong>Altersfreigabe: 12+</strong></p>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Diese App ist für Nutzer ab 12 Jahren geeignet</li>
                <li>Sie sind für die Sicherheit Ihres Kontos verantwortlich</li>
                <li>Sie müssen genaue und wahrheitsgemäße Informationen angeben</li>
                <li>Ein Konto pro Person ist erlaubt</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">4. Gesundheitshinweis</h3>
              <p className="text-white/80 mb-2"><strong>Wichtig:</strong> FitBlaq bietet allgemeine Fitness- und Ernährungsinformationen. Es ist KEIN Ersatz für professionelle medizinische Beratung.</p>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Konsultieren Sie einen Arzt, bevor Sie ein neues Trainingsprogramm beginnen</li>
                <li>KI-Analysen dienen nur zu Informationszwecken</li>
                <li>Trainings- und Ernährungsempfehlungen sind allgemeine Richtlinien</li>
                <li>Brechen Sie die Aktivität ab und suchen Sie medizinische Hilfe, wenn Sie Beschwerden haben</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">5. Pro-Zugang</h3>
              <h4 className="text-white text-lg font-medium mt-4 mb-2">5.1 Kostenlose Funktionen</h4>
              <p className="text-white/80">Basis-Tracking-Funktionen sind kostenlos verfügbar.</p>
              
              <h4 className="text-white text-lg font-medium mt-4 mb-2">5.2 Pro-Aktivierung</h4>
              <p className="text-white/80">Pro-Zugang wird über unsere Website aktiviert. Für weitere Informationen kontaktieren Sie uns unter Supportservice@Fitblaq.com</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">6. Nutzerverhalten</h3>
              <p className="text-white/80 mb-2">Sie erklären sich einverstanden, Folgendes NICHT zu tun:</p>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Illegale oder unangemessene Inhalte hochladen</li>
                <li>Versuchen, die App zu hacken oder zu manipulieren</li>
                <li>Falsche persönliche Informationen angeben</li>
                <li>Die Konten anderer Nutzer teilen oder darauf zugreifen</li>
                <li>Die App für nicht autorisierte kommerzielle Zwecke nutzen</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">7. Geistiges Eigentum</h3>
              <p className="text-white/80">Alle Inhalte, Funktionen und Design von FitBlaq sind geistiges Eigentum von FitBlaq Company. Nutzer behalten das Eigentum an ihren hochgeladenen Inhalten.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">8. Datenschutz</h3>
              <p className="text-white/80">Ihre Nutzung von FitBlaq unterliegt auch unserer Datenschutzerklärung, die erklärt, wie wir Ihre personenbezogenen Daten und Gesundheitsinformationen erheben, nutzen und schützen.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">9. Haftungsbeschränkung</h3>
              <p className="text-white/80">FitBlaq wird „wie besehen" ohne Garantien bereitgestellt. Wir haften nicht für Verletzungen, Gesundheitsprobleme oder Schäden, die aus der Nutzung der App oder der Befolgung von Trainings-/Ernährungsempfehlungen resultieren.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">10. Kontokündigung</h3>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Sie können Ihr Konto jederzeit in den Einstellungen löschen</li>
                <li>Wir können Konten bei Verstößen gegen diese Bedingungen sperren</li>
                <li>Bei Kündigung werden Ihre Daten gemäß unserer Datenschutzerklärung gelöscht</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">11. Änderungen der Bedingungen</h3>
              <p className="text-white/80">Wir können diese Bedingungen jederzeit aktualisieren. Die weitere Nutzung nach Änderungen bedeutet die Annahme der neuen Bedingungen.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">12. Anwendbares Recht</h3>
              <p className="text-white/80">Diese Bedingungen unterliegen dem Recht des Landes, in dem FitBlaq Company registriert ist.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">13. Kontakt</h3>
              <p className="text-white/80">Bei Fragen zu diesen Nutzungsbedingungen kontaktieren Sie uns bitte:</p>
              <p className="text-white/80 mt-2"><strong>FitBlaq Company</strong><br/>E-Mail: Supportservice@Fitblaq.com</p>
            </>
          ) : (
            <>
              <h2 className="text-white text-2xl font-bold mb-4">Terms of Service – FitBlaq</h2>
              <p className="text-white/80 mb-4"><strong>Last Updated:</strong> December 2024</p>
              <p className="text-white/80 mb-4">Please read these Terms of Service carefully before using the FitBlaq application.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">1. Acceptance of Terms</h3>
              <p className="text-white/80">By accessing or using FitBlaq, you agree to be bound by these Terms of Service. If you disagree, please do not use the app.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">2. Service Description</h3>
              <p className="text-white/80 mb-2">FitBlaq is a fitness and health tracking application that provides:</p>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Workout logging and tracking</li>
                <li>Nutrition and calorie tracking</li>
                <li>Jogging/running tracking</li>
                <li>Weight history and goal tracking</li>
                <li>AI-powered body and food analysis (Pro features)</li>
                <li>Personalized fitness plans and recommendations</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">3. User Accounts & Age Rating</h3>
              <p className="text-white/80 mb-2"><strong>Age Rating: 12+</strong></p>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>This app is suitable for users aged 12 and above</li>
                <li>You are responsible for maintaining account security</li>
                <li>You must provide accurate and truthful information</li>
                <li>One account per person is allowed</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">4. Health Disclaimer</h3>
              <p className="text-white/80 mb-2"><strong>Important:</strong> FitBlaq provides general fitness and nutrition information. It is NOT a substitute for professional medical advice.</p>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Consult a physician before starting any new exercise program</li>
                <li>AI analysis is for informational purposes only</li>
                <li>Training and nutrition suggestions are general guidelines</li>
                <li>Stop activity and seek medical help if you experience discomfort</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">5. Pro Access</h3>
              <h4 className="text-white text-lg font-medium mt-4 mb-2">5.1 Free Features</h4>
              <p className="text-white/80">Basic tracking features are available for free.</p>
              
              <h4 className="text-white text-lg font-medium mt-4 mb-2">5.2 Pro Activation</h4>
              <p className="text-white/80">Pro access is activated via our website. For more information, contact us at Supportservice@Fitblaq.com</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">6. User Conduct</h3>
              <p className="text-white/80 mb-2">You agree NOT to:</p>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>Upload illegal or inappropriate content</li>
                <li>Attempt to hack or manipulate the app</li>
                <li>Provide false personal information</li>
                <li>Share or access other users' accounts</li>
                <li>Use the app for unauthorized commercial purposes</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">7. Intellectual Property</h3>
              <p className="text-white/80">All content, features, and design of FitBlaq are the intellectual property of FitBlaq Company. Users retain ownership of their uploaded content.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">8. Privacy</h3>
              <p className="text-white/80">Your use of FitBlaq is also governed by our Privacy Policy, which explains how we collect, use, and protect your personal data and health information.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">9. Limitation of Liability</h3>
              <p className="text-white/80">FitBlaq is provided "as is" without warranties. We are not liable for any injuries, health issues, or damages resulting from using the app or following workout/nutrition suggestions.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">10. Account Termination</h3>
              <ul className="text-white/80 list-disc pl-6 space-y-1">
                <li>You may delete your account at any time in Settings</li>
                <li>We may suspend accounts for violation of these terms</li>
                <li>Upon termination, your data will be deleted per our Privacy Policy</li>
              </ul>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">11. Changes to Terms</h3>
              <p className="text-white/80">We may update these terms at any time. Continued use after changes constitutes acceptance of new terms.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">12. Governing Law</h3>
              <p className="text-white/80">These terms are governed by the laws of the country where FitBlaq Company is registered.</p>

              <h3 className="text-white text-xl font-semibold mt-6 mb-3">13. Contact</h3>
              <p className="text-white/80">For questions about these Terms of Service, please contact us:</p>
              <p className="text-white/80 mt-2"><strong>FitBlaq Company</strong><br/>Email: Supportservice@Fitblaq.com</p>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TermsOfService;
