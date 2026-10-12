import { createContext, useContext, useEffect, useState } from "react";
import { getSiteSettings } from "../services/api";

const SiteSettingsContext = createContext(null);

const DEFAULTS = {
  address: "Route Gremda Km3, en face Clinique Chams, Sfax, Tunisie",
  phone: "+216 94 169 416",
  email: "parasunshine25@gmail.com",
  whatsapp: "+216 94 169 416",
  opening_hours: "Lun – Sam : 9h – 20h",
  facebook_url: "https://www.facebook.com/ParaSunShine",
  instagram_url: "https://www.instagram.com/para_sunshine_tunisie",
  tiktok_url: "",
  legal_form: "—",
  capital: "—",
  hosting_provider: "—",
  publication_director: "—",
};

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      getSiteSettings()
        .then((data) => {
          if (!cancelled && data) {
            setSettings({ ...DEFAULTS, ...data });
          }
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };

    load();

    // Refresh toutes les 5 minutes (au cas où l'admin modifie en direct)
    const interval = setInterval(load, 5 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <SiteSettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx) {
    // Fallback : retourne les defaults si le contexte n'est pas monté
    return { settings: DEFAULTS, loading: false };
  }
  return ctx;
}

export { DEFAULTS as SITE_SETTINGS_DEFAULTS };
