import { useState, useEffect } from "react";
import { useDebounce } from "../hooks/useDebounce";
import {
  Search,
  Eye,
  Trash2,
  ShoppingBag,
  Heart,
  ShoppingCart,
  Award,
  MapPin,
  Sparkles,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
  Crown,
  Mail as MailIcon,
  Megaphone,
} from "lucide-react";
import { getAdminUsers, getAdminUser2, deleteUser } from "../services/adminApi";
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
import { STORAGE_URL } from "../../config/api";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({});
  const [vipThreshold, setVipThreshold] = useState(Infinity);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [purchaseStatus, setPurchaseStatus] = useState("");
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [selected, setSelected] = useState(null);
  const [detailTab, setDetailTab] = useState("info");

  useEffect(() => {
    fetchUsers();
  }, [debouncedSearch, purchaseStatus, page]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getAdminUsers({
        search: debouncedSearch,
        purchase_status: purchaseStatus,
        page,
        per_page: 20,
      });
      setUsers(data.data || []);
      setMeta(data.meta || data);
      setVipThreshold(data.vip_threshold ?? Infinity);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const isNew = (dateStr) =>
    Date.now() - new Date(dateStr).getTime() < 24 * 60 * 60 * 1000;

  const isVip = (u) => totalSpent(u) >= vipThreshold && totalSpent(u) > 0;

  const avgOrderValue = (u) => {
    const orders = u.orders || [];
    if (orders.length === 0) return 0;
    return totalSpent(u) / orders.length;
  };

  const memberSince = (dateStr) => {
    const months = Math.floor(
      (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24 * 30),
    );
    if (months < 1) return "Ce mois-ci";
    if (months === 1) return "1 mois";
    if (months < 12) return `${months} mois`;
    const years = Math.floor(months / 12);
    return years === 1 ? "1 an" : `${years} ans`;
  };

  const openDetail = async (user) => {
    setSelected({ ...user, _loading: true });
    setDetailTab("info");
    try {
      const d = await getAdminUser2(user.id);
      setSelected(d);
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!confirm("Supprimer cet utilisateur ?")) return;
    await deleteUser(id);
    fetchUsers();
  };

  const totalSpent = (u) =>
    (u.orders || []).reduce((s, o) => s + parseFloat(o.total || 0), 0);

  const sortedUsers = (() => {
    if (!sortField) return users;
    const arr = [...users];
    arr.sort((a, b) => {
      let valA, valB;
      if (sortField === "orders_count") {
        valA = a.orders_count ?? 0;
        valB = b.orders_count ?? 0;
      } else if (sortField === "total_spent") {
        valA = totalSpent(a);
        valB = totalSpent(b);
      } else if (sortField === "created_at") {
        valA = new Date(a.created_at).getTime();
        valB = new Date(b.created_at).getTime();
      }
      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  })();
  const TABS = [
    { key: "info", label: "Informations", icon: "👤" },
    { key: "orders", label: "Commandes", icon: "🛍️" },
    { key: "addresses", label: "Adresses", icon: "📍" },
    { key: "wishlist", label: "Favoris", icon: "❤️" },
    { key: "cart", label: "Panier abandonné", icon: "🛒" },
  ];

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <PageHeader
        title="Clients"
        subtitle={`${meta.total ?? 0} utilisateurs`}
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
            placeholder="Nom ou email..."
            className="pl-9 w-full"
          />
        </div>
        <Select
          value={purchaseStatus}
          onChange={(e) => {
            setPurchaseStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Tous les clients</option>
          <option value="with_orders">Avec commandes</option>
          <option value="no_orders">Sans commande</option>
        </Select>
      </div>

      {/* Table */}
      <TableWrap>
        {loading ? (
          <Spinner />
        ) : (
          <Table
            headers={[
              "Prénom",
              "Nom",
              "Email",
              "Civilité",
              "Téléphone",
              <button
                key="orders"
                onClick={() => handleSort("orders_count")}
                className="flex items-center gap-1 hover:text-gray-700"
              >
                Commandes
                {sortField === "orders_count" ? (
                  sortDir === "asc" ? (
                    <ArrowUp size={11} />
                  ) : (
                    <ArrowDown size={11} />
                  )
                ) : (
                  <ChevronsUpDown size={11} className="text-gray-300" />
                )}
              </button>,
              <button
                key="spent"
                onClick={() => handleSort("total_spent")}
                className="flex items-center gap-1 hover:text-gray-700"
              >
                Total dépensé
                {sortField === "total_spent" ? (
                  sortDir === "asc" ? (
                    <ArrowUp size={11} />
                  ) : (
                    <ArrowDown size={11} />
                  )
                ) : (
                  <ChevronsUpDown size={11} className="text-gray-300" />
                )}
              </button>,
              <button
                key="date"
                onClick={() => handleSort("created_at")}
                className="flex items-center gap-1 hover:text-gray-700"
              >
                Inscrit le
                {sortField === "created_at" ? (
                  sortDir === "asc" ? (
                    <ArrowUp size={11} />
                  ) : (
                    <ArrowDown size={11} />
                  )
                ) : (
                  <ChevronsUpDown size={11} className="text-gray-300" />
                )}
              </button>,
              "Actions",
            ]}
            empty={sortedUsers.length === 0 ? "Aucun utilisateur" : null}
          >
            {sortedUsers.map((user) => (
              <TR key={user.id}>
                <TD>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#1a4731]/10 flex items-center justify-center text-[#1a4731] font-bold text-[13px] flex-shrink-0">
                      {(user.first_name || user.name)?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-[13px]">
                        {user.first_name || "—"}
                      </p>
                      {isVip(user) && (
                        <span
                          className="flex items-center gap-0.5 text-[9.5px] font-bold px-1.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-full"
                          title="Client VIP — parmi les 10% de clients les plus dépensiers"
                        >
                          <Crown size={9} /> VIP
                        </span>
                      )}
                      {isNew(user.created_at) && (
                        <span className="flex items-center gap-0.5 text-[9.5px] font-bold px-1.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-full">
                          <Sparkles size={9} /> Nouveau
                        </span>
                      )}
                    </div>
                  </div>
                </TD>
                <TD className="text-[13px] font-medium">
                  {user.last_name || "—"}
                </TD>
                <TD className="text-[12.5px] text-gray-500">{user.email}</TD>
                <TD>
                  <Badge type={user.civility === "Mme" ? "info" : "success"}>
                    {user.civility || "—"}
                  </Badge>
                </TD>
                <TD className="text-[13px]">{user.phone || "—"}</TD>
                <TD className="text-center font-semibold">
                  {user.orders_count ?? 0}
                </TD>
                <TD>
                  <span className="font-bold text-[#1a4731]">
                    {totalSpent(user).toFixed(3)} DT
                  </span>
                </TD>
                <TD className="text-[12px] text-gray-400">
                  {new Date(user.created_at).toLocaleDateString("fr-FR")}
                </TD>
                <TD>
                  <div className="flex gap-1.5">
                    <ActionBtn
                      type="info"
                      onClick={() => openDetail(user)}
                      title="Voir fiche"
                    >
                      <Eye size={13} />
                    </ActionBtn>
                    {user.role !== "admin" && (
                      <ActionBtn
                        type="danger"
                        onClick={() => handleDelete(user.id)}
                        title="Supprimer"
                      >
                        <Trash2 size={13} />
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

      {/* Modal fiche client */}
      {selected && (
        <Modal
          title={
            <span className="flex items-center gap-2">
              Fiche client — {selected.name}
              {!selected._loading && isVip(selected) && (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-full">
                  <Crown size={10} /> VIP
                </span>
              )}
            </span>
          }
          onClose={() => setSelected(null)}
          maxWidth="max-w-3xl"
        >
          {selected._loading ? (
            <Spinner />
          ) : (
            <>
              {/* Résumé en haut */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {[
                  {
                    icon: ShoppingBag,
                    label: "Commandes",
                    val: selected.orders?.length ?? 0,
                    bg: "bg-blue-50",
                    ic: "text-blue-500",
                  },
                  {
                    icon: Award,
                    label: "Total dépensé",
                    val: totalSpent(selected).toFixed(3) + " DT",
                    bg: "bg-emerald-50",
                    ic: "text-emerald-500",
                  },
                  {
                    icon: ShoppingCart,
                    label: "Panier moyen",
                    val: avgOrderValue(selected).toFixed(3) + " DT",
                    bg: "bg-indigo-50",
                    ic: "text-indigo-500",
                  },
                  {
                    icon: Heart,
                    label: "Favoris",
                    val: selected.wishlists?.length ?? 0,
                    bg: "bg-pink-50",
                    ic: "text-pink-500",
                  },
                ].map(({ icon: Icon, label, val, bg, ic }) => (
                  <div
                    key={label}
                    className={`${bg} rounded-xl p-3 flex items-center gap-3`}
                  >
                    <Icon size={16} className={ic} />
                    <div>
                      <p className="text-[11px] text-gray-500 font-medium">
                        {label}
                      </p>
                      <p className="text-[14px] font-extrabold text-gray-800">
                        {val}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tabs */}
              <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5 overflow-x-auto">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setDetailTab(tab.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold whitespace-nowrap transition-all ${
                      detailTab === tab.key
                        ? "bg-white text-[#1a4731] shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <span style={{ fontSize: 13 }}>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}

              {/* INFO */}
              {detailTab === "info" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                        Informations personnelles
                      </p>
                      <a
                        href={`mailto:${selected.email}`}
                        className="flex items-center gap-1.5 text-[11px] font-semibold text-[#1a4731] hover:opacity-70 transition-opacity"
                      >
                        <MailIcon size={12} /> Envoyer un email
                      </a>
                    </div>
                    <InfoRow label="Civilité" val={selected.civility || "—"} />
                    <InfoRow label="Prénom" val={selected.first_name || "—"} />
                    <InfoRow label="Nom" val={selected.last_name || "—"} />
                    <InfoRow label="Email" val={selected.email} />
                    <InfoRow label="Téléphone" val={selected.phone || "—"} />
                    <InfoRow
                      label="Date de naissance"
                      val={
                        selected.birthdate
                          ? new Date(selected.birthdate).toLocaleDateString(
                              "fr-FR",
                              {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                              },
                            )
                          : "—"
                      }
                    />
                    <InfoRow
                      label="Inscrit le"
                      val={`${new Date(selected.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })} (${memberSince(selected.created_at)})`}
                    />
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                      <span className="text-[12px] text-gray-500 font-medium">
                        Newsletter
                      </span>
                      <span
                        className={`flex items-center gap-1 text-[11.5px] font-semibold px-2 py-0.5 rounded-full ${
                          selected.newsletter_opt_in
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-gray-100 text-gray-500 border border-gray-200"
                        }`}
                      >
                        <Megaphone size={10} />
                        {selected.newsletter_opt_in ? "Abonné" : "Non abonné"}
                      </span>
                    </div>
                    {selected.google_id && (
                      <InfoRow label="Connexion" val="Google OAuth" />
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                      Statistiques
                    </p>
                    <InfoRow
                      label="Commandes totales"
                      val={selected.orders?.length ?? 0}
                    />
                    <InfoRow
                      label="Commandes livrées"
                      val={
                        selected.orders?.filter((o) => o.status === "delivered")
                          .length ?? 0
                      }
                    />
                    <InfoRow
                      label="Commandes annulées"
                      val={
                        selected.orders?.filter((o) => o.status === "cancelled")
                          .length ?? 0
                      }
                    />
                    <InfoRow
                      label="Total dépensé"
                      val={totalSpent(selected).toFixed(3) + " DT"}
                    />
                    <InfoRow
                      label="Produits en favoris"
                      val={selected.wishlists?.length ?? 0}
                    />
                  </div>
                </div>
              )}

              {/* COMMANDES */}
              {detailTab === "orders" && (
                <div>
                  {(selected.orders?.length ?? 0) === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-[13px]">
                      Aucune commande
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selected.orders.map((o) => (
                        <div
                          key={o.id}
                          className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 hover:bg-gray-100 transition-colors"
                        >
                          <div>
                            <p className="text-[13px] font-semibold text-gray-800">
                              #{o.order_number || o.id}
                            </p>
                            <p className="text-[11.5px] text-gray-400">
                              {new Date(o.created_at).toLocaleDateString(
                                "fr-FR",
                              )}
                            </p>
                          </div>
                          <Badge
                            type={
                              o.status === "delivered"
                                ? "success"
                                : o.status === "cancelled"
                                  ? "danger"
                                  : o.status === "shipped"
                                    ? "info"
                                    : o.status === "processing"
                                      ? "info"
                                      : "warning"
                            }
                          >
                            {o.status === "delivered"
                              ? "Livrée"
                              : o.status === "cancelled"
                                ? "Annulée"
                                : o.status === "shipped"
                                  ? "Expédiée"
                                  : o.status === "processing"
                                    ? "En préparation"
                                    : "En attente"}
                          </Badge>
                          <div className="text-right">
                            <p className="font-bold text-[#1a4731] text-[13px]">
                              {parseFloat(o.total).toFixed(3)} DT
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {/* ADRESSES */}
              {detailTab === "addresses" && (
                <div>
                  {(selected.addresses?.length ?? 0) === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-[13px]">
                      Aucune adresse enregistrée
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selected.addresses.map((addr) => (
                        <div
                          key={addr.id}
                          className="bg-gray-50 rounded-xl p-4 relative"
                        >
                          {addr.is_default && (
                            <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 bg-[#1a4731]/10 text-[#1a4731] rounded-full">
                              Par défaut
                            </span>
                          )}
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin size={14} className="text-[#1a4731]" />
                            <p className="text-[13px] font-bold text-gray-800">
                              {addr.label || "Adresse"}
                            </p>
                          </div>
                          <p className="text-[12.5px] text-gray-600 mb-1">
                            {addr.first_name} {addr.last_name}
                          </p>
                          <p className="text-[12.5px] text-gray-600 mb-1">
                            {addr.address}
                          </p>
                          <p className="text-[12.5px] text-gray-500">
                            {addr.delegation}, {addr.governorate}
                            {addr.postal_code ? ` — ${addr.postal_code}` : ""}
                          </p>
                          {addr.phone && (
                            <p className="text-[12px] text-gray-400 mt-1.5">
                              📞 {addr.phone}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* FAVORIS */}
              {detailTab === "wishlist" && (
                <div>
                  {(selected.wishlists?.length ?? 0) === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-[13px]">
                      Aucun favori
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selected.wishlists.map((w) => {
                        const item = w.bundle || w.product;
                        const isBundle = !!w.bundle;
                        if (!item) return null;
                        return (
                          <div
                            key={w.id}
                            className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition-colors"
                          >
                            {item.image ? (
                              <img
                                src={`${STORAGE_URL}/${item.image}`}
                                alt=""
                                className="w-12 h-12 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-gray-200 flex-shrink-0" />
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-[12.5px] font-semibold text-gray-800 truncate">
                                  {item.name}
                                </p>
                                {isBundle && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-purple-50 text-purple-600 border border-purple-200 rounded-full flex-shrink-0">
                                    Coffret
                                  </span>
                                )}
                              </div>
                              <p className="text-[11.5px] text-[#1a4731] font-bold">
                                {parseFloat(item.price || 0).toFixed(3)} DT
                              </p>
                              {isBundle
                                ? item.is_available === false && (
                                    <Badge type="danger" className="mt-1">
                                      Rupture
                                    </Badge>
                                  )
                                : item.stock === 0 && (
                                    <Badge type="danger" className="mt-1">
                                      Rupture
                                    </Badge>
                                  )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* PANIER ABANDONNÉ */}
              {detailTab === "cart" && (
                <div>
                  {(selected.abandoned_carts?.length ?? 0) === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-[13px]">
                      Aucun panier abandonné
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selected.abandoned_carts.map((cart) => (
                        <div
                          key={cart.id}
                          className="bg-gray-50 rounded-xl p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="text-[12.5px] font-semibold text-gray-700">
                                {new Date(cart.created_at).toLocaleDateString(
                                  "fr-FR",
                                  {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                type={cart.recovered ? "success" : "warning"}
                              >
                                {cart.recovered ? "Récupéré" : "Abandonné"}
                              </Badge>
                              <span className="font-bold text-[#1a4731]">
                                {parseFloat(cart.total || 0).toFixed(3)} DT
                              </span>
                            </div>
                          </div>
                          {cart.cart_products &&
                            cart.cart_products.length > 0 && (
                              <div className="space-y-2">
                                {cart.cart_products.map((item, i) => (
                                  <div
                                    key={i}
                                    className="flex items-center gap-2.5 bg-white rounded-lg px-3 py-2"
                                  >
                                    {item.image && (
                                      <img
                                        src={`${STORAGE_URL}/${item.image}`}
                                        alt=""
                                        className="w-8 h-8 rounded-md object-cover flex-shrink-0"
                                      />
                                    )}
                                    <span className="text-[12.5px] text-gray-700 flex-1 truncate">
                                      {item.name}
                                    </span>
                                    <span className="text-[11.5px] text-gray-400">
                                      ×{item.quantity}
                                    </span>
                                    <span className="text-[12px] font-semibold text-[#1a4731]">
                                      {parseFloat(item.price || 0).toFixed(3)}{" "}
                                      DT
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </Modal>
      )}
    </div>
  );
}

// Helper composant
const InfoRow = ({ label, val }) => (
  <div className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
    <span className="text-[12px] text-gray-500 font-medium">{label}</span>
    <span className="text-[12.5px] font-semibold text-gray-800">{val}</span>
  </div>
);
