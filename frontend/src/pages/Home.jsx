import { useState, useEffect, useRef, memo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cachedFetch } from "../utils/cache";
import api from "../services/api";
import { API_URL, STORAGE_URL } from "../config/api";
import {
  ChevronLeft,
  ChevronRight,
  Truck,
  HeadphonesIcon,
  Package,
  Star,
  Droplets,
  Sun,
  Baby,
  Leaf,
  Heart,
  Pill,
  Sparkles,
  Gift,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import ProductCard from "../components/ProductCard";
import HeroCarousel from "../components/HeroCarousel";
import HygieneSection from "../components/HygieneSection";
import HomeVideoSection from "../components/HomeVideoSection";

const CONCERNS = [
  {
    to: "/products?category=visage",
    label: "Soin Visage",
    icon: Sparkles,
    color: "#f87171",
    bg: "#fef2f2",
  },
  {
    to: "/products?category=corps",
    label: "Soin Corps",
    icon: Heart,
    color: "#f472b6",
    bg: "#fdf2f8",
  },
  {
    to: "/products?category=capillaire",
    label: "Soin Capillaire",
    icon: Leaf,
    color: "#34d399",
    bg: "#ecfdf5",
  },
  {
    to: "/products?category=solaire",
    label: "Protection Solaire",
    icon: Sun,
    color: "#fbbf24",
    bg: "#fffbeb",
  },
  {
    to: "/products?category=bebe-et-maman",
    label: "Bébé & Maman",
    icon: Baby,
    color: "#fb923c",
    bg: "#fff7ed",
  },
  {
    to: "/products?category=complements-alimentaires",
    label: "Compléments alimentaires",
    icon: Pill,
    color: "#2d5f4f",
    bg: "#f0fdf4",
  },
  {
    to: "/products?category=hygiene",
    label: "Hygiène",
    icon: Droplets,
    color: "#60a5fa",
    bg: "#eff6ff",
  },
  {
    to: "/products?category=paramedicaux",
    label: "Paramédicaux",
    icon: Star,
    color: "#a78bfa",
    bg: "#f5f3ff",
  },
];

const STATS = [
  {
    val: "500+",
    label: "Produits référencés",
    sub: "et en constante évolution",
  },
  { val: "99 DT", label: "Livraison gratuite dès", sub: "partout en Tunisie" },
  { val: "24h", label: "Réponse service client", sub: "du lundi au samedi" },
  {
    val: "100%",
    label: "Produits authentiques",
    sub: "garantis d'origine officielle",
  },
];

const SectionTitle = memo(({ children, light = false, style }) => (
  <h2
    className={`text-center text-[1.6rem] font-bold mb-6 md:mb-10 relative pb-5 md:pb-6 ${light ? "text-white" : "text-gray-900"}`}
    style={{
      fontFamily: "Segoe UI, sans-serif",
      letterSpacing: "-0.02em",
      ...style,
    }}
  >
    {children}
    {/* Ligne */}

    {/* Soleil SVG */}
    <span className="absolute -bottom-3 left-1/2 -translate-x-1/2">
      <svg width="40" height="35" viewBox="0 0 24 24" fill="none">
        {/* Rayons */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <line
            key={angle}
            x1="12"
            y1="2"
            x2="12"
            y2="4"
            stroke={light ? "#d4af37" : "#d4af37"}
            strokeWidth="2"
            strokeLinecap="round"
            transform={`rotate(${angle} 12 12)`}
          />
        ))}
        {/* Cercle jaune */}
        <circle cx="12" cy="12" r="5" fill="#d4af37" />
        {/* Croix verte */}
        <rect x="10.5" y="8.5" width="3" height="7" rx="0.5" fill="#1a5242" />
        <rect x="8.5" y="10.5" width="7" height="3" rx="0.5" fill="#1a5242" />
      </svg>
    </span>
  </h2>
));

export default function Home() {
  const navigate = useNavigate();
  const [clickedBrandId, setClickedBrandId] = useState(null);
  const marqueeRef = useRef(null);
  const clickedBrandTimeoutRef = useRef(null);
  const [data, setData] = useState({
    featured: [],
    newest: [],
    promotions: [],
    bestsellers: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [promoIdx, setPromoIdx] = useState(0);
  const promoScrollRef = useRef(null);
  const [mobilePromoActive, setMobilePromoActive] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  const fetchedRef = useRef(false);
  const [blogPosts, setBlogPosts] = useState([]);
  const [blogSectionVisible, setBlogSectionVisible] = useState(true);
  const [blogSlide, setBlogSlide] = useState(0); // ← index de page courante
  const blogScrollRef = useRef(null); // ← ref pour le scroll mobile
  const [mobileBlogActive, setMobileBlogActive] = useState(0); // ← page mobile
  const [promoSection, setPromoSection] = useState(null);
  const isLoggedIn = !!localStorage.getItem("auth_token");
  const [brands, setBrands] = useState([]);
  const [categoryShowcase, setCategoryShowcase] = useState([]);
  const [featuredVisible, setFeaturedVisible] = useState(true);
  const [shipping, setShipping] = useState({
    delivery_days_min: 2,
    delivery_days_max: 5,
  });
  const [homepageVideos, setHomepageVideos] = useState([]);

  const videoFor = (positionKey) =>
    homepageVideos.find((v) => v.position === positionKey);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchData();
  }, []);

  useEffect(() => {
    return () => clearTimeout(clickedBrandTimeoutRef.current);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const preloaded = sessionStorage.getItem("preloaded_home");
      const preloadedTime = sessionStorage.getItem("preloaded_home_time");
      if (
        preloaded &&
        preloadedTime &&
        Date.now() - parseInt(preloadedTime) < 30000
      ) {
        setData(JSON.parse(preloaded));
        sessionStorage.removeItem("preloaded_home");
        sessionStorage.removeItem("preloaded_home_time");
      } else {
        setData(await cachedFetch(`${API_URL}/home`));
      }

      // Tous ces appels passent désormais par cachedFetch (comme /home
      // déjà), avec son cache mémoire de 5 minutes — évite de refaire ces
      // 6 requêtes réseau à chaque retour sur Home, alors que React
      // Router démonte/remonte entièrement le composant à la navigation.
      const [
        blogData,
        brandsData,
        promoData,
        showcaseData,
        featuredData,
        shippingData,
        videosData,
      ] = await Promise.all([
        cachedFetch(`${API_URL}/blog`),
        cachedFetch(`${API_URL}/brands`),
        cachedFetch(`${API_URL}/promo-section`),
        cachedFetch(`${API_URL}/category-showcase`),
        cachedFetch(`${API_URL}/featured-section`),
        cachedFetch(`${API_URL}/shipping-settings`),
        cachedFetch(`${API_URL}/homepage-videos`),
      ]);

      setBrands(brandsData);
      setBlogPosts(blogData.posts || []);
      setBlogSectionVisible(blogData.section_visible ?? true);
      setPromoSection(promoData);
      setCategoryShowcase(showcaseData);
      setFeaturedVisible(featuredData.visible !== false);
      setShipping(shippingData);
      setHomepageVideos(videosData || []);
    } catch {
      setError("Impossible de charger les produits");
    } finally {
      setLoading(false);
    }
  };
  const handlePromoScroll = () => {
    const el = promoScrollRef.current;
    if (!el) return;
    const cardWidth = el.firstChild?.offsetWidth || 1;
    const gap = 12;
    const cardIndex = Math.round(el.scrollLeft / (cardWidth + gap));
    const pageIndex = Math.round(cardIndex / MOBILE_CARDS_PER_VIEW);
    setMobilePromoActive(pageIndex);
  };

  const scrollToPromoPage = (pageIndex) => {
    const el = promoScrollRef.current;
    if (!el) return;
    const cardWidth = el.firstChild?.offsetWidth || 1;
    const gap = 12;
    const cardIndex = pageIndex * MOBILE_CARDS_PER_VIEW;
    el.scrollTo({ left: cardIndex * (cardWidth + gap), behavior: "smooth" });
  };
  const MOBILE_CARDS_PER_VIEW = 2;

  const handleBrandClick = (brand) => {
    // Sur mobile (< 768px) : redirection directe avec filtre marque
    if (window.innerWidth < 768) {
      navigate(`/products?brand=${brand.slug}`);
      return;
    }

    // Sur desktop : double-clic pour rediriger
    if (clickedBrandId === brand.id) {
      clearTimeout(clickedBrandTimeoutRef.current);
      navigate(`/products?brand=${brand.slug}`);
      return;
    }

    setClickedBrandId(brand.id);
    if (marqueeRef.current) {
      marqueeRef.current.style.animationPlayState = "paused";
    }

    clearTimeout(clickedBrandTimeoutRef.current);
    clickedBrandTimeoutRef.current = setTimeout(() => {
      setClickedBrandId(null);
      if (marqueeRef.current) {
        marqueeRef.current.style.animationPlayState = "running";
      }
    }, 4000);
  };
  // ── Navigation blog carrousel ──
  const CARDS_PER_PAGE_DESKTOP = 3;
  const CARDS_PER_PAGE_MOBILE = 1;

  const blogTotalPages = Math.ceil(blogPosts.length / CARDS_PER_PAGE_DESKTOP);

  const handleBlogScroll = () => {
    const el = blogScrollRef.current;
    if (!el) return;
    const cardWidth = el.firstChild?.offsetWidth || 1;
    const gap = 20;
    const cardIndex = Math.round(el.scrollLeft / (cardWidth + gap));
    const pageIndex = Math.round(cardIndex / CARDS_PER_PAGE_MOBILE);
    setMobileBlogActive(pageIndex);
  };

  const scrollToBlogPage = (pageIndex) => {
    const el = blogScrollRef.current;
    if (!el) return;
    const cardWidth = el.firstChild?.offsetWidth || 1;
    const gap = 20;
    const cardIndex = pageIndex * CARDS_PER_PAGE_MOBILE;
    el.scrollTo({ left: cardIndex * (cardWidth + gap), behavior: "smooth" });
  };

  const promoProducts = data.promotions || [];
  const featuredProducts = data.featured || [];
  const bestsellers = data.bestsellers || [];
  const maxIdx = Math.max(0, promoProducts.length - 5);

  if (loading)
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div
          className="w-12 h-12 rounded-full animate-spin"
          style={{ border: "4px solid #f3f4f6", borderTopColor: "#1a5242" }}
        />
        <p className="text-gray-400">Chargement...</p>
      </div>
    );

  if (error)
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="text-red-500 text-lg">{error}</p>
        <button
          onClick={fetchData}
          className="px-6 py-2.5 bg-[#1a5242] text-white rounded-lg font-semibold hover:opacity-90"
        >
          Réessayer
        </button>
      </div>
    );

  return (
    <div className="bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── Hero ── */}
      <HeroCarousel />
      <HomeVideoSection video={videoFor("after_hero")} />

      {/* ── Catégories showcase ── */}
      {categoryShowcase.length > 0 && (
        <section className="py-12 bg-white">
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px" }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
              {categoryShowcase.map(({ id, link, image, title, subtitle }) => (
                <Link
                  key={id}
                  to={link}
                  className="relative h-48 sm:h-56 lg:h-64 rounded-lg overflow-hidden block group"
                  style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}
                >
                  <img
                    src={`${STORAGE_URL}/${image}`}
                    alt={title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div
                    className="absolute inset-0 flex flex-col justify-end p-8"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.85), transparent)",
                    }}
                  >
                    <h3
                      className="text-white text-[1.4rem] mb-1.5"
                      style={{
                        fontWeight: 530,
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      {title}
                    </h3>
                    {subtitle && (
                      <p className="text-white/90 text-[0.95rem]">{subtitle}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
      <HomeVideoSection video={videoFor("after_category_showcase")} />

      {/* ── Top Promo Carrousel ── */}
      {promoSection?.visible && promoSection.products?.length > 0 && (
        <section
          className="py-10"
          style={{ background: promoSection.background_color }}
        >
          <div
            className="relative mx-auto px-5 md:px-14"
            style={{ maxWidth: 1400 }}
          >
            <SectionTitle
              style={{
                color: promoSection.title_color,
                fontSize: "1.8rem",
              }}
            >
              {promoSection.title}
            </SectionTitle>

            <button
              onClick={() => setPromoIdx((p) => Math.max(p - 1, 0))}
              disabled={promoIdx === 0}
              className="hidden md:flex absolute left-0 top-[calc(50%+24px)] -translate-y-1/2 w-11 h-11 rounded-full bg-white border-2 border-black/10 items-center justify-center z-10 shadow-md transition-all hover:bg-[#1a5242] hover:text-white hover:border-[#1a5242] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
            </button>

            <div
              ref={promoScrollRef}
              onScroll={handlePromoScroll}
              className="overflow-x-auto md:overflow-hidden w-full pt-2 pb-4 md:py-3 snap-x snap-mandatory md:snap-none scrollbar-hide"
            >
              <div
                className="flex gap-3 md:gap-6 transition-transform duration-400"
                style={
                  isDesktop
                    ? { transform: `translateX(-${promoIdx * 20}%)` }
                    : undefined
                }
              >
                {promoSection.products.map((p) => (
                  <div
                    key={p.id}
                    className="flex-none w-[46%] sm:w-[32%] md:w-auto snap-start"
                    style={
                      isDesktop
                        ? { width: "calc((100% - 96px) / 5)" }
                        : undefined
                    }
                  >
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
            </div>

            <div className="md:hidden flex justify-center gap-1.5 mt-1">
              {Array.from({
                length: Math.ceil(
                  promoSection.products.length / MOBILE_CARDS_PER_VIEW,
                ),
              }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => scrollToPromoPage(i)}
                  aria-label={`Aller à la page ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    mobilePromoActive === i
                      ? "w-5 bg-[#1a5242]"
                      : "w-1.5 bg-[#1a5242]/25"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() =>
                setPromoIdx((p) =>
                  Math.min(
                    p + 1,
                    Math.max(0, promoSection.products.length - 5),
                  ),
                )
              }
              disabled={
                promoIdx >= Math.max(0, promoSection.products.length - 5)
              }
              className="hidden md:flex absolute right-0 top-[calc(50%+24px)] -translate-y-1/2 w-11 h-11 rounded-full bg-white border-2 border-black/10 items-center justify-center z-10 shadow-md transition-all hover:bg-[#1a5242] hover:text-white hover:border-[#1a5242] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </section>
      )}
      <HomeVideoSection video={videoFor("after_top_promo")} />

      {/* ── Meilleures Ventes ── */}
      {bestsellers.length > 0 && (
        <section className="py-16 bg-white">
          <div style={{ maxWidth: 1300, margin: "0 auto", padding: "0 20px" }}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "#fef2f2" }}
                  >
                    <TrendingUp size={16} className="text-red-500" />
                  </div>
                  <span className="text-[11.5px] font-bold uppercase tracking-widest text-red-500">
                    Les plus vendus
                  </span>
                </div>
                <h2
                  className="text-[1.6rem] font-bold text-gray-900"
                  style={{ fontFamily: "Segoe UI, sans-serif" }}
                >
                  Meilleures ventes
                </h2>
              </div>
              <Link
                to="/products?bestseller=true"
                className="flex items-center gap-2 text-[13.5px] font-semibold hover:gap-3 transition-all"
                style={{ color: "#1a5242" }}
              >
                Voir tout <ArrowRight size={15} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6">
              {bestsellers.slice(0, isDesktop ? 8 : 14).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
      <HomeVideoSection video={videoFor("after_bestsellers")} />

      {/* ── Sélection Vedette ── */}
      {featuredVisible && featuredProducts.length > 0 && (
        <section className="py-16 bg-white">
          <div style={{ maxWidth: 1300, margin: "0 auto", padding: "0 20px" }}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "#fdf9ec" }}
                  >
                    <Star
                      size={16}
                      style={{ color: "#d4af37" }}
                      fill="#d4af37"
                    />
                  </div>
                  <span
                    className="text-[11.5px] font-bold uppercase tracking-widest"
                    style={{ color: "#d4af37" }}
                  >
                    Sélection ParaSunshine
                  </span>
                </div>
                <h2
                  className="text-[1.6rem] font-bold text-gray-900"
                  style={{ fontFamily: "Segoe UI, sans-serif" }}
                >
                  Nos produits vedettes
                </h2>
              </div>
              <Link
                to="/products?featured=true"
                className="flex items-center gap-2 text-[13.5px] font-semibold hover:gap-3 transition-all"
                style={{ color: "#1a5242" }}
              >
                Voir tout <ArrowRight size={15} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6">
              {featuredProducts.slice(0, isDesktop ? 10 : 14).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
      <HomeVideoSection video={videoFor("after_featured")} />

      {/* ── Nouveautés ── */}
      <section className="py-16" style={{ background: "#f9fafb" }}>
        <div style={{ maxWidth: 1300, margin: "0 auto", padding: "0 20px" }}>
          <SectionTitle>Nouveautés</SectionTitle>
          {data.newest?.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6">
              {data.newest.slice(0, isDesktop ? 8 : 14).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-400 py-10">Aucune nouveauté</p>
          )}
        </div>
      </section>
      <HomeVideoSection video={videoFor("after_newest")} />

      {/* ── Hygiène ── */}
      <HygieneSection />
      <HomeVideoSection video={videoFor("after_hygiene")} />

      {/* ── Marques partenaires ── */}
      {brands.length > 0 && (
        <section className="py-16 bg-white">
          <div style={{ maxWidth: 1300, margin: "0 auto", padding: "0 20px" }}>
            <SectionTitle>Nos marques partenaires</SectionTitle>
            <div
              className="relative overflow-hidden py-5"
              style={{
                maskImage:
                  "linear-gradient(to right, transparent, black 15%, black 85%, transparent)",
                WebkitMaskImage:
                  "linear-gradient(to right, transparent, black 15%, black 85%, transparent)",
              }}
            >
              <div
                ref={marqueeRef}
                className="flex w-max"
                style={{
                  animation: `scrollMarquee ${Math.max(20, brands.length * 3)}s linear infinite`,
                }}
                onMouseEnter={(e) => {
                  if (!clickedBrandId)
                    e.currentTarget.style.animationPlayState = "paused";
                }}
                onMouseLeave={(e) => {
                  if (!clickedBrandId)
                    e.currentTarget.style.animationPlayState = "running";
                }}
              >
                {[1, 2].map((loop) => (
                  <div key={loop} className="flex gap-10 pr-10">
                    {brands.map((brand) => {
                      const isClicked = clickedBrandId === brand.id;
                      return (
                        <button
                          key={`${loop}-${brand.id}`}
                          type="button"
                          onClick={() => handleBrandClick(brand)}
                          title={
                            isClicked
                              ? `Cliquez à nouveau pour voir les produits ${brand.name}`
                              : `Voir les produits ${brand.name}`
                          }
                          className={`group flex-none w-48 h-20 md:w-52 md:h-28 flex items-center justify-center px-1 py-1 md:px-3 md:py-2 overflow-hidden cursor-pointer transition-all duration-300
                            bg-white border border-gray-200 rounded-lg
                            md:bg-white md:border md:border-gray-200 md:rounded-xl
                            hover:shadow-md hover:border-[#1a5242]/20
                            ${isClicked ? "shadow-md border-[#1a5242]/20" : ""}
                          `}
                        >
                          <img
                            src={`${STORAGE_URL}/${brand.logo}`}
                            alt={brand.name}
                            loading="lazy"
                            decoding="async"
                            className={`max-w-full max-h-full w-auto h-auto object-contain transition-all duration-300 scale-105 md:scale-100 ${
                              isClicked
                                ? "grayscale-0 opacity-100"
                                : "grayscale-0 opacity-100 md:grayscale md:opacity-60 md:group-hover:grayscale-0 md:group-hover:opacity-100"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <style>{`
        @keyframes scrollMarquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { scrollbar-width: none; -ms-overflow-style: none; }
      `}</style>
        </section>
      )}
      <HomeVideoSection video={videoFor("after_brands")} />

      {blogSectionVisible && blogPosts.length > 0 && (
        <section className="py-16 md:py-20 bg-white">
          <div
            className="relative mx-auto px-5 md:px-14"
            style={{ maxWidth: 1400 }}
          >
            {/* Titre + lien "Voir tous" */}
            <div className="flex items-end justify-between mb-8 md:mb-10 flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "#f0f7f4" }}
                  >
                    <Sparkles size={16} style={{ color: "#1a5242" }} />
                  </div>
                  <span
                    className="text-[11.5px] font-bold uppercase tracking-widest"
                    style={{ color: "#1a5242" }}
                  >
                    Notre blog
                  </span>
                </div>
                <h2
                  className="text-[1.5rem] md:text-[1.6rem] font-bold text-gray-900"
                  style={{ fontFamily: "Segoe UI, sans-serif" }}
                >
                  Actualités & Conseils
                </h2>
              </div>
              <Link
                to="/blog"
                className="flex items-center gap-2 text-[13.5px] font-semibold hover:gap-3 transition-all"
                style={{ color: "#1a5242" }}
              >
                Voir tous les articles <ArrowRight size={15} />
              </Link>
            </div>

            {/* Flèche gauche (desktop) */}
            {blogPosts.length > CARDS_PER_PAGE_DESKTOP && (
              <button
                onClick={() => setBlogSlide((p) => Math.max(p - 1, 0))}
                disabled={blogSlide === 0}
                className="hidden md:flex absolute left-0 top-[calc(50%+40px)] -translate-y-1/2 w-11 h-11 rounded-full bg-white border-2 border-black/10 items-center justify-center z-10 shadow-md transition-all hover:bg-[#1a5242] hover:text-white hover:border-[#1a5242] disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Articles précédents"
              >
                <ChevronLeft size={20} />
              </button>
            )}

            {/* Carrousel */}
            <div
              ref={blogScrollRef}
              onScroll={handleBlogScroll}
              className="overflow-x-auto md:overflow-hidden w-full pt-2 pb-4 md:py-3 snap-x snap-mandatory md:snap-none scrollbar-hide"
            >
              <div
                className="flex gap-5 md:gap-6 transition-transform duration-500"
                style={
                  isDesktop
                    ? {
                        transform: `translateX(-${blogSlide * (100 / CARDS_PER_PAGE_DESKTOP)}%)`,
                      }
                    : undefined
                }
              >
                {blogPosts.map((post) => (
                  <div
                    key={post.id}
                    className="flex-none w-[85%] sm:w-[60%] md:w-auto snap-start"
                    style={
                      isDesktop
                        ? {
                            width: `calc((100% - ${(CARDS_PER_PAGE_DESKTOP - 1) * 24}px) / ${CARDS_PER_PAGE_DESKTOP})`,
                          }
                        : undefined
                    }
                  >
                    <article className="flex flex-col bg-white border border-gray-100 rounded-2xl overflow-hidden h-full transition-all hover:-translate-y-1 hover:shadow-lg">
                      <Link
                        to={`/blog/${post.id}`}
                        className="block h-52 overflow-hidden bg-gray-50 group"
                      >
                        <img
                          src={
                            post.image
                              ? `${STORAGE_URL}/${post.image}`
                              : post.image
                          }
                          alt={post.title}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </Link>
                      <div className="p-5 md:p-6 flex flex-col flex-1">
                        <span
                          className="inline-block w-fit text-[10.5px] font-bold uppercase tracking-widest mb-3 px-2.5 py-1 rounded-full"
                          style={{ background: "#f0f7f4", color: "#1a5242" }}
                        >
                          {post.category}
                        </span>
                        <h3 className="mb-3 leading-snug">
                          <Link
                            to={`/blog/${post.id}`}
                            className="text-gray-900 text-[1.1rem] font-bold hover:text-[#1a5242] transition-colors line-clamp-2"
                          >
                            {post.title}
                          </Link>
                        </h3>
                        <p className="text-gray-500 text-[13.5px] leading-relaxed mb-5 line-clamp-3 flex-1">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                          <time className="text-[0.8rem] text-gray-400 font-medium">
                            {new Date(post.created_at).toLocaleDateString(
                              "fr-FR",
                            )}
                          </time>
                          <Link
                            to={`/blog/${post.id}`}
                            className="inline-flex items-center gap-1.5 text-[0.82rem] font-bold uppercase tracking-wide hover:gap-2 transition-all"
                            style={{ color: "#1a5242" }}
                          >
                            Lire <ArrowRight size={13} />
                          </Link>
                        </div>
                      </div>
                    </article>
                  </div>
                ))}
              </div>
            </div>

            {/* Flèche droite (desktop) */}
            {blogPosts.length > CARDS_PER_PAGE_DESKTOP && (
              <button
                onClick={() =>
                  setBlogSlide((p) => Math.min(p + 1, blogTotalPages - 1))
                }
                disabled={blogSlide >= blogTotalPages - 1}
                className="hidden md:flex absolute right-0 top-[calc(50%+40px)] -translate-y-1/2 w-11 h-11 rounded-full bg-white border-2 border-black/10 items-center justify-center z-10 shadow-md transition-all hover:bg-[#1a5242] hover:text-white hover:border-[#1a5242] disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Articles suivants"
              >
                <ChevronRight size={20} />
              </button>
            )}

            {/* Dots mobile */}
            <div className="md:hidden flex justify-center gap-1.5 mt-4">
              {Array.from({
                length: Math.ceil(blogPosts.length / CARDS_PER_PAGE_MOBILE),
              }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => scrollToBlogPage(i)}
                  aria-label={`Aller à la page ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    mobileBlogActive === i
                      ? "w-5 bg-[#1a5242]"
                      : "w-1.5 bg-[#1a5242]/25"
                  }`}
                />
              ))}
            </div>
          </div>
        </section>
      )}
      <HomeVideoSection video={videoFor("after_blog")} />

      {/* ── Services ── */}
      <section
        className="py-16 border-t border-gray-100"
        style={{ background: "#f6f9f7" }}
      >
        <div style={{ maxWidth: 1300, margin: "0 auto", padding: "0 20px" }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
            {[
              {
                icon: Truck,
                val: `${shipping.delivery_days_min}–${shipping.delivery_days_max}j`,
                title: "Livraison rapide",
                sub: "Partout en Tunisie",
              },
              {
                icon: HeadphonesIcon,
                val: "24h",
                title: "Service client réactif",
                sub: "Du lundi au samedi 9h–20h",
              },
              {
                icon: Package,
                val: "100%",
                title: "Produits authentiques",
                sub: "Garantie d'origine officielle",
              },
            ].map(({ icon: Icon, val, title, sub }) => (
              <div
                key={title}
                className="flex items-start gap-4 py-7 px-7 rounded-2xl bg-white border border-gray-100 transition-all hover:-translate-y-0.5"
                style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}
              >
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: "#FFF3B0" }}
                >
                  <Icon size={20} style={{ color: "#355847" }} />
                </div>
                <div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <p
                      className="text-[1.5rem] font-bold leading-none"
                      style={{ color: "#1a5242" }}
                    >
                      {val}
                    </p>
                    <p className="text-[14px] font-bold text-gray-900">
                      {title}
                    </p>
                  </div>
                  <p className="text-[13px] text-gray-500 leading-relaxed">
                    {sub}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <HomeVideoSection video={videoFor("after_services")} />
    </div>
  );
}
