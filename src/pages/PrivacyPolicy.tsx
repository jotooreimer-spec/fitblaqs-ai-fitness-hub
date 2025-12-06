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
        Back
      </Button>

      <div className="max-w-3xl mx-auto prose prose-invert">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">1. Data Controller</h2>
          <p className="text-muted-foreground">
            FitBlaq Company<br />
            Email: Supportservice@Fitblaq.com
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">2. Collection and Processing of Personal Data</h2>
          <p className="text-muted-foreground mb-4">
            We collect and process the following personal data:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>Account information (name, email address, password)</li>
            <li>Profile information (height, weight, body type, athlete level)</li>
            <li>Training data (exercises, sets, repetitions, weights)</li>
            <li>Nutrition data (meals, calories, macronutrients)</li>
            <li>Jogging data (distance, duration, calories burned)</li>
            <li>Weight history</li>
            <li>Uploaded images and videos</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">3. Purpose of Data Processing</h2>
          <p className="text-muted-foreground">
            Your data is used exclusively to provide our fitness app services, including:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>Personalized training plans</li>
            <li>Nutrition analysis and recommendations</li>
            <li>Progress tracking</li>
            <li>AI-powered body analysis</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">4. Data Security</h2>
          <p className="text-muted-foreground">
            All data is transmitted using state-of-the-art encryption technologies (TLS/SSL) and stored securely in encrypted databases. Access to your data is strictly limited to authorized personnel.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">5. Your Rights</h2>
          <p className="text-muted-foreground mb-4">
            You have the following rights:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li><strong>Right of access:</strong> You can request information about your stored data</li>
            <li><strong>Right to rectification:</strong> You can have incorrect data corrected</li>
            <li><strong>Right to erasure:</strong> You can request the deletion of your data</li>
            <li><strong>Right to data portability:</strong> You can receive your data in a common format</li>
            <li><strong>Right to object:</strong> You can object to the processing</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">6. Data Retention</h2>
          <p className="text-muted-foreground">
            Your data is stored as long as you have an active account. After account deletion, all personal data will be deleted within 30 days. Pro Athlete data is automatically deleted and regenerated after 5 days.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">7. Cookies and Tracking</h2>
          <p className="text-muted-foreground">
            We only use technically necessary cookies for authentication and session management. No tracking or advertising cookies are used.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">8. Contact</h2>
          <p className="text-muted-foreground">
            For privacy inquiries, contact us at:<br />
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

export default PrivacyPolicy;
