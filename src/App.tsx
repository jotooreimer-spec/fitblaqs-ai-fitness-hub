import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { RealtimeProvider } from "./contexts/RealtimeContext";
import { LiveDataProvider } from "./contexts/LiveDataContext";
import Landing from "./pages/Landing";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Nutrition from "./pages/Nutrition";
import JoggingTracker from "./pages/JoggingTracker";
import CalendarPage from "./pages/CalendarPage";
import Settings from "./pages/Settings";
import TrainingDetail from "./pages/TrainingDetail";
import WeightTracker from "./pages/WeightTracker";
import ExerciseCategory from "./pages/ExerciseCategory";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Impressum from "./pages/Impressum";
import NotFound from "./pages/NotFound";
import CookieBanner from "./components/CookieBanner";
import BodyworkoutPlan from "./pages/BodyworkoutPlan";
import PostOnboardingLoading from "./pages/PostOnboardingLoading";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: true,
      retry: 3,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <RealtimeProvider>
        <LiveDataProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/loading" element={<PostOnboardingLoading />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/training/:muscleGroup" element={<TrainingDetail />} />
                <Route path="/exercise/:category" element={<ExerciseCategory />} />
                <Route path="/weight-tracker" element={<WeightTracker />} />
                <Route path="/nutrition" element={<Nutrition />} />
                <Route path="/jogging-tracker" element={<JoggingTracker />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/performance" element={<CalendarPage />} />
                <Route path="/bodyworkout-plan" element={<BodyworkoutPlan />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/impressum" element={<Impressum />} />
                <Route path="/legal" element={<Impressum />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <CookieBanner />
            </BrowserRouter>
          </TooltipProvider>
        </LiveDataProvider>
      </RealtimeProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
