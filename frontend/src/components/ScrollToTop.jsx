import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const MAX_WAIT_MS = 8000; // filet de sécurité absolu
const STABLE_DELAY_MS = 450; // arrête d'observer si la hauteur ne bouge plus pendant ce délai

export default function ScrollToTop() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  const pathnameRef = useRef(pathname);
  const scrollRafRef = useRef(null);
  const cleanupRef = useRef(null);

  // Empêche le navigateur de restaurer lui-même le scroll au chargement
  // initial — on gère la restauration nous-mêmes.
  useLayoutEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  // Sauvegarde EN CONTINU la position de scroll de la page affichée. Un
  // listener "beforeunload" ne se déclenche jamais lors d'une navigation
  // interne React Router — seulement au vrai rechargement/fermeture.
  useEffect(() => {
    const onScroll = () => {
      if (scrollRafRef.current) return;
      scrollRafRef.current = requestAnimationFrame(() => {
        sessionStorage.setItem(
          `scroll_${pathnameRef.current}`,
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

  useEffect(() => {
    // Annule toute restauration en cours d'une navigation précédente
    cleanupRef.current?.();
    cleanupRef.current = null;

    if (navigationType === "POP") {
      const saved = sessionStorage.getItem(`scroll_${pathname}`);
      if (saved !== null) {
        const target = parseInt(saved, 10);
        let userScrolled = false;
        let stableTimer = null;
        let hardTimer = null;

        const applyScroll = () => {
          if (userScrolled) return;
          // N'applique le scroll que si la page est déjà assez haute pour
          // contenir réellement la position cible — sinon le navigateur
          // clamperait le scroll au maximum possible (souvent en plein sur
          // le Footer, pendant que le contenu réel est encore en train de
          // charger, ex: sur Home avec son spinner initial très court).
          const maxScroll =
            document.documentElement.scrollHeight - window.innerHeight;
          if (maxScroll >= target) {
            window.scrollTo(0, target);
            return true;
          }
          return false;
        };

        const onUserScroll = () => {
          userScrolled = true;
          stop();
        };

        // Réapplique le scroll à chaque fois que la hauteur de la page
        // change (images qui se chargent, appels API qui aboutissent,
        // sections qui apparaissent...) — couvre les pages lentes comme
        // Home, sans dépendre d'un délai fixe qui pourrait être trop court.
        const observer = new ResizeObserver(() => {
          const applied = applyScroll();
          // Ne déclenche le minuteur de stabilisation qu'une fois le
          // scroll réellement appliqué au moins une fois — avant ça, la
          // page grandit normalement et ce n'est pas encore "stable".
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

        window.addEventListener("wheel", onUserScroll, { once: true });
        window.addEventListener("touchmove", onUserScroll, { once: true });
        observer.observe(document.body);
        applyScroll();
        // Filet de sécurité absolu : si la page n'atteint jamais la
        // hauteur nécessaire (ex: moins de contenu qu'avant), scrolle
        // quand même au clamp maximum plutôt que de rester en haut.
        hardTimer = setTimeout(() => {
          if (!userScrolled) window.scrollTo(0, target);
          stop();
        }, MAX_WAIT_MS);

        cleanupRef.current = stop;
      }
      pathnameRef.current = pathname;
      return;
    }

    // "PUSH" ou "REPLACE" = navigation classique (clic sur un lien,
    // changement de filtre...) → toujours remonter en haut.
    window.scrollTo(0, 0);
    pathnameRef.current = pathname;
  }, [pathname, navigationType]);

  useEffect(() => () => cleanupRef.current?.(), []);

  return null;
}
