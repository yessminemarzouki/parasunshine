import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const MAX_WAIT_MS = 8000;
const STABLE_DELAY_MS = 800; // ✅ Augmenté pour laisser le temps aux images

export default function ScrollToTop() {
  const { pathname, search } = useLocation();
  const navigationType = useNavigationType();
  const locationKey = `${pathname}${search}`;
  const locationKeyRef = useRef(locationKey);
  const scrollRafRef = useRef(null);
  const cleanupRef = useRef(null);

  useLayoutEffect(() => {
    if (
      typeof window !== "undefined" &&
      "scrollRestoration" in window.history
    ) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  // Sauvegarde en continu le scroll
  useEffect(() => {
    const onScroll = () => {
      if (scrollRafRef.current) return;
      scrollRafRef.current = requestAnimationFrame(() => {
        sessionStorage.setItem(
          `scroll_${locationKeyRef.current}`,
          String(window.scrollY),
        );
        scrollRafRef.current = null;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
    };
  }, []);

  // Restauration sur POP (retour navigateur)
  useEffect(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;

    if (navigationType === "POP") {
      const saved = sessionStorage.getItem(`scroll_${locationKey}`);
      if (saved !== null) {
        const target = parseInt(saved, 10);
        let userScrolled = false;
        let stableTimer = null;
        let hardTimer = null;
        let lastAppliedY = 0;

        const applyScroll = () => {
          if (userScrolled) return false;
          const maxScroll =
            document.documentElement.scrollHeight - window.innerHeight;
          if (maxScroll >= target) {
            window.scrollTo(0, target);
            lastAppliedY = window.scrollY;
            return true;
          }
          return false;
        };

        const onUserScroll = () => {
          // ✅ Ne déclenche que si l'utilisateur a réellement bougé (tolérance 20px)
          if (Math.abs(window.scrollY - lastAppliedY) > 20) {
            userScrolled = true;
            stop();
          }
        };

        const observer = new ResizeObserver(() => {
          const applied = applyScroll();
          if (applied) {
            clearTimeout(stableTimer);
            stableTimer = setTimeout(stop, STABLE_DELAY_MS);
          }
        });

        function stop() {
          observer.disconnect();
          clearTimeout(stableTimer);
          clearTimeout(hardTimer);
          window.removeEventListener("wheel", onUserScroll);
          window.removeEventListener("touchmove", onUserScroll);
        }

        // ✅ Sans `once: true` → plus fiable
        window.addEventListener("wheel", onUserScroll, { passive: true });
        window.addEventListener("touchmove", onUserScroll, { passive: true });
        observer.observe(document.body);
        applyScroll();

        hardTimer = setTimeout(() => {
          if (!userScrolled) window.scrollTo(0, target);
          stop();
        }, MAX_WAIT_MS);

        cleanupRef.current = stop;
      }
      locationKeyRef.current = locationKey;
      return;
    }

    // PUSH/REPLACE → remonte en haut
    window.scrollTo(0, 0);
    locationKeyRef.current = locationKey;
  }, [locationKey, navigationType]);

  useEffect(() => () => cleanupRef.current?.(), []);

  return null;
}
