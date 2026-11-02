import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const MetaPixelTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // On vérifie que window.fbq existe (chargé par index.html)
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "PageView");
    }
  }, [location.pathname]); // Se déclenche à chaque changement d'URL

  return null; // Ce composant n'affiche rien
};

export default MetaPixelTracker;
