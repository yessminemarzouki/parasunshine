import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const MetaPixelTracker = () => {
  const location = useLocation();
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false; // le 1er PageView est déjà envoyé par index.html
      return;
    }
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "PageView");
    }
  }, [location.pathname]);

  return null;
};

export default MetaPixelTracker;
