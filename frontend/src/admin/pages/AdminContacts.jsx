// ─── AdminContacts.jsx ───────────────────────────────────────────
import { useState, useEffect } from "react";
import { Eye, Trash2, Mail, Sparkles, Check, X } from "lucide-react";
import {
  getAdminContacts,
  markContactRead,
  deleteContact,
  bulkMarkContactsRead,
  bulkDeleteContacts,
  markAsSeen,
} from "../services/adminApi";
import {
  ActionBtn,
  Select,
  TableWrap,
  Table,
  TR,
  TD,
  Pagination,
  Modal,
  Spinner,
  PageHeader,
} from "../components/AdminShared";

// ── Modal de confirmation custom ──
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

export default function AdminContacts() {
  const [contacts, setContacts] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkActing, setBulkActing] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchContacts();
  }, [filter, page]);

  useEffect(() => {
    markAsSeen("contacts");
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const params = { page, per_page: 20 };
      if (filter !== "") params.is_read = filter;
      const data = await getAdminContacts(params);
      setContacts(data.data || []);
      setMeta(data.meta || data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openContact = async (c) => {
    setSelected(c);
    if (!c.is_read) {
      await markContactRead(c.id);
      setContacts((prev) =>
        prev.map((x) => (x.id === c.id ? { ...x, is_read: true } : x)),
      );
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
      prev.size === contacts.length
        ? new Set()
        : new Set(contacts.map((c) => c.id)),
    );
  };

  const handleBulkMarkRead = async () => {
    setBulkActing(true);
    try {
      const result = await bulkMarkContactsRead([...selectedIds]);
      showToast(result.message);
      setSelectedIds(new Set());
      fetchContacts();
    } catch {
      showToast("Erreur lors du marquage.", "error");
    } finally {
      setBulkActing(false);
    }
  };

  const handleBulkDelete = async () => {
    setBulkActing(true);
    try {
      const result = await bulkDeleteContacts([...selectedIds]);
      showToast(result.message);
      setSelectedIds(new Set());
      fetchContacts();
    } catch {
      showToast("Erreur lors de la suppression.", "error");
    } finally {
      setBulkActing(false);
      setConfirmBulkDelete(false);
    }
  };
  const requestDelete = (contact) => setConfirmDelete(contact);

  const confirmDeleteContact = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deleteContact(confirmDelete.id);
      setConfirmDelete(null);
      fetchContacts();
      if (selected?.id === confirmDelete.id) setSelected(null);
      showToast("Message supprimé.");
    } catch {
      showToast("Erreur lors de la suppression.", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <PageHeader
        title="Messages Contact"
        subtitle={`${meta.total ?? 0} messages`}
      />
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
          title={confirmDelete.subject || confirmDelete.name || "ce message"}
          onConfirm={confirmDeleteContact}
          onCancel={() => setConfirmDelete(null)}
          deleting={deleting}
        />
      )}

      <div className="flex gap-2.5 mb-5">
        <Select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Tous les messages</option>
          <option value="false">Non lus</option>
          <option value="true">Lus</option>
        </Select>
      </div>

      {/* Barre d'actions groupées */}
      {selectedIds.size > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 bg-[#0f2a1e] text-white rounded-2xl px-4 sm:px-5 py-3 shadow-lg">
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <span className="text-[13px] font-semibold whitespace-nowrap">
              {selectedIds.size} message(s) sélectionné(s)
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
              onClick={handleBulkMarkRead}
              disabled={bulkActing}
              className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              <Check size={13} /> Marquer comme lu
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
              Supprimer {selectedIds.size} message(s) ?
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
                  contacts.length > 0 && selectedIds.size === contacts.length
                }
                onChange={toggleSelectAll}
                className="w-4 h-4 accent-[#1a4731] cursor-pointer"
              />,
              "",
              "Expéditeur",
              "Sujet",
              <span className="hidden md:inline">Aperçu</span>,
              "Date",
              "Actions",
            ]}
            empty={contacts.length === 0 ? "Aucun message" : null}
          >
            {contacts.map((c) => (
              <TR key={c.id} className={!c.is_read ? "bg-blue-50/30" : ""}>
                <TD>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(c.id)}
                    onChange={() => toggleSelect(c.id)}
                    className="w-4 h-4 accent-[#1a4731] cursor-pointer"
                  />
                </TD>
                <TD>
                  <div className="relative">
                    <Mail
                      size={14}
                      className={c.is_read ? "text-gray-300" : "text-[#1a4731]"}
                    />
                    {!c.is_read && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                </TD>
                <TD>
                  <div className="flex items-center gap-1.5">
                    <p
                      className={`text-[13px] ${c.is_read ? "font-normal" : "font-semibold"}`}
                    >
                      {c.name}
                    </p>
                    {isNew(c.created_at) && (
                      <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-full">
                        <Sparkles size={8} /> Nouveau
                      </span>
                    )}
                  </div>
                  <p className="text-[11.5px] text-gray-400">{c.email}</p>
                </TD>
                <TD
                  className={`text-[13px] ${c.is_read ? "" : "font-semibold"}`}
                >
                  {c.subject}
                </TD>
                <TD className="text-[12.5px] text-gray-500 max-w-[200px] hidden md:table-cell">
                  <span className="truncate block">
                    {c.message?.substring(0, 60)}…
                  </span>
                </TD>
                <TD className="text-[12px] text-gray-400">
                  {new Date(c.created_at).toLocaleDateString("fr-FR")}
                </TD>
                <TD>
                  <div className="flex gap-1.5">
                    <ActionBtn
                      type="info"
                      onClick={() => openContact(c)}
                      title="Lire"
                    >
                      <Eye size={13} />
                    </ActionBtn>
                    <ActionBtn
                      type="danger"
                      onClick={() => requestDelete(c)}
                      title="Supprimer"
                    >
                      <Trash2 size={13} />
                    </ActionBtn>
                  </div>
                </TD>
              </TR>
            ))}
          </Table>
        )}
        <Pagination meta={meta} page={page} setPage={setPage} />
      </TableWrap>

      {selected && (
        <Modal
          title={selected.subject}
          onClose={() => setSelected(null)}
          maxWidth="max-w-xl"
        >
          <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                Expéditeur
              </p>
              <p className="font-semibold text-gray-800">{selected.name}</p>
              <p className="text-[12.5px] text-gray-500">{selected.email}</p>
              {selected.phone && (
                <p className="text-[12.5px] text-gray-500">{selected.phone}</p>
              )}
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                Reçu le
              </p>
              <p className="text-[13px] text-gray-700">
                {new Date(selected.created_at).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
          <p className="text-[13.5px] text-gray-700 leading-relaxed whitespace-pre-wrap mb-5">
            {selected.message}
          </p>
          <a
            href={`mailto:${selected.email}?subject=Re: ${selected.subject}`}
            className="inline-flex items-center gap-2 px-4 py-2 h-9 bg-[#1a4731] text-white text-[13.5px] font-semibold rounded-lg hover:bg-[#153d29] transition-colors"
          >
            Répondre par email
          </a>
        </Modal>
      )}
    </div>
  );
}
