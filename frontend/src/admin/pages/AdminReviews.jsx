import { useState, useEffect } from "react";
import { useDebounce } from "../hooks/useDebounce";
import { Search, Trash2, Star, Check, X, Eye, Sparkles } from "lucide-react";
import {
  getAdminReviews,
  approveReview,
  rejectReview,
  deleteReview,
  bulkApproveReviews,
  bulkRejectReviews,
  bulkDeleteReviews,
} from "../services/adminApi";
import {
  ActionBtn,
  Input,
  Select,
  TableWrap,
  Table,
  TR,
  TD,
  Pagination,
  Spinner,
  PageHeader,
} from "../components/AdminShared";

const Stars = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        size={12}
        fill={s <= rating ? "#D4AF37" : "none"}
        stroke={s <= rating ? "#D4AF37" : "#d1d5db"}
      />
    ))}
  </div>
);

const Spin = () => (
  <span className="w-3 h-3 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin inline-block" />
);

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [loadingAction, setLoadingAction] = useState(null);
  const [ratingFilter, setRatingFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkActing, setBulkActing] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchReviews();
  }, [debouncedSearch, statusFilter, ratingFilter, page]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await getAdminReviews({
        search: debouncedSearch,
        status: statusFilter,
        rating: ratingFilter,
        page,
        per_page: 20,
      });
      setReviews(data.data || []);
      setMeta(data.meta || data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const isNew = (dateStr) =>
    Date.now() - new Date(dateStr).getTime() < 24 * 60 * 60 * 1000;

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) =>
      prev.size === reviews.length
        ? new Set()
        : new Set(reviews.map((r) => r.id)),
    );
  };

  const handleBulkApprove = async () => {
    setBulkActing(true);
    try {
      const result = await bulkApproveReviews([...selectedIds]);
      showToast(result.message);
      setSelectedIds(new Set());
      fetchReviews();
    } catch {
      showToast("Erreur lors de l'approbation groupée.", "error");
    } finally {
      setBulkActing(false);
    }
  };

  const handleBulkReject = async () => {
    setBulkActing(true);
    try {
      const result = await bulkRejectReviews([...selectedIds]);
      showToast(result.message);
      setSelectedIds(new Set());
      fetchReviews();
    } catch {
      showToast("Erreur lors du refus groupé.", "error");
    } finally {
      setBulkActing(false);
    }
  };

  const handleBulkDelete = async () => {
    setBulkActing(true);
    try {
      const result = await bulkDeleteReviews([...selectedIds]);
      showToast(result.message);
      setSelectedIds(new Set());
      fetchReviews();
    } catch {
      showToast("Erreur lors de la suppression groupée.", "error");
    } finally {
      setBulkActing(false);
      setConfirmBulkDelete(false);
    }
  };

  const handleApprove = async (id) => {
    setLoadingAction(`approve_${id}`);
    try {
      await approveReview(id);
      setReviews((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, is_approved: true, is_rejected: false } : r,
        ),
      );
      showToast("Avis approuvé avec succès.");
    } catch {
      showToast("Erreur lors de l'approbation.", "error");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReject = async (id) => {
    setLoadingAction(`reject_${id}`);
    try {
      await rejectReview(id);
      setReviews((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, is_approved: false, is_rejected: true } : r,
        ),
      );
      showToast("Avis refusé.");
    } catch {
      showToast("Erreur lors du refus.", "error");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDelete = async (id) => {
    setLoadingAction(`delete_${id}`);
    try {
      await deleteReview(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      setMeta((prev) => ({ ...prev, total: (prev.total || 1) - 1 }));
      showToast("Avis supprimé avec succès.");
    } catch {
      showToast("Erreur lors de la suppression.", "error");
    } finally {
      setLoadingAction(null);
      setConfirmDelete(null);
    }
  };

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-5 sm:top-5 z-[99999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-[13.5px] font-semibold ${
            toast.type === "error"
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0]"
          }`}
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
              toast.type === "error" ? "bg-red-100" : "bg-green-100"
            }`}
          >
            <span className="text-[12px]">
              {toast.type === "error" ? "✕" : "✓"}
            </span>
          </div>
          {toast.message}
        </div>
      )}

      {/* Modal confirmation suppression */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(3px)" }}
        >
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <h3 className="text-[15px] font-bold text-gray-900 text-center mb-2">
              Supprimer cet avis ?
            </h3>
            <p className="text-[13px] text-gray-400 text-center mb-2">
              Avis de{" "}
              <span className="font-semibold text-gray-600">
                {confirmDelete.customer_name}
              </span>
            </p>
            <p className="text-[12px] text-gray-400 text-center italic mb-6 line-clamp-2">
              "{confirmDelete.comment}"
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-[13.5px] font-semibold hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(confirmDelete.id)}
                disabled={!!loadingAction}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-[13.5px] font-semibold hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loadingAction === `delete_${confirmDelete.id}` ? (
                  <Spin />
                ) : null}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal détail avis */}
      {selectedReview && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => setSelectedReview(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100">
              <p className="text-[14px] font-bold text-gray-900">
                Détail de l'avis
              </p>
              <button
                onClick={() => setSelectedReview(null)}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              {/* Produit */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                {selectedReview.product?.image && (
                  <img
                    src={`http://localhost/storage/${selectedReview.product.image}`}
                    alt=""
                    className="w-12 h-12 rounded-xl object-cover border border-gray-100 flex-shrink-0"
                  />
                )}
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                    Produit
                  </p>
                  <p className="text-[13.5px] font-semibold text-gray-800">
                    {selectedReview.product?.name}
                  </p>
                </div>
              </div>

              {/* Client */}
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Client
                </p>
                <p className="text-[13.5px] font-semibold text-gray-800">
                  {selectedReview.customer_name}
                </p>
                <p className="text-[12px] text-gray-400">
                  {selectedReview.customer_email}
                </p>
              </div>

              {/* Note */}
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Note
                </p>
                <div className="flex items-center gap-2">
                  <Stars rating={selectedReview.rating} />
                  <span className="text-[13px] font-bold text-gray-700">
                    {selectedReview.rating}/5
                  </span>
                </div>
              </div>

              {/* Commentaire */}
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Commentaire
                </p>
                <p className="text-[14px] text-gray-700 leading-relaxed">
                  {selectedReview.comment}
                </p>
              </div>

              {/* Date + Statut */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                    Date
                  </p>
                  <p className="text-[13px] text-gray-700">
                    {new Date(selectedReview.created_at).toLocaleDateString(
                      "fr-FR",
                      {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      },
                    )}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
                    selectedReview.is_approved
                      ? "bg-green-50 text-green-700 border-green-200"
                      : selectedReview.is_rejected
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {selectedReview.is_approved
                    ? "Approuvé"
                    : selectedReview.is_rejected
                      ? "Refusé"
                      : "En attente"}
                </span>
              </div>
              {/* Actions — exactement les mêmes règles que le tableau */}
              <div className="flex flex-wrap gap-3 pt-2">
                {selectedReview.deleted_at ? (
                  <p className="text-[12.5px] text-gray-400 italic w-full text-center py-2">
                    Cet avis a été supprimé — aucune action possible.
                  </p>
                ) : !selectedReview.is_approved &&
                  !selectedReview.is_rejected ? (
                  // ── En attente : Approuver + Refuser ──
                  <>
                    <button
                      onClick={async () => {
                        await handleApprove(selectedReview.id);
                        setSelectedReview(null);
                      }}
                      disabled={!!loadingAction}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1a4731] text-white text-[13.5px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
                    >
                      {loadingAction === `approve_${selectedReview.id}` ? (
                        <Spin />
                      ) : (
                        <Check size={14} />
                      )}
                      Approuver
                    </button>
                    <button
                      onClick={async () => {
                        await handleReject(selectedReview.id);
                        setSelectedReview(null);
                      }}
                      disabled={!!loadingAction}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 text-white text-[13.5px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
                    >
                      {loadingAction === `reject_${selectedReview.id}` ? (
                        <Spin />
                      ) : (
                        <X size={14} />
                      )}
                      Refuser
                    </button>
                  </>
                ) : selectedReview.is_approved ? (
                  // ── Approuvé : Supprimer uniquement ──
                  <button
                    onClick={() => {
                      setConfirmDelete(selectedReview);
                      setSelectedReview(null);
                    }}
                    disabled={!!loadingAction}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500 text-white text-[13.5px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
                  >
                    <Trash2 size={14} />
                    Supprimer
                  </button>
                ) : (
                  // ── Refusé : Approuver uniquement (corriger une erreur) ──
                  <button
                    onClick={async () => {
                      await handleApprove(selectedReview.id);
                      setSelectedReview(null);
                    }}
                    disabled={!!loadingAction}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1a4731] text-white text-[13.5px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
                  >
                    {loadingAction === `approve_${selectedReview.id}` ? (
                      <Spin />
                    ) : (
                      <Check size={14} />
                    )}
                    Approuver
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <PageHeader title="Avis Clients" subtitle={`${meta.total ?? 0} avis`} />

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-2.5 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-0">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Client ou produit..."
            className="pl-9 w-full"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Tous les avis</option>
          <option value="pending">En attente</option>
          <option value="approved">Approuvés</option>
          <option value="rejected">Refusés</option>
        </Select>
        <Select
          value={ratingFilter}
          onChange={(e) => {
            setRatingFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Toutes les notes</option>
          <option value="5">5 étoiles</option>
          <option value="4">4 étoiles</option>
          <option value="3">3 étoiles</option>
          <option value="2">2 étoiles</option>
          <option value="1">1 étoile</option>
        </Select>
      </div>

      {/* Barre d'actions groupées */}
      {selectedIds.size > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 bg-[#0f2a1e] text-white rounded-2xl px-4 sm:px-5 py-3 shadow-lg">
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <span className="text-[13px] font-semibold whitespace-nowrap">
              {selectedIds.size} avis sélectionné(s)
            </span>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="sm:hidden text-white/60 hover:text-white transition-colors p-1"
            >
              <X size={16} />
            </button>
          </div>
          <div className="hidden sm:block h-5 w-px bg-white/20" />
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleBulkApprove}
              disabled={bulkActing}
              className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 transition-colors disabled:opacity-50"
            >
              <Check size={13} /> Approuver
            </button>
            <button
              onClick={handleBulkReject}
              disabled={bulkActing}
              className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-amber-500/80 hover:bg-amber-500 transition-colors disabled:opacity-50"
            >
              <X size={13} /> Refuser
            </button>
            <button
              onClick={() => setConfirmBulkDelete(true)}
              disabled={bulkActing}
              className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-red-500/90 hover:bg-red-500 transition-colors disabled:opacity-50"
            >
              <Trash2 size={13} /> Supprimer
            </button>
          </div>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="hidden sm:block ml-auto text-white/60 hover:text-white transition-colors p-1"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Confirmation suppression groupée */}
      {confirmBulkDelete && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)" }}
        >
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <h3 className="text-[15px] font-bold text-gray-900 text-center mb-2">
              Supprimer {selectedIds.size} avis ?
            </h3>
            <p className="text-[13px] text-gray-400 text-center mb-6">
              Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmBulkDelete(false)}
                disabled={bulkActing}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-[13.5px] font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkActing}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-[13.5px] font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {bulkActing ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      <TableWrap>
        {loading ? (
          <Spinner />
        ) : (
          <Table
            headers={[
              <input
                key="checkall"
                type="checkbox"
                checked={
                  reviews.length > 0 && selectedIds.size === reviews.length
                }
                onChange={toggleSelectAll}
                className="w-4 h-4 accent-[#1a4731] cursor-pointer"
              />,
              "Produit",
              "Client",
              "Note",
              <span className="hidden md:inline">Commentaire</span>,
              "Date",
              "Statut",
              "Actions",
            ]}
            empty={reviews.length === 0 ? "Aucun avis" : null}
          >
            {reviews.map((r) => (
              <TR key={r.id}>
                <TD>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(r.id)}
                    onChange={() => toggleSelect(r.id)}
                    className="w-4 h-4 accent-[#1a4731] cursor-pointer"
                  />
                </TD>
                <TD>
                  <div className="flex items-center gap-2">
                    {r.product?.image && (
                      <img
                        src={`http://localhost/storage/${r.product.image}`}
                        alt=""
                        className="w-8 h-8 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                      />
                    )}
                    <span className="font-semibold text-[12.5px] max-w-[120px] truncate">
                      {r.product?.name}
                    </span>
                  </div>
                </TD>
                <TD>
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-[13px]">
                      {r.customer_name}
                    </p>
                    {isNew(r.created_at) && (
                      <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-full">
                        <Sparkles size={8} /> Nouveau
                      </span>
                    )}
                  </div>
                  <p className="text-[11.5px] text-gray-400">
                    {r.customer_email}
                  </p>
                </TD>
                <TD>
                  <Stars rating={r.rating} />
                </TD>
                <TD className="text-[12.5px] text-gray-600 max-w-[200px] hidden md:table-cell">
                  <span className="line-clamp-2">{r.comment}</span>
                </TD>
                <TD className="text-[12px] text-gray-400">
                  {new Date(r.created_at).toLocaleDateString("fr-FR")}
                </TD>
                <TD>
                  <div className="flex flex-col gap-1">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold w-fit ${
                        r.is_approved
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : r.is_rejected
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {r.is_approved
                        ? "Approuvé"
                        : r.is_rejected
                          ? "Refusé"
                          : "En attente"}
                    </span>
                    {r.deleted_at && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold w-fit bg-gray-100 text-gray-500 border border-gray-300">
                        Supprimé par{" "}
                        {r.deleted_by === "admin" ? "l'admin" : "le client"}
                      </span>
                    )}
                  </div>
                </TD>
                <TD>
                  <div className="flex gap-1.5">
                    <ActionBtn
                      type="info"
                      onClick={() => setSelectedReview(r)}
                      title="Voir détails"
                    >
                      <Eye size={13} />
                    </ActionBtn>
                    {!r.deleted_at && !r.is_approved && !r.is_rejected && (
                      <>
                        <ActionBtn
                          type="success"
                          onClick={() => handleApprove(r.id)}
                          title="Approuver"
                          disabled={!!loadingAction}
                        >
                          {loadingAction === `approve_${r.id}` ? (
                            <Spin />
                          ) : (
                            <Check size={13} />
                          )}
                        </ActionBtn>
                        <ActionBtn
                          type="warning"
                          onClick={() => handleReject(r.id)}
                          title="Refuser"
                          disabled={!!loadingAction}
                        >
                          {loadingAction === `reject_${r.id}` ? (
                            <Spin />
                          ) : (
                            <X size={13} />
                          )}
                        </ActionBtn>
                      </>
                    )}

                    {!r.deleted_at && r.is_rejected && (
                      <ActionBtn
                        type="success"
                        onClick={() => handleApprove(r.id)}
                        title="Approuver"
                        disabled={!!loadingAction}
                      >
                        {loadingAction === `approve_${r.id}` ? (
                          <Spin />
                        ) : (
                          <Check size={13} />
                        )}
                      </ActionBtn>
                    )}
                    {/* Poubelle : uniquement pour un avis approuvé, pas déjà supprimé */}
                    {r.is_approved && !r.deleted_at && (
                      <ActionBtn
                        type="danger"
                        onClick={() => setConfirmDelete(r)}
                        title="Supprimer"
                        disabled={!!loadingAction}
                      >
                        {loadingAction === `delete_${r.id}` ? (
                          <Spin />
                        ) : (
                          <Trash2 size={13} />
                        )}
                      </ActionBtn>
                    )}
                  </div>
                </TD>
              </TR>
            ))}
          </Table>
        )}
        <Pagination meta={meta} page={page} setPage={setPage} />
      </TableWrap>
    </div>
  );
}
