import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const TermsOfService = () => {
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
        <h1 className="text-3xl font-bold mb-6">Allgemeine Geschäftsbedingungen (AGB) / Terms of Service</h1>
        
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">1. Geltungsbereich</h2>
          <p className="text-muted-foreground">
            Diese Allgemeinen Geschäftsbedingungen gelten für die Nutzung der FitBlaqs Fitness-App und aller damit verbundenen Dienste. Mit der Registrierung akzeptieren Sie diese Bedingungen.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">2. Leistungsbeschreibung</h2>
          <p className="text-muted-foreground mb-4">
            FitBlaqs bietet folgende Dienste:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>Trainings-Tracking und -Planung</li>
            <li>Ernährungs-Tracking</li>
            <li>Jogging-Tracker mit Statistiken</li>
            <li>Gewichtsverfolgung</li>
            <li>Performance-Kalender</li>
            <li>Pro Athlete: KI-gestützte Trainingspläne (kostenpflichtig)</li>
            <li>Pro Nutrition: KI-gestützte Ernährungsanalyse (kostenpflichtig)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">3. Registrierung und Konto</h2>
          <p className="text-muted-foreground">
            Für die Nutzung ist eine Registrierung erforderlich. Sie sind für die Sicherheit Ihrer Zugangsdaten verantwortlich. Falsche Angaben können zur Kontosperrung führen.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">4. Pro Athlete Abonnement</h2>
          <p className="text-muted-foreground mb-4">
            <strong>Preis:</strong> €19,99 für 12 Monate<br />
            <strong>Kündigungsfrist:</strong> Kündigung nach 6 Monaten möglich<br />
            <strong>Leistungen:</strong>
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>KI-generierte personalisierte Trainingspläne</li>
            <li>KI-Körperanalyse basierend auf Fotos</li>
            <li>Social Media Integration (Instagram, TikTok)</li>
            <li>Automatische Datenspeicherung für 5 Tage</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">5. Pro Nutrition Abonnement</h2>
          <p className="text-muted-foreground mb-4">
            <strong>Preis:</strong> €14,99 für 12 Monate<br />
            <strong>Kündigungsfrist:</strong> Kündigung nach 6 Monaten möglich<br />
            <strong>Leistungen:</strong>
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>KI-gestützte Nahrungsmittelanalyse per Foto</li>
            <li>Food Tracker mit manueller Eingabe</li>
            <li>Automatische Nährwertberechnung</li>
            <li>Automatische Datenspeicherung für 5 Tage</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">6. Zahlungsbedingungen</h2>
          <p className="text-muted-foreground">
            Die Zahlung erfolgt im Voraus für den gewählten Zeitraum. Bei Nichtzahlung wird der Zugang zu Premium-Funktionen gesperrt. Rückerstattungen sind nur in den ersten 14 Tagen möglich.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">7. Nutzungsrechte und -pflichten</h2>
          <p className="text-muted-foreground mb-4">
            Sie dürfen:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>Die App für persönliche Fitnesszwecke nutzen</li>
            <li>Ihre Daten exportieren</li>
            <li>Inhalte für soziale Medien teilen</li>
          </ul>
          <p className="text-muted-foreground mt-4">
            Sie dürfen nicht:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>Die App kommerziell weitervertreiben</li>
            <li>Den Dienst für illegale Zwecke nutzen</li>
            <li>Andere Nutzer belästigen oder schädigen</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">8. Haftungsausschluss</h2>
          <p className="text-muted-foreground">
            FitBlaqs ersetzt keine professionelle medizinische Beratung. Die KI-generierten Trainingspläne und Ernährungsempfehlungen dienen nur zu Informationszwecken. Bei gesundheitlichen Bedenken konsultieren Sie einen Arzt.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">9. Kündigung</h2>
          <p className="text-muted-foreground">
            Sie können Ihr Konto jederzeit in den Einstellungen löschen. Bei Verstößen gegen diese AGB behalten wir uns das Recht vor, Konten zu sperren oder zu löschen.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">10. Änderungen der AGB</h2>
          <p className="text-muted-foreground">
            Wir behalten uns das Recht vor, diese AGB zu ändern. Wesentliche Änderungen werden per E-Mail mitgeteilt. Die weitere Nutzung nach Änderungen gilt als Zustimmung.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">11. Anwendbares Recht</h2>
          <p className="text-muted-foreground">
            Es gilt das Recht der Bundesrepublik Deutschland. Gerichtsstand ist Berlin.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">12. Kontakt</h2>
          <p className="text-muted-foreground">
            FitBlaqs GmbH<br />
            Fitness Street 123<br />
            10115 Berlin, Deutschland<br />
            E-Mail: legal@fitblaqs.com<br />
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

export default TermsOfService;