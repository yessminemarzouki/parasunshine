import { useState, useEffect, useRef } from "react";
import {
  Search,
  Eye,
  Trash2,
  ShoppingCart,
  User,
  UserX,
  Eraser,
  Mail as MailIcon,
  Phone,
} from "lucide-react";
import { useDebounce } from "../hooks/useDebounce";
import {
  getAdminAbandonedCarts,
  deleteAdminAbandonedCart,
  purgeAdminAbandonedCarts,
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
  Modal,
  Spinner,
  PageHeader,
  Toast,
} from "../components/AdminShared";
import { STORAGE_URL } from "../../config/api";

const fmt = (n) => parseFloat(n || 0).toFixed(3);

const timeAgo = (dateStr) => {
  if (!dateStr) return "—";
  const min = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  return `il y a ${d} j`;
};

const fullDate = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Africa/Tunis",
      })
    : "—";

const contactOf = (cart) => {
  const u = cart.user;
  const name =
    cart.customer_name ||
    u?.name ||
    `${u?.first_name || ""} ${u?.last_name || ""}`.trim() ||
    null;
  return {
    name,
    email: cart.customer_email || u?.email || null,
    phone: u?.phone || null,
  };
};

const guestLabel = (cart) =>
  `Visiteur #${String(cart.session_id || cart.id).slice(-6)}`;

const itemsCount = (cart) =>
  (cart.cart_products || []).reduce(
    (s, i) => s + (parseInt(i.quantity, 10) || 0),
    0,
  );

const ConfirmBox = ({
  title,
  text,
  confirmLabel,
  onConfirm,
  onCancel,
  busy,
  children,
}) => (
  <div
    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
    style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }}
  >
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
      <p className="text-[15px] font-bold text-gray-900 text-center mb-2">
        {title}
      </p>
      <p className="text-[13.5px] text-gray-500 text-center mb-4">{text}</p>
      {children}
      <div className="flex gap-3 mt-2">
        <button
          onClick={onCancel}
          disabled={busy}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-[13.5px] font-semibold hover:bg-gray-50 disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          onClick={onConfirm}
          disabled={busy}
          className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-[13.5px] font-semibold hover:bg-red-600 disabled:opacity-60"
        >
          {busy ? "..." : confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

export default function AdminAbandonedCarts() {
  const [carts, setCarts] = useState([]);
  const [meta, setMeta] = useState({});
  const [stats, setStats] = useState({
    guests_count: 0,
    guests_value: 0,
    customers_count: 0,
    customers_value: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [type, setType] = useState("");
  const [status, setStatus] = useState("pending");
  const [idle, setIdle] = useState("60");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [purgeOpen, setPurgeOpen] = useState(false);
  const [purgeDays, setPurgeDays] = useState("60");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const reqId = useRef(0);

  const showToast = (message, t = "success") => setToast({ message, type: t });

  const fetchCarts = async () => {
    const id = ++reqId.current;
    setLoading(true);
    try {
      const data = await getAdminAbandonedCarts({
        search: debouncedSearch || undefined,
        type: type || undefined,
        status,
        idle_minutes: idle,
        from: from || undefined,
        to: to || undefined,
        page,
        per_page: 20,
      });
      if (id !== reqId.current) return;
      setCarts(data.carts?.data || []);
      setMeta(data.carts || {});
      setStats(data.stats || stats);
    } catch {
      if (id === reqId.current) showToast("Erreur de chargement.", "error");
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, type, status, idle, from, to, page]);

  const resetPage = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    setBusy(true);
    try {
      await deleteAdminAbandonedCart(confirmDelete.id);
      setConfirmDelete(null);
      showToast("Panier supprimé.");
      fetchCarts();
    } catch {
      showToast("Erreur lors de la suppression.", "error");
    } finally {
      setBusy(false);
    }
  };

  const doPurge = async () => {
    setBusy(true);
    try {
      const res = await purgeAdminAbandonedCarts(parseInt(purgeDays, 10));
      setPurgeOpen(false);
      showToast(res.message || "Nettoyage terminé.");
      setPage(1);
      fetchCarts();
    } catch {
      showToast("Erreur lors du nettoyage.", "error");
    } finally {
      setBusy(false);
    }
  };

  const statCards = [
    {
      label: "Visiteurs (sans compte)",
      count: stats.guests_count,
      value: stats.guests_value,
      icon: UserX,
      bg: "bg-gray-50",
      ic: "text-gray-500",
    },
    {
      label: "Clients (avec compte)",
      count: stats.customers_count,
      value: stats.customers_value,
      icon: User,
      bg: "bg-blue-50",
      ic: "text-blue-500",
    },
    {
      label: "Total paniers",
      count: stats.guests_count + stats.customers_count,
      value: stats.guests_value + stats.customers_value,
      icon: ShoppingCart,
      bg: "bg-amber-50",
      ic: "text-amber-500",
    },
  ];

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {confirmDelete && (
        <ConfirmBox
          title="Supprimer ce panier ?"
          text="Cette action est définitive."
          confirmLabel="Supprimer"
          onConfirm={doDelete}
          onCancel={() => setConfirmDelete(null)}
          busy={busy}
        />
      )}

      {purgeOpen && (
        <ConfirmBox
          title="Nettoyer les anciens paniers visiteurs"
          text="Supprime les paniers des visiteurs sans compte inactifs depuis plus de :"
          confirmLabel="Nettoyer"
          onConfirm={doPurge}
          onCancel={() => setPurgeOpen(false)}
          busy={busy}
        >
          <Select
            value={purgeDays}
            onChange={(e) => setPurgeDays(e.target.value)}
            className="w-full mb-2"
          >
            <option value="30">30 jours</option>
            <option value="60">60 jours</option>
            <option value="90">90 jours</option>
            <option value="180">180 jours</option>
          </Select>
          <p className="text-[11.5px] text-gray-400 mb-2">
            Les paniers des clients avec compte ne sont jamais supprimés.
          </p>
        </ConfirmBox>
      )}

      <PageHeader
        title="Paniers abandonnés"
        subtitle={`${meta.total ?? 0} panier(s) affiché(s)`}
        action={
          <Btn ghost onClick={() => setPurgeOpen(true)}>
            <Eraser size={14} /> Nettoyer les anciens
          </Btn>
        }
      />

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {statCards.map(({ label, count, value, icon: Icon, bg, ic }) => (
          <div
            key={label}
            className={`${bg} rounded-xl p-4 flex items-center gap-3`}
          >
            <Icon size={20} className={ic} />
            <div>
              <p className="text-[11.5px] text-gray-500 font-medium">{label}</p>
              <p className="text-[16px] font-extrabold text-gray-800">
                {count}{" "}
                <span className="text-[12px] font-semibold text-gray-500">
                  panier(s)
                </span>
              </p>
              <p className="text-[12px] font-bold text-[#1a4731]">
                {fmt(value)} DT
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex flex-col lg:flex-row gap-2.5 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <Input
            value={search}
            onChange={resetPage(setSearch)}
            placeholder="Nom, email ou téléphone..."
            className="pl-9 w-full"
          />
        </div>
        <Select value={type} onChange={resetPage(setType)}>
          <option value="">Visiteurs et clients</option>
          <option value="guests">Visiteurs (sans compte)</option>
          <option value="customers">Clients (avec compte)</option>
        </Select>
        <Select value={status} onChange={resetPage(setStatus)}>
          <option value="pending">Non récupérés</option>
          <option value="recovered">Récupérés (commande passée)</option>
          <option value="all">Tous</option>
        </Select>
        <Select value={idle} onChange={resetPage(setIdle)}>
          <option value="60">Inactifs depuis +1 h</option>
          <option value="360">Inactifs depuis +6 h</option>
          <option value="1440">Inactifs depuis +24 h</option>
          <option value="0">Tous (même en cours)</option>
        </Select>
        <Input
          type="date"
          value={from}
          onChange={resetPage(setFrom)}
          title="Du"
        />
        <Input type="date" value={to} onChange={resetPage(setTo)} title="Au" />
      </div>

      {/* Tableau */}
      <TableWrap>
        {loading ? (
          <Spinner />
        ) : (
          <Table
            headers={[
              "Type",
              "Contact",
              "Produits",
              "Total",
              "Dernière activité",
              "Statut",
              "Actions",
            ]}
            empty={carts.length === 0 ? "Aucun panier abandonné" : null}
          >
            {carts.map((cart) => {
              const c = contactOf(cart);
              const isGuest = !cart.user_id;
              const products = cart.cart_products || [];
              return (
                <TR key={cart.id}>
                  <TD>
                    <Badge type={isGuest ? "gray" : "info"}>
                      {isGuest ? "Visiteur" : "Client"}
                    </Badge>
                  </TD>
                  <TD>
                    {isGuest ? (
                      <span className="text-[12.5px] text-gray-400">
                        {guestLabel(cart)}
                      </span>
                    ) : (
                      <div>
                        <p className="text-[13px] font-semibold">
                          {c.name || "—"}
                        </p>
                        <p className="text-[11.5px] text-gray-400">
                          {c.email || "—"}
                        </p>
                      </div>
                    )}
                  </TD>
                  <TD>
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {products
                          .slice(0, 3)
                          .map((p, i) =>
                            p.image ? (
                              <img
                                key={i}
                                src={`${STORAGE_URL}/${p.image}`}
                                alt=""
                                className="w-8 h-8 rounded-md object-cover border-2 border-white bg-gray-100"
                              />
                            ) : (
                              <div
                                key={i}
                                className="w-8 h-8 rounded-md border-2 border-white bg-gray-200"
                              />
                            ),
                          )}
                      </div>
                      <span className="text-[12px] text-gray-500">
                        {itemsCount(cart)} article(s)
                      </span>
                    </div>
                  </TD>
                  <TD>
                    <span className="font-bold text-[#1a4731]">
                      {fmt(cart.total)} DT
                    </span>
                  </TD>
                  <TD className="text-[12px] text-gray-500 whitespace-nowrap">
                    {timeAgo(cart.last_activity)}
                  </TD>
                  <TD>
                    <Badge type={cart.recovered ? "success" : "warning"}>
                      {cart.recovered ? "Récupéré" : "Abandonné"}
                    </Badge>
                  </TD>
                  <TD>
                    <div className="flex gap-1.5">
                      <ActionBtn
                        type="info"
                        onClick={() => setSelected(cart)}
                        title="Voir le détail"
                      >
                        <Eye size={13} />
                      </ActionBtn>
                      <ActionBtn
                        type="danger"
                        onClick={() => setConfirmDelete(cart)}
                        title="Supprimer"
                      >
                        <Trash2 size={13} />
                      </ActionBtn>
                    </div>
                  </TD>
                </TR>
              );
            })}
          </Table>
        )}
        <Pagination meta={meta} page={page} setPage={setPage} />
      </TableWrap>

      {/* Détail */}
      {selected && (
        <Modal
          title={`Panier ${selected.user_id ? "client" : "visiteur"} — ${fmt(selected.total)} DT`}
          onClose={() => setSelected(null)}
          maxWidth="max-w-xl"
        >
          {(() => {
            const c = contactOf(selected);
            const isGuest = !selected.user_id;
            return (
              <>
                <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-1.5">
                  {isGuest ? (
                    <>
                      <p className="text-[13px] font-semibold text-gray-700">
                        {guestLabel(selected)}
                      </p>
                      <p className="text-[12px] text-gray-400">
                        Visiteur anonyme : aucune coordonnée disponible.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-[13.5px] font-bold text-gray-800">
                        {c.name || "—"}
                      </p>
                      {c.email && (
                        <a
                          href={`mailto:${c.email}`}
                          className="flex items-center gap-1.5 text-[12.5px] text-[#1a4731] font-semibold hover:opacity-70"
                        >
                          <MailIcon size={12} /> {c.email}
                        </a>
                      )}
                      {c.phone && (
                        <a
                          href={`tel:${c.phone}`}
                          className="flex items-center gap-1.5 text-[12.5px] text-[#1a4731] font-semibold hover:opacity-70"
                        >
                          <Phone size={12} /> {c.phone}
                        </a>
                      )}
                    </>
                  )}
                  <p className="text-[11.5px] text-gray-400 pt-1">
                    Créé le {fullDate(selected.created_at)} · Dernière activité{" "}
                    {fullDate(selected.last_activity)}
                  </p>
                </div>

                <div className="space-y-2">
                  {(selected.cart_products || []).map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 bg-gray-50 rounded-lg px-3 py-2"
                    >
                      {item.image ? (
                        <img
                          src={`${STORAGE_URL}/${item.image}`}
                          alt=""
                          className="w-10 h-10 rounded-md object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-gray-200 flex-shrink-0" />
                      )}
                      <span className="text-[12.5px] text-gray-700 flex-1 min-w-0 truncate">
                        {item.name}
                      </span>
                      <span className="text-[11.5px] text-gray-400">
                        ×{item.quantity}
                      </span>
                      <span className="text-[12px] font-semibold text-[#1a4731]">
                        {fmt(item.price)} DT
                      </span>
                    </div>
                  ))}
                  {(selected.cart_products || []).length === 0 && (
                    <p className="text-center text-[13px] text-gray-400 py-6">
                      Panier vide
                    </p>
                  )}
                </div>
              </>
            );
          })()}
        </Modal>
      )}
    </div>
  );
}
