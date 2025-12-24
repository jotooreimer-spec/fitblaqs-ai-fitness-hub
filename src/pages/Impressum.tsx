import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Building2, Mail, Phone, Globe, User, FileText, Scale } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import settingsBg from "@/assets/settings-bg.jpg";

const Impressum = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const content = {
    de: {
      title: "Impressum",
      subtitle: "Angaben gemäß § 5 TMG",
      company: {
        title: "Unternehmen",
        name: "FitBlaqs Power & Healthy",
        type: "Digitales Fitness-Unternehmen",
        description: "Anbieter von digitalen Fitness-, Ernährungs- und Kalorienlösungen sowie Healthy-Health-Funktionen",
      },
      management: {
        title: "Geschäftsführung",
        ceo: "CEO: John Daniel Otoo",
      },
      contact: {
        title: "Kontakt",
        email: "E-Mail: supportservice@fitblaqs.com",
        website: "Website: www.fitblaqs.com",
      },
      editorial: {
        title: "Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV",
        responsible: "John Daniel Otoo",
        address: "FitBlaqs Power & Healthy",
      },
      disclaimer: {
        title: "Haftungsausschluss",
        content: {
          title: "Haftung für Inhalte",
          text: "Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.",
        },
        links: {
          title: "Haftung für Links",
          text: "Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.",
        },
        copyright: {
          title: "Urheberrecht",
          text: "Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.",
        },
      },
      dispute: {
        title: "Streitschlichtung",
        text: "Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: https://ec.europa.eu/consumers/odr/. Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.",
      },
      lastUpdated: "Stand: Dezember 2025",
    },
    en: {
      title: "Legal Notice",
      subtitle: "Information according to § 5 TMG",
      company: {
        title: "Company",
        name: "FitBlaqs Power & Healthy",
        type: "Digital Fitness Company",
        description: "Provider of digital fitness, nutrition and calorie solutions as well as Healthy-Health functions",
      },
      management: {
        title: "Management",
        ceo: "CEO: John Daniel Otoo",
      },
      contact: {
        title: "Contact",
        email: "Email: supportservice@fitblaqs.com",
        website: "Website: www.fitblaqs.com",
      },
      editorial: {
        title: "Responsible for content according to § 55 Abs. 2 RStV",
        responsible: "John Daniel Otoo",
        address: "FitBlaqs Power & Healthy",
      },
      disclaimer: {
        title: "Disclaimer",
        content: {
          title: "Liability for Content",
          text: "As a service provider, we are responsible for our own content on these pages in accordance with § 7 (1) TMG under general law. According to §§ 8 to 10 TMG, however, we are not obligated as a service provider to monitor transmitted or stored third-party information or to investigate circumstances that indicate illegal activity.",
        },
        links: {
          title: "Liability for Links",
          text: "Our offer contains links to external third-party websites over whose content we have no influence. Therefore, we cannot assume any liability for this external content. The respective provider or operator of the pages is always responsible for the content of the linked pages.",
        },
        copyright: {
          title: "Copyright",
          text: "The content and works created by the site operators on these pages are subject to German copyright law. Duplication, processing, distribution and any kind of exploitation outside the limits of copyright require the written consent of the respective author or creator.",
        },
      },
      dispute: {
        title: "Dispute Resolution",
        text: "The European Commission provides a platform for online dispute resolution (OS): https://ec.europa.eu/consumers/odr/. We are not willing or obliged to participate in dispute resolution proceedings before a consumer arbitration board.",
      },
      lastUpdated: "Last Updated: December 2025",
    },
  };

  const t = language === "de" ? content.de : content.en;

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${settingsBg})` }}
      />
      <div className="absolute inset-0 bg-black/70" />
      
      <div className="relative z-10 max-w-4xl mx-auto p-6 pb-24">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">{t.title}</h1>
            <p className="text-white/70">{t.subtitle}</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Company Info */}
          <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-white">{t.company.title}</h2>
            </div>
            <div className="space-y-2 text-white/80">
              <p className="font-semibold text-lg text-white">{t.company.name}</p>
              <p>{t.company.type}</p>
              <p className="text-sm">{t.company.description}</p>
            </div>
          </Card>

          {/* Management */}
          <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-white">{t.management.title}</h2>
            </div>
            <p className="text-white/80">{t.management.ceo}</p>
          </Card>

          {/* Contact */}
          <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-white">{t.contact.title}</h2>
            </div>
            <div className="space-y-2 text-white/80">
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <a href="mailto:supportservice@fitblaqs.com" className="hover:text-primary transition-colors">
                  supportservice@fitblaqs.com
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <a href="https://www.fitblaqs.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  www.fitblaqs.com
                </a>
              </p>
            </div>
          </Card>

          {/* Editorial Responsibility */}
          <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-white">{t.editorial.title}</h2>
            </div>
            <div className="space-y-1 text-white/80">
              <p>{t.editorial.responsible}</p>
              <p>{t.editorial.address}</p>
            </div>
          </Card>

          {/* Disclaimer */}
          <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Scale className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-white">{t.disclaimer.title}</h2>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-white mb-2">{t.disclaimer.content.title}</h3>
                <p className="text-sm text-white/70">{t.disclaimer.content.text}</p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">{t.disclaimer.links.title}</h3>
                <p className="text-sm text-white/70">{t.disclaimer.links.text}</p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">{t.disclaimer.copyright.title}</h3>
                <p className="text-sm text-white/70">{t.disclaimer.copyright.text}</p>
              </div>
            </div>
          </Card>

          {/* Dispute Resolution */}
          <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-6">
            <h2 className="text-xl font-semibold text-white mb-3">{t.dispute.title}</h2>
            <p className="text-sm text-white/70">{t.dispute.text}</p>
          </Card>

          {/* Last Updated */}
          <p className="text-center text-white/50 text-sm">{t.lastUpdated}</p>
        </div>
      </div>
    </div>
  );
};

export default Impressum;
