import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { cachedFetch } from "../utils/cache";
import ProductCard from "../components/ProductCard";
import { API_URL } from "../config/api";
import {
  ChevronDown,
  X,
  SlidersHorizontal,
  ChevronRight,
  RotateCcw,
  Search,
} from "lucide-react";

export default function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [availableBrands, setAvailableBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "",
  );
  const [selectedBrand, setSelectedBrand] = useState("");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [showPromo, setShowPromo] = useState(
    searchParams.get("promo") === "true",
  );
  const [showNew, setShowNew] = useState(false);
  const [showBestseller, setShowBestseller] = useState(
    searchParams.get("bestseller") === "true",
  );
  const [showFeatured, setShowFeatured] = useState(
    searchParams.get("featured") === "true",
  );
  const [sortBy, setSortBy] = useState("created_at");

  const [showFilters, setShowFilters] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [showAllBrands, setShowAllBrands] = useState(false);

  useEffect(() => {
    fetchFiltersData();
  }, []);

  useEffect(() => {
    const category = searchParams.get("category");
    if (category) setSelectedCategory(category);
    const brand = searchParams.get("brand");
    if (brand) setSelectedBrand(brand);
    setShowBestseller(searchParams.get("bestseller") === "true");
    setShowFeatured(searchParams.get("featured") === "true");
    setShowPromo(searchParams.get("promo") === "true");
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
  }, [currentPage]);
  // Revient systématiquement à la page 1 dès qu'un filtre change, remonte
  // en haut de page, et affiche un état de chargement — évite de rester
  // bloqué sur une page qui n'existe plus après un filtrage (ex: page 3
  // alors que le nouveau filtre ne donne que 1 page de résultats).
  const isFirstFilterRun = useRef(true);
  useEffect(() => {
    if (isFirstFilterRun.current) {
      isFirstFilterRun.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      fetchProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedCategory,
    selectedBrand,
    showPromo,
    showNew,
    showBestseller,
    showFeatured,
    sortBy,
  ]);

  useEffect(() => {
    if (selectedCategory) fetchBrandsByCategory(selectedCategory);
    else setAvailableBrands(brands);
    setShowAllBrands(false);
  }, [selectedCategory, brands]);

  useEffect(() => {
    if (selectedCategory && categories.length > 0) autoExpandSelectedCategory();
  }, [selectedCategory, categories]);

  const fetchFiltersData = async () => {
    try {
      const categoriesData = await cachedFetch(`${API_URL}/categories`);
      setCategories(categoriesData);
      const brandsData = await cachedFetch(`${API_URL}/brands`);
      setBrands(brandsData);
      setAvailableBrands(brandsData);
    } catch {
      // silencieux — l'échec de chargement filtres n'empêche pas le reste de la page
    }
  };

  const fetchBrandsByCategory = async (categorySlug) => {
    try {
      const data = await cachedFetch(
        `${API_URL}/categories/${categorySlug}/brands`,
      );
      setAvailableBrands(data);
      if (selectedBrand && !data.find((b) => b.slug === selectedBrand))
        setSelectedBrand("");
    } catch {
      setAvailableBrands([]);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory) params.append("category", selectedCategory);
      if (selectedBrand) params.append("brand", selectedBrand);
      if (minPrice > 0) params.append("min_price", minPrice);
      if (maxPrice < 5000) params.append("max_price", maxPrice);
      if (showPromo) params.append("promo", "1");
      if (showNew) params.append("new", "1");
      if (showBestseller) params.append("bestseller", "1");
      if (showFeatured) params.append("featured", "1");
      if (sortBy) params.append("sort", sortBy);
      params.append("page", currentPage);
      params.append("per_page", "16");
      const data = await cachedFetch(
        `${API_URL}/products/filter?${params.toString()}`,
      );
      setProducts(data.data || []);
      setTotalPages(data.last_page || 1);
      setTotalProducts(data.total || 0);
      setCurrentPage(data.current_page || 1);
    } catch {
      setError("Impossible de charger les produits");
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setSelectedCategory("");
    setSelectedBrand("");
    setMinPrice(0);
    setMaxPrice(5000);
    setShowPromo(false);
    setShowNew(false);
    setSortBy("created_at");
    setCurrentPage(1);
    setSearchParams({});
    setShowBestseller(false);
    setShowFeatured(false);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleCategory = (id) =>
    setExpandedCategories((p) => ({ ...p, [id]: !p[id] }));

  const autoExpandSelectedCategory = () => {
    const expanded = {};
    categories.forEach((l1) => {
      if (l1.slug === selectedCategory) {
        expanded[l1.id] = true;
      } else if (l1.children) {
        l1.children.forEach((l2) => {
          if (l2.slug === selectedCategory) {
            expanded[l1.id] = true;
            expanded[`${l1.id}-${l2.id}`] = true;
          } else if (l2.children) {
            l2.children.forEach((l3) => {
              if (l3.slug === selectedCategory) {
                expanded[l1.id] = true;
                expanded[`${l1.id}-${l2.id}`] = true;
              }
            });
          }
        });
      }
    });
    setExpandedCategories(expanded);
  };

  const getCategoryPath = () => {
    if (!selectedCategory || categories.length === 0) return null;
    for (const l1 of categories) {
      if (l1.slug === selectedCategory) return [l1];
      if (l1.children) {
        for (const l2 of l1.children) {
          if (l2.slug === selectedCategory) return [l1, l2];
          if (l2.children) {
            for (const l3 of l2.children) {
              if (l3.slug === selectedCategory) return [l1, l2, l3];
            }
          }
        }
      }
    }
    return null;
  };

  const categoryPath = getCategoryPath();
  const currentCategoryName = categoryPath
    ? categoryPath[categoryPath.length - 1].name
    : null;

  const getSelectedBrandName = () => {
    const found = brands.find((b) => b.slug === selectedBrand);
    return found ? found.name : selectedBrand;
  };

  // Regroupe les marques par hiérarchie (parent → ses sous-marques),
  // en remontant en tête le groupe contenant la marque sélectionnée.
  const buildBrandGroups = (list, fallbackList, selectedSlug) => {
    const byId = new Map();
    list.forEach((b) => byId.set(b.id, b));
    fallbackList.forEach((b) => {
      if (!byId.has(b.id)) byId.set(b.id, b);
    });

    const inListIds = new Set(list.map((b) => b.id));
    const childrenByParent = {};
    list.forEach((b) => {
      if (b.parent_id) {
        if (!childrenByParent[b.parent_id]) childrenByParent[b.parent_id] = [];
        childrenByParent[b.parent_id].push(b);
      }
    });

    let topLevel = list.filter((b) => !b.parent_id);

    // Si une sous-marque est dans la liste mais que sa marque mère n'y
    // figure pas (ex: la mère n'a aucun produit direct), on la récupère
    // depuis la liste complète pour préserver la hiérarchie visuelle.
    const missingParentIds = new Set();
    list.forEach((b) => {
      if (b.parent_id && !inListIds.has(b.parent_id)) {
        missingParentIds.add(b.parent_id);
      }
    });
    missingParentIds.forEach((pid) => {
      const parent = byId.get(pid);
      if (parent) topLevel.push(parent);
    });

    const seen = new Set();
    topLevel = topLevel.filter((b) => {
      if (seen.has(b.id)) return false;
      seen.add(b.id);
      return true;
    });

    let priorityParentId = null;
    if (selectedSlug) {
      const selected = byId.get(
        list.find((b) => b.slug === selectedSlug)?.id ??
          fallbackList.find((b) => b.slug === selectedSlug)?.id,
      );
      if (selected) priorityParentId = selected.parent_id || selected.id;
    }

    topLevel.sort((a, b) => {
      if (priorityParentId) {
        if (a.id === priorityParentId) return -1;
        if (b.id === priorityParentId) return 1;
      }
      return a.name.localeCompare(b.name);
    });

    return topLevel.map((parent) => ({
      parent,
      children: (childrenByParent[parent.id] || []).sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    }));
  };

  const getPageTitle = () => {
    // Priorité 1 : une catégorie est choisie — peu importe les autres filtres actifs
    if (currentCategoryName) return `Nos produits ${currentCategoryName}`;

    // Priorité 2 : une marque est choisie, sans catégorie
    if (selectedBrand) return `Nos produits ${getSelectedBrandName()}`;

    // Priorité 3 : un seul filtre spécial actif, sans catégorie ni marque
    if (showPromo) return "Nos promotions";
    if (showNew) return "Nos nouveautés";
    if (showBestseller) return "Nos meilleures ventes";
    if (showFeatured) return "Nos produits vedettes";

    // Par défaut
    return "Tous nos produits";
  };

  if (loading && products.length === 0)
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div
          className="w-12 h-12 rounded-full animate-spin"
          style={{ border: "3px solid #e5e7eb", borderTopColor: "#1a5242" }}
        />
        <p className="text-gray-400 text-[14px] font-medium">
          Chargement des produits...
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
          {categoryPath?.length > 0 ? (
            categoryPath.map((cat, i) => (
              <span key={cat.id} className="flex items-center gap-2">
                <ChevronRight size={13} />
                {i < categoryPath.length - 1 ? (
                  <Link
                    to={`/products?category=${cat.slug}`}
                    className="hover:text-[#1a5242] transition-colors font-medium"
                  >
                    {cat.name}
                  </Link>
                ) : (
                  <span className="text-[#1a5242] font-semibold">
                    {cat.name}
                  </span>
                )}
              </span>
            ))
          ) : (
            <>
              <ChevronRight size={13} />
              <span className="text-[#1a5242] font-semibold">
                Tous les produits
              </span>
            </>
          )}
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
                {getPageTitle()}
              </h1>
              <div className="flex items-center gap-2 text-[13.5px] text-gray-400">
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-gray-300 border-t-[#1a5242] rounded-full animate-spin inline-block" />
                    <span>Actualisation des résultats...</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block" />
                    <span>
                      {totalProducts} produit{totalProducts > 1 ? "s" : ""}{" "}
                      trouvé{totalProducts > 1 ? "s" : ""}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <button
                onClick={() => setShowFilters(true)}
                className="lg:hidden flex items-center gap-2 h-10 px-4 border border-gray-300 rounded-xl text-[13px] text-gray-800 font-semibold bg-white shadow-sm"
              >
                <SlidersHorizontal size={14} />
                Filtres
              </button>
              <span className="text-[13px] text-gray-600 font-semibold hidden sm:inline">
                Trier par :
              </span>
              <div className="relative flex-1 sm:flex-none">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none w-full sm:w-auto h-10 pl-4 pr-10 border border-gray-300 rounded-xl text-[13px] text-gray-800 font-semibold outline-none focus:border-[#1a5242] transition-colors bg-white cursor-pointer shadow-sm"
                >
                  <option value="created_at">Plus récents</option>
                  <option value="price_asc">Prix croissant</option>
                  <option value="price_desc">Prix décroissant</option>
                  <option value="name">Nom, A à Z</option>
                  <option value="popularity">Popularité</option>
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 lg:gap-8 items-start">
          {/* ── Sidebar Filtres ── */}
          <>
            {/* Overlay mobile */}
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
              {/* Header sidebar */}
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

              {/* Catégories */}
              <FilterSection title="Catégories">
                <label className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <Radio
                    checked={selectedCategory === ""}
                    onChange={() => setSelectedCategory("")}
                  />
                  <span className="text-[13px] text-gray-600 font-medium">
                    Toutes les catégories
                  </span>
                </label>

                {categories.map((l1) => (
                  <div key={l1.id}>
                    <div
                      className="flex items-center gap-1 cursor-pointer"
                      onClick={() => toggleCategory(l1.id)}
                    >
                      <ChevronRight
                        size={14}
                        className={`text-gray-400 transition-transform flex-shrink-0 ${expandedCategories[l1.id] ? "rotate-90 text-[#1a5242]" : ""}`}
                      />
                      <label
                        className="flex items-center gap-2 px-1 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50 flex-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Radio
                          checked={selectedCategory === l1.slug}
                          onChange={() => setSelectedCategory(l1.slug)}
                        />
                        <span className="text-[13px] font-bold text-gray-800">
                          {l1.name}
                        </span>
                      </label>
                    </div>

                    {expandedCategories[l1.id] && l1.children?.length > 0 && (
                      <div className="ml-4 pl-3 border-l-2 border-gray-100">
                        {l1.children.map((l2) => (
                          <div key={l2.id}>
                            <div
                              className="flex items-center gap-1 cursor-pointer"
                              onClick={() =>
                                toggleCategory(`${l1.id}-${l2.id}`)
                              }
                            >
                              {l2.children?.length > 0 && (
                                <ChevronRight
                                  size={13}
                                  className={`text-gray-400 transition-transform flex-shrink-0 ${expandedCategories[`${l1.id}-${l2.id}`] ? "rotate-90 text-[#1a5242]" : ""}`}
                                />
                              )}
                              <label
                                className="flex items-center gap-2 px-1 py-1 rounded-lg cursor-pointer hover:bg-gray-50 flex-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Radio
                                  checked={selectedCategory === l2.slug}
                                  onChange={() => setSelectedCategory(l2.slug)}
                                />
                                <span className="text-[13px] text-gray-600">
                                  {l2.name}
                                </span>
                              </label>
                            </div>

                            {expandedCategories[`${l1.id}-${l2.id}`] &&
                              l2.children?.length > 0 && (
                                <div className="ml-4 pl-3 border-l border-dashed border-gray-200">
                                  {l2.children.map((l3) => (
                                    <label
                                      key={l3.id}
                                      className="flex items-center gap-2 px-1 py-1 rounded-lg cursor-pointer hover:bg-gray-50"
                                    >
                                      <Radio
                                        checked={selectedCategory === l3.slug}
                                        onChange={() =>
                                          setSelectedCategory(l3.slug)
                                        }
                                      />
                                      <span className="text-[12.5px] text-gray-500">
                                        {l3.name}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </FilterSection>

              {/* Marques */}
              <FilterSection title="Marques">
                {availableBrands.length > 0 ? (
                  <>
                    <label className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <Radio
                        checked={selectedBrand === ""}
                        onChange={() => setSelectedBrand("")}
                      />
                      <span className="text-[13px] text-gray-600 font-medium">
                        Toutes les marques
                      </span>
                    </label>

                    {(() => {
                      const groups = buildBrandGroups(
                        availableBrands,
                        brands,
                        selectedBrand,
                      );
                      const visibleGroups = showAllBrands
                        ? groups
                        : (() => {
                            const acc = [];
                            let count = 0;
                            for (const g of groups) {
                              acc.push(g);
                              count += 1 + g.children.length;
                              if (count >= 8) break;
                            }
                            return acc;
                          })();
                      const totalCount = groups.reduce(
                        (sum, g) => sum + 1 + g.children.length,
                        0,
                      );
                      const visibleCount = visibleGroups.reduce(
                        (sum, g) => sum + 1 + g.children.length,
                        0,
                      );

                      return (
                        <>
                          {visibleGroups.map(({ parent, children }) => (
                            <div key={parent.id}>
                              <label className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                <Radio
                                  checked={selectedBrand === parent.slug}
                                  onChange={() => setSelectedBrand(parent.slug)}
                                />
                                <span className="text-[13px] text-gray-600 font-semibold">
                                  {parent.name}
                                </span>
                              </label>
                              {children.length > 0 && (
                                <div className="ml-4 pl-3 border-l-2 border-gray-100">
                                  {children.map((c) => (
                                    <label
                                      key={c.id}
                                      className="flex items-center gap-2.5 px-1 py-1 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                                    >
                                      <Radio
                                        checked={selectedBrand === c.slug}
                                        onChange={() =>
                                          setSelectedBrand(c.slug)
                                        }
                                      />
                                      <span className="text-[12.5px] text-gray-500">
                                        {c.name}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                          {totalCount > visibleCount && (
                            <button
                              onClick={() => setShowAllBrands((v) => !v)}
                              className="flex items-center gap-1.5 px-2 py-1.5 text-[12.5px] font-semibold text-[#1a5242] hover:opacity-70 transition-opacity mt-1"
                            >
                              <ChevronDown
                                size={13}
                                className={`transition-transform ${showAllBrands ? "rotate-180" : ""}`}
                              />
                              {showAllBrands
                                ? "Voir moins"
                                : `Voir plus (${totalCount - visibleCount})`}
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </>
                ) : (
                  <p className="text-[12.5px] text-gray-400 italic text-center py-3 bg-gray-50 rounded-lg">
                    Aucune marque disponible
                  </p>
                )}
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
                    onClick={async () => {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                      if (currentPage !== 1) {
                        setCurrentPage(1);
                      } else {
                        await fetchProducts();
                      }
                      // Filet de sécurité : si le rechargement du contenu a
                      // interrompu l'animation de scroll en cours (hauteur de
                      // grille qui change pendant le "smooth"), on rescroll
                      // une fois les nouveaux produits affichés.
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    disabled={loading}
                    className="w-full py-2 rounded-xl text-white text-[13px] font-semibold transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                    style={{
                      background:
                        "linear-gradient(135deg, #2d7a5f 0%, #3f9973 100%)",
                    }}
                  >
                    {loading && (
                      <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    )}
                    {loading ? "Recherche..." : "Chercher"}
                  </button>
                </div>
              </FilterSection>

              {/* Options */}
              {/* Options */}
              <FilterSection title="Options">
                <label className="flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <Checkbox
                    checked={showPromo}
                    onChange={(e) => setShowPromo(e.target.checked)}
                  />
                  <span className="text-[13px] text-gray-600 font-medium">
                    En promotion
                  </span>
                </label>
                <label className="flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <Checkbox
                    checked={showNew}
                    onChange={(e) => setShowNew(e.target.checked)}
                  />
                  <span className="text-[13px] text-gray-600 font-medium">
                    Nouveautés
                  </span>
                </label>
                <label className="flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <Checkbox
                    checked={showBestseller}
                    onChange={(e) => setShowBestseller(e.target.checked)}
                  />
                  <span className="text-[13px] text-gray-600 font-medium">
                    Meilleures ventes
                  </span>
                </label>
                <label className="flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <Checkbox
                    checked={showFeatured}
                    onChange={(e) => setShowFeatured(e.target.checked)}
                  />
                  <span className="text-[13px] text-gray-600 font-medium">
                    Sélection ParaSunshine
                  </span>
                </label>
              </FilterSection>

              {/* Reset */}
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
            {/* Erreur */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center mb-5">
                <p className="text-red-600 font-semibold text-[14px] mb-3">
                  {error}
                </p>
                <button
                  onClick={fetchProducts}
                  className="px-5 py-2 rounded-xl bg-red-500 text-white text-[13px] font-semibold hover:bg-red-600 transition-colors"
                >
                  Réessayer
                </button>
              </div>
            )}

            {/* Grille produits */}
            {products.length > 0 ? (
              <>
                <div
                  className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5 transition-opacity duration-200 ${
                    loading ? "opacity-40 pointer-events-none" : "opacity-100"
                  }`}
                >
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1.5 mt-10 pt-8 border-t border-gray-100 flex-wrap">
                    {/* Flèche gauche */}
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

                    {/* Flèche droite */}
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
                  Aucun produit ne correspond à vos critères
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

// ── Composants utilitaires ──

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

const Checkbox = ({ checked, onChange }) => (
  <input
    type="checkbox"
    checked={checked}
    onChange={onChange}
    className="w-4 h-4 flex-shrink-0 cursor-pointer accent-[#1a5242] rounded"
  />
);
