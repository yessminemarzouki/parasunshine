import { useState, useEffect } from "react";
import { useDebounce } from "../hooks/useDebounce";
import {
  Search,
  X,
  Tag,
  Sparkles,
  AlertTriangle,
  Check,
  Trash2,
} from "lucide-react";
import {
  searchPromotionProducts,
  applyBulkPromotion,
  removeBulkPromotion,
  getAdminCategories,
  getAdminBrands,
} from "../services/adminApi";
import { Btn, Input, PageHeader, Label } from "../components/AdminShared";

export default function AdminPromotions() {
  const [mode, setMode] = useState("apply"); // "apply" | "remove"
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]); // liste de produits complets
  const [discount, setDiscount] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [addToTopPromo, setAddToTopPromo] = useState(false);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectingAll, setSelectingAll] = useState(false);
  const [applying, setApplying] = useState(false);
  const [toasts, setToasts] = useState([]);

  const pushToast = (message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const debouncedQuery = useDebounce(query, 350);

  const runSearch = async (q, currentMode = mode) => {
    setSearching(true);
    setResults([]); // vide immédiatement l'ancienne liste pendant le chargement
    try {
      const data = await searchPromotionProducts({
        q: q.trim(),
        mode: currentMode,
        category_id: filterCategory || undefined,
        brand_id: filterBrand || undefined,
      });
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Relance la recherche à chaque frappe (debouncée), changement de mode ou de filtre
  useEffect(() => {
    runSearch(debouncedQuery, mode);
    setSelected([]); // la sélection ne doit jamais survivre à un changement de filtre
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, mode, filterCategory, filterBrand]);

  useEffect(() => {
    getAdminCategories()
      .then(setCategories)
      .catch(() => {});
    getAdminBrands()
      .then(setBrands)
      .catch(() => {});
  }, []);

  // Réinitialise la sélection/recherche au changement de mode
  useEffect(() => {
    setSelected([]);
    setQuery("");
    setFilterCategory("");
    setFilterBrand("");
  }, [mode]);

  const toggleSelect = (product) => {
    setSelected((prev) =>
      prev.find((p) => p.id === product.id)
        ? prev.filter((p) => p.id !== product.id)
        : [...prev, product],
    );
  };

  const removeSelected = (id) => {
    setSelected((prev) => prev.filter((p) => p.id !== id));
  };

  const clearSelection = () => setSelected([]);
  const handleSelectAll = async () => {
    setSelectingAll(true);
    try {
      const all = await searchPromotionProducts({
        q: debouncedQuery.trim(),
        mode,
        category_id: filterCategory || undefined,
        brand_id: filterBrand || undefined,
        select_all: 1,
      });
      setSelected(all);
      pushToast(`${all.length} produit(s) sélectionné(s).`);
    } catch {
      pushToast("Erreur lors de la sélection.", "error");
    } finally {
      setSelectingAll(false);
    }
  };

  const discountNum = parseFloat(discount) || 0;
  const isHighDiscount = discountNum >= 70;

  const handleApply = async () => {
    if (selected.length === 0) {
      pushToast("Sélectionnez au moins un produit.", "error");
      return;
    }
    if (!discount || discountNum <= 0 || discountNum >= 100) {
      pushToast("Entrez un pourcentage de remise valide (1 à 99).", "error");
      return;
    }
    setApplying(true);
    try {
      const result = await applyBulkPromotion({
        product_ids: selected.map((p) => p.id),
        discount_percentage: discountNum,
        starts_at: startsAt || null,
        ends_at: endsAt || null,
        add_to_top_promo: addToTopPromo,
      });
      pushToast(result.message);
      setSelected([]);
      setDiscount("");
      setStartsAt("");
      setEndsAt("");
      setAddToTopPromo(false);
      runSearch(query, mode);
    } catch (err) {
      pushToast(
        err.response?.data?.message || "Erreur lors de l'application.",
        "error",
      );
    } finally {
      setApplying(false);
    }
  };

  const handleRemove = async () => {
    if (selected.length === 0) {
      pushToast("Sélectionnez au moins un produit.", "error");
      return;
    }
    setApplying(true);
    try {
      const result = await removeBulkPromotion({
        product_ids: selected.map((p) => p.id),
      });
      pushToast(result.message);
      setSelected([]);
      runSearch(query, mode);
    } catch (err) {
      pushToast(
        err.response?.data?.message || "Erreur lors du retrait.",
        "error",
      );
    } finally {
      setApplying(false);
    }
  };

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Pile de toasts empilables */}
      <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-5 sm:top-5 z-[9999] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg max-w-sm text-[13px] font-semibold ${
              t.type === "error"
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-emerald-50 border-emerald-200 text-emerald-700"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>

      <PageHeader
        title="Assistant Promotions"
        subtitle="Appliquez ou retirez une promotion sur plusieurs produits en une fois"
      />

      {/* Bascule mode */}
      <div className="flex gap-0.5 bg-gray-100 p-1 rounded-xl mb-5 overflow-x-auto">
        {[
          { key: "apply", label: "Appliquer une promo", icon: Tag },
          { key: "remove", label: "Retirer une promo", icon: Trash2 },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all ${
              mode === key
                ? "bg-white text-[#1a4731] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
        {/* ── Colonne recherche ── */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <p className="text-[13px] font-bold text-gray-700">
              {mode === "apply"
                ? "Produits sans promotion active"
                : "Produits actuellement en promotion"}
            </p>
            <button
              onClick={handleSelectAll}
              disabled={selectingAll || results.length === 0}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-[#1a4731] hover:opacity-70 disabled:opacity-40 transition-opacity"
            >
              {selectingAll ? (
                <span className="w-3.5 h-3.5 border-2 border-[#1a4731]/30 border-t-[#1a4731] rounded-full animate-spin" />
              ) : (
                <Check size={13} />
              )}
              Sélectionner tout
            </button>
          </div>
          <div className="relative mb-3">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nom, référence, catégorie ou marque..."
              className="pl-9 w-full"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="h-9 px-2.5 border border-gray-200 rounded-lg text-[12.5px] text-gray-700 bg-white outline-none focus:border-[#1a4731]"
            >
              <option value="">Toutes catégories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={filterBrand}
              onChange={(e) => setFilterBrand(e.target.value)}
              className="h-9 px-2.5 border border-gray-200 rounded-lg text-[12.5px] text-gray-700 bg-white outline-none focus:border-[#1a4731]"
            >
              <option value="">Toutes marques</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {searching && (
            <p className="text-[12.5px] text-gray-400 text-center py-4">
              Recherche...
            </p>
          )}

          {!searching && results.length === 0 && (
            <p className="text-[12.5px] text-gray-400 text-center py-4">
              {mode === "apply"
                ? "Aucun produit sans promotion trouvé."
                : "Aucun produit en promotion trouvé."}
            </p>
          )}

          <div className="space-y-1.5 max-h-[480px] overflow-y-auto">
            {results.map((p) => {
              const isSelected = selected.some((s) => s.id === p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => toggleSelect(p)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left ${
                    isSelected
                      ? "border-[#1a4731] bg-[#edf7f3]"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? "bg-[#1a4731] border-[#1a4731]"
                        : "border-gray-300"
                    }`}
                  >
                    {isSelected && <Check size={13} className="text-white" />}
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                    {p.image && (
                      <img
                        src={`http://localhost/storage/${p.image}`}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-gray-800 truncate">
                      {p.name}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Réf: {p.reference || "—"} · {p.category?.name || "—"}
                      {mode === "remove" && p.discount_percentage && (
                        <span className="ml-1.5 text-red-500 font-semibold">
                          · -{p.discount_percentage}%
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="text-[12.5px] font-bold text-[#1a4731] flex-shrink-0">
                    {parseFloat(p.promo_price || p.price).toFixed(3)} DT
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Colonne sélection + paramètres ── */}
        <div className="space-y-4">
          {/* Produits sélectionnés */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] font-bold text-gray-700">
                Sélection ({selected.length})
              </p>
              {selected.length > 0 && (
                <button
                  onClick={clearSelection}
                  className="text-[11.5px] text-red-500 font-semibold hover:opacity-70"
                >
                  Tout retirer
                </button>
              )}
            </div>
            {selected.length === 0 ? (
              <p className="text-[12px] text-gray-400 text-center py-6">
                Sélectionnez des produits à gauche.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
                {selected.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-50 rounded-lg"
                  >
                    <span className="text-[12px] text-gray-700 flex-1 truncate">
                      {p.name}
                    </span>
                    <button
                      onClick={() => removeSelected(p.id)}
                      className="text-gray-400 hover:text-red-500 flex-shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {mode === "apply" ? (
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <p className="text-[13px] font-bold text-gray-700 mb-4">
                Paramètres de la promotion
              </p>

              <div className="mb-4">
                <Label>Pourcentage de remise (%)</Label>
                <Input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="Ex: 20"
                  className="w-full mt-1"
                />
                {isHighDiscount && (
                  <p className="flex items-center gap-1.5 text-[11.5px] text-amber-600 font-semibold mt-1.5">
                    <AlertTriangle size={12} />
                    Remise élevée — vérifiez qu'il ne s'agit pas d'une erreur de
                    saisie.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div>
                  <Label>Début (optionnel)</Label>
                  <input
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="w-full h-9 px-3 border border-gray-200 rounded-lg text-[12.5px] text-gray-800 bg-white outline-none focus:border-[#1a4731] mt-1"
                  />
                </div>
                <div>
                  <Label>Fin (optionnel)</Label>
                  <input
                    type="datetime-local"
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    className="w-full h-9 px-3 border border-gray-200 rounded-lg text-[12.5px] text-gray-800 bg-white outline-none focus:border-[#1a4731] mt-1"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer mb-5">
                <input
                  type="checkbox"
                  checked={addToTopPromo}
                  onChange={(e) => setAddToTopPromo(e.target.checked)}
                  className="w-4 h-4 accent-[#1a4731]"
                />
                <span className="text-[12.5px] text-gray-700 font-medium">
                  Ajouter à la section Top Promo
                </span>
              </label>

              {selected.length > 0 && discountNum > 0 && discountNum < 100 && (
                <div className="mb-5 border border-gray-100 rounded-xl overflow-hidden">
                  <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                      Aperçu
                    </p>
                  </div>
                  <div className="max-h-[160px] overflow-y-auto">
                    {selected.map((p) => {
                      const price = parseFloat(p.price) || 0;
                      const newPrice = (
                        price -
                        (price * discountNum) / 100
                      ).toFixed(3);
                      return (
                        <div
                          key={p.id}
                          className="flex items-center justify-between px-3 py-2 border-b border-gray-50 last:border-0 text-[12px]"
                        >
                          <span className="text-gray-600 truncate max-w-[140px]">
                            {p.name}
                          </span>
                          <span>
                            <span className="text-gray-400 line-through mr-1.5">
                              {price.toFixed(3)}
                            </span>
                            <span className="font-bold text-emerald-600">
                              {newPrice} DT
                            </span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <Btn onClick={handleApply} disabled={applying}>
                {applying ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles size={14} /> Appliquer à {selected.length}{" "}
                    produit(s)
                  </>
                )}
              </Btn>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <p className="text-[13px] font-bold text-gray-700 mb-4">
                Retirer la promotion
              </p>
              <p className="text-[12.5px] text-gray-500 mb-5">
                Les produits sélectionnés reviendront à leur prix normal et
                seront retirés de la section Top Promo si applicable.
              </p>
              <Btn danger onClick={handleRemove} disabled={applying}>
                {applying ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash2 size={14} /> Retirer de {selected.length} produit(s)
                  </>
                )}
              </Btn>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
