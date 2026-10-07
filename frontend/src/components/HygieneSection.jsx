import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";
import { STORAGE_URL } from "../config/api";
import api from "../services/api";

export default function HygieneSection() {
  const [sections, setSections] = useState([]);

  useEffect(() => {
    api
      .get("/hygiene-section")
      .then((res) => setSections(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
  }, []);

  if (sections.length === 0) return null;

  return (
    <>
      {sections.map((config) => (
        <SingleHygieneSection key={config.id} config={config} />
      ))}
    </>
  );
}

function SingleHygieneSection({ config }) {
  const [activeTab, setActiveTab] = useState(config.tabs?.[0]?.slug || null);
  const [products, setProducts] = useState([]);
  const [scrollIndex, setScrollIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeTab) return;
    fetchProducts(activeTab);
  }, [activeTab]);

  const shuffleArray = (arr) => {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const fetchProducts = async (slug) => {
    try {
      setLoading(true);
      const res = await api.get("/products", { params: { category: slug } });
      setProducts(shuffleArray(res.data.data || res.data));
      setScrollIndex(0);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const tabs = config.tabs || [];
  const visibleProducts = products.slice(0, 12);
  const canLeft = scrollIndex > 0;
  const canRight = scrollIndex < visibleProducts.length - 4;

  const handleTabScroll = (e) => {
    const el = e.currentTarget;
    const cardWidth = el.firstChild?.offsetWidth || 1;
    const gap = 12;
    setScrollIndex(Math.round(el.scrollLeft / (cardWidth + gap)));
  };

  return (
    <section
      className="py-16 border-t border-gray-100"
      style={{ background: config.background_color }}
    >
      <div
        style={{ maxWidth: 1300, margin: "0 auto" }}
        className="px-4 md:px-8"
      >
        {/* Header */}
        <div className="mb-8">
          <h2
            className="text-[1.6rem] font-bold"
            style={{
              fontFamily: "Segoe UI, sans-serif",
              color: config.title_color,
            }}
          >
            {config.title}
          </h2>
        </div>

        {/* Contenu */}
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 lg:gap-8">
          {/* Image gauche */}
          <div className="relative rounded-2xl overflow-hidden hidden sm:block h-[220px] lg:h-[400px]">
            <img
              src={
                config.image
                  ? `${STORAGE_URL}/${config.image}`
                  : "https://www.cdc.gov/respiratory-viruses/media/images/4.png"
              }
              alt={config.title}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Droite — onglets + produits */}
          <div className="flex flex-col gap-5">
            {/* Onglets avec scroll horizontal */}
            <div
              className="hygiene-tabs flex border-b border-gray-200 overflow-x-auto"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: `${config.tab_active_color}40 transparent`,
                gap: "0px",
              }}
            >
              {tabs.map((tab) => (
                <button
                  key={tab.slug}
                  onClick={() => setActiveTab(tab.slug)}
                  className={`pb-4 text-[14px] md:text-[15px] font-semibold transition-all border-b-2 -mb-px flex-shrink-0 whitespace-nowrap ${
                    activeTab === tab.slug
                      ? "border-current"
                      : "border-transparent text-gray-800 hover:opacity-80"
                  }`}
                  style={{
                    ...(activeTab === tab.slug
                      ? {
                          color: config.tab_active_color,
                          borderColor: config.tab_active_color,
                        }
                      : {}),
                    flex: 1,
                    textAlign: "center",
                    minWidth: "fit-content",
                    padding: "0 16px 16px 16px",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Produits */}
            {loading ? (
              <div
                className="flex items-center justify-center"
                style={{ minHeight: 300 }}
              >
                <div
                  className="w-10 h-10 rounded-full animate-spin"
                  style={{
                    border: "3px solid #f3f4f6",
                    borderTopColor: config.tab_active_color,
                  }}
                />
              </div>
            ) : visibleProducts.length > 0 ? (
              <div className="relative px-0 lg:px-0">
                <button
                  onClick={() => setScrollIndex(Math.max(0, scrollIndex - 1))}
                  disabled={!canLeft}
                  className="hidden lg:flex absolute left-[-18px] top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-md items-center justify-center transition-all hover:text-white hover:border-transparent disabled:opacity-30 disabled:cursor-not-allowed"
                  onMouseEnter={(e) => {
                    if (canLeft)
                      e.currentTarget.style.background =
                        "linear-gradient(135deg, #2d7a5f 0%, #3f9973 100%)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "white";
                  }}
                >
                  <ChevronLeft size={18} />
                </button>

                {/* Mobile/tablette : carrousel glissable au doigt */}
                <div
                  onScroll={handleTabScroll}
                  className="flex lg:hidden gap-3 overflow-x-auto snap-x snap-mandatory pb-1 scrollbar-hide"
                >
                  {visibleProducts.map((p) => (
                    <div
                      key={p.id}
                      className="flex-none w-[46%] sm:w-[31%] snap-start"
                    >
                      <ProductCard product={p} />
                    </div>
                  ))}
                </div>

                {/* Desktop : grille avec flèches */}
                <div className="hidden lg:grid grid-cols-4 gap-4">
                  {visibleProducts
                    .slice(scrollIndex, scrollIndex + 4)
                    .map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                </div>

                <button
                  onClick={() =>
                    setScrollIndex(
                      Math.min(visibleProducts.length - 4, scrollIndex + 1),
                    )
                  }
                  disabled={!canRight}
                  className="hidden lg:flex absolute right-[-18px] top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-md items-center justify-center transition-all hover:text-white hover:border-transparent disabled:opacity-30 disabled:cursor-not-allowed"
                  onMouseEnter={(e) => {
                    if (canRight)
                      e.currentTarget.style.background =
                        "linear-gradient(135deg, #2d7a5f 0%, #3f9973 100%)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "white";
                  }}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            ) : (
              <div
                className="flex items-center justify-center text-gray-400 text-[14px]"
                style={{ minHeight: 300 }}
              >
                Aucun produit dans cette catégorie
              </div>
            )}

            {activeTab && (
              <div className="flex justify-end">
                <a
                  href={`/products?category=${activeTab}`}
                  className="text-[13px] font-semibold hover:opacity-70 transition-opacity"
                  style={{ color: config.tab_active_color }}
                >
                  Voir tout →
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .hygiene-tabs::-webkit-scrollbar { display: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { scrollbar-width: none; -ms-overflow-style: none; }
      `}</style>
    </section>
  );
}
