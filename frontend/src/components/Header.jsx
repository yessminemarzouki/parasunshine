import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  ShoppingCart,
  User,
  Heart,
  LogOut,
  X,
  Package,
  Tag,
  Menu,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import PromoBanner from "./PromoBanner";
import MobileMenu from "./MobileMenu";
import logoImage from "../assets/logo.png";
import api from "../services/api";
import { STORAGE_URL } from "../config/api";

// ══════════ Ligne de résultat produit (réutilisée partout) ══════════
function ResultRow({ p, size = "normal", onSelect }) {
  const imgSize = size === "small" ? 40 : 44;
  return (
    <button
      onClick={() => onSelect(p.slug)}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 16px",
        background: "none",
        border: "none",
        cursor: "pointer",
        textAlign: "left",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
    >
      <div
        style={{
          width: imgSize,
          height: imgSize,
          borderRadius: 10,
          border: "1px solid #f3f4f6",
          background: "#f9fafb",
          flexShrink: 0,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {p.image ? (
          <img
            src={`${STORAGE_URL}/${p.image}`}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              padding: 3,
            }}
          />
        ) : (
          <Package size={16} style={{ color: "#d1d5db" }} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: "#1f2937",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            margin: 0,
          }}
        >
          {p.name}
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginTop: 2,
          }}
        >
          {p.brand && (
            <p
              style={{
                fontSize: 11.5,
                color: "#d4af37",
                fontWeight: 600,
                margin: 0,
              }}
            >
              {p.brand.name}
            </p>
          )}
          {p.stock === 0 && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#ef4444",
                background: "#fef2f2",
                padding: "1px 6px",
                borderRadius: 999,
              }}
            >
              Rupture
            </span>
          )}
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        {p.promo_price ? (
          <>
            <p
              style={{
                fontSize: 13.5,
                fontWeight: 800,
                color: "#059669",
                margin: 0,
              }}
            >
              {parseFloat(p.promo_price).toFixed(3)} DT
            </p>
            <p
              style={{
                fontSize: 11.5,
                color: "#9ca3af",
                textDecoration: "line-through",
                margin: 0,
              }}
            >
              {parseFloat(p.price).toFixed(3)} DT
            </p>
          </>
        ) : (
          <p
            style={{
              fontSize: 13.5,
              fontWeight: 700,
              color: "#1a5242",
              margin: 0,
            }}
          >
            {parseFloat(p.price).toFixed(3)} DT
          </p>
        )}
      </div>
    </button>
  );
}
// ══════════ Ligne de résultat marque/sous-marque ══════════
function BrandResultRow({ b, onSelect }) {
  return (
    <button
      onClick={() => onSelect(b.slug)}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 16px",
        background: "none",
        border: "none",
        cursor: "pointer",
        textAlign: "left",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          border: "1px solid #f3f4f6",
          background: "#f9fafb",
          flexShrink: 0,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {b.logo ? (
          <img
            src={`${STORAGE_URL}/${b.logo}`}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              padding: 3,
            }}
          />
        ) : (
          <Package size={16} style={{ color: "#d1d5db" }} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: "#1f2937",
            margin: 0,
          }}
        >
          {b.name}
        </p>
      </div>
    </button>
  );
}
// ══════════ Corps des résultats (partagé desktop + mobile) ══════════
function SearchResultsBody({
  results,
  suggestions,
  brands,
  loading,
  hasResults,
  query,
  onSelect,
  onSelectBrand,
  onSeeAll,
}) {
  return (
    <>
      {brands.length > 0 && (
        <div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#9ca3af",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              padding: "12px 16px 6px",
            }}
          >
            Marques
          </p>
          {brands.map((b) => (
            <BrandResultRow key={b.id} b={b} onSelect={onSelectBrand} />
          ))}
        </div>
      )}

      {results.length > 0 && (
        <div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#9ca3af",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              padding: "12px 16px 6px",
            }}
          >
            Produits ({results.length})
          </p>
          {results.map((p) => (
            <ResultRow key={p.id} p={p} onSelect={onSelect} />
          ))}
        </div>
      )}

      {suggestions.length > 0 && (
        <div style={{ borderTop: "1px solid #f3f4f6" }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#9ca3af",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              padding: "12px 16px 6px",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Tag size={11} />
            {results.length === 0
              ? "Produits similaires que vous pourriez aimer"
              : "Vous aimerez aussi"}
          </p>
          {suggestions.map((p) => (
            <ResultRow key={p.id} p={p} size="small" onSelect={onSelect} />
          ))}
        </div>
      )}

      {results.length > 0 && (
        <button
          onClick={onSeeAll}
          style={{
            width: "100%",
            padding: "12px 16px",
            background: "#f9fafb",
            border: "none",
            borderTop: "1px solid #f3f4f6",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 700,
            color: "#1a5242",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          Voir tous les résultats pour "{query}" →
        </button>
      )}

      {!loading && !hasResults && query.trim().length >= 3 && (
        <div style={{ padding: "24px 16px", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 4px" }}>
            Aucun résultat pour "<strong>{query}</strong>"
          </p>
          <p style={{ fontSize: 12.5, color: "#9ca3af", margin: 0 }}>
            Essayez avec des termes différents
          </p>
        </div>
      )}
    </>
  );
}

// ══════════ Barre de recherche générique (desktop ET mobile) ══════════
function SearchBar({
  query,
  loading,
  showDrop,
  dropRef,
  searchRef,
  onChange,
  onFocus,
  onClear,
  onSubmit,
  results,
  suggestions,
  brands,
  hasResults,
  onSelect,
  onSelectBrand,
  onSeeAll,
  variant = "desktop",
}) {
  const isMobile = variant === "mobile";
  return (
    <div
      className={isMobile ? "relative w-full" : "relative flex-1"}
      style={!isMobile ? { maxWidth: 600 } : undefined}
    >
      <form
        className={
          isMobile
            ? "relative flex items-center"
            : "flex-1 max-w-[750px] relative flex"
        }
        onSubmit={onSubmit}
        ref={searchRef}
      >
        {isMobile && (
          <Search
            size={18}
            strokeWidth={2}
            className="absolute left-4 text-gray-400 pointer-events-none z-[1]"
          />
        )}
        <input
          type="text"
          placeholder={
            isMobile
              ? "Rechercher un produit ou une marque..."
              : "Rechercher un produit, une marque..."
          }
          value={query}
          onChange={onChange}
          onFocus={onFocus}
          autoComplete="off"
          className={
            isMobile
              ? "w-full h-11 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-full text-[0.88rem] outline-none focus:border-[#1a5242] focus:bg-white transition-colors"
              : "w-full py-[0.7rem] pr-14 pl-4 border border-[#1a5242] rounded-xl text-[0.9rem] outline-none focus:shadow-[0_4px_12px_rgba(26,82,66,0.15)] transition-shadow"
          }
        />
        {!isMobile && query && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-14 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-1.5 text-gray-400 hover:text-gray-600 z-[2] rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>
        )}
        {!isMobile && (
          <button
            type="submit"
            className="absolute right-0 top-0 bottom-0 px-4 text-white border-none rounded-r-xl cursor-pointer flex items-center justify-center transition-opacity hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #2d7a5f 0%, #3f9973 100%)",
            }}
          >
            {loading ? (
              <span
                className="inline-block rounded-full"
                style={{
                  width: 18,
                  height: 18,
                  border: "2px solid rgba(255,255,255,0.4)",
                  borderTopColor: "white",
                  animation: "spin 0.7s linear infinite",
                }}
              />
            ) : (
              <Search size={20} />
            )}
          </button>
        )}
        {isMobile && query && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-4 bg-transparent border-none cursor-pointer text-gray-400 flex items-center"
          >
            {loading ? (
              <span
                className="inline-block rounded-full"
                style={{
                  width: 14,
                  height: 14,
                  border: "2px solid rgba(26,82,66,0.25)",
                  borderTopColor: "#1a5242",
                  animation: "spin 0.7s linear infinite",
                }}
              />
            ) : (
              <X size={16} />
            )}
          </button>
        )}
      </form>

      {showDrop && (
        <div
          ref={dropRef}
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            background: "white",
            borderRadius: 16,
            boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
            border: "1px solid #f3f4f6",
            zIndex: 9999,
            overflow: "hidden",
            fontFamily: "'Inter', sans-serif",
            maxHeight: isMobile ? "70vh" : 480,
            overflowY: "auto",
          }}
        >
          <SearchResultsBody
            results={results}
            suggestions={suggestions}
            brands={brands}
            loading={loading}
            hasResults={hasResults}
            query={query}
            onSelect={onSelect}
            onSelectBrand={onSelectBrand}
            onSeeAll={onSeeAll}
          />
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const dropRef = useRef(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [brandResults, setBrandResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDrop, setShowDrop] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 768 : true,
  );
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const debounceRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    checkAuth();
    window.addEventListener("storage", checkAuth);
    return () => window.removeEventListener("storage", checkAuth);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (
        dropRef.current &&
        !dropRef.current.contains(e.target) &&
        searchRef.current &&
        !searchRef.current.contains(e.target)
      ) {
        setShowDrop(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const checkAuth = () => setIsLoggedIn(!!localStorage.getItem("auth_token"));

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setShowUserMenu(false);
    navigate("/");
    window.location.reload();
  };

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (val.trim().length < 3) {
      setShowDrop(false);
      setResults([]);
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(() => fetchSearch(val.trim()), 350);
  };

  const fetchSearch = async (q) => {
    setLoading(true);
    try {
      const res = await api.get("/products/search", { params: { q } });
      setResults(res.data.results || []);
      setSuggestions(res.data.suggestions || []);
      setBrandResults(res.data.brands || []);
      setShowDrop(true);
    } catch {
      setShowDrop(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setShowDrop(false);
    navigate(`/products?search=${encodeURIComponent(query.trim())}`);
  };

  const handleSelect = (slug) => {
    setShowDrop(false);
    setQuery("");
    navigate(`/products/${slug}`);
  };

  const handleSelectBrand = (slug) => {
    setShowDrop(false);
    setQuery("");
    navigate(`/products?brand=${slug}`);
  };

  const handleSeeAll = () => {
    setShowDrop(false);
    navigate(`/products?search=${encodeURIComponent(query)}`);
  };

  const clearSearch = () => {
    setQuery("");
    setShowDrop(false);
    setResults([]);
    setSuggestions([]);
    setBrandResults([]);
  };

  const hasResults =
    results.length > 0 || suggestions.length > 0 || brandResults.length > 0;

  const AccountBlock = ({ compact = false }) => (
    <div className="relative">
      {isLoggedIn ? (
        <>
          <button
            className={`flex items-center justify-center bg-transparent border-none cursor-pointer transition-opacity active:opacity-50 hover:opacity-75 group ${
              compact ? "w-10 h-10" : "flex-col gap-1 p-0"
            }`}
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div
              className={
                compact
                  ? "flex items-center justify-center"
                  : "relative flex items-center justify-center p-1.5 transition-transform group-hover:-translate-y-0.5"
              }
            >
              <User
                size={compact ? 21 : 20}
                strokeWidth={compact ? 1.6 : 2}
                className={compact ? "text-[#1a1a1a]" : "text-[#1a5242]"}
              />
            </div>
            {!compact && (
              <span className="text-[0.65rem] md:text-[0.75rem] font-medium tracking-[0.3px] text-[#1a1a1a]">
                Compte
              </span>
            )}
          </button>
          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-[998] bg-transparent"
                onClick={() => setShowUserMenu(false)}
              />
              <div
                className="absolute top-full mt-3 right-0 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[220px] py-2 z-[999]"
                style={{ animation: "slideDown 0.2s ease" }}
              >
                <Link
                  to="/account"
                  className="flex items-center gap-3 px-5 py-3 text-[#1a1a1a] no-underline text-[0.95rem] cursor-pointer bg-transparent border-none w-full text-left transition-colors hover:bg-[#2d6f5f] hover:text-white"
                  onClick={() => setShowUserMenu(false)}
                >
                  <User size={18} />
                  <span>Mon compte</span>
                </Link>
                <Link
                  to="/account"
                  className="flex items-center gap-3 px-5 py-3 text-[#1a1a1a] no-underline text-[0.95rem] cursor-pointer bg-transparent border-none w-full text-left transition-colors hover:bg-[#2d6f5f] hover:text-white"
                  onClick={() => setShowUserMenu(false)}
                >
                  <ShoppingCart size={18} />
                  <span>Mes commandes</span>
                </Link>
                <Link
                  to="/favoris"
                  className="flex items-center gap-3 px-5 py-3 text-[#1a1a1a] no-underline text-[0.95rem] cursor-pointer bg-transparent border-none w-full text-left transition-colors hover:bg-[#2d6f5f] hover:text-white"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Heart size={18} />
                  <span>Mes favoris</span>
                </Link>
                <div className="h-px bg-gray-200 my-2" />
                <button
                  className="flex items-center gap-3 px-5 py-3 text-red-600 text-[0.95rem] cursor-pointer bg-transparent border-none w-full text-left transition-colors hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut size={18} />
                  <span>Déconnexion</span>
                </button>
              </div>
            </>
          )}
        </>
      ) : (
        <Link
          to="/login"
          className={`flex items-center justify-center no-underline text-[#1a1a1a] transition-opacity active:opacity-50 hover:opacity-75 group ${
            compact ? "w-10 h-10" : "flex-col gap-1"
          }`}
        >
          <div
            className={
              compact
                ? "flex items-center justify-center"
                : "relative flex items-center justify-center p-1.5 transition-transform group-hover:-translate-y-0.5"
            }
          >
            <User
              size={compact ? 21 : 20}
              strokeWidth={compact ? 1.6 : 2}
              className={compact ? "text-[#1a1a1a]" : "text-black"}
            />
          </div>
          {!compact && (
            <span className="text-[0.65rem] md:text-[0.75rem] font-medium tracking-[0.3px] text-[#1a1a1a]">
              Compte
            </span>
          )}
        </Link>
      )}
    </div>
  );

  return (
    <>
      <PromoBanner />
      <header className="bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] sticky top-0 z-[1001] border-b border-gray-200">
        {isDesktop ? (
          // ══════════ DESKTOP — identique à l'original, aucun changement ══════════
          <div className="max-w-[1400px] mx-auto px-8 py-4 flex items-center justify-between gap-8 relative z-[1] flex-wrap md:flex-nowrap">
            <Link
              to="/"
              className="flex items-center gap-3.5 no-underline flex-shrink-0"
            >
              <div className="w-[46px] h-[46px] md:w-[52px] md:h-[52px] flex items-center justify-center">
                <img
                  src={logoImage}
                  alt="ParaSunshine Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-[1.1rem] md:text-[1.375rem] font-bold text-[#1a5242] m-0 leading-[1.2] tracking-[0.3px]">
                  ParaSunshine
                </h1>
                <div className="text-[0.65rem] md:text-[0.75rem] text-[#f4c430] mt-0.5 font-medium tracking-[0.3px]">
                  Votre bien-être naturel
                </div>
              </div>
            </Link>

            <SearchBar
              variant="desktop"
              query={query}
              loading={loading}
              showDrop={showDrop}
              dropRef={dropRef}
              searchRef={searchRef}
              onChange={handleQueryChange}
              onFocus={() => query.trim().length >= 3 && setShowDrop(true)}
              onClear={clearSearch}
              onSubmit={handleSubmit}
              results={results}
              suggestions={suggestions}
              brands={brandResults}
              hasResults={hasResults}
              onSelect={handleSelect}
              onSelectBrand={handleSelectBrand}
              onSeeAll={handleSeeAll}
            />

            <div className="flex items-center gap-[1.7rem] flex-shrink-0">
              <Link
                to="/favoris"
                className="flex flex-col items-center gap-1 no-underline text-[#1a1a1a] transition-opacity hover:opacity-75 group"
              >
                <div className="relative flex items-center justify-center p-1.5 transition-transform group-hover:-translate-y-0.5">
                  <Heart size={20} strokeWidth={1.5} className="text-black" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[0.65rem] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center border-2 border-white">
                      {wishlistCount}
                    </span>
                  )}
                </div>
                <span className="text-[0.75rem] font-medium tracking-[0.3px] text-[#1a1a1a]">
                  Favoris
                </span>
              </Link>

              <AccountBlock />

              <Link
                to="/cart"
                className="flex flex-col items-center gap-1 no-underline text-[#1a1a1a] transition-opacity hover:opacity-75 group"
              >
                <div className="relative flex items-center justify-center p-1.5 transition-transform group-hover:-translate-y-0.5">
                  <ShoppingCart
                    size={20}
                    strokeWidth={1.5}
                    className="text-black"
                  />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[0.65rem] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center border-2 border-white">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="text-[0.75rem] font-medium tracking-[0.3px] text-[#1a1a1a]">
                  Panier
                </span>
              </Link>
            </div>
          </div>
        ) : (
          // ══════════ MOBILE — recherche en haut, navigation avec logo centré en dessous ══════════
          <div className="px-4 pt-3 pb-3 flex flex-col gap-3">
            {/* Ligne 1 — Recherche */}
            <SearchBar
              variant="mobile"
              query={query}
              loading={loading}
              showDrop={showDrop}
              dropRef={dropRef}
              searchRef={searchRef}
              onChange={handleQueryChange}
              onFocus={() => query.trim().length >= 3 && setShowDrop(true)}
              onClear={clearSearch}
              onSubmit={handleSubmit}
              results={results}
              suggestions={suggestions}
              hasResults={hasResults}
              onSelect={handleSelect}
              onSeeAll={handleSeeAll}
            />

            {/* Ligne 2 — Menu / Logo centré / Actions */}
            <div className="grid grid-cols-3 items-center">
              <div className="flex items-center">
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  aria-label="Ouvrir le menu"
                  className="w-9 h-9 -ml-1.5 flex items-center justify-center text-[#1a1a1a] active:opacity-50 transition-opacity"
                >
                  <Menu size={22} strokeWidth={1.7} />
                </button>
              </div>

              <Link
                to="/"
                className="flex flex-col items-center gap-0.5 no-underline"
              >
                <div className="w-[30px] h-[30px] flex items-center justify-center">
                  <img
                    src={logoImage}
                    alt="ParaSunshine Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-[0.85rem] font-bold text-[#1a5242] leading-tight tracking-[0.2px] whitespace-nowrap">
                  ParaSunshine
                </span>
              </Link>

              <div className="flex items-center justify-end gap-1">
                <Link
                  to="/favoris"
                  aria-label="Favoris"
                  className="relative w-9 h-9 flex items-center justify-center text-[#1a1a1a] no-underline active:opacity-50 transition-opacity"
                >
                  <Heart size={20} strokeWidth={1.6} />
                  {wishlistCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 bg-red-600 text-white text-[0.6rem] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full border-2 border-white leading-none px-0.5">
                      {wishlistCount}
                    </span>
                  )}
                </Link>

                <AccountBlock compact />

                <Link
                  to="/cart"
                  aria-label="Panier"
                  className="relative w-9 h-9 flex items-center justify-center text-[#1a1a1a] no-underline active:opacity-50 transition-opacity"
                >
                  <ShoppingCart size={20} strokeWidth={1.6} />
                  {cartCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 bg-red-600 text-white text-[0.6rem] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full border-2 border-white leading-none px-0.5">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </>
  );
}
