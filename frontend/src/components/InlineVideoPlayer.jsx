import { useRef, useEffect, useState } from "react";
import { Volume2, VolumeX, Play, Pause, Loader2 } from "lucide-react";

/**
 * Lecteur vidéo inline réutilisé sur Home et Quiz — autoplay muet en boucle,
 * chargement anticipé avant l'entrée à l'écran, aucune requête réseau tant
 * que la section n'approche pas.
 */
export default function InlineVideoPlayer({
  src,
  poster,
  maxWidth = 900,
  // true = contexte déjà visible à l'écran (ex: résultat de quiz déjà
  // affiché) → charge immédiatement, pas besoin d'anticiper un scroll
  eager = false,
}) {
  const wrapperRef = useRef(null);
  const videoRef = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(eager);
  const [inView, setInView] = useState(eager);
  const [userPaused, setUserPaused] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const [muted, setMuted] = useState(true);

  // Démarre le chargement ~600px avant l'entrée réelle dans le viewport —
  // le buffer a le temps de se remplir avant que l'utilisateur arrive.
  useEffect(() => {
    if (eager) return;
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "600px 0px 600px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [eager]);

  // Pilote lecture/pause automatique selon la visibilité réelle
  useEffect(() => {
    if (eager) return;
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [eager]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (inView && !userPaused) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [inView, userPaused, shouldLoad]);

  const togglePlay = () => setUserPaused((p) => !p);
  const isPlaying = inView && !userPaused;

  return (
    <div
      ref={wrapperRef}
      className="relative rounded-2xl overflow-hidden mx-auto cursor-pointer group bg-gray-100"
      style={{ maxWidth, boxShadow: "0 8px 30px rgba(0,0,0,0.1)" }}
      onClick={togglePlay}
    >
      {shouldLoad ? (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          muted={muted}
          loop
          playsInline
          preload="auto"
          className="w-full h-auto block"
          onWaiting={() => setBuffering(true)}
          onPlaying={() => setBuffering(false)}
          onCanPlay={() => setBuffering(false)}
          onLoadedData={() => setBuffering(false)}
        />
      ) : (
        poster && <img src={poster} alt="" className="w-full h-auto block" />
      )}

      {shouldLoad && buffering && (inView || eager) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 pointer-events-none">
          <Loader2
            size={36}
            className="text-white animate-spin drop-shadow-lg"
          />
        </div>
      )}

      {shouldLoad && !isPlaying && !buffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity">
          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <Play size={26} className="text-[#1a5242] ml-1" fill="#1a5242" />
          </div>
        </div>
      )}

      {shouldLoad && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            aria-label={isPlaying ? "Mettre en pause" : "Lancer la lecture"}
            className="absolute bottom-3 left-3 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur flex items-center justify-center text-white transition-colors"
          >
            {isPlaying ? (
              <Pause size={15} fill="white" />
            ) : (
              <Play size={15} fill="white" className="ml-0.5" />
            )}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMuted((m) => !m);
            }}
            aria-label={muted ? "Activer le son" : "Couper le son"}
            className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur flex items-center justify-center text-white transition-colors"
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </>
      )}
    </div>
  );
}
