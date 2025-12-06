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
        Back
      </Button>

      <div className="max-w-3xl mx-auto prose prose-invert">
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">1. Scope</h2>
          <p className="text-muted-foreground">
            These Terms of Service apply to the use of the FitBlaqs fitness app and all related services. By registering, you accept these terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">2. Service Description</h2>
          <p className="text-muted-foreground mb-4">
            FitBlaqs offers the following services:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>Training tracking and planning</li>
            <li>Nutrition tracking</li>
            <li>Jogging tracker with statistics</li>
            <li>Weight tracking</li>
            <li>Performance calendar</li>
            <li>Pro Athlete: AI-powered training plans (paid)</li>
            <li>Pro Nutrition: AI-powered nutrition analysis (paid)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">3. Registration and Account</h2>
          <p className="text-muted-foreground">
            Registration is required for use. You are responsible for the security of your login credentials. False information may result in account suspension.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">4. Pro Athlete Subscription</h2>
          <p className="text-muted-foreground mb-4">
            <strong>Price:</strong> €19.99 for 12 months<br />
            <strong>Cancellation:</strong> Can be cancelled after 6 months via email<br />
            <strong>Features:</strong>
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>AI-generated personalized training plans</li>
            <li>AI body analysis based on photos</li>
            <li>Automatic data storage for 5 days</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">5. Pro Nutrition Subscription</h2>
          <p className="text-muted-foreground mb-4">
            <strong>Price:</strong> €14.99 for 12 months<br />
            <strong>Cancellation:</strong> Can be cancelled after 6 months via email<br />
            <strong>Features:</strong>
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>AI-powered food analysis via photo</li>
            <li>Food tracker with manual input</li>
            <li>Automatic nutritional value calculation</li>
            <li>Automatic data storage for 5 days</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">6. Payment Terms</h2>
          <p className="text-muted-foreground">
            Payment is made in advance for the selected period. Non-payment will result in suspension of access to premium features. Refunds are only possible within the first 14 days.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">7. Usage Rights and Obligations</h2>
          <p className="text-muted-foreground mb-4">
            You may:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>Use the app for personal fitness purposes</li>
            <li>Export your data</li>
            <li>Share content on social media</li>
          </ul>
          <p className="text-muted-foreground mt-4">
            You may not:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>Commercially redistribute the app</li>
            <li>Use the service for illegal purposes</li>
            <li>Harass or harm other users</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">8. Disclaimer</h2>
          <p className="text-muted-foreground">
            FitBlaqs does not replace professional medical advice. AI-generated training plans and nutrition recommendations are for informational purposes only. Consult a doctor if you have health concerns.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">9. Cancellation</h2>
          <p className="text-muted-foreground">
            You can delete your account at any time in the settings. Subscriptions can be cancelled after 6 months via email to Supportservice@Fitblaq.com. We reserve the right to suspend or delete accounts for violations of these terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">10. Changes to Terms</h2>
          <p className="text-muted-foreground">
            We reserve the right to change these terms. Significant changes will be communicated via email. Continued use after changes constitutes acceptance.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">11. Contact</h2>
          <p className="text-muted-foreground">
            FitBlaq Company<br />
            Email: Supportservice@Fitblaq.com
          </p>
        </section>

        <p className="text-sm text-muted-foreground mt-8">
          Last updated: December 2024
        </p>
      </div>
    </div>
  );
};

export default TermsOfService;
