import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { STORAGE_URL } from "../config/api";
import { getHeroSlides } from "../services/api";

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ 1. On précharge la première image dès que le composant est monté
  // (même si l'API n'a pas encore répondu)
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    // On suppose que la première image est /storage/... si l'API renvoie un chemin
    // On utilise une URL de fallback si l'API met du temps
    link.href = `${STORAGE_URL}/hero-fallback.webp`; // ⚠️ À adapter
    link.fetchPriority = "high";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  useEffect(() => {
    getHeroSlides()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setSlides(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Sur mobile (< 768px), on ne rend pas le carrousel.
  // L'image statique dans index.html prend le relais pour un LCP ultra-rapide.
  if (typeof window !== "undefined" && window.innerWidth < 768) {
    return null;
  }

  if (loading || slides.length === 0) return null;

  const goToSlide = (index) => setCurrentSlide(index);

  const getImageUrl = (image) => {
    if (!image) return "";
    if (image.startsWith("http")) return image;
    return `${STORAGE_URL}/${image}`;
  };

  return (
    <div className="p-3 sm:px-5 sm:py-4 md:px-5 md:py-5 max-w-[1500px] mx-auto">
      <div className="relative w-full h-[200px] sm:h-[320px] md:h-[450px] rounded-[5px] overflow-hidden bg-gray-100">
        <div
          className="flex h-full transition-transform duration-700 ease-in-out"
          style={{
            width: `${slides.length * 100}%`,
            transform: `translateX(-${currentSlide * (100 / slides.length)}%)`,
          }}
        >
          {slides.map((slide, index) => {
            const imgElement = (
              <>
                <img
                  src={getImageUrl(slide.image)}
                  alt={slide.title || ""}
                  width="1200"
                  height="450"
                  loading={index === 0 ? "eager" : "lazy"}
                  fetchPriority={index === 0 ? "high" : "auto"}
                  decoding="async"
                  className="w-full h-full object-cover"
                />
                {(slide.title || slide.subtitle || slide.button_text) && (
                  <div
                    className="absolute inset-0 flex flex-col justify-center items-start p-6 md:p-16"
                    style={{
                      background:
                        "linear-gradient(90deg, rgba(0,0,0,0.5) 0%, transparent 60%)",
                    }}
                  >
                    {slide.title && (
                      <h2 className="text-white text-[1.5rem] md:text-[2.5rem] font-bold mb-2 max-w-lg">
                        {slide.title}
                      </h2>
                    )}
                    {slide.subtitle && (
                      <p className="text-white/90 text-[13px] md:text-[16px] mb-4 max-w-md">
                        {slide.subtitle}
                      </p>
                    )}
                    {slide.button_text && (
                      <span className="bg-white text-[#1a5242] px-5 py-2.5 rounded-xl font-bold text-[13px] md:text-[14px]">
                        {slide.button_text}
                      </span>
                    )}
                  </div>
                )}
              </>
            );

            return (
              <div
                key={slide.id}
                className="relative h-full flex-shrink-0"
                style={{ width: `${100 / slides.length}%` }}
              >
                {slide.link ? (
                  <Link to={slide.link} className="block w-full h-full">
                    {imgElement}
                  </Link>
                ) : (
                  imgElement
                )}
              </div>
            );
          })}
        </div>

        {slides.length > 1 && (
          <div className="absolute bottom-4 md:bottom-5 left-1/2 -translate-x-1/2 flex gap-2.5 z-10">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                aria-label={`Aller à la diapositive ${index + 1}`}
                className={`h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? "w-6 bg-white"
                    : "w-3 bg-white/50 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroCarousel;
