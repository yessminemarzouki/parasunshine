// ─── AdminNewsletter.jsx ─────────────────────────────────────────
import { useState, useEffect } from "react";
import { useDebounce } from "../hooks/useDebounce";
import { Trash2, Download, Search, Sparkles, X } from "lucide-react";
import {
  getAdminNewsletter,
  deleteSubscriber,
  bulkDeleteSubscribers,
  markAsSeen,
} from "../services/adminApi";
import {
  Badge,
  ActionBtn,
  Btn,
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
const ConfirmModal = ({ title, onConfirm, onCancel, deleting }) => (
  <div
    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
    style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }}
  >
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
      <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-4">
        <Trash2 size={22} className="text-red-500" />
      </div>
      <p className="text-[15px] font-bold text-gray-900 text-center mb-2">
        Confirmer la suppression
      </p>
      <p className="text-[13.5px] text-gray-500 text-center mb-6">
        Voulez-vous vraiment supprimer <strong>"{title}"</strong> ?
      </p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={deleting}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-[13.5px] font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Non, annuler
        </button>
        <button
          onClick={onConfirm}
          disabled={deleting}
          className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-[13.5px] font-semibold hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {deleting && (
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          Oui, supprimer
        </button>
      </div>
    </div>
  </div>
);
export default function AdminNewsletter() {
  const [subs, setSubs] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkActing, setBulkActing] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // ← ajoute
  const [deleting, setDeleting] = useState(false); // ← ajoute

  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchSubs();
  }, [filter, debouncedSearch, page]);

  useEffect(() => {
    markAsSeen("newsletter");
  }, []);

  const fetchSubs = async () => {
    setLoading(true);
    try {
      const params = { page, per_page: 50, search: debouncedSearch };
      if (filter !== "") params.is_active = filter;
      const data = await getAdminNewsletter(params);
      setSubs(data.data || []);
      setMeta(data.meta || data);
    } catch {
    } finally {
      setLoading(false);
    }
  };
  const requestDelete = (sub) => setConfirmDelete(sub);

  const confirmDeleteSubscriber = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deleteSubscriber(confirmDelete.id);
      setConfirmDelete(null);
      showToast("Abonné supprimé.");
      fetchSubs();
    } catch {
      showToast("Erreur lors de la suppression.", "error");
    } finally {
      setDeleting(false);
    }
  };
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
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
      prev.size === subs.length ? new Set() : new Set(subs.map((s) => s.id)),
    );
  };

  const exportEmails = (onlySelected = false) => {
    const list = onlySelected
      ? subs.filter((s) => selectedIds.has(s.id))
      : subs.filter((s) => s.is_active);
    const emails = list.map((s) => s.email).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([emails], { type: "text/plain" }));
    a.download = "newsletter_emails.txt";
    a.click();
  };

  const handleBulkDelete = async () => {
    setBulkActing(true);
    try {
      const result = await bulkDeleteSubscribers([...selectedIds]);
      showToast(result.message);
      setSelectedIds(new Set());
      fetchSubs();
    } catch {
      showToast("Erreur lors de la suppression.", "error");
    } finally {
      setBulkActing(false);
      setConfirmBulkDelete(false);
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
          {toast.message}
        </div>
      )}
      {confirmDelete && (
        <ConfirmModal
          title={confirmDelete.email}
          onConfirm={confirmDeleteSubscriber}
          onCancel={() => setConfirmDelete(null)}
          deleting={deleting}
        />
      )}

      <PageHeader
        title="Newsletter"
        subtitle={`${meta.total ?? 0} abonnés`}
        action={
          <Btn ghost onClick={() => exportEmails(false)}>
            <Download size={14} />
            Exporter les emails
          </Btn>
        }
      />

      <div className="flex flex-col sm:flex-row gap-2.5 mb-5">
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
            placeholder="Rechercher un email..."
            className="pl-9 w-full"
          />
        </div>
        <Select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Tous</option>
          <option value="true">Actifs</option>
          <option value="false">Désabonnés</option>
        </Select>
      </div>

      {/* Barre d'actions groupées */}
      {selectedIds.size > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 bg-[#0f2a1e] text-white rounded-2xl px-4 sm:px-5 py-3 shadow-lg">
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <span className="text-[13px] font-semibold whitespace-nowrap">
              {selectedIds.size} abonné(s) sélectionné(s)
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
              onClick={() => exportEmails(true)}
              className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <Download size={13} /> Exporter la sélection
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
              Supprimer {selectedIds.size} abonné(s) ?
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
                checked={subs.length > 0 && selectedIds.size === subs.length}
                onChange={toggleSelectAll}
                className="w-4 h-4 accent-[#1a4731] cursor-pointer"
              />,
              "Email",
              "Statut",
              "Inscrit le",
              "Actions",
            ]}
            empty={subs.length === 0 ? "Aucun abonné" : null}
          >
            {subs.map((s) => (
              <TR key={s.id}>
                <TD>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(s.id)}
                    onChange={() => toggleSelect(s.id)}
                    className="w-4 h-4 accent-[#1a4731] cursor-pointer"
                  />
                </TD>
                <TD className="font-medium">
                  <div className="flex items-center gap-1.5">
                    {s.email}
                    {isNew(s.created_at) && (
                      <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-full">
                        <Sparkles size={8} /> Nouveau
                      </span>
                    )}
                  </div>
                </TD>
                <TD>
                  <Badge type={s.is_active ? "success" : "gray"}>
                    {s.is_active ? "Actif" : "Désabonné"}
                  </Badge>
                </TD>
                <TD className="text-[12px] text-gray-400">
                  {new Date(s.created_at).toLocaleDateString("fr-FR")}
                </TD>
                <TD>
                  <ActionBtn
                    type="danger"
                    onClick={() => setConfirmDelete(s)}
                    title="Supprimer"
                  >
                    <Trash2 size={13} />
                  </ActionBtn>
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
