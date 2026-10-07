import { useState, useEffect } from "react";
import { useDebounce } from "../hooks/useDebounce";
import { useSearchParams } from "react-router-dom";
import { Search, Eye, Trash2, Sparkles } from "lucide-react";
import { STORAGE_URL } from "../../config/api";
import {
  getAdminOrders,
  updateOrderStatus,
  deleteOrder,
  getAdminOrderDetail,
} from "../services/adminApi";
import {
  Badge,
  ActionBtn,
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
} from "../components/AdminShared";

const STATUS_OPTIONS = [
  { value: "", label: "Tous les statuts" },
  { value: "pending", label: "En attente" },
  { value: "processing", label: "En préparation" },
  { value: "shipped", label: "Expédiée" },
  { value: "delivered", label: "Livrée" },
  { value: "cancelled", label: "Annulée" },
];

const STATUS_LABEL = {
  pending: "En attente",
  processing: "En préparation",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};
const timeAgo = (dateStr) => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return "à l'instant";
  if (diffHours < 24) return `il y a ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `il y a ${diffDays}j`;
};

const isNew = (dateStr) => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  return diffMs < 24 * 60 * 60 * 1000;
};

export default function AdminOrders() {
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  useEffect(() => {
    const urlStatus = searchParams.get("status");
    if (urlStatus !== null) {
      setStatus(urlStatus);
      setPage(1);
    }
  }, [searchParams]);
  useEffect(() => {
    fetchOrders();
  }, [debouncedSearch, status, page]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getAdminOrders({
        search: debouncedSearch,
        status,
        page,
        per_page: 15,
      });
      setOrders(data.data || []);
      setMeta(data.meta || data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleMouseEnter = async (order) => {
    if (sessionStorage.getItem(`order_${order.id}`)) return;
    try {
      const data = await getAdminOrderDetail(order.id);
      sessionStorage.setItem(`order_${order.id}`, JSON.stringify(data));
    } catch {}
  };

  const handleViewOrder = async (order) => {
    const cached = sessionStorage.getItem(`order_${order.id}`);
    if (cached) {
      setSelected(JSON.parse(cached));
      setLoadingDetail(false);
      return;
    }
    setSelected(order);
    setLoadingDetail(true);
    try {
      const data = await getAdminOrderDetail(order.id);
      setSelected(data);
      sessionStorage.setItem(`order_${order.id}`, JSON.stringify(data));
    } catch {
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleStatus = async (id, val) => {
    setUpdatingStatus(id);
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: val } : o)),
    );
    try {
      await updateOrderStatus(id, val);
      sessionStorage.removeItem(`order_${id}`);
      showToast("Statut mis à jour avec succès.");
    } catch {
      fetchOrders();
      showToast("Erreur lors de la mise à jour.", "error");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteOrder(id);
      sessionStorage.removeItem(`order_${id}`);
      setOrders((prev) => prev.filter((o) => o.id !== id));
      setMeta((prev) => ({ ...prev, total: (prev.total || 1) - 1 }));
      showToast("Commande supprimée avec succès.");
    } catch {
      showToast("Erreur lors de la suppression.", "error");
    } finally {
      setConfirmDelete(null);
    }
  };

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Toast notification */}
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
              Supprimer cette commande ?
            </h3>
            <p className="text-[13px] text-gray-400 text-center mb-6">
              Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-[13.5px] font-semibold hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-[13.5px] font-semibold hover:bg-red-600 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      <PageHeader
        title="Commandes"
        subtitle={`${meta.total ?? 0} commandes au total`}
      />

      {/* Filtres */}
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
            placeholder="Rechercher par référence ou client..."
            className="pl-9 w-full"
          />
        </div>
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-auto"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>

      <TableWrap>
        {loading ? (
          <Spinner />
        ) : (
          <Table
            headers={[
              "Référence",
              "Client",
              "Produits",
              "Total",
              "Statut",
              "Date",
              "Actions",
            ]}
            empty={orders.length === 0 ? "Aucune commande trouvée" : null}
          >
            {orders.map((order) => (
              <TR key={order.id}>
                <TD>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-[#1a4731]">
                      #{order.order_number || order.id}
                    </span>
                    {isNew(order.created_at) && (
                      <span className="flex items-center gap-0.5 text-[9.5px] font-bold px-1.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-full">
                        <Sparkles size={9} /> Nouvelle
                      </span>
                    )}
                    {order.promo_code && (
                      <span
                        className="text-[9.5px] font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full"
                        title={`Code promo: ${order.promo_code}`}
                      >
                        🏷️ Code promo
                      </span>
                    )}
                  </div>
                </TD>
                <TD>
                  <p className="font-semibold text-[13px]">
                    {order.user?.name}
                  </p>
                  <p className="text-[11.5px] text-gray-400">
                    {order.user?.email}
                  </p>
                </TD>
                <TD>
                  <div className="space-y-1">
                    {order.items?.slice(0, 2).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-1.5 text-[12px] text-gray-600"
                      >
                        {item.product?.image && (
                          <img
                            src={`${STORAGE_URL}/${item.product.image}`}
                            alt=""
                            className="w-5 h-5 rounded object-cover flex-shrink-0"
                          />
                        )}
                        <span
                          className="truncate max-w-[120px]"
                          dangerouslySetInnerHTML={{
                            __html: item.product?.name,
                          }}
                        />
                        <span className="text-gray-400">×{item.quantity}</span>
                      </div>
                    ))}
                    {order.items?.length > 2 && (
                      <span className="text-[11px] text-gray-400">
                        +{order.items.length - 2} autre(s)
                      </span>
                    )}
                  </div>
                </TD>
                <TD>
                  <span className="font-bold text-[#1a4731]">
                    {parseFloat(order.total).toFixed(3)} DT
                  </span>
                </TD>
                <TD>
                  <div className="flex items-center gap-2">
                    {updatingStatus === order.id && (
                      <span className="w-3.5 h-3.5 border-2 border-gray-300 border-t-[#1a4731] rounded-full animate-spin flex-shrink-0" />
                    )}
                    <select
                      value={order.status}
                      onChange={(e) => handleStatus(order.id, e.target.value)}
                      disabled={updatingStatus === order.id}
                      className={`text-[11.5px] font-semibold px-2 py-1 rounded-md border outline-none cursor-pointer transition-opacity ${
                        updatingStatus === order.id
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      } ${
                        order.status === "delivered"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : order.status === "cancelled"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : order.status === "shipped"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : order.status === "processing"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {STATUS_OPTIONS.slice(1).map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </TD>
                <TD className="text-[12px] text-gray-400">
                  <p>
                    {new Date(order.created_at).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  {order.status === "pending" && (
                    <p
                      className={`text-[10.5px] font-semibold mt-0.5 ${
                        Date.now() - new Date(order.created_at).getTime() >
                        48 * 60 * 60 * 1000
                          ? "text-red-500"
                          : Date.now() - new Date(order.created_at).getTime() >
                              24 * 60 * 60 * 1000
                            ? "text-amber-500"
                            : "text-gray-400"
                      }`}
                    >
                      {timeAgo(order.created_at)} en attente
                    </p>
                  )}
                </TD>
                <TD>
                  <div className="flex gap-1.5">
                    <ActionBtn
                      type="info"
                      onClick={() => handleViewOrder(order)}
                      onMouseEnter={() => handleMouseEnter(order)}
                      title="Voir détails"
                    >
                      <Eye size={13} />
                    </ActionBtn>
                    <ActionBtn
                      type="danger"
                      onClick={() => setConfirmDelete(order.id)}
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

      {/* Modal détail */}
      {selected && (
        <Modal
          title={`Commande #${selected.order_number || selected.id}`}
          onClose={() => setSelected(null)}
        >
          {loadingDetail ? (
            <div className="flex items-center justify-center py-10">
              <span className="w-6 h-6 border-2 border-gray-300 border-t-[#1a4731] rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-5">
                {[
                  {
                    title: "Client",
                    lines: [
                      selected.user?.name,
                      selected.user?.email,
                      selected.shipping_phone,
                    ],
                  },
                  {
                    title: "Livraison",
                    lines: [selected.shipping_address, selected.shipping_city],
                  },
                ].map(({ title, lines }) => (
                  <div key={title}>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                      {title}
                    </p>
                    {lines.filter(Boolean).map((l, i) => (
                      <p key={i} className="text-[13.5px] text-gray-700 mb-1">
                        {l}
                      </p>
                    ))}
                  </div>
                ))}
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Paiement
                  </p>
                  <p className="text-[13.5px] text-gray-700">
                    {selected.payment_method === "cash_on_delivery"
                      ? "Paiement à la livraison"
                      : selected.payment_method}
                  </p>
                  <Badge
                    type={
                      selected.payment_status === "paid" ? "success" : "warning"
                    }
                    className="mt-1"
                  >
                    {selected.payment_status === "paid" ? "Payé" : "En attente"}
                  </Badge>
                </div>
                {selected.promo_code && (
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                      Code promo utilisé
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[13px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg">
                        {selected.promo_code}
                      </span>
                      {selected.promo_discount_percentage && (
                        <span className="text-[12px] font-semibold text-emerald-600">
                          -{selected.promo_discount_percentage}%
                          {selected.promo_discount_amount &&
                            ` (${parseFloat(selected.promo_discount_amount).toFixed(3)} DT)`}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Produits commandés
                </p>
                <div className="space-y-2">
                  {selected.items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
                    >
                      {item.product?.image && (
                        <img
                          src={`${STORAGE_URL}/${item.product.image}`}
                          alt=""
                          className="w-11 h-11 rounded-xl object-cover border border-gray-100 flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-[13px] font-semibold text-gray-800 truncate"
                          dangerouslySetInnerHTML={{
                            __html: item.product?.name,
                          }}
                        />
                        <p className="text-[11.5px] text-gray-400">
                          {item.quantity} × {parseFloat(item.price).toFixed(3)}{" "}
                          DT
                        </p>
                        {item.selected_size && (
                          <div className="flex flex-col gap-0.5">
                            {item.selected_size && (
                              <p className="text-[11px] text-gray-400">
                                Taille: {item.selected_size}
                              </p>
                            )}
                            {item.selected_color && (
                              <p className="text-[11px] text-gray-400 flex items-center gap-1">
                                Couleur:
                                {(() => {
                                  try {
                                    const c =
                                      typeof item.selected_color === "string"
                                        ? JSON.parse(item.selected_color)
                                        : item.selected_color;
                                    return (
                                      <>
                                        <span
                                          className="inline-block w-3 h-3 rounded-full border border-gray-300 flex-shrink-0"
                                          style={{
                                            backgroundColor: c.hex || "#808080",
                                          }}
                                        />
                                        <span>
                                          {c.name || item.selected_color}
                                        </span>
                                      </>
                                    );
                                  } catch {
                                    return <span>{item.selected_color}</span>;
                                  }
                                })()}
                              </p>
                            )}
                          </div>
                        )}
                        {item.selected_color && (
                          <p className="text-[11.5px] text-[#1a4731] font-semibold mt-0.5">
                            Couleur : {item.selected_color}
                          </p>
                        )}
                      </div>
                      <span className="font-bold text-[#1a4731] text-[13px]">
                        {parseFloat(item.total).toFixed(3)} DT
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t-2 border-gray-100 mt-2 space-y-2">
                  <div className="flex justify-between text-[13px] text-gray-500">
                    <span>Sous-total</span>
                    <span className="font-semibold text-gray-700">
                      {parseFloat(selected.subtotal || 0).toFixed(3)} DT
                    </span>
                  </div>

                  {selected.promo_code && (
                    <div className="flex justify-between text-[13px] text-emerald-600">
                      <span className="flex items-center gap-1.5">
                        Code promo
                        <span className="font-mono font-bold text-[11.5px] bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                          {selected.promo_code}
                        </span>
                        {selected.promo_discount_percentage && (
                          <span className="font-semibold">
                            -{selected.promo_discount_percentage}%
                          </span>
                        )}
                      </span>
                      <span className="font-semibold">
                        -
                        {parseFloat(
                          selected.promo_discount_amount || 0,
                        ).toFixed(3)}{" "}
                        DT
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-[13px] text-gray-500">
                    <span>Livraison</span>
                    <span
                      className={`font-semibold ${
                        parseFloat(selected.shipping_cost) === 0
                          ? "text-emerald-600"
                          : "text-gray-700"
                      }`}
                    >
                      {parseFloat(selected.shipping_cost) === 0
                        ? "Gratuite"
                        : `${parseFloat(selected.shipping_cost || 0).toFixed(3)} DT`}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <span className="font-semibold text-gray-600">
                      Total payé par le client
                    </span>
                    <span className="text-[17px] font-extrabold text-[#1a4731]">
                      {parseFloat(selected.total).toFixed(3)} DT
                    </span>
                  </div>

                  {parseFloat(selected.shipping_cost) > 0 && (
                    <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-200">
                      <span className="text-[12px] font-semibold text-gray-400">
                        Revenu réel pharmacie (hors livraison)
                      </span>
                      <span className="text-[13.5px] font-bold text-gray-600">
                        {(
                          parseFloat(selected.subtotal || 0) -
                          parseFloat(selected.promo_discount_amount || 0)
                        ).toFixed(3)}{" "}
                        DT
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Historique des statuts */}
              {selected.status_histories?.length > 0 && (
                <div className="col-span-2 mt-4 pt-4 border-t border-gray-100">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                    Historique des modifications
                  </p>
                  <div className="space-y-2">
                    {selected.status_histories.map((h, i) => (
                      <div
                        key={i}
                        className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2 bg-gray-50 rounded-xl text-[12px]"
                      >
                        <span className="text-gray-400">
                          {new Date(h.created_at).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className="text-gray-400">→</span>
                        {h.old_status && (
                          <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 text-[10px] font-bold">
                            {STATUS_LABEL[h.old_status]}
                          </span>
                        )}
                        <span className="text-gray-400">→</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            h.new_status === "delivered"
                              ? "bg-green-50 text-green-700"
                              : h.new_status === "cancelled"
                                ? "bg-red-50 text-red-700"
                                : h.new_status === "shipped"
                                  ? "bg-blue-50 text-blue-700"
                                  : h.new_status === "processing"
                                    ? "bg-blue-50 text-blue-700"
                                    : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {STATUS_LABEL[h.new_status]}
                        </span>

                        {h.note && (
                          <span className="text-gray-500 italic">
                            "{h.note}"
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
