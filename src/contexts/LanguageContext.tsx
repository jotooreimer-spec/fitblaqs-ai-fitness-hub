import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LanguageContextType {
  language: string;
  isGerman: boolean;
  setLanguage: (lang: string) => void;
  t: (de: string, en: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState("de");

  useEffect(() => {
    // Load language from user metadata on mount
    const loadLanguage = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.user_metadata?.language) {
        setLanguageState(session.user.user_metadata.language);
      }
    };
    loadLanguage();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user?.user_metadata?.language) {
        setLanguageState(session.user.user_metadata.language);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const setLanguage = async (lang: string) => {
    setLanguageState(lang);
    // Update user metadata
    await supabase.auth.updateUser({
      data: { language: lang }
    });
  };

  const isGerman = language === "de";

  const t = (de: string, en: string) => {
    return isGerman ? de : en;
  };

  return (
    <LanguageContext.Provider value={{ language, isGerman, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};