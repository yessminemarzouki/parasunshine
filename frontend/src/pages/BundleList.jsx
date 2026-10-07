import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { cachedFetch } from "../utils/cache";
import BundleCard from "../components/BundleCard";
import { API_URL } from "../config/api";
import { getBundles, getBundleCategories } from "../services/api";
import {
  X,
  SlidersHorizontal,
  ChevronRight,
  RotateCcw,
  Search,
} from "lucide-react";

export default function BundleList() {
  const [searchParams] = useSearchParams();

  const [bundles, setBundles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBundles, setTotalBundles] = useState(0);

  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("bundle_category") || "",
  );
  const [selectedBrand, setSelectedBrand] = useState("");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [availability, setAvailability] = useState("");

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchFiltersData();
  }, []);

  useEffect(() => {
    fetchBundles();
  }, [selectedCategory, selectedBrand, availability, currentPage]);

  const fetchFiltersData = async () => {
    try {
      const categoriesData = await getBundleCategories();
      setCategories(categoriesData);
      const brandsData = await cachedFetch(`${API_URL}/brands`);
      setBrands(brandsData);
    } catch {
      // silencieux — l'échec de chargement filtres n'empêche pas le reste
    }
  };

  const fetchBundles = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        per_page: 14,
      };
      if (selectedCategory) params.bundle_category = selectedCategory;
      if (selectedBrand) params.brand = selectedBrand;
      if (availability) params.availability = availability;
      if (minPrice > 0) params.min_price = minPrice;
      if (maxPrice < 5000) params.max_price = maxPrice;

      const data = await getBundles(params);
      setBundles(data.data || []);
      setTotalPages(data.last_page || 1);
      setTotalBundles(data.total || 0);
      setCurrentPage(data.current_page || 1);
    } catch {
      setError("Impossible de charger les coffrets");
    } finally {
      setLoading(false);
    }
  };

  const applyPriceFilter = () => {
    if (currentPage !== 1) setCurrentPage(1);
    else fetchBundles();
  };

  const resetFilters = () => {
    setSelectedCategory("");
    setSelectedBrand("");
    setMinPrice(0);
    setMaxPrice(5000);
    setAvailability("");
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading && bundles.length === 0)
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div
          className="w-12 h-12 rounded-full animate-spin"
          style={{ border: "3px solid #e5e7eb", borderTopColor: "#1a5242" }}
        />
        <p className="text-gray-400 text-[14px] font-medium">
          Chargement des coffrets...
        </p>
      </div>
    );

  return (
    <div
      className="bg-white min-h-screen pb-16"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px" }}>
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 py-5 text-[13px] text-gray-400 flex-wrap">
          <Link
            to="/"
            className="hover:text-[#1a5242] transition-colors font-medium"
          >
            Accueil
          </Link>
          <ChevronRight size={13} />
          <span className="text-[#1a5242] font-semibold">Nos coffrets</span>
        </nav>

        {/* Header */}
        <div className="mb-7 pb-5 border-b border-gray-100 relative">
          <div
            className="absolute bottom-0 left-0 w-24 h-0.5 rounded-full"
            style={{ background: "linear-gradient(135deg, #1a5242, #256d5d)" }}
          />
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <h1 className="text-[19px] md:text-[22px] font-bold text-gray-900 mb-1.5">
                Nos coffrets
              </h1>
              <div className="flex items-center gap-2 text-[13.5px] text-gray-400">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block" />
                <span>
                  {totalBundles} coffret{totalBundles > 1 ? "s" : ""} trouvé
                  {totalBundles > 1 ? "s" : ""}
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowFilters(true)}
              className="lg:hidden flex items-center gap-2 h-10 px-4 border border-gray-300 rounded-xl text-[13px] text-gray-800 font-semibold bg-white shadow-sm"
            >
              <SlidersHorizontal size={14} />
              Filtres
            </button>
          </div>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 lg:gap-8 items-start">
          {/* ── Sidebar Filtres ── */}
          <>
            {showFilters && (
              <div
                className="fixed inset-0 z-[1100] bg-black/50 lg:hidden"
                onClick={() => setShowFilters(false)}
              />
            )}

            <aside
              className={`bg-white border border-gray-100 rounded-2xl p-5 shadow-sm transition-all duration-300
  max-lg:fixed max-lg:top-0 max-lg:bottom-0 max-lg:left-0 max-lg:w-80 max-lg:z-[1101] max-lg:rounded-none max-lg:overflow-y-auto
  ${showFilters ? "max-lg:translate-x-0" : "max-lg:-translate-x-full"}`}
            >
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div
                    className="w-1 h-5 rounded-full"
                    style={{
                      background: "linear-gradient(135deg, #1a5242, #256d5d)",
                    }}
                  />
                  <p className="text-[15px] font-bold text-gray-900">Filtres</p>
                </div>
                <button
                  onClick={() => setShowFilters(false)}
                  className="lg:hidden w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Catégories de coffrets (liste plate) */}
              <FilterSection title="Catégories">
                <label className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <Radio
                    checked={selectedCategory === ""}
                    onChange={() => {
                      setSelectedCategory("");
                      setCurrentPage(1);
                    }}
                  />
                  <span className="text-[13px] text-gray-600 font-medium">
                    Toutes les catégories
                  </span>
                </label>
                {categories.map((cat) => (
                  <label
                    key={cat.id}
                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <Radio
                      checked={selectedCategory === cat.slug}
                      onChange={() => {
                        setSelectedCategory(cat.slug);
                        setCurrentPage(1);
                      }}
                    />
                    <span className="text-[13px] text-gray-600">
                      {cat.name}
                    </span>
                  </label>
                ))}
              </FilterSection>

              {/* Marques */}
              <FilterSection title="Marques">
                {brands.length > 0 ? (
                  <>
                    <label className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <Radio
                        checked={selectedBrand === ""}
                        onChange={() => {
                          setSelectedBrand("");
                          setCurrentPage(1);
                        }}
                      />
                      <span className="text-[13px] text-gray-600 font-medium">
                        Toutes les marques
                      </span>
                    </label>
                    {brands.map((b) => (
                      <label
                        key={b.id}
                        className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <Radio
                          checked={selectedBrand === b.slug}
                          onChange={() => {
                            setSelectedBrand(b.slug);
                            setCurrentPage(1);
                          }}
                        />
                        <span className="text-[13px] text-gray-600">
                          {b.name}
                        </span>
                      </label>
                    ))}
                  </>
                ) : (
                  <p className="text-[12.5px] text-gray-400 italic text-center py-3 bg-gray-50 rounded-lg">
                    Aucune marque disponible
                  </p>
                )}
              </FilterSection>

              {/* Disponibilité */}
              <FilterSection title="Disponibilité">
                <label className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <Radio
                    checked={availability === ""}
                    onChange={() => {
                      setAvailability("");
                      setCurrentPage(1);
                    }}
                  />
                  <span className="text-[13px] text-gray-600 font-medium">
                    Tous
                  </span>
                </label>
                <label className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <Radio
                    checked={availability === "available"}
                    onChange={() => {
                      setAvailability("available");
                      setCurrentPage(1);
                    }}
                  />
                  <span className="text-[13px] text-gray-600">Disponible</span>
                </label>
                <label className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <Radio
                    checked={availability === "unavailable"}
                    onChange={() => {
                      setAvailability("unavailable");
                      setCurrentPage(1);
                    }}
                  />
                  <span className="text-[13px] text-gray-600">
                    Indisponible
                  </span>
                </label>
              </FilterSection>

              {/* Prix */}
              <FilterSection title="Prix (DT)">
                <div className="px-1">
                  <div className="flex justify-between items-center mb-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
                    <span className="text-[13.5px] font-bold text-gray-800">
                      {minPrice}
                    </span>
                    <span className="text-[12px] text-gray-400">—</span>
                    <span className="text-[13.5px] font-bold text-gray-800">
                      {maxPrice}
                    </span>
                  </div>
                  <div className="relative h-2 bg-gray-200 rounded-full mb-4">
                    <input
                      type="range"
                      min="0"
                      max="5000"
                      value={minPrice}
                      onChange={(e) => setMinPrice(parseInt(e.target.value))}
                      className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer"
                      style={{ accentColor: "#1a5242" }}
                    />
                    <input
                      type="range"
                      min="0"
                      max="5000"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                      className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer"
                      style={{ accentColor: "#1a5242" }}
                    />
                  </div>
                  <button
                    onClick={applyPriceFilter}
                    className="w-full py-2 rounded-xl text-white text-[13px] font-semibold transition-opacity hover:opacity-90"
                    style={{
                      background:
                        "linear-gradient(135deg, #2d7a5f 0%, #3f9973 100%)",
                    }}
                  >
                    Chercher
                  </button>
                </div>
              </FilterSection>

              <button
                onClick={resetFilters}
                className="w-full flex items-center justify-center gap-2 py-2.5 mt-2 rounded-xl border-2 border-gray-200 text-gray-400 text-[13px] font-semibold hover:border-[#1a5242] hover:text-[#1a5242] transition-all"
                style={{
                  marginBottom: "max(8px, env(safe-area-inset-bottom))",
                }}
              >
                <RotateCcw size={14} /> Réinitialiser les filtres
              </button>
            </aside>
          </>

          {/* ── Contenu ── */}
          <div className="min-w-0">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center mb-5">
                <p className="text-red-600 font-semibold text-[14px] mb-3">
                  {error}
                </p>
                <button
                  onClick={fetchBundles}
                  className="px-5 py-2 rounded-xl bg-red-500 text-white text-[13px] font-semibold hover:bg-red-600 transition-colors"
                >
                  Réessayer
                </button>
              </div>
            )}

            {bundles.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
                  {bundles.map((bundle) => (
                    <BundleCard key={bundle.id} bundle={bundle} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1.5 mt-10 pt-8 border-t border-gray-100 flex-wrap">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="w-9 h-9 rounded-lg border-0 text-gray-500 flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed text-[13px] font-bold hover:border hover:border-gray-900"
                      style={{ background: "#f3f4f6" }}
                    >
                      ←
                    </button>
                    {[...Array(totalPages)].map((_, i) => {
                      const p = i + 1;
                      if (
                        p === 1 ||
                        p === totalPages ||
                        (p >= currentPage - 2 && p <= currentPage + 2)
                      ) {
                        return (
                          <button
                            key={p}
                            onClick={() => handlePageChange(p)}
                            className={`w-9 h-9 rounded-lg text-[13px] font-bold transition-all ${
                              currentPage === p
                                ? "border border-gray-900 text-[#92660a]"
                                : "border-0 text-gray-600 hover:border hover:border-gray-900"
                            }`}
                            style={
                              currentPage === p
                                ? { background: "#fffbeb" }
                                : { background: "#f3f4f6" }
                            }
                          >
                            {p}
                          </button>
                        );
                      } else if (
                        p === currentPage - 3 ||
                        p === currentPage + 3
                      ) {
                        return (
                          <span key={p} className="text-gray-400 px-1">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="w-9 h-9 rounded-lg border-0 text-gray-500 flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed text-[13px] font-bold hover:border hover:border-gray-900"
                      style={{ background: "#f3f4f6" }}
                    >
                      →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-white border-2 border-dashed border-gray-200 rounded-2xl gap-4">
                <Search size={40} className="text-gray-300" strokeWidth={1.2} />
                <p className="text-[15px] text-gray-400 font-medium">
                  Aucun coffret ne correspond à vos critères
                </p>
                <button
                  onClick={resetFilters}
                  className="px-6 py-2.5 rounded-xl text-white text-[13.5px] font-semibold hover:opacity-90 transition-opacity"
                  style={{
                    background:
                      "linear-gradient(135deg, #2d7a5f 0%, #3f9973 100%)",
                  }}
                >
                  Réinitialiser les filtres
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const FilterSection = ({ title, children }) => (
  <div className="mb-5 pb-5 border-b border-gray-100 last:border-0 last:mb-0 last:pb-0">
    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
      {title}
      <span className="flex-1 h-px bg-gray-100" />
    </p>
    <div className="space-y-0.5">{children}</div>
  </div>
);

const Radio = ({ checked, onChange }) => (
  <input
    type="radio"
    checked={checked}
    onChange={onChange}
    className="w-4 h-4 flex-shrink-0 cursor-pointer accent-[#1a5242]"
  />
);
