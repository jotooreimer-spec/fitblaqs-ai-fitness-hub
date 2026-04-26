import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const clearStalePreviewCaches = async () => {
  if (!import.meta.env.DEV || typeof window === "undefined") return false;

  const cacheKey = "fitblaqs-preview-cache-cleared";
  if ( sessionStorage.getItem(cacheKey) === "true") return false;

  try {
    const registrations = await navigator.serviceWorker?.getRegistrations?.();
    await Promise.all(registrations?.map((registration) => registration.unregister()) ?? []);

    if ("caches" in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
    }

    sessionStorage.setItem(cacheKey, "true");
    window.location.reload();
    return true;
  } catch (error) {
    console.warn("Unable to clear stale preview caches", error);
    return false;
  }
};

const bootstrap = async () => {
  if (await clearStalePreviewCaches()) return;

  const container = document.getElementById("root");
  if (container) {
    const root = createRoot(container);
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  }
};

bootstrap();
