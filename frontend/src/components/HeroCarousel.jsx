import { useState, useEffect } from "react";

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      image:
        "https://pharma-shop.tn/themes/pharmashop/assets/img/modules/appagebuilder/images/NUTRI.png",
    },
    {
      id: 2,
      image:
        "https://www.maparatunisie.tn/wp-content/uploads/2025/01/Maman-et-Bebe-1536x521.avif",
    },
    {
      id: 3,
      image:
        "https://www.maparatunisie.tn/wp-content/uploads/2024/12/Banner-ANTI-TACHES-MAPARATUNISIE-1536x521.avif",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const goToSlide = (index) => setCurrentSlide(index);

  return (
    <div className="p-3 sm:px-5 sm:py-4 md:px-5 md:py-5 max-w-[1500px] mx-auto">
      <div className="relative aspect-[3/1] sm:h-[320px] sm:aspect-auto md:h-[450px] rounded-[5px] overflow-hidden">
        {/* Piste glissante */}
        <div
          className="flex h-full transition-transform duration-700 ease-in-out"
          style={{
            width: `${slides.length * 100}%`,
            transform: `translateX(-${currentSlide * (100 / slides.length)}%)`,
          }}
        >
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className="h-full flex-shrink-0"
              style={{ width: `${100 / slides.length}%` }}
            >
              <img
                src={slide.image}
                alt=""
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "auto"}
                decoding="async"
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>

        {/* Indicateurs (Dots) */}
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
      </div>
    </div>
  );
};

export default HeroCarousel;
