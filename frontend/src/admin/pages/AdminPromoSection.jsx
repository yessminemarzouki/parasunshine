import { useState, useEffect, useRef } from "react";
import { useDebounce } from "../hooks/useDebounce";
import {
  Save,
  Search,
  X,
  GripVertical,
  Palette,
  Package,
  Trash2,
  Plus,
} from "lucide-react";
import {
  getPromoSection,
  updatePromoSection,
  searchPromoProducts,
  addProductToPromoSection,
  removeProductFromPromoSection,
  addAllPromotedToPromoSection,
} from "../services/adminApi";
import {
  Btn,
  Input,
  Spinner,
  PageHeader,
  Label,
} from "../components/AdminShared";
import { STORAGE_URL } from "../../config/api";

export default function AdminPromoSection() {
  const [section, setSection] = useState(null);
  const [includedProducts, setIncludedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [addingIds, setAddingIds] = useState(new Set());
  const [removingIds, setRemovingIds] = useState(new Set());
  const [addingAll, setAddingAll] = useState(false);

  const handleAddAllPromoted = async () => {
    setAddingAll(true);
    try {
      const result = await addAllPromotedToPromoSection();
      pushToast(result.message);
      await fetchSection();
    } catch (err) {
      pushToast(
        err.response?.data?.message || "Erreur lors de l'ajout.",
        "error",
      );
    } finally {
      setAddingAll(false);
    }
  };
  const searchRef = useRef();

  const pushToast = (message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  useEffect(() => {
    fetchSection();
  }, []);

  const fetchSection = async () => {
    try {
      setLoading(true);
      const data = await getPromoSection();
      setSection({ order_mode: "recent", ...data.section });
      setIncludedProducts(data.included_products || []);
    } catch {
      pushToast("Erreur lors du chargement.", "error");
    } finally {
      setLoading(false);
    }
  };

  const s = (key, val) => setSection((p) => ({ ...p, [key]: val }));

  const debouncedSearchQ = useDebounce(searchQ, 350);

  const runSearch = async (q) => {
    try {
      setSearching(true);
      const excludeIds = includedProducts.map((p) => p.id);
      const results = await searchPromoProducts(q, excludeIds);
      setSearchResults(results);
    } catch {
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (!loading) runSearch(debouncedSearchQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQ, includedProducts, loading]);

  const handleAdd = async (product) => {
    setAddingIds((prev) => new Set(prev).add(product.id));
    try {
      await addProductToPromoSection(product.id);
      setIncludedProducts((prev) => [...prev, product]);
      pushToast(`"${product.name}" ajouté à la section.`);
    } catch (err) {
      pushToast(
        err.response?.data?.message || "Erreur lors de l'ajout.",
        "error",
      );
    } finally {
      setAddingIds((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }
  };

  const handleRemove = async (product) => {
    setRemovingIds((prev) => new Set(prev).add(product.id));
    try {
      await removeProductFromPromoSection(product.id);
      setIncludedProducts((prev) => prev.filter((p) => p.id !== product.id));
      pushToast(`"${product.name}" retiré de la section.`);
    } catch (err) {
      pushToast(
        err.response?.data?.message || "Erreur lors du retrait.",
        "error",
      );
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updatePromoSection({
        title: section.title,
        background_color: section.background_color,
        title_color: section.title_color,
        is_visible: section.is_visible,
        order_mode: section.order_mode,
        product_ids: includedProducts.map((p) => p.id),
      });
      pushToast("Section promo mise à jour avec succès.");
    } catch (err) {
      pushToast(
        err.response?.data?.message || "Erreur lors de la mise à jour.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading || !section) return <Spinner />;

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
        title="Section Top Promo"
        subtitle="Gérez l'affichage, le design et les produits de la section promotions"
        action={
          <Btn onClick={handleSave} disabled={saving}>
            {saving ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save size={14} /> Enregistrer
              </>
            )}
          </Btn>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Design & Visibilité ── */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Palette size={16} className="text-[#1a4731]" />
            <p className="text-[13px] font-bold text-gray-700">
              Design & Visibilité
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <Label>Titre de la section</Label>
              <Input
                value={section.title}
                onChange={(e) => s("title", e.target.value)}
                className="w-full mt-1"
                placeholder="Top Promo"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Couleur de fond</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={section.background_color}
                    onChange={(e) => s("background_color", e.target.value)}
                    className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer"
                  />
                  <Input
                    value={section.background_color}
                    onChange={(e) => s("background_color", e.target.value)}
                    className="flex-1"
                    placeholder="#faf0e6"
                  />
                </div>
              </div>
              <div>
                <Label>Couleur du titre</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={section.title_color}
                    onChange={(e) => s("title_color", e.target.value)}
                    className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer"
                  />
                  <Input
                    value={section.title_color}
                    onChange={(e) => s("title_color", e.target.value)}
                    className="flex-1"
                    placeholder="#1a1a1a"
                  />
                </div>
              </div>
            </div>

            <div
              className="rounded-xl py-3 px-6 text-center font-bold text-[1.1rem] transition-all"
              style={{
                background: section.background_color,
                color: section.title_color,
              }}
            >
              {section.title || "Top Promo"}
            </div>

            <div>
              <Label>Visibilité</Label>
              <label className="flex items-center gap-3 cursor-pointer mt-1.5">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={section.is_visible}
                    onChange={(e) => s("is_visible", e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-10 h-5 rounded-full transition-colors ${section.is_visible ? "bg-[#1a4731]" : "bg-gray-200"}`}
                  />
                  <div
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${section.is_visible ? "translate-x-5" : ""}`}
                  />
                </div>
                <span className="text-[13px] text-gray-700 font-medium">
                  {section.is_visible ? "Visible sur le site" : "Masquée"}
                </span>
              </label>
              <p className="text-[11.5px] text-gray-400 mt-1.5">
                Les dates de début/fin de chaque promotion sont gérées
                individuellement depuis l'Assistant Promotions.
              </p>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <Label>Ordre d'affichage des produits</Label>
              <div className="flex flex-col gap-2 mt-2">
                {[
                  {
                    val: "recent",
                    label: "Plus récents en premier",
                    desc: "Les dernières promotions ajoutées d'abord",
                  },
                  {
                    val: "bestseller",
                    label: "Meilleures ventes en premier",
                    desc: "Les produits les plus vendus en tête",
                  },
                  {
                    val: "random",
                    label: "Aléatoire",
                    desc: "Ordre mélangé à chaque visite",
                  },
                ].map((opt) => (
                  <label
                    key={opt.val}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      section.order_mode === opt.val
                        ? "border-[#1a4731] bg-[#edf7f3]"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      checked={section.order_mode === opt.val}
                      onChange={() => s("order_mode", opt.val)}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-[13px] font-semibold text-gray-700">
                        {opt.label}
                      </p>
                      <p className="text-[11.5px] text-gray-400">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Produits inclus ── */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Package size={16} className="text-[#1a4731]" />
              <p className="text-[13px] font-bold text-gray-700">
                Produits dans la section ({includedProducts.length})
              </p>
            </div>
            <button
              onClick={handleAddAllPromoted}
              disabled={addingAll}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-[#1a4731] hover:opacity-70 disabled:opacity-40 transition-opacity"
            >
              {addingAll ? (
                <span className="w-3.5 h-3.5 border-2 border-[#1a4731]/30 border-t-[#1a4731] rounded-full animate-spin" />
              ) : (
                <Plus size={13} />
              )}
              Ajouter tous les produits en promo
            </button>
          </div>

          {includedProducts.length > 0 ? (
            <div className="space-y-2 max-h-[260px] overflow-y-auto mb-2">
              {includedProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2.5 p-2.5 border border-gray-200 rounded-xl bg-gray-50"
                >
                  <GripVertical
                    size={14}
                    className="text-gray-300 flex-shrink-0"
                  />
                  <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                    {p.image ? (
                      <img
                        src={`${STORAGE_URL}/${p.image}`}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-gray-800 truncate">
                      {p.name}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {p.promo_price ? `${p.promo_price} DT` : `${p.price} DT`}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemove(p)}
                    disabled={removingIds.has(p.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 flex-shrink-0 disabled:opacity-40"
                  >
                    {removingIds.has(p.id) ? (
                      <span className="w-3.5 h-3.5 border-2 border-red-200 border-t-red-500 rounded-full animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400 text-[12.5px] border-2 border-dashed border-gray-200 rounded-xl mb-4">
              Aucun produit dans cette section pour le moment.
            </div>
          )}

          <div className="border-t border-gray-100 pt-4 mt-2">
            <p className="text-[12px] font-semibold text-gray-500 mb-2.5">
              Ajouter un produit en promotion
            </p>
            <div className="relative mb-3">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                ref={searchRef}
                type="text"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Rechercher parmi les produits en promo..."
                className="w-full h-9 pl-9 pr-3 border border-gray-200 rounded-lg text-[13px] text-gray-700 bg-white outline-none focus:border-[#1a4731]"
              />
            </div>

            {searching ? (
              <p className="text-[12px] text-gray-400 text-center py-3">
                Recherche...
              </p>
            ) : searchResults.length > 0 ? (
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
                {searchResults.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                      {p.image ? (
                        <img
                          src={`http://localhost/storage/${p.image}`}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-semibold text-gray-800 truncate">
                        {p.name}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {p.promo_price
                          ? `${p.promo_price} DT`
                          : `${p.price} DT`}
                        {p.discount_percentage && (
                          <span className="ml-1.5 text-red-500 font-bold">
                            -{p.discount_percentage}%
                          </span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAdd(p)}
                      disabled={addingIds.has(p.id)}
                      className="flex items-center gap-1 text-[11px] font-bold text-[#1a4731] px-2 py-1 bg-[#edf7f3] rounded-lg hover:opacity-80 disabled:opacity-40 flex-shrink-0"
                    >
                      {addingIds.has(p.id) ? (
                        <span className="w-3 h-3 border-2 border-[#1a4731]/30 border-t-[#1a4731] rounded-full animate-spin" />
                      ) : (
                        <>
                          <Plus size={12} /> Ajouter
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-gray-400 text-center py-3">
                {searchQ.trim()
                  ? "Aucun produit en promo ne correspond."
                  : "Aucun produit en promo disponible à ajouter."}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
