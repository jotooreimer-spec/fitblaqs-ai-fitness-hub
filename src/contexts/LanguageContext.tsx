import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

type LanguageCode = "de" | "en" | "es" | "fr" | "pt" | "ru" | "tr" | "it";

interface Translations {
  [key: string]: {
    de: string;
    en: string;
    es: string;
    fr: string;
    pt: string;
    ru: string;
    tr: string;
    it: string;
  };
}

const translations: Translations = {
  // Common
  save: { de: "Speichern", en: "Save", es: "Guardar", fr: "Sauvegarder", pt: "Salvar", ru: "Сохранить", tr: "Kaydet", it: "Salva" },
  delete: { de: "Löschen", en: "Delete", es: "Eliminar", fr: "Supprimer", pt: "Excluir", ru: "Удалить", tr: "Sil", it: "Elimina" },
  cancel: { de: "Abbrechen", en: "Cancel", es: "Cancelar", fr: "Annuler", pt: "Cancelar", ru: "Отмена", tr: "İptal", it: "Annulla" },
  back: { de: "Zurück", en: "Back", es: "Volver", fr: "Retour", pt: "Voltar", ru: "Назад", tr: "Geri", it: "Indietro" },
  error: { de: "Fehler", en: "Error", es: "Error", fr: "Erreur", pt: "Erro", ru: "Ошибка", tr: "Hata", it: "Errore" },
  saved: { de: "Gespeichert", en: "Saved", es: "Guardado", fr: "Sauvegardé", pt: "Salvo", ru: "Сохранено", tr: "Kaydedildi", it: "Salvato" },
  deleted: { de: "Gelöscht", en: "Deleted", es: "Eliminado", fr: "Supprimé", pt: "Excluído", ru: "Удалено", tr: "Silindi", it: "Eliminato" },
  loading: { de: "Laden...", en: "Loading...", es: "Cargando...", fr: "Chargement...", pt: "Carregando...", ru: "Загрузка...", tr: "Yükleniyor...", it: "Caricamento..." },
  
  // Navigation
  dashboard: { de: "Dashboard", en: "Dashboard", es: "Panel", fr: "Tableau de bord", pt: "Painel", ru: "Панель", tr: "Panel", it: "Dashboard" },
  nutrition: { de: "Ernährung", en: "Nutrition", es: "Nutrición", fr: "Nutrition", pt: "Nutrição", ru: "Питание", tr: "Beslenme", it: "Nutrizione" },
  jogging: { de: "Jogging", en: "Jogging", es: "Jogging", fr: "Jogging", pt: "Corrida", ru: "Бег", tr: "Koşu", it: "Jogging" },
  weight: { de: "Gewicht", en: "Weight", es: "Peso", fr: "Poids", pt: "Peso", ru: "Вес", tr: "Ağırlık", it: "Peso" },
  calendar: { de: "Kalender", en: "Calendar", es: "Calendario", fr: "Calendrier", pt: "Calendário", ru: "Календарь", tr: "Takvim", it: "Calendario" },
  settings: { de: "Einstellungen", en: "Settings", es: "Ajustes", fr: "Paramètres", pt: "Configurações", ru: "Настройки", tr: "Ayarlar", it: "Impostazioni" },
  
  // Dashboard
  startWorkout: { de: "Starte dein Workout heute", en: "Start your Workout Today", es: "Comienza tu entrenamiento hoy", fr: "Commence ton entraînement aujourd'hui", pt: "Comece seu treino hoje", ru: "Начни тренировку сегодня", tr: "Bugün antrenmanına başla", it: "Inizia il tuo allenamento oggi" },
  upperBody: { de: "Oberkörper", en: "Upper Body", es: "Tren superior", fr: "Haut du corps", pt: "Parte superior", ru: "Верх тела", tr: "Üst vücut", it: "Parte superiore" },
  middleBody: { de: "Mittlerer Körper", en: "Middle Body", es: "Core", fr: "Core", pt: "Core", ru: "Корпус", tr: "Orta vücut", it: "Core" },
  lowerBody: { de: "Unterkörper", en: "Lower Body", es: "Tren inferior", fr: "Bas du corps", pt: "Parte inferior", ru: "Низ тела", tr: "Alt vücut", it: "Parte inferiore" },
  
  // Nutrition
  calories: { de: "Kalorien", en: "Calories", es: "Calorías", fr: "Calories", pt: "Calorias", ru: "Калории", tr: "Kalori", it: "Calorie" },
  protein: { de: "Protein", en: "Protein", es: "Proteína", fr: "Protéine", pt: "Proteína", ru: "Белок", tr: "Protein", it: "Proteine" },
  water: { de: "Wasser", en: "Water", es: "Agua", fr: "Eau", pt: "Água", ru: "Вода", tr: "Su", it: "Acqua" },
  fats: { de: "Fette", en: "Fats", es: "Grasas", fr: "Graisses", pt: "Gorduras", ru: "Жиры", tr: "Yağlar", it: "Grassi" },
  vitamins: { de: "Vitamine", en: "Vitamins", es: "Vitaminas", fr: "Vitamines", pt: "Vitaminas", ru: "Витамины", tr: "Vitaminler", it: "Vitamine" },
  supplements: { de: "Supplements", en: "Supplements", es: "Suplementos", fr: "Suppléments", pt: "Suplementos", ru: "Добавки", tr: "Takviyeler", it: "Integratori" },
  vegetarian: { de: "Vegetarisch", en: "Vegetarian", es: "Vegetariano", fr: "Végétarien", pt: "Vegetariano", ru: "Вегетарианский", tr: "Vejetaryen", it: "Vegetariano" },
  vegan: { de: "Vegan", en: "Vegan", es: "Vegano", fr: "Végan", pt: "Vegano", ru: "Веганский", tr: "Vegan", it: "Vegano" },
  todayMealPlan: { de: "Heutiger Essensplan", en: "Today's Meal Plan", es: "Plan de comidas de hoy", fr: "Plan de repas du jour", pt: "Plano de refeições de hoje", ru: "План питания на сегодня", tr: "Bugünün yemek planı", it: "Piano pasti di oggi" },
  
  // Weight Tracker
  weightTracker: { de: "Gewichtskontrolle", en: "Weight Tracker", es: "Seguimiento de peso", fr: "Suivi du poids", pt: "Rastreador de peso", ru: "Трекер веса", tr: "Kilo takibi", it: "Tracciamento peso" },
  recordWeight: { de: "Neues Gewicht eintragen", en: "Record New Weight", es: "Registrar nuevo peso", fr: "Enregistrer nouveau poids", pt: "Registrar novo peso", ru: "Записать новый вес", tr: "Yeni kilo kaydet", it: "Registra nuovo peso" },
  weightHistory: { de: "Gewichtsverlauf", en: "Weight History", es: "Historial de peso", fr: "Historique du poids", pt: "Histórico de peso", ru: "История веса", tr: "Kilo geçmişi", it: "Storico peso" },
  
  // Jogging
  joggingTracker: { de: "Jogging Tracker", en: "Jogging Tracker", es: "Rastreador de jogging", fr: "Traqueur de jogging", pt: "Rastreador de corrida", ru: "Трекер бега", tr: "Koşu takipçisi", it: "Tracker jogging" },
  distance: { de: "Distanz", en: "Distance", es: "Distancia", fr: "Distance", pt: "Distância", ru: "Дистанция", tr: "Mesafe", it: "Distanza" },
  time: { de: "Zeit", en: "Time", es: "Tiempo", fr: "Temps", pt: "Tempo", ru: "Время", tr: "Süre", it: "Tempo" },
  history: { de: "Verlauf", en: "History", es: "Historial", fr: "Historique", pt: "Histórico", ru: "История", tr: "Geçmiş", it: "Cronologia" },
  
  // Settings
  editProfile: { de: "Profil bearbeiten", en: "Edit Profile", es: "Editar perfil", fr: "Modifier le profil", pt: "Editar perfil", ru: "Редактировать профиль", tr: "Profili düzenle", it: "Modifica profilo" },
  subscription: { de: "Abo", en: "Subscription", es: "Suscripción", fr: "Abonnement", pt: "Assinatura", ru: "Подписка", tr: "Abonelik", it: "Abbonamento" },
  notifications: { de: "Benachrichtigungen", en: "Notifications", es: "Notificaciones", fr: "Notifications", pt: "Notificações", ru: "Уведомления", tr: "Bildirimler", it: "Notifiche" },
  language: { de: "Sprache", en: "Language", es: "Idioma", fr: "Langue", pt: "Idioma", ru: "Язык", tr: "Dil", it: "Lingua" },
  privacy: { de: "Datenschutz & Sicherheit", en: "Privacy & Security", es: "Privacidad y seguridad", fr: "Confidentialité et sécurité", pt: "Privacidade e segurança", ru: "Конфиденциальность", tr: "Gizlilik ve güvenlik", it: "Privacy e sicurezza" },
  logout: { de: "Abmelden", en: "Logout", es: "Cerrar sesión", fr: "Déconnexion", pt: "Sair", ru: "Выйти", tr: "Çıkış yap", it: "Esci" },
  
  // Features
  performance: { de: "Performance", en: "Performance", es: "Rendimiento", fr: "Performance", pt: "Desempenho", ru: "Производительность", tr: "Performans", it: "Performance" },
  learnMore: { de: "Mehr erfahren", en: "Learn more", es: "Saber más", fr: "En savoir plus", pt: "Saiba mais", ru: "Узнать больше", tr: "Daha fazla bilgi", it: "Scopri di più" },
};

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
  isGerman: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const languages = [
  { code: "de" as const, name: "Deutsch", flag: "🇩🇪" },
  { code: "en" as const, name: "English", flag: "🇬🇧" },
  { code: "es" as const, name: "Español", flag: "🇪🇸" },
  { code: "fr" as const, name: "Français", flag: "🇫🇷" },
  { code: "pt" as const, name: "Português", flag: "🇵🇹" },
  { code: "ru" as const, name: "Русский", flag: "🇷🇺" },
  { code: "tr" as const, name: "Türkçe", flag: "🇹🇷" },
  { code: "it" as const, name: "Italiano", flag: "🇮🇹" },
];

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<LanguageCode>("en");

  useEffect(() => {
    const loadLanguage = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.user_metadata?.language) {
        const lang = session.user.user_metadata.language as LanguageCode;
        if (languages.some(l => l.code === lang)) {
          setLanguageState(lang);
        }
      }
    };
    loadLanguage();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user?.user_metadata?.language) {
        const lang = session.user.user_metadata.language as LanguageCode;
        if (languages.some(l => l.code === lang)) {
          setLanguageState(lang);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const setLanguage = async (lang: LanguageCode) => {
    setLanguageState(lang);
    await supabase.auth.updateUser({
      data: { language: lang }
    });
  };

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) return key;
    return translation[language] || translation.en || key;
  };

  const isGerman = language === "de";

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isGerman }}>
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
