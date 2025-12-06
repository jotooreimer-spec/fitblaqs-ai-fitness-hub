import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-6">
      <Button 
        variant="ghost" 
        onClick={() => navigate(-1)}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Zurück
      </Button>

      <div className="max-w-3xl mx-auto prose prose-invert">
        <h1 className="text-3xl font-bold mb-6">Datenschutzerklärung / Privacy Policy</h1>
        
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">1. Verantwortlicher</h2>
          <p className="text-muted-foreground">
            FitBlaqs GmbH<br />
            Fitness Street 123<br />
            10115 Berlin, Deutschland<br />
            E-Mail: privacy@fitblaqs.com
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">2. Erhebung und Verarbeitung personenbezogener Daten</h2>
          <p className="text-muted-foreground mb-4">
            Wir erheben und verarbeiten folgende personenbezogene Daten:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>Kontoinformationen (Name, E-Mail-Adresse, Passwort)</li>
            <li>Profilinformationen (Größe, Gewicht, Körpertyp, Athleten-Level)</li>
            <li>Trainingsdaten (Übungen, Sätze, Wiederholungen, Gewichte)</li>
            <li>Ernährungsdaten (Mahlzeiten, Kalorien, Makronährstoffe)</li>
            <li>Jogging-Daten (Distanz, Dauer, verbrannte Kalorien)</li>
            <li>Gewichtsverlauf</li>
            <li>Hochgeladene Bilder und Videos</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">3. Zweck der Datenverarbeitung</h2>
          <p className="text-muted-foreground">
            Ihre Daten werden ausschließlich zur Bereitstellung unserer Fitness-App-Dienste verwendet, einschließlich:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>Personalisierte Trainingspläne</li>
            <li>Ernährungsanalyse und -empfehlungen</li>
            <li>Fortschrittsverfolgung</li>
            <li>KI-gestützte Körperanalyse</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">4. Datensicherheit</h2>
          <p className="text-muted-foreground">
            Alle Daten werden mit modernsten Verschlüsselungstechnologien übertragen (TLS/SSL) und sicher in verschlüsselten Datenbanken gespeichert. Der Zugriff auf Ihre Daten ist streng auf autorisiertes Personal beschränkt.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">5. Ihre Rechte</h2>
          <p className="text-muted-foreground mb-4">
            Nach der DSGVO haben Sie folgende Rechte:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li><strong>Auskunftsrecht:</strong> Sie können Auskunft über Ihre gespeicherten Daten verlangen</li>
            <li><strong>Berichtigungsrecht:</strong> Sie können unrichtige Daten korrigieren lassen</li>
            <li><strong>Löschungsrecht:</strong> Sie können die Löschung Ihrer Daten verlangen</li>
            <li><strong>Recht auf Datenübertragbarkeit:</strong> Sie können Ihre Daten in einem gängigen Format erhalten</li>
            <li><strong>Widerspruchsrecht:</strong> Sie können der Verarbeitung widersprechen</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">6. Speicherdauer</h2>
          <p className="text-muted-foreground">
            Ihre Daten werden so lange gespeichert, wie Sie ein aktives Konto haben. Nach Kontolöschung werden alle personenbezogenen Daten innerhalb von 30 Tagen gelöscht. Pro Athlete Daten werden nach 5 Tagen automatisch gelöscht und neu generiert.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">7. Cookies und Tracking</h2>
          <p className="text-muted-foreground">
            Wir verwenden nur technisch notwendige Cookies für die Authentifizierung und Sitzungsverwaltung. Es werden keine Tracking- oder Werbe-Cookies verwendet.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">8. Kontakt</h2>
          <p className="text-muted-foreground">
            Bei Fragen zum Datenschutz kontaktieren Sie uns unter:<br />
            E-Mail: privacy@fitblaqs.com<br />
            Telefon: +49 30 12345678
          </p>
        </section>

        <p className="text-sm text-muted-foreground mt-8">
          Letzte Aktualisierung: Dezember 2024
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;