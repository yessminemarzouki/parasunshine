import { useState, useEffect, useRef } from "react";
import { useDebounce } from "../hooks/useDebounce";
import {
  Plus,
  Trash2,
  X,
  Search,
  Check,
  ArrowLeft,
  Power,
  Edit2,
  Calendar,
  Tag,
  Clock,
} from "lucide-react";
import {
  getPromoCampaigns,
  createPromoCampaign,
  updatePromoCampaign,
  togglePromoCampaignActive,
  deletePromoCampaign,
  getPromoCampaignProducts,
  searchPromoCampaignAvailable,
  addPromoCampaignProducts,
  removePromoCampaignProducts,
  getAdminCategories,
  getAdminBrands,
} from "../services/adminApi";
import { STORAGE_URL } from "../../config/api";
import {
  Btn,
  Input,
  Label,
  PageHeader,
  Spinner,
  Toast,
  Badge,
} from "../components/AdminShared";

const emptyForm = {
  name: "",
  discount_percentage: "",
  starts_at: "",
  ends_at: "",
};

// MySQL renvoie "Y-m-d H:i:s" — Safari/iOS ne parse pas cette forme sans "T"
const parseServerDate = (str) => (str ? new Date(str.replace(" ", "T")) : null);

const formatFullDate = (d) =>
  d
    ? d.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

export default function AdminPromoCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  const showToast = (message, type = "success") => setToast({ message, type });

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const data = await getPromoCampaigns();
      setCampaigns(data);
    } catch {
      showToast("Erreur lors du chargement des campagnes.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (c) => {
    setEditId(c.id);
    setForm({
      name: c.name,
      discount_percentage: c.discount_percentage,
      starts_at: c.starts_at ? c.starts_at.slice(0, 16) : "",
      ends_at: c.ends_at ? c.ends_at.slice(0, 16) : "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast("Le nom de la campagne est obligatoire.", "error");
      return;
    }
    const discount = parseInt(form.discount_percentage, 10);
    if (!discount || discount < 1 || discount > 99) {
      showToast("Le pourcentage doit être compris entre 1 et 99.", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        discount_percentage: discount,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
      };
      if (editId) {
        await updatePromoCampaign(editId, payload);
        showToast("Campagne mise à jour avec succès.");
      } else {
        await createPromoCampaign(payload);
        showToast("Campagne créée avec succès.");
      }
      setShowForm(false);
      fetchCampaigns();
    } catch (err) {
      showToast(
        err.response?.data?.message || "Erreur lors de l'enregistrement.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (c) => {
    setBusyId(c.id);
    try {
      await togglePromoCampaignActive(c.id);
      showToast(c.is_active ? "Campagne désactivée." : "Campagne activée.");
      fetchCampaigns();
    } catch {
      showToast("Erreur lors du changement de statut.", "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setBusyId(deleteConfirm.id);
    try {
      await deletePromoCampaign(deleteConfirm.id);
      showToast("Campagne supprimée.");
      setDeleteConfirm(null);
      fetchCampaigns();
    } catch {
      showToast("Erreur lors de la suppression.", "error");
    } finally {
      setBusyId(null);
    }
  };

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : null;

  // ── Vue détail d'une campagne ──
  if (selectedCampaign) {
    return (
      <CampaignDetail
        campaign={selectedCampaign}
        onBack={() => {
          setSelectedCampaign(null);
          fetchCampaigns();
        }}
        showToast={showToast}
      />
    );
  }

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
        title="Campagnes de promotion"
        subtitle="Créez des groupes de produits en promotion, avec un nom, un pourcentage et une durée"
        action={
          <Btn onClick={openAdd}>
            <Plus size={14} /> Nouvelle campagne
          </Btn>
        }
      />

      {loading ? (
        <Spinner />
      ) : campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 border-2 border-dashed border-gray-200 rounded-2xl">
          <Tag size={40} className="text-gray-300" />
          <p className="text-gray-400 text-[14px]">
            Aucune campagne pour le moment
          </p>
          <button
            onClick={openAdd}
            className="text-[13.5px] font-semibold text-[#1a4731] hover:opacity-70"
          >
            Créer la première campagne →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((c) => (
            <div
              key={c.id}
              className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-[15px] font-bold text-gray-900">
                    {c.name}
                  </p>
                  <p className="text-[13px] text-red-500 font-bold mt-0.5">
                    -{c.discount_percentage}%
                  </p>
                </div>
                <Badge type={c.is_active ? "green" : "gray"}>
                  {c.is_active ? "Active" : "Désactivée"}
                </Badge>
              </div>

              {(c.starts_at || c.ends_at) && (
                <p className="flex items-center gap-1.5 text-[12px] text-gray-400 mb-2">
                  <Calendar size={12} />
                  {c.starts_at ? formatDate(c.starts_at) : "—"} →{" "}
                  {c.ends_at ? formatDate(c.ends_at) : "—"}
                </p>
              )}

              <p className="text-[12.5px] text-gray-500 mb-4">
                {c.products_count} produit{c.products_count > 1 ? "s" : ""} dans
                cette campagne
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedCampaign(c)}
                  className="flex-1 px-3 py-2 bg-[#edf7f3] text-[#1a4731] rounded-lg text-[12.5px] font-semibold hover:opacity-80 transition-opacity"
                >
                  Gérer les produits →
                </button>
                <button
                  onClick={() => handleToggle(c)}
                  disabled={busyId === c.id}
                  title={c.is_active ? "Désactiver" : "Activer"}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-colors disabled:opacity-50 ${
                    c.is_active
                      ? "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100"
                      : "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                  }`}
                >
                  <Power size={14} />
                </button>
                <button
                  onClick={() => openEdit(c)}
                  className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 flex items-center justify-center"
                >
                  <Edit2 size={13} />
                </button>
                <button
                  onClick={() => setDeleteConfirm(c)}
                  className="w-9 h-9 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 flex items-center justify-center"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation suppression */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)" }}
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-bold text-gray-900 mb-2">
              Supprimer "{deleteConfirm.name}" ?
            </p>
            <p className="text-[13px] text-gray-500 mb-6">
              Les {deleteConfirm.products_count} produit(s) rattaché(s) perdront
              leur promotion. Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <Btn ghost onClick={() => setDeleteConfirm(null)}>
                Annuler
              </Btn>
              <button
                onClick={handleDelete}
                disabled={busyId === deleteConfirm.id}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-[13.5px] font-semibold hover:bg-red-600 disabled:opacity-50"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire création/édition */}
      {showForm && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)" }}
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <p className="text-[16px] font-bold text-gray-900">
                {editId ? "Modifier la campagne" : "Nouvelle campagne"}
              </p>
              <button
                onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <Label required>Nom de la campagne</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Ex: Soldes d'été"
                  className="w-full"
                  required
                />
              </div>
              <div>
                <Label required>Pourcentage de remise</Label>
                <Input
                  type="number"
                  min={1}
                  max={99}
                  value={form.discount_percentage}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      discount_percentage: e.target.value,
                    }))
                  }
                  placeholder="20"
                  className="w-full"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Début (optionnel)</Label>
                  <input
                    type="datetime-local"
                    value={form.starts_at}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, starts_at: e.target.value }))
                    }
                    className="w-full h-10 px-3 border border-gray-200 rounded-lg text-[13px] text-gray-800 outline-none focus:border-[#1a4731]"
                  />
                </div>
                <div>
                  <Label>Fin (optionnel)</Label>
                  <input
                    type="datetime-local"
                    value={form.ends_at}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, ends_at: e.target.value }))
                    }
                    className="w-full h-10 px-3 border border-gray-200 rounded-lg text-[13px] text-gray-800 outline-none focus:border-[#1a4731]"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Btn ghost type="button" onClick={() => setShowForm(false)}>
                  Annuler
                </Btn>
                <Btn type="submit" disabled={saving}>
                  {saving
                    ? "Enregistrement..."
                    : editId
                      ? "Mettre à jour"
                      : "Créer la campagne"}
                </Btn>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
// ══════════ Bandeau compte à rebours ══════════
function CampaignCountdown({ campaign }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!campaign.ends_at) {
    return (
      <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-5">
        <Clock size={16} className="text-gray-400 flex-shrink-0" />
        <p className="text-[13px] text-gray-500">
          Cette campagne n'a pas de date de fin — elle reste active
          indéfiniment.
        </p>
      </div>
    );
  }

  const endsAt = parseServerDate(campaign.ends_at);
  const diff = endsAt.getTime() - now;

  if (diff <= 0) {
    return (
      <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
        <Clock size={16} className="text-red-500 flex-shrink-0" />
        <p className="text-[13px] text-red-700 font-semibold">
          Cette campagne a expiré le {formatFullDate(endsAt)}.
        </p>
      </div>
    );
  }

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  const pad = (n) => String(n).padStart(2, "0");

  return (
    <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 flex-wrap">
      <Clock size={16} className="text-amber-600 flex-shrink-0" />
      <p className="text-[13px] text-amber-800">
        Cette campagne expire le <strong>{formatFullDate(endsAt)}</strong>
      </p>
      <div className="flex items-center gap-1.5 ml-auto">
        {[
          { val: days, label: "j" },
          { val: hours, label: "h" },
          { val: minutes, label: "m" },
          { val: seconds, label: "s" },
        ].map((u, i) => (
          <span
            key={i}
            className="flex items-baseline gap-0.5 bg-white border border-amber-200 rounded-lg px-2 py-1 text-[13px] font-bold text-amber-700 tabular-nums"
          >
            {pad(u.val)}
            <span className="text-[10px] font-semibold text-amber-500">
              {u.label}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
// ══════════ Vue détail d'une campagne — gestion des produits ══════════
function CampaignDetail({ campaign, onBack, showToast }) {
  const [included, setIncluded] = useState([]);
  const [loadingIncluded, setLoadingIncluded] = useState(true);
  const [query, setQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedToAdd, setSelectedToAdd] = useState([]);
  const [adding, setAdding] = useState(false);
  const [removingIds, setRemovingIds] = useState(new Set());
  const [selectingAll, setSelectingAll] = useState(false);
  const debouncedQuery = useDebounce(query, 350);

  const fetchIncluded = async () => {
    setLoadingIncluded(true);
    try {
      const data = await getPromoCampaignProducts(campaign.id);
      setIncluded(data);
    } catch {
      showToast("Erreur lors du chargement des produits.", "error");
    } finally {
      setLoadingIncluded(false);
    }
  };

  useEffect(() => {
    fetchIncluded();
    getAdminCategories()
      .then(setCategories)
      .catch(() => {});
    getAdminBrands()
      .then(setBrands)
      .catch(() => {});
  }, []);

  const runSearch = async () => {
    setSearching(true);
    try {
      const data = await searchPromoCampaignAvailable(campaign.id, {
        q: debouncedQuery.trim(),
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

  useEffect(() => {
    runSearch();
    setSelectedToAdd([]); // la sélection ne doit jamais survivre à un changement de filtre
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, filterCategory, filterBrand]);

  const toggleSelectToAdd = (p) => {
    setSelectedToAdd((prev) =>
      prev.find((x) => x.id === p.id)
        ? prev.filter((x) => x.id !== p.id)
        : [...prev, p],
    );
  };

  const handleSelectAll = async () => {
    setSelectingAll(true);
    try {
      const all = await searchPromoCampaignAvailable(campaign.id, {
        q: debouncedQuery.trim(),
        category_id: filterCategory || undefined,
        brand_id: filterBrand || undefined,
        select_all: 1,
      });
      // Remplace la sélection : elle correspond toujours exactement au
      // filtre affiché à l'écran, jamais à un cumul d'anciens filtres.
      setSelectedToAdd(all);
      showToast(`${all.length} produit(s) sélectionné(s).`);
    } catch {
      showToast("Erreur lors de la sélection.", "error");
    } finally {
      setSelectingAll(false);
    }
  };

  const handleAddSelected = async () => {
    if (selectedToAdd.length === 0) return;
    setAdding(true);
    try {
      const result = await addPromoCampaignProducts(
        campaign.id,
        selectedToAdd.map((p) => p.id),
      );
      showToast(result.message);
      setSelectedToAdd([]);
      fetchIncluded();
      runSearch();
    } catch (err) {
      showToast(
        err.response?.data?.message || "Erreur lors de l'ajout.",
        "error",
      );
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (product) => {
    setRemovingIds((prev) => new Set(prev).add(product.id));
    try {
      await removePromoCampaignProducts(campaign.id, [product.id]);
      setIncluded((prev) => prev.filter((p) => p.id !== product.id));
      showToast(`"${product.name}" retiré de la campagne.`);
      runSearch();
    } catch {
      showToast("Erreur lors du retrait.", "error");
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }
  };

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-500 hover:text-[#1a4731] mb-4"
      >
        <ArrowLeft size={15} /> Toutes les campagnes
      </button>

      <PageHeader
        title={campaign.name}
        subtitle={`-${campaign.discount_percentage}% · ${included.length} produit(s) inclus`}
      />

      <CampaignCountdown campaign={campaign} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Produits déjà inclus */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-[13px] font-bold text-gray-700 mb-4">
            Produits dans cette campagne
          </p>
          {loadingIncluded ? (
            <Spinner />
          ) : included.length === 0 ? (
            <p className="text-[12.5px] text-gray-400 text-center py-8">
              Aucun produit dans cette campagne.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-[480px] overflow-y-auto">
              {included.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2.5 p-2.5 border border-gray-200 rounded-xl bg-gray-50"
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                    {p.image && (
                      <img
                        src={`${STORAGE_URL}/${p.image}`}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-gray-800 truncate">
                      {p.name}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {p.category?.name || "—"} · {p.brand?.name || "—"}
                      {p.stock === 0 || p.is_unavailable ? (
                        <span className="ml-1.5 text-red-500 font-semibold">
                          Indisponible
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {p.promo_price ? (
                      <>
                        <p className="text-[12px] font-bold text-emerald-600 leading-tight">
                          {parseFloat(p.promo_price).toFixed(3)} DT
                        </p>
                        <p className="text-[10.5px] text-gray-400 line-through leading-tight">
                          {parseFloat(p.price).toFixed(3)} DT
                        </p>
                      </>
                    ) : (
                      <p className="text-[12px] font-semibold text-gray-500">
                        {parseFloat(p.price).toFixed(3)} DT
                      </p>
                    )}
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
          )}
        </div>

        {/* Ajouter des produits */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-bold text-gray-700">
              Ajouter des produits
            </p>
            <button
              onClick={handleSelectAll}
              disabled={selectingAll || results.length === 0}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-[#1a4731] hover:opacity-70 disabled:opacity-40"
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

          {selectedToAdd.length > 0 && (
            <div className="mb-3 flex items-center justify-between bg-[#edf7f3] border border-[#1a4731]/20 rounded-lg px-3 py-2">
              <span className="text-[12.5px] font-semibold text-[#1a4731]">
                {selectedToAdd.length} sélectionné(s)
              </span>
              <button
                onClick={handleAddSelected}
                disabled={adding}
                className="flex items-center gap-1.5 text-[12px] font-bold text-white bg-[#1a4731] px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {adding ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Plus size={13} />
                )}
                Ajouter à la campagne
              </button>
            </div>
          )}

          {searching ? (
            <p className="text-[12px] text-gray-400 text-center py-4">
              Recherche...
            </p>
          ) : results.length === 0 ? (
            <p className="text-[12px] text-gray-400 text-center py-4">
              Aucun produit trouvé.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-[360px] overflow-y-auto">
              {results.map((p) => {
                const isSelected = selectedToAdd.some((s) => s.id === p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleSelectToAdd(p)}
                    className={`w-full flex items-center gap-2.5 p-2 rounded-xl border transition-all text-left ${
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
                    <div className="w-9 h-9 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                      {p.image && (
                        <img
                          src={`${STORAGE_URL}/${p.image}`}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-semibold text-gray-800 truncate">
                        {p.name}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {p.category?.name || "—"} · {p.brand?.name || "—"}
                        {p.promo_campaign_id && (
                          <span className="ml-1.5 text-amber-600 font-semibold">
                            Autre campagne
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="text-[12px] font-bold text-gray-700 flex-shrink-0">
                      {parseFloat(p.price).toFixed(3)} DT
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
