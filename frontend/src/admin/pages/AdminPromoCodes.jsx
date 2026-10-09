import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Search,
  Percent,
  AlertTriangle,
  Calendar,
  Ban,
} from "lucide-react";
import {
  getPromoCodes,
  createPromoCode,
  updatePromoCode,
  togglePromoCodeActive,
  deletePromoCode,
} from "../services/adminApi";
import {
  Btn,
  Input,
  Label,
  Select,
  PageHeader,
  Spinner,
  Toast,
  Badge,
} from "../components/AdminShared";

const emptyForm = {
  code: "",
  discount_percentage: "",
  is_active: true,
  allow_with_promo_items: true,
  starts_at: "",
  ends_at: "",
  usage_limit: "",
};

export default function AdminPromoCodes() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [toast, setToast] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [busyKey, setBusyKey] = useState(null);

  const showToast = (message, type = "success") => setToast({ message, type });

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPromoCodes({
        page,
        search,
        is_active: statusFilter,
      });
      setCodes(data.data || []);
      setMeta(data);
    } catch {
      showToast("Erreur lors du chargement des codes promo.", "error");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  };

  const openEdit = (code) => {
    setEditId(code.id);
    setForm({
      code: code.code,
      discount_percentage: code.discount_percentage,
      is_active: code.is_active,
      allow_with_promo_items: code.allow_with_promo_items,
      starts_at: code.starts_at ? code.starts_at.slice(0, 16) : "",
      ends_at: code.ends_at ? code.ends_at.slice(0, 16) : "",
      usage_limit: code.usage_limit ?? "",
    });
    setError("");
    setShowForm(true);
  };

  const f = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.code.trim()) {
      setError("Le code est obligatoire.");
      return;
    }
    const pct = parseInt(form.discount_percentage, 10);
    if (!pct || pct < 1 || pct > 100) {
      setError("Le pourcentage doit être compris entre 1 et 100.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        discount_percentage: pct,
        is_active: form.is_active,
        allow_with_promo_items: form.allow_with_promo_items,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
        usage_limit: form.usage_limit ? parseInt(form.usage_limit, 10) : null,
      };

      if (editId) {
        await updatePromoCode(editId, payload);
        showToast("Code promo mis à jour avec succès.");
      } else {
        await createPromoCode(payload);
        showToast("Code promo créé avec succès.");
      }
      setShowForm(false);
      fetchCodes();
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors?.code) {
        setError("Ce code existe déjà.");
      } else {
        setError(
          err.response?.data?.message || "Erreur lors de l'enregistrement.",
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (code) => {
    setBusyKey(`toggle-${code.id}`);
    try {
      await togglePromoCodeActive(code.id);
      showToast(code.is_active ? "Code désactivé." : "Code activé.");
      fetchCodes();
    } catch {
      showToast("Erreur lors de la mise à jour.", "error");
    } finally {
      setBusyKey(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setBusyKey(`delete-${deleteConfirm.id}`);
    try {
      await deletePromoCode(deleteConfirm.id);
      showToast("Code promo supprimé.");
      setDeleteConfirm(null);
      fetchCodes();
    } catch {
      showToast("Erreur lors de la suppression.", "error");
    } finally {
      setBusyKey(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const isExpired = (code) =>
    code.ends_at && new Date(code.ends_at) < new Date();
  const isNotStarted = (code) =>
    code.starts_at && new Date(code.starts_at) > new Date();
  const isLimitReached = (code) =>
    code.usage_limit !== null && code.used_count >= code.usage_limit;

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
        title="Codes promo"
        subtitle={meta ? `${meta.total} code(s) promo` : ""}
        action={
          <Btn onClick={openAdd}>
            <Plus size={14} /> Nouveau code promo
          </Btn>
        }
      />

      {/* Filtres */}
      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <div className="relative w-full sm:w-56">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Rechercher un code..."
            className="pl-9 w-full"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="w-[170px]"
        >
          <option value="">Tous les statuts</option>
          <option value="true">Actifs</option>
          <option value="false">Désactivés</option>
        </Select>
      </div>

      {/* Liste */}
      {loading ? (
        <Spinner />
      ) : codes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 border-2 border-dashed border-gray-200 rounded-2xl">
          <Percent size={40} className="text-gray-300" />
          <p className="text-gray-400 text-[14px]">
            Aucun code promo pour le moment
          </p>
          <button
            onClick={openAdd}
            className="text-[13.5px] font-semibold text-[#1a4731] hover:opacity-70"
          >
            Créer le premier code promo →
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 font-semibold text-gray-500">
                  Code
                </th>
                <th className="text-left px-5 py-3 font-semibold text-gray-500">
                  Réduction
                </th>
                <th className="text-left px-5 py-3 font-semibold text-gray-500">
                  Avec articles en promo
                </th>
                <th className="text-left px-5 py-3 font-semibold text-gray-500">
                  Validité
                </th>
                <th className="text-left px-5 py-3 font-semibold text-gray-500">
                  Utilisation
                </th>
                <th className="text-left px-5 py-3 font-semibold text-gray-500">
                  Statut
                </th>
                <th className="text-right px-5 py-3 font-semibold text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {codes.map((code) => {
                const expired = isExpired(code);
                const notStarted = isNotStarted(code);
                const limitReached = isLimitReached(code);
                return (
                  <tr
                    key={code.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50"
                  >
                    <td className="px-5 py-3">
                      <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg">
                        {code.code}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-bold text-[#1a4731]">
                        -{code.discount_percentage}%
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {code.allow_with_promo_items ? (
                        <span className="text-emerald-600 text-[12px] font-semibold">
                          Autorisé
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-500 text-[12px] font-semibold">
                          <Ban size={12} /> Interdit
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {code.starts_at || code.ends_at ? (
                        <div className="flex items-center gap-1.5 text-[11.5px] text-gray-500">
                          <Calendar size={12} className="text-gray-400" />
                          {code.starts_at && formatDate(code.starts_at)}
                          {code.starts_at && code.ends_at && " → "}
                          {code.ends_at && formatDate(code.ends_at)}
                        </div>
                      ) : (
                        <span className="text-[11.5px] text-gray-300">
                          Sans limite
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {code.used_count}
                      {code.usage_limit ? ` / ${code.usage_limit}` : ""}
                    </td>
                    <td className="px-5 py-3">
                      {!code.is_active ? (
                        <Badge type="gray">Désactivé</Badge>
                      ) : expired ? (
                        <Badge type="red">Expiré</Badge>
                      ) : notStarted ? (
                        <Badge type="amber">Pas encore actif</Badge>
                      ) : limitReached ? (
                        <Badge type="red">Limite atteinte</Badge>
                      ) : (
                        <Badge type="green">Actif</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleToggle(code)}
                          disabled={busyKey === `toggle-${code.id}`}
                          title={code.is_active ? "Désactiver" : "Activer"}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors disabled:opacity-50 ${
                            code.is_active
                              ? "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100"
                              : "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                          }`}
                        >
                          {code.is_active ? "Désactiver" : "Activer"}
                        </button>
                        <button
                          onClick={() => openEdit(code)}
                          className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 flex items-center justify-center"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(code)}
                          className="w-7 h-7 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 flex items-center justify-center"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {meta && meta.last_page > 1 && (
            <div className="flex justify-center gap-2 py-4 border-t border-gray-100">
              {Array.from({ length: meta.last_page }, (_, i) => i + 1).map(
                (p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-[13px] font-semibold ${
                      p === page
                        ? "bg-[#1a4731] text-white"
                        : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Confirmation suppression ── */}
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
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={26} className="text-red-500" />
            </div>
            <p className="font-bold text-gray-900 mb-2">
              Supprimer le code "{deleteConfirm.code}" ?
            </p>
            <p className="text-[13px] text-gray-500 mb-6">
              Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <Btn
                ghost
                onClick={() => setDeleteConfirm(null)}
                disabled={busyKey === `delete-${deleteConfirm.id}`}
              >
                Annuler
              </Btn>
              <button
                onClick={handleDelete}
                disabled={busyKey === `delete-${deleteConfirm.id}`}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-[13.5px] font-semibold hover:bg-red-600 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {busyKey === `delete-${deleteConfirm.id}` && (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Formulaire création/édition ── */}
      {showForm && (
        <div
          className="fixed inset-0 z-[999] flex items-start justify-center p-4 overflow-y-auto"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)" }}
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg shadow-2xl my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <p className="text-[16px] font-bold text-gray-900">
                {editId ? "Modifier le code promo" : "Nouveau code promo"}
              </p>
              <button
                onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[13px] font-medium">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label required>Code</Label>
                  <Input
                    value={form.code}
                    onChange={(e) => f("code", e.target.value.toUpperCase())}
                    placeholder="EX: BIENVENUE20"
                    className="w-full font-mono"
                    required
                  />
                </div>
                <div>
                  <Label required>Pourcentage de réduction</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={form.discount_percentage}
                      onChange={(e) => f("discount_percentage", e.target.value)}
                      placeholder="20"
                      className="w-full pr-8"
                      required
                    />
                    <Percent
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.allow_with_promo_items}
                    onChange={(e) =>
                      f("allow_with_promo_items", e.target.checked)
                    }
                    className="w-4 h-4 mt-0.5 accent-[#1a4731]"
                  />
                  <div>
                    <span className="text-[13px] font-semibold text-gray-800 block">
                      Autoriser ce code même si le panier contient des articles
                      déjà en promotion
                    </span>
                    <span className="text-[11.5px] text-gray-500 mt-0.5 block">
                      Si décoché, ce code sera refusé dès qu'un produit ou
                      coffret du panier a déjà un prix promo actif.
                    </span>
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Date de début (optionnel)</Label>
                  <input
                    type="datetime-local"
                    value={form.starts_at}
                    onChange={(e) => f("starts_at", e.target.value)}
                    className="w-full h-10 px-3 border border-gray-200 rounded-xl text-[13.5px] text-gray-800 outline-none focus:border-[#1a4731] focus:ring-2 focus:ring-[#1a4731]/10 transition-all"
                  />
                </div>
                <div>
                  <Label>Date de fin (optionnel)</Label>
                  <input
                    type="datetime-local"
                    value={form.ends_at}
                    onChange={(e) => f("ends_at", e.target.value)}
                    className="w-full h-10 px-3 border border-gray-200 rounded-xl text-[13.5px] text-gray-800 outline-none focus:border-[#1a4731] focus:ring-2 focus:ring-[#1a4731]/10 transition-all"
                  />
                </div>
              </div>

              <div>
                <Label>Limite d'utilisation (optionnel)</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.usage_limit}
                  onChange={(e) => f("usage_limit", e.target.value)}
                  placeholder="Laisser vide pour un usage illimité"
                  className="w-full"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => f("is_active", e.target.checked)}
                  className="w-4 h-4 accent-[#1a4731]"
                />
                <span className="text-[13px] text-gray-700">
                  Code actif dès l'enregistrement
                </span>
              </label>

              <div className="flex gap-3 pt-2">
                <Btn ghost type="button" onClick={() => setShowForm(false)}>
                  Annuler
                </Btn>
                <Btn type="submit" disabled={saving}>
                  {saving
                    ? "Enregistrement..."
                    : editId
                      ? "Mettre à jour"
                      : "Créer le code promo"}
                </Btn>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
