import { useState, useEffect } from "react";
import {
  Search,
  Trash2,
  Plus,
  ToggleLeft,
  ToggleRight,
  Star,
} from "lucide-react";
import {
  getFeaturedSection,
  updateFeaturedSection,
  searchFeaturedProducts,
  addFeaturedProduct,
  removeFeaturedProduct,
} from "../services/adminApi";
import {
  PageHeader,
  Btn,
  Spinner,
  Input,
  Toast,
} from "../components/AdminShared";

export default function AdminFeaturedSection() {
  const [section, setSection] = useState(null);
  const [included, setIncluded] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [toast, setToast] = useState(null);
  const [savingVisibility, setSavingVisibility] = useState(false);
  const [addingId, setAddingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  const showToast = (message, type = "success") => setToast({ message, type });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getFeaturedSection();
      setSection(data.section);
      setIncluded(data.included_products || []);
    } catch {
      showToast("Erreur lors du chargement.", "error");
    } finally {
      setLoading(false);
    }
  };

  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchFeaturedProducts(search);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const handleFocus = () => setShowDropdown(true);

  const handleToggleVisibility = async () => {
    setSavingVisibility(true);
    try {
      const updated = await updateFeaturedSection({
        is_visible: !section.is_visible,
      });
      setSection(updated.section);
      showToast(
        updated.section.is_visible
          ? "Section rendue visible sur le site."
          : "Section masquée du site.",
      );
    } catch {
      showToast("Erreur.", "error");
    } finally {
      setSavingVisibility(false);
    }
  };

  const handleAdd = async (product) => {
    setAddingId(product.id);
    try {
      await addFeaturedProduct(product.id);
      setIncluded((prev) => [...prev, product]);
      setSearchResults((prev) => prev.filter((p) => p.id !== product.id));
      showToast(`"${product.name}" ajouté à la section.`);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Erreur lors de l'ajout.",
        "error",
      );
    } finally {
      setAddingId(null);
    }
  };

  const handleRemove = async (productId) => {
    setRemovingId(productId);
    try {
      await removeFeaturedProduct(productId);
      setIncluded((prev) => prev.filter((p) => p.id !== productId));
      showToast("Produit retiré de la section.");
    } catch {
      showToast("Erreur lors du retrait.", "error");
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <PageHeader
        title="Produits vedettes"
        subtitle="Les produits affichés dans la section « Sélection ParaSunshine » de la page d'accueil"
        action={
          <button
            onClick={handleToggleVisibility}
            disabled={savingVisibility}
            className={`flex items-center justify-center gap-2 px-4 py-2 h-9 rounded-lg text-[13.5px] font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap w-full sm:w-auto ${
              section?.is_visible
                ? "bg-[#1a4731] text-white hover:opacity-90"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {savingVisibility ? (
              <span
                className={`w-4 h-4 border-2 rounded-full animate-spin ${
                  section?.is_visible
                    ? "border-white/30 border-t-white"
                    : "border-gray-300 border-t-gray-500"
                }`}
              />
            ) : section?.is_visible ? (
              <ToggleRight size={16} />
            ) : (
              <ToggleLeft size={16} />
            )}
            {savingVisibility
              ? "Mise à jour..."
              : section?.is_visible
                ? "Section visible"
                : "Section masquée"}
          </button>
        }
      />

      {/* Recherche */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm mb-5">
        <p className="text-[13px] font-bold text-gray-700 mb-3">
          Ajouter un produit
        </p>
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={handleFocus}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            placeholder="Rechercher un produit marqué 'Vedette'..."
            className="pl-9 w-full"
          />
        </div>
        <p className="text-[11.5px] text-gray-400 mt-2">
          Ajouter un produit ici active automatiquement son badge « Vedette » —
          et inversement, cocher ce badge sur une fiche produit l'ajoute
          directement à cette section.
        </p>

        {showDropdown && searching && (
          <p className="text-[12px] text-gray-400 mt-3">Recherche...</p>
        )}

        {showDropdown && searchResults.length > 0 && (
          <div className="mt-3 space-y-2 max-h-72 overflow-y-auto">
            {searchResults.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 p-2.5 border border-gray-100 rounded-xl hover:border-[#1a4731]/30 transition-colors"
              >
                {p.image ? (
                  <img
                    src={`http://localhost/storage/${p.image}`}
                    alt=""
                    className="w-10 h-10 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-gray-800 truncate">
                    {p.name}
                  </p>
                  <p className="text-[11.5px] text-gray-400">
                    {parseFloat(p.promo_price || p.price).toFixed(3)} DT
                  </p>
                </div>
                <button
                  onClick={() => handleAdd(p)}
                  disabled={addingId === p.id}
                  className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-[#1a4731]/10 text-[#1a4731] hover:bg-[#1a4731] hover:text-white transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingId === p.id ? (
                    <span className="w-3 h-3 border-2 border-[#1a4731]/30 border-t-[#1a4731] rounded-full animate-spin" />
                  ) : (
                    <Plus size={13} />
                  )}
                  {addingId === p.id ? "Ajout..." : "Ajouter"}
                </button>
              </div>
            ))}
          </div>
        )}

        {showDropdown && !searching && searchResults.length === 0 && (
          <p className="text-[12px] text-gray-400 mt-3">
            {search.trim()
              ? `Aucun produit vedette trouvé pour "${search}".`
              : "Aucun produit disponible à ajouter (tous les produits vedettes sont déjà dans la section, ou aucun produit n'a le badge Vedette activé)."}
          </p>
        )}
      </div>

      {/* Produits inclus */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <p className="text-[13px] font-bold text-gray-700 mb-4">
          Produits dans la section ({included.length})
        </p>

        {included.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Star size={28} className="mx-auto mb-2 text-gray-200" />
            <p className="text-[13px]">
              Aucun produit dans cette section pour l'instant.
            </p>
          </div>
        ) : (
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            }}
          >
            {included.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl"
              >
                {p.image ? (
                  <img
                    src={`http://localhost/storage/${p.image}`}
                    alt=""
                    className="w-11 h-11 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-lg bg-gray-100 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-semibold text-gray-800 truncate">
                    {p.name}
                  </p>
                  <p className="text-[11.5px] text-gray-400">
                    {parseFloat(p.promo_price || p.price).toFixed(3)} DT
                  </p>
                </div>
                <button
                  onClick={() => handleRemove(p.id)}
                  disabled={removingId === p.id}
                  className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Retirer de la section"
                >
                  {removingId === p.id ? (
                    <span className="w-3.5 h-3.5 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" />
                  ) : (
                    <Trash2 size={13} />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
