import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { STORAGE_URL } from "../config/api";
import {
  peekPostLoginRedirect,
  clearPostLoginRedirect,
} from "../utils/authRedirect";
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getOrders,
  getCurrentUser,
  logout as logoutApi,
  updateProfile,
  updatePassword,
  getMyStockRequests,
} from "../services/api";
import { GOVERNORATES, getDelegations } from "../data/tunisia";
import {
  Trash2,
  User,
  Package,
  MapPin,
  Heart,
  LogOut,
  Edit2,
  Eye,
  ChevronRight,
  ShoppingBag,
  Bell,
} from "lucide-react";

const STATUS = {
  pending: {
    label: "En attente",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
  },
  processing: {
    label: "En traitement",
    cls: "bg-blue-50 text-blue-700 border-blue-200",
  },
  shipped: {
    label: "Expédiée",
    cls: "bg-blue-50 text-blue-700 border-blue-200",
  },
  delivered: {
    label: "Livrée",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  cancelled: { label: "Annulée", cls: "bg-red-50 text-red-700 border-red-200" },
};

const NAV_ITEMS = [
  { key: "orders", icon: Package, label: "Mes commandes" },
  { key: "stock-requests", icon: Bell, label: "Mes demandes de stock" },
  { key: "addresses", icon: MapPin, label: "Mes adresses" },
  { key: "wishlist", icon: Heart, label: "Ma liste d'envies" },
  { key: "profile", icon: Edit2, label: "Informations personnelles" },
];

const Badge = ({ status }) => {
  const s = STATUS[status] || STATUS.pending;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wide ${s.cls}`}
    >
      {s.label}
    </span>
  );
};

const FieldInput = ({
  label,
  type = "text",
  value,
  onChange,
  disabled,
  placeholder,
}) => (
  <div className="flex-1">
    <label className="block text-[12.5px] font-semibold text-gray-600 mb-1.5">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      className="w-full h-10 px-3 border border-gray-200 rounded-lg text-[13.5px] text-gray-800 outline-none focus:border-[#1a5242] focus:ring-2 focus:ring-[#1a5242]/10 transition-all disabled:bg-gray-50 disabled:text-gray-400"
    />
  </div>
);

const Notif = ({ msg }) => {
  if (!msg) return null;
  return (
    <div
      className={`flex items-center gap-2.5 px-4 py-3 rounded-xl mb-5 text-[13.5px] font-semibold ${
        msg.type === "success"
          ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
          : "bg-red-50 border border-red-200 text-red-600"
      }`}
    >
      {msg.type === "success" ? "✓" : "✗"} {msg.text}
    </div>
  );
};

export default function Account() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("orders");
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [stockRequests, setStockRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Adresses ──
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressMsg, setAddressMsg] = useState(null);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    label: "Domicile",
    first_name: "",
    last_name: "",
    phone: "",
    governorate: "",
    delegation: "",
    address: "",
    postal_code: "",
    is_default: false,
  });

  // ── Profil ──
  const [profileForm, setProfileForm] = useState({
    civility: "",
    first_name: "",
    last_name: "",
    phone: "",
    birthdate: "",
    newsletter_opt_in: false,
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });
  const [profileMsg, setProfileMsg] = useState(null);
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  useEffect(() => {
    if (!localStorage.getItem("auth_token")) {
      navigate("/login");
      return;
    }
    // Une commande était en attente avant la connexion : on y retourne
    // au lieu d'afficher le compte (couvre email, inscription et Google).
    const pending = peekPostLoginRedirect();
    if (pending) {
      clearPostLoginRedirect();
      navigate(pending, { replace: true });
      return;
    }
    fetchUserData();
  }, [navigate]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const userResponse = await getCurrentUser();
      const userData = userResponse.user;

      let ordersData = [];
      try {
        const r = await getOrders();
        ordersData = r.orders || [];
      } catch {}

      const formattedOrders = ordersData.map((o) => ({
        id: o.id,
        number: o.order_number,
        date: new Date(o.created_at).toLocaleDateString("fr-FR"),
        status: o.status,
        total: parseFloat(o.total),
        items_count: o.items?.length || 0,
      }));
      setOrders(formattedOrders);

      const totalSpent = formattedOrders.reduce((s, o) => s + o.total, 0);
      setUser({
        ...userData,
        total_spent: totalSpent,
        orders_count: formattedOrders.length,
      });
      setProfileForm({
        civility: userData.civility || "",
        first_name: userData.first_name || "",
        last_name: userData.last_name || "",
        phone: userData.phone || "",
        birthdate: userData.birthdate || "",
        newsletter_opt_in: !!userData.newsletter_opt_in,
      });
      // Charger les adresses
      try {
        const addrData = await getAddresses();
        setAddresses(addrData.addresses || []);
      } catch {}

      // Charger les demandes de stock
      try {
        const stockData = await getMyStockRequests();
        setStockRequests(stockData.requests || []);
      } catch {}
    } catch {
      const stored = JSON.parse(localStorage.getItem("user"));
      stored
        ? setUser({ ...stored, total_spent: 0, orders_count: 0 })
        : handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch {}
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    navigate("/");
    window.location.reload();
  };

  // ── Handlers adresses ──
  const resetAddressForm = () => {
    setAddressForm({
      label: "Domicile",
      first_name: "",
      last_name: "",
      phone: "",
      governorate: "",
      delegation: "",
      address: "",
      postal_code: "",
      is_default: false,
    });
    setEditingAddress(null);
    setShowAddressForm(false);
    setAddressMsg(null);
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setSavingAddress(true);
    setAddressMsg(null);
    try {
      if (editingAddress) {
        const res = await updateAddress(editingAddress.id, addressForm);
        setAddresses((prev) =>
          prev.map((a) => (a.id === editingAddress.id ? res.address : a)),
        );
        setAddressMsg({
          type: "success",
          text: "Adresse mise à jour avec succès !",
        });
      } else {
        const res = await createAddress(addressForm);
        setAddresses((prev) => {
          const updated = res.address.is_default
            ? prev.map((a) => ({ ...a, is_default: false }))
            : prev;
          return [...updated, res.address];
        });
        setAddressMsg({
          type: "success",
          text: "Adresse ajoutée avec succès !",
        });
      }
      resetAddressForm();
      setTimeout(() => setAddressMsg(null), 4000);
      // Remonte en douceur après fermeture du formulaire
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setAddressMsg({
        type: "error",
        text: err.response?.data?.message || "Erreur.",
      });
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!confirm("Supprimer cette adresse ?")) return;
    try {
      await deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch {}
  };

  const handleSetDefault = async (id) => {
    try {
      await setDefaultAddress(id);
      setAddresses((prev) =>
        prev.map((a) => ({ ...a, is_default: a.id === id })),
      );
    } catch {}
  };

  const openEditAddress = (addr) => {
    setEditingAddress(addr);
    setAddressForm({
      label: addr.label,
      first_name: addr.first_name,
      last_name: addr.last_name,
      phone: addr.phone,
      governorate: addr.governorate,
      delegation: addr.delegation,
      address: addr.address,
      postal_code: addr.postal_code || "",
      is_default: addr.is_default,
    });
    setShowAddressForm(true);
  };
  const [showNewsletterConfirm, setShowNewsletterConfirm] = useState(false);
  const [savingNewsletter, setSavingNewsletter] = useState(false);

  const updateNewsletterPreference = async (value) => {
    setSavingNewsletter(true);
    try {
      const res = await updateProfile({
        ...profileForm,
        newsletter_opt_in: value,
      });
      localStorage.setItem("user", JSON.stringify(res.user));
      setUser((prev) => ({ ...prev, ...res.user }));
      setProfileForm((p) => ({ ...p, newsletter_opt_in: value }));
      setProfileMsg({
        type: "success",
        text: value
          ? "Vous êtes maintenant inscrit(e) à la newsletter."
          : "Vous avez été désabonné(e) de la newsletter.",
      });
      setTimeout(() => setProfileMsg(null), 4000);
    } catch (err) {
      setProfileMsg({
        type: "error",
        text:
          err.response?.data?.message ||
          "Erreur lors de la mise à jour de votre préférence.",
      });
    } finally {
      setSavingNewsletter(false);
    }
  };

  const handleNewsletterToggle = (checked) => {
    if (!checked) {
      setShowNewsletterConfirm(true);
      return;
    }
    updateNewsletterPreference(true);
  };

  // ── Handlers profil ──
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const res = await updateProfile(profileForm);
      localStorage.setItem("user", JSON.stringify(res.user));
      setUser((prev) => ({ ...prev, ...res.user }));
      setProfileMsg({
        type: "success",
        text: "Profil mis à jour avec succès !",
      });
      setTimeout(() => setProfileMsg(null), 4000);
    } catch (err) {
      setProfileMsg({
        type: "error",
        text: err.response?.data?.message || "Erreur lors de la mise à jour.",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setSavingPassword(true);
    setPasswordMsg(null);
    try {
      await updatePassword(passwordForm);
      setPasswordMsg({
        type: "success",
        text: "Mot de passe mis à jour avec succès !",
      });
      setPasswordForm({
        current_password: "",
        password: "",
        password_confirmation: "",
      });
      setTimeout(() => setPasswordMsg(null), 4000);
    } catch (err) {
      setPasswordMsg({
        type: "error",
        text: err.response?.data?.message || "Erreur lors de la mise à jour.",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div
          className="w-10 h-10 rounded-full animate-spin"
          style={{ border: "3px solid #e5e7eb", borderTopColor: "#1a5242" }}
        />
        <p className="text-gray-400 text-[14px]">Chargement...</p>
      </div>
    );

  return (
    <div
      className="bg-gray-50 min-h-screen py-8"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div style={{ maxWidth: 1300, margin: "0 auto", padding: "0 24px" }}>
        {/* Header */}
        <div className="bg-white rounded-2xl px-4 md:px-6 py-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-[16px]"
              style={{
                background: "#FFF3B0",
                color: "#355847",
              }}
            >
              {(user?.first_name?.[0] || user?.name?.[0] || "?").toUpperCase()}
              {(user?.last_name?.[0] || "").toUpperCase()}
            </div>
            <div>
              <p className="text-[15.5px] font-bold text-gray-900 leading-tight capitalize">
                {user?.civility ? `${user.civility} ` : ""}
                {(
                  user?.first_name ||
                  user?.name?.split(" ")[0] ||
                  ""
                ).toLowerCase()}{" "}
                {(user?.last_name || "").toLowerCase()}
              </p>
              <p className="text-[12.5px] text-gray-400 mt-0.5">
                {user?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-100">
              <Package size={15} className="text-[#1a5242]" />
              <span className="text-[13px] font-semibold text-gray-700">
                {user?.orders_count || 0} commande
                {(user?.orders_count || 0) > 1 ? "s" : ""}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors text-[13px] font-semibold"
            >
              <LogOut size={14} /> Déconnexion
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-[270px_1fr] gap-5 items-start">
          {/* Sidebar */}
          <div className="bg-white border border-gray-100 rounded-2xl p-2.5 shadow-sm lg:sticky lg:top-5 flex lg:flex-col gap-1 overflow-x-auto">
            {NAV_ITEMS.map(({ key, icon: Icon, label }) => {
              const count =
                key === "orders"
                  ? orders.length
                  : key === "stock-requests"
                    ? stockRequests.filter((r) => !r.notified).length
                    : key === "addresses"
                      ? addresses.length
                      : key === "wishlist"
                        ? wishlist.length
                        : null;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex-shrink-0 lg:w-full flex items-center gap-2.5 lg:gap-3 px-3.5 lg:px-4 py-2.5 lg:py-3 rounded-xl text-[13px] lg:text-[13.5px] font-medium transition-all lg:mb-1 text-left ${
                    activeTab === key
                      ? "bg-[#1a5242] text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-50 hover:text-[#1a5242]"
                  }`}
                >
                  <Icon size={17} className="flex-shrink-0" />
                  <span className="flex-1">{label}</span>
                  {count !== null && count > 0 && (
                    <span
                      className={`text-[10.5px] font-bold px-1.5 py-0.5 rounded-md min-w-[20px] text-center ${
                        activeTab === key
                          ? "bg-white/20 text-white"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Main */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 md:p-7 shadow-sm">
            {/* ── COMMANDES ── */}
            {activeTab === "orders" && (
              <div>
                <SectionTitle>Mes commandes</SectionTitle>
                {orders.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {orders.map((o) => (
                      <div
                        key={o.id}
                        className="border border-gray-100 rounded-2xl p-5 hover:border-[#1a5242]/20 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-100">
                          <div>
                            <p className="font-bold text-[#1a5242] text-[14px]">
                              #{o.number}
                            </p>
                            <p className="text-[12px] text-gray-400 mt-0.5">
                              Commandé le {o.date}
                            </p>
                          </div>
                          <Badge status={o.status} />
                        </div>
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-[13px] text-gray-500">
                            {o.items_count} article(s)
                          </span>
                          <span className="font-extrabold text-[15px] text-gray-900">
                            {o.total.toFixed(3)} DT
                          </span>
                        </div>
                        <Link
                          to={`/account/orders/${o.id}`}
                          className="flex items-center justify-center gap-2 w-full py-2 rounded-xl border border-[#1a5242] text-[#1a5242] text-[13px] font-semibold"
                        >
                          Voir les détails
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    text="Aucune commande"
                    link="/products"
                    linkText="Commencer mes achats"
                  />
                )}
              </div>
            )}

            {/* ── ADRESSES ── */}
            {activeTab === "addresses" && (
              <div>
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                  <p className="text-[18px] font-bold text-gray-900">
                    Mes adresses
                  </p>
                  {!showAddressForm && (
                    <button
                      onClick={() => {
                        setShowAddressForm(true);
                        setEditingAddress(null);
                        setAddressForm({
                          label: "Domicile",
                          first_name: "",
                          last_name: "",
                          phone: "",
                          governorate: "",
                          delegation: "",
                          address: "",
                          postal_code: "",
                          is_default: false,
                        });
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a5242] text-white text-[13px] font-semibold hover:opacity-90 transition-opacity"
                    >
                      <span className="text-lg leading-none">+</span> Ajouter
                      une adresse
                    </button>
                  )}
                </div>

                <Notif msg={addressMsg} />

                {/* Formulaire ajout/édition */}
                {showAddressForm && (
                  <div className="border border-[#1a5242]/20 rounded-2xl p-6 mb-6 bg-[#1a5242]/5">
                    <p className="text-[15px] font-bold text-gray-800 mb-5">
                      {editingAddress
                        ? "Modifier l'adresse"
                        : "Nouvelle adresse"}
                    </p>
                    <form onSubmit={handleAddressSubmit} className="space-y-4">
                      {/* Label */}
                      <div>
                        <label className="block text-[12.5px] font-semibold text-gray-600 mb-1.5">
                          Type d'adresse
                        </label>
                        <select
                          value={addressForm.label}
                          onChange={(e) =>
                            setAddressForm((p) => ({
                              ...p,
                              label: e.target.value,
                            }))
                          }
                          className="w-full h-10 px-3 border border-gray-200 rounded-lg text-[13.5px] text-gray-800 outline-none focus:border-[#1a5242] bg-white"
                        >
                          <option>Domicile</option>
                          <option>Bureau</option>
                          <option>Autre</option>
                        </select>
                      </div>

                      {/* Prénom + Nom */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <FieldInput
                          label="Prénom *"
                          value={addressForm.first_name}
                          onChange={(e) =>
                            setAddressForm((p) => ({
                              ...p,
                              first_name: e.target.value,
                            }))
                          }
                        />
                        <FieldInput
                          label="Nom *"
                          value={addressForm.last_name}
                          onChange={(e) =>
                            setAddressForm((p) => ({
                              ...p,
                              last_name: e.target.value,
                            }))
                          }
                        />
                      </div>

                      {/* Téléphone */}
                      <FieldInput
                        label="Téléphone *"
                        type="tel"
                        value={addressForm.phone}
                        onChange={(e) =>
                          setAddressForm((p) => ({
                            ...p,
                            phone: e.target.value,
                          }))
                        }
                        placeholder="+216 20 000 000"
                      />

                      {/* Gouvernorat */}
                      <div>
                        <label className="block text-[12.5px] font-semibold text-gray-600 mb-1.5">
                          Gouvernorat *
                        </label>
                        <select
                          value={addressForm.governorate}
                          onChange={(e) =>
                            setAddressForm((p) => ({
                              ...p,
                              governorate: e.target.value,
                              delegation: "",
                            }))
                          }
                          required
                          className="w-full h-10 px-3 border border-gray-200 rounded-lg text-[13.5px] text-gray-800 outline-none focus:border-[#1a5242] bg-white"
                        >
                          <option value="">
                            Sélectionner un gouvernorat...
                          </option>
                          {GOVERNORATES.map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Délégation */}
                      <div>
                        <label className="block text-[12.5px] font-semibold text-gray-600 mb-1.5">
                          Délégation *
                        </label>
                        <select
                          value={addressForm.delegation}
                          onChange={(e) =>
                            setAddressForm((p) => ({
                              ...p,
                              delegation: e.target.value,
                            }))
                          }
                          required
                          disabled={!addressForm.governorate}
                          className="w-full h-10 px-3 border border-gray-200 rounded-lg text-[13.5px] text-gray-800 outline-none focus:border-[#1a5242] bg-white disabled:bg-gray-50 disabled:text-gray-400"
                        >
                          <option value="">
                            {addressForm.governorate
                              ? "Sélectionner une délégation..."
                              : "Choisissez d'abord un gouvernorat"}
                          </option>
                          {getDelegations(addressForm.governorate).map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Adresse complète */}
                      <FieldInput
                        label="Adresse complète *"
                        value={addressForm.address}
                        onChange={(e) =>
                          setAddressForm((p) => ({
                            ...p,
                            address: e.target.value,
                          }))
                        }
                        placeholder="N° rue, nom de la rue, appartement..."
                      />

                      {/* Code postal */}
                      <FieldInput
                        label="Code postal"
                        value={addressForm.postal_code}
                        onChange={(e) =>
                          setAddressForm((p) => ({
                            ...p,
                            postal_code: e.target.value,
                          }))
                        }
                        placeholder="Ex: 1000"
                      />

                      {/* Par défaut */}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={addressForm.is_default}
                          onChange={(e) =>
                            setAddressForm((p) => ({
                              ...p,
                              is_default: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 accent-[#1a5242]"
                        />
                        <span className="text-[13px] text-gray-600">
                          Définir comme adresse par défaut
                        </span>
                      </label>

                      {/* Boutons */}
                      <div className="flex gap-3 pt-2">
                        <button
                          type="submit"
                          disabled={savingAddress}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1a5242] text-white text-[13.5px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          {savingAddress && (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          )}
                          {editingAddress ? "Enregistrer" : "Ajouter"}
                        </button>
                        <button
                          type="button"
                          onClick={resetAddressForm}
                          className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-[13.5px] font-semibold hover:bg-gray-50 transition-colors"
                        >
                          Annuler
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Liste des adresses */}
                {addresses.length === 0 && !showAddressForm ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-4 border border-dashed border-gray-200 rounded-2xl">
                    <MapPin
                      size={36}
                      className="text-gray-300"
                      strokeWidth={1.2}
                    />
                    <p className="text-gray-400 text-[14px]">
                      Aucune adresse enregistrée
                    </p>
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="text-[13.5px] font-semibold text-[#1a5242] hover:opacity-70 transition-opacity"
                    >
                      Ajouter une adresse →
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-2">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`border rounded-2xl p-5 transition-all ${addr.is_default ? "border-[#1a5242]/30 bg-[#1a5242]/5" : "border-gray-200"}`}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <MapPin size={14} className="text-[#1a5242]" />
                          <span className="text-[13px] font-bold text-gray-700">
                            {addr.label}
                          </span>
                          {addr.is_default && (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                              Par défaut
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-[#1a5242] text-[14px] mb-1">
                          {addr.first_name} {addr.last_name}
                        </p>
                        <p className="text-[12.5px] text-gray-500 leading-relaxed">
                          {addr.address}
                          <br />
                          {addr.delegation}, {addr.governorate}
                          <br />
                          {addr.postal_code && `${addr.postal_code} — `}
                          {addr.phone}
                        </p>
                        <div className="flex gap-3 mt-4 pt-3 border-t border-gray-100">
                          <button
                            onClick={() => openEditAddress(addr)}
                            className="text-[12.5px] text-[#1a5242] font-semibold hover:opacity-70"
                          >
                            Modifier
                          </button>
                          {!addr.is_default && (
                            <button
                              onClick={() => handleSetDefault(addr.id)}
                              className="text-[12.5px] text-amber-600 font-semibold hover:opacity-70"
                            >
                              Par défaut
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="text-[12.5px] text-red-500 font-semibold hover:opacity-70 ml-auto"
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {/* ── DEMANDES DE STOCK ── */}
            {activeTab === "stock-requests" && (
              <div>
                <SectionTitle>Mes demandes de stock</SectionTitle>
                {stockRequests.length === 0 ? (
                  <EmptyState
                    text="Vous n'avez fait aucune demande de disponibilité"
                    link="/products"
                    linkText="Découvrir nos produits"
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {stockRequests.map((r) => {
                      const isBackInStock =
                        r.product_stock > 0 && !r.product_is_unavailable;
                      return (
                        <div
                          key={r.id}
                          className="border border-gray-100 rounded-2xl p-4 flex gap-3 hover:border-gray-200 transition-all"
                        >
                          <Link
                            to={`/products/${r.product_slug}`}
                            className="w-16 h-16 rounded-xl border border-gray-100 bg-gray-50 flex-shrink-0 overflow-hidden flex items-center justify-center"
                          >
                            {r.product_image ? (
                              <img
                                src={`${STORAGE_URL}/${r.product_image}`}
                                alt=""
                                className="w-full h-full object-contain p-1.5"
                              />
                            ) : (
                              <Bell size={18} className="text-gray-300" />
                            )}
                          </Link>
                          <div className="flex-1 min-w-0">
                            <Link
                              to={`/products/${r.product_slug}`}
                              className="text-[13px] font-semibold text-gray-800 leading-snug hover:text-[#1a5242] transition-colors line-clamp-2"
                            >
                              {r.product_name}
                            </Link>
                            <p className="text-[11.5px] text-gray-400 mt-1">
                              Demandé le{" "}
                              {new Date(r.created_at).toLocaleDateString(
                                "fr-FR",
                              )}
                            </p>
                            <span
                              className={`inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wide ${
                                isBackInStock
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : r.notified
                                    ? "bg-gray-50 text-gray-500 border-gray-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              {isBackInStock
                                ? "De nouveau en stock"
                                : r.notified
                                  ? "Traité"
                                  : "En attente"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── WISHLIST ── */}
            {/* ── WISHLIST ── */}
            {activeTab === "wishlist" && (
              <div>
                <SectionTitle>Ma liste d'envies</SectionTitle>
                {wishlist.length === 0 ? (
                  <EmptyState
                    text="Votre liste d'envies est vide"
                    link="/products"
                    linkText="Découvrir nos produits"
                  />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {wishlist.map((item) => {
                      const product = item.product;
                      if (!product) return null;
                      const price = parseFloat(product.price) || 0;
                      const promoPrice = parseFloat(product.promo_price) || 0;
                      const hasPromo = promoPrice > 0 && promoPrice < price;
                      const display = hasPromo ? promoPrice : price;
                      return (
                        <div
                          key={item.id}
                          className="border border-gray-100 rounded-2xl overflow-hidden hover:shadow-sm hover:border-gray-200 transition-all group"
                        >
                          <Link
                            to={`/products/${product.slug}`}
                            className="block bg-gray-50 overflow-hidden"
                            style={{ height: 160 }}
                          >
                            <img
                              src={
                                product.image
                                  ? `${STORAGE_URL}/${product.image}`
                                  : "/images/placeholder-product.png"
                              }
                              alt={product.name}
                              className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                            />
                          </Link>
                          <div className="p-3 space-y-2">
                            {product.brand && (
                              <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
                                {product.brand.name}
                              </p>
                            )}
                            <Link
                              to={`/products/${product.slug}`}
                              className="block text-[13px] font-semibold text-gray-800 leading-snug hover:text-[#1a5242] transition-colors line-clamp-2"
                            >
                              {product.name}
                            </Link>
                            <div className="flex items-center gap-2">
                              <span
                                className="text-[14px] font-extrabold"
                                style={{ color: "#3f9973" }}
                              >
                                {display.toFixed(3)} DT
                              </span>
                              {hasPromo && (
                                <span className="text-[12px] text-gray-400 line-through">
                                  {price.toFixed(3)} DT
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={() =>
                                  product.stock > 0 && addToCart(product)
                                }
                                disabled={product.stock === 0}
                                className="flex-1 py-1.5 rounded-lg text-[12px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                                style={{ background: "#1a5242" }}
                              >
                                {product.stock === 0 ? "Rupture" : "Ajouter"}
                              </button>
                              <button
                                onClick={() => removeFromWishlist(product.id)}
                                className="w-8 h-8 rounded-lg border border-red-100 bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors flex-shrink-0"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── PROFIL ── */}
            {activeTab === "profile" && (
              <div>
                <SectionTitle>Informations personnelles</SectionTitle>
                <Notif msg={profileMsg} />
                <form
                  onSubmit={handleProfileSubmit}
                  className="space-y-4 max-w-2xl"
                >
                  <div>
                    <label className="block text-[12.5px] font-semibold text-gray-600 mb-1.5">
                      Civilité
                    </label>
                    <div className="flex gap-5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="account_civility"
                          checked={profileForm.civility === "M."}
                          onChange={() =>
                            setProfileForm((p) => ({ ...p, civility: "M." }))
                          }
                          className="w-4 h-4 accent-[#1a5242]"
                        />
                        <span className="text-[13.5px] text-gray-700">M.</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="account_civility"
                          checked={profileForm.civility === "Mme"}
                          onChange={() =>
                            setProfileForm((p) => ({ ...p, civility: "Mme" }))
                          }
                          className="w-4 h-4 accent-[#1a5242]"
                        />
                        <span className="text-[13.5px] text-gray-700">Mme</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <FieldInput
                      label="Prénom"
                      value={profileForm.first_name}
                      onChange={(e) =>
                        setProfileForm((p) => ({
                          ...p,
                          first_name: e.target.value,
                        }))
                      }
                    />
                    <FieldInput
                      label="Nom"
                      value={profileForm.last_name}
                      onChange={(e) =>
                        setProfileForm((p) => ({
                          ...p,
                          last_name: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <FieldInput
                      label="Email"
                      type="email"
                      value={user?.email || ""}
                      disabled
                    />
                    <FieldInput
                      label="Téléphone"
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) =>
                        setProfileForm((p) => ({ ...p, phone: e.target.value }))
                      }
                      placeholder="+216 20 000 000"
                    />
                  </div>
                  <FieldInput
                    label="Date de naissance"
                    type="date"
                    value={profileForm.birthdate}
                    onChange={(e) =>
                      setProfileForm((p) => ({
                        ...p,
                        birthdate: e.target.value,
                      }))
                    }
                  />

                  <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={profileForm.newsletter_opt_in}
                      disabled={savingNewsletter}
                      onChange={(e) => handleNewsletterToggle(e.target.checked)}
                      className="w-4 h-4 accent-[#1a5242]"
                    />
                    <span className="text-[13px] text-gray-700">
                      Recevoir les offres et actualités par email
                      {savingNewsletter && " (mise à jour...)"}
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-[#1a5242] text-[#1a5242] text-[13.5px] font-semibold hover:bg-[#1a5242] hover:text-white transition-all disabled:opacity-50"
                  >
                    {savingProfile && (
                      <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    )}
                    Enregistrer les modifications
                  </button>
                </form>

                <div className="mt-10 pt-8 border-t border-gray-100">
                  <p className="text-[15px] font-bold text-gray-800 mb-5">
                    Changer mon mot de passe
                  </p>
                  <Notif msg={passwordMsg} />
                  <form
                    onSubmit={handlePasswordSubmit}
                    className="space-y-4 max-w-md"
                  >
                    {[
                      { label: "Mot de passe actuel", key: "current_password" },
                      { label: "Nouveau mot de passe", key: "password" },
                      {
                        label: "Confirmer le mot de passe",
                        key: "password_confirmation",
                      },
                    ].map(({ label, key }) => (
                      <FieldInput
                        key={key}
                        label={label}
                        type="password"
                        value={passwordForm[key]}
                        onChange={(e) =>
                          setPasswordForm((p) => ({
                            ...p,
                            [key]: e.target.value,
                          }))
                        }
                      />
                    ))}
                    <button
                      type="submit"
                      disabled={savingPassword}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-[#1a5242] text-[#1a5242] text-[13.5px] font-semibold hover:bg-[#1a5242] hover:text-white transition-all disabled:opacity-50"
                    >
                      {savingPassword && (
                        <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                      )}
                      Mettre à jour le mot de passe
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Confirmation désabonnement newsletter */}
      {showNewsletterConfirm && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4"
          onClick={() => setShowNewsletterConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
          >
            <p className="text-[15px] font-bold text-gray-800 mb-2">
              Se désabonner de la newsletter ?
            </p>
            <p className="text-[13.5px] text-gray-500 mb-5">
              Vous ne recevrez plus nos offres et actualités par email. Vous
              pourrez vous réabonner à tout moment.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowNewsletterConfirm(false)}
                className="px-4 py-2 rounded-xl text-[13px] font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  await updateNewsletterPreference(false);
                  setShowNewsletterConfirm(false);
                }}
                disabled={savingNewsletter}
                className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {savingNewsletter ? "Désabonnement..." : "Se désabonner"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const SectionTitle = ({ children }) => (
  <p className="text-[18px] font-bold text-gray-900 mb-6 pb-4 border-b border-gray-100">
    {children}
  </p>
);

const EmptyState = ({ text, link, linkText }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-4 border border-dashed border-gray-200 rounded-2xl mt-2">
    <ShoppingBag size={36} className="text-gray-300" strokeWidth={1.2} />
    <p className="text-gray-400 text-[14px]">{text}</p>
    <Link
      to={link}
      className="text-[13.5px] font-semibold text-[#1a5242] hover:opacity-70 transition-opacity"
    >
      {linkText} →
    </Link>
  </div>
);
