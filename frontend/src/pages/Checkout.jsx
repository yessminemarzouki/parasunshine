import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import {
  setPostLoginRedirect,
  clearPostLoginRedirect,
} from "../utils/authRedirect";
import { STORAGE_URL } from "../config/api";
import {
  Truck,
  MapPin,
  Phone,
  Mail,
  User,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Plus,
  Home,
  Gift,
  Banknote,
  Tag,
  Check,
  Loader2,
  X,
  Briefcase,
} from "lucide-react";
import {
  createOrder,
  getAddresses,
  createAddress,
  getShippingSettings,
  validatePromoCode,
} from "../services/api";
import { GOVERNORATES, getDelegations } from "../data/tunisia";

const Label = ({ children, required }) => (
  <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
    {children} {required && <span className="text-red-500">*</span>}
  </label>
);

const InputField = ({ icon: Icon, ...props }) => (
  <div className="relative">
    {Icon && (
      <Icon
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
    )}
    <input
      {...props}
      className={`w-full h-11 border border-gray-200 rounded-xl text-[13.5px] text-gray-800 outline-none focus:border-[#1a5242] focus:ring-2 focus:ring-[#1a5242]/10 transition-all bg-white ${Icon ? "pl-10 pr-4" : "px-4"}`}
    />
  </div>
);

const SelectField = ({ icon: Icon, children, ...props }) => (
  <div className="relative">
    {Icon && (
      <Icon
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"
      />
    )}
    <select
      {...props}
      className={`w-full h-11 border border-gray-200 rounded-xl text-[13.5px] text-gray-800 outline-none focus:border-[#1a5242] focus:ring-2 focus:ring-[#1a5242]/10 transition-all bg-white appearance-none ${Icon ? "pl-10 pr-8" : "px-4 pr-8"}`}
    >
      {children}
    </select>
    <ChevronRight
      size={14}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none rotate-90"
    />
  </div>
);

const FormSection = ({ icon: Icon, title, children }) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
      <div className="w-8 h-8 rounded-lg bg-[#1a5242]/10 flex items-center justify-center flex-shrink-0">
        <Icon size={16} className="text-[#1a5242]" />
      </div>
      <p className="text-[14.5px] font-bold text-gray-900">{title}</p>
    </div>
    {children}
  </div>
);

export default function Checkout() {
  const navigate = useNavigate();
  const {
    cart,
    cartTotal,
    clearCart,
    promoCode,
    applyPromoCode,
    removePromoCode,
  } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [deliveryMethod, setDeliveryMethod] = useState("delivery");
  const [shipping, setShipping] = useState({
    free_shipping_enabled: true,
    free_shipping_threshold: 99,
    shipping_cost: 7,
  });

  useEffect(() => {
    getShippingSettings()
      .then(setShipping)
      .catch(() => {});
  }, []);
  const [saveNewAddress, setSaveNewAddress] = useState(false);
  const [setAsDefault, setSetAsDefault] = useState(false);
  s;

  // ── Rappel code promo (au cas où le client aurait manqué le champ dans le panier) ──
  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState("");
  const [promoChecking, setPromoChecking] = useState(false);

  const handleApplyPromo = async () => {
    const code = promoInput.trim();
    if (!code) return;
    setPromoChecking(true);
    setPromoError("");
    try {
      const result = await validatePromoCode(code, cart);
      applyPromoCode(result);
      setPromoInput("");
    } catch (err) {
      setPromoError(
        err.response?.data?.message || "Ce code promo n'est pas valide.",
      );
    } finally {
      setPromoChecking(false);
    }
  };

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    governorate: "",
    delegation: "",
    address: "",
    postalCode: "",
    addressLabel: "Domicile",
  });

  const delegations = getDelegations(formData.governorate);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setPostLoginRedirect("/checkout");
      navigate("/login");
      return;
    }
    // Arrivé ici connecté : la redirection en attente est consommée.
    clearPostLoginRedirect();

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.email) {
      setFormData((p) => ({
        ...p,
        email: user.email,
        phone: user.phone || "",
        firstName: user.name?.split(" ")[0] || "",
        lastName: user.name?.split(" ").slice(1).join(" ") || "",
      }));
    }

    // Charger les adresses sauvegardées
    getAddresses()
      .then((data) => {
        const addresses = data.addresses || [];
        setSavedAddresses(addresses);
        if (addresses.length > 0) {
          const def = addresses.find((a) => a.is_default) || addresses[0];
          setSelectedAddressId(def.id);
          setUseNewAddress(false);
        } else {
          setUseNewAddress(true);
        }
      })
      .catch(() => setUseNewAddress(true))
      .finally(() => setLoadingAddresses(false));
  }, [navigate]);

  useEffect(() => {
    if (cart.length === 0) navigate("/cart");
  }, [cart, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      // Réinitialiser la délégation si le gouvernorat change
      ...(name === "governorate" ? { delegation: "" } : {}),
    }));
  };

  const getShippingAddressString = (addr) => {
    return `${addr.address}, ${addr.delegation}, ${addr.governorate}${addr.postal_code ? " " + addr.postal_code : ""}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation de l'adresse (uniquement si livraison à domicile)
    if (deliveryMethod === "delivery") {
      if (!useNewAddress && !selectedAddressId) {
        setError("Veuillez sélectionner une adresse de livraison.");
        return;
      }
      if (useNewAddress) {
        if (!formData.governorate) {
          setError("Veuillez sélectionner un gouvernorat.");
          return;
        }
        if (!formData.delegation) {
          setError("Veuillez sélectionner une délégation.");
          return;
        }
        if (!formData.address.trim()) {
          setError("Veuillez entrer votre adresse complète.");
          return;
        }
      }
    }

    setLoading(true);
    try {
      let shippingAddress;
      let shippingPhone;

      if (!useNewAddress && selectedAddressId) {
        const addr = savedAddresses.find((a) => a.id === selectedAddressId);
        shippingAddress = getShippingAddressString(addr);
        shippingPhone = addr.phone;
      } else {
        shippingAddress = `${formData.address}, ${formData.delegation}, ${formData.governorate}${formData.postalCode ? " " + formData.postalCode : ""}`;
        shippingPhone = formData.phone;
      }

      const orderData = {
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          selected_size: item.selectedSize || null,
          selected_color:
            item.selectedColor?.name || item.selectedAgeColor || null,
          selected_age: item.selectedAge || null,
        })),
        delivery_method: deliveryMethod,
        shipping_address:
          deliveryMethod === "store_pickup"
            ? "Retrait en magasin"
            : shippingAddress,
        phone: shippingPhone,
        promo_code: promoCode?.code || null,
        shipping_city:
          deliveryMethod === "store_pickup"
            ? ""
            : useNewAddress
              ? formData.governorate
              : savedAddresses.find((a) => a.id === selectedAddressId)
                  ?.governorate || "",
        shipping_postal_code:
          deliveryMethod === "store_pickup"
            ? ""
            : useNewAddress
              ? formData.postalCode
              : savedAddresses.find((a) => a.id === selectedAddressId)
                  ?.postal_code || "",
      };

      const response = await createOrder(orderData);

      if (useNewAddress && saveNewAddress) {
        try {
          await createAddress({
            label: formData.addressLabel || "Domicile",
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
            governorate: formData.governorate,
            delegation: formData.delegation,
            address: formData.address,
            postal_code: formData.postalCode,
            // Si c'est la 1ère adresse OU si l'utilisateur a coché "Définir comme principale"
            is_default: setAsDefault || savedAddresses.length === 0,
          });
        } catch {
          // On ne bloque pas la confirmation de commande si la sauvegarde échoue
        }
      }

      clearCart();
      navigate(`/order-confirmation/${response.order.id}`);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Une erreur est survenue lors de la création de la commande",
      );
      setLoading(false);
    }
  };

  const freeShippingEnabled = shipping.free_shipping_enabled;
  const freeShippingThreshold =
    parseFloat(shipping.free_shipping_threshold) || 0;
  const shippingCostValue = parseFloat(shipping.shipping_cost) || 0;

  const subtotal = cartTotal;
  const promoDiscount = promoCode?.discount_amount || 0;
  const subtotalAfterPromo = Math.max(0, subtotal - promoDiscount);
  const shippingCost =
    deliveryMethod === "store_pickup"
      ? 0
      : freeShippingEnabled && subtotalAfterPromo >= freeShippingThreshold
        ? 0
        : shippingCostValue;
  const total = subtotalAfterPromo + shippingCost;
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

  if (cart.length === 0) return null;

  return (
    <div
      className="bg-gray-50 min-h-screen py-10 pb-16"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div style={{ maxWidth: 1330, margin: "0 auto", padding: "0 20px" }}>
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[13px] text-gray-400 mb-6">
          <Link to="/" className="hover:text-[#1a5242] transition-colors">
            Accueil
          </Link>
          <ChevronRight size={13} />
          <Link to="/cart" className="hover:text-[#1a5242] transition-colors">
            Panier
          </Link>
          <ChevronRight size={13} />
          <span className="text-[#1a5242] font-semibold">Finalisation</span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between mb-7">
          <p className="text-[22px] font-semibold text-gray-900">
            Finaliser la commande
          </p>
          <Link
            to="/cart"
            className="flex items-center gap-2 text-[13.5px] text-gray-500 font-semibold hover:text-[#1a5242] transition-colors"
          >
            <ArrowLeft size={15} /> Retour au panier
          </Link>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 px-4 py-3.5 rounded-xl mb-6 text-[13.5px] font-medium">
            <AlertCircle size={16} className="flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="checkout-grid gap-6">
          {/* ── Formulaire ── */}
          <div className="co-form">
            <form
              id="checkout-form"
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* Infos personnelles */}
              <FormSection icon={User} title="Informations personnelles">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label required>Prénom</Label>
                    <InputField
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <Label required>Nom</Label>
                    <InputField
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label required>Email</Label>
                    <InputField
                      type="email"
                      name="email"
                      icon={Mail}
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <Label required>Téléphone</Label>
                    <InputField
                      type="tel"
                      name="phone"
                      icon={Phone}
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </FormSection>

              {/* Mode de réception */}
              <FormSection icon={Truck} title="Mode de réception">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Livraison à domicile */}
                  <label
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      deliveryMethod === "delivery"
                        ? "border-[#1a5242] bg-[#1a5242]/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="delivery_method"
                      checked={deliveryMethod === "delivery"}
                      onChange={() => setDeliveryMethod("delivery")}
                      className="mt-1 accent-[#1a5242]"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Truck size={15} className="text-[#1a5242]" />
                        <span className="text-[13.5px] font-bold text-gray-800">
                          Livraison à domicile
                        </span>
                      </div>
                      <p className="text-[12.5px] text-gray-500">
                        {freeShippingEnabled &&
                        subtotalAfterPromo >= freeShippingThreshold
                          ? "Gratuite"
                          : `${shippingCostValue.toFixed(3)} DT`}
                      </p>
                    </div>
                  </label>

                  {/* Retrait magasin */}
                  <label
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      deliveryMethod === "store_pickup"
                        ? "border-[#1a5242] bg-[#1a5242]/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="delivery_method"
                      checked={deliveryMethod === "store_pickup"}
                      onChange={() => setDeliveryMethod("store_pickup")}
                      className="mt-1 accent-[#1a5242]"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Home size={15} className="text-[#1a5242]" />
                        <span className="text-[13.5px] font-bold text-gray-800">
                          Retrait en magasin
                        </span>
                      </div>
                      <p className="text-[12.5px] text-emerald-600 font-semibold">
                        Gratuit
                      </p>
                    </div>
                  </label>
                </div>
              </FormSection>

              {/* Adresse de livraison — UNIQUEMENT si livraison à domicile */}
              {deliveryMethod === "delivery" && (
                <FormSection icon={MapPin} title="Adresse de livraison">
                  {loadingAddresses ? (
                    <div className="flex items-center gap-2 text-[13px] text-gray-400 py-4">
                      <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      Chargement des adresses...
                    </div>
                  ) : (
                    <>
                      {/* Adresses sauvegardées */}
                      {savedAddresses.length > 0 && (
                        <div className="space-y-3 mb-5">
                          <p className="text-[13px] font-semibold text-gray-600 mb-3">
                            Choisir une adresse enregistrée :
                          </p>
                          {savedAddresses.map((addr) => (
                            <label
                              key={addr.id}
                              className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                selectedAddressId === addr.id && !useNewAddress
                                  ? "border-[#1a5242] bg-[#1a5242]/5"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <input
                                type="radio"
                                name="address_choice"
                                checked={
                                  selectedAddressId === addr.id &&
                                  !useNewAddress
                                }
                                onChange={() => {
                                  setSelectedAddressId(addr.id);
                                  setUseNewAddress(false);
                                }}
                                className="mt-1 accent-[#1a5242]"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Home size={13} className="text-[#1a5242]" />
                                  <span className="text-[13px] font-bold text-gray-800">
                                    {addr.label}
                                  </span>
                                  {addr.is_default && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                                      Par défaut
                                    </span>
                                  )}
                                </div>
                                <p className="text-[13px] text-gray-700 font-semibold">
                                  {addr.first_name} {addr.last_name}
                                </p>
                                <p className="text-[12.5px] text-gray-500 mt-0.5">
                                  {addr.address}, {addr.delegation},{" "}
                                  {addr.governorate}
                                  {addr.postal_code && ` — ${addr.postal_code}`}
                                </p>
                                <p className="text-[12.5px] text-gray-500">
                                  {addr.phone}
                                </p>
                              </div>
                            </label>
                          ))}

                          {/* Option nouvelle adresse */}
                          <label
                            className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              useNewAddress
                                ? "border-[#1a5242] bg-[#1a5242]/5"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <input
                              type="radio"
                              name="address_choice"
                              checked={useNewAddress}
                              onChange={() => {
                                setUseNewAddress(true);
                                setSelectedAddressId(null);
                              }}
                              className="accent-[#1a5242]"
                            />
                            <Plus size={15} className="text-[#1a5242]" />
                            <span className="text-[13px] font-semibold text-gray-700">
                              Utiliser une nouvelle adresse
                            </span>
                          </label>
                        </div>
                      )}

                      {/* Formulaire nouvelle adresse */}
                      {(useNewAddress || savedAddresses.length === 0) && (
                        <div className="space-y-4">
                          {/* Type d'adresse */}
                          <div>
                            <Label>Type d'adresse</Label>
                            <div className="grid grid-cols-3 gap-2 mt-1.5">
                              {[
                                {
                                  value: "Domicile",
                                  label: "Domicile",
                                  icon: Home,
                                },
                                {
                                  value: "Bureau",
                                  label: "Bureau",
                                  icon: Briefcase,
                                },
                                {
                                  value: "Autre",
                                  label: "Autre",
                                  icon: MapPin,
                                },
                              ].map(({ value, label, icon: Icon }) => (
                                <button
                                  key={value}
                                  type="button"
                                  onClick={() =>
                                    setFormData((p) => ({
                                      ...p,
                                      addressLabel: value,
                                    }))
                                  }
                                  className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border-2 transition-all ${
                                    (formData.addressLabel || "Domicile") ===
                                    value
                                      ? "border-[#1a5242] bg-[#1a5242]/5"
                                      : "border-gray-200 hover:border-gray-300"
                                  }`}
                                >
                                  <Icon
                                    size={16}
                                    className={
                                      (formData.addressLabel || "Domicile") ===
                                      value
                                        ? "text-[#1a5242]"
                                        : "text-gray-400"
                                    }
                                  />
                                  <span
                                    className={`text-[12px] font-semibold ${
                                      (formData.addressLabel || "Domicile") ===
                                      value
                                        ? "text-[#1a5242]"
                                        : "text-gray-600"
                                    }`}
                                  >
                                    {label}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Gouvernorat */}
                          <div>
                            <Label required>Gouvernorat</Label>
                            <SelectField
                              icon={MapPin}
                              name="governorate"
                              value={formData.governorate}
                              onChange={handleChange}
                              required
                            >
                              <option value="">
                                Sélectionner un gouvernorat...
                              </option>
                              {GOVERNORATES.map((g) => (
                                <option key={g} value={g}>
                                  {g}
                                </option>
                              ))}
                            </SelectField>
                          </div>

                          {/* Délégation */}
                          <div>
                            <Label required>Délégation</Label>
                            <SelectField
                              name="delegation"
                              value={formData.delegation}
                              onChange={handleChange}
                              required
                              disabled={!formData.governorate}
                            >
                              <option value="">
                                {formData.governorate
                                  ? "Sélectionner une délégation..."
                                  : "Choisissez d'abord un gouvernorat"}
                              </option>
                              {delegations.map((d) => (
                                <option key={d} value={d}>
                                  {d}
                                </option>
                              ))}
                            </SelectField>
                          </div>

                          {/* Adresse complète */}
                          <div>
                            <Label required>Adresse complète</Label>
                            <InputField
                              type="text"
                              name="address"
                              value={formData.address}
                              onChange={handleChange}
                              placeholder="N° rue, nom de la rue, appartement..."
                              required
                            />
                          </div>

                          {/* Code postal */}
                          <div>
                            <Label>Code postal</Label>
                            <InputField
                              type="text"
                              name="postalCode"
                              value={formData.postalCode}
                              onChange={handleChange}
                              placeholder="Ex: 1000"
                            />
                          </div>

                          {/* Sauvegarder l'adresse + Définir comme principale */}
                          <div className="space-y-3 mt-2 p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <label className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={saveNewAddress}
                                onChange={(e) => {
                                  setSaveNewAddress(e.target.checked);
                                  if (!e.target.checked) setSetAsDefault(false);
                                }}
                                className="w-4 h-4 mt-0.5 accent-[#1a5242] flex-shrink-0"
                              />
                              <div>
                                <span className="text-[13.5px] font-semibold text-gray-800 block">
                                  Sauvegarder cette adresse dans mon compte
                                </span>
                                <span className="text-[11.5px] text-gray-500 mt-0.5 block">
                                  Elle sera disponible pour vos prochaines
                                  commandes
                                </span>
                              </div>
                            </label>

                            {saveNewAddress && (
                              <label className="flex items-start gap-3 cursor-pointer pt-3 border-t border-gray-200">
                                <input
                                  type="checkbox"
                                  checked={setAsDefault}
                                  onChange={(e) =>
                                    setSetAsDefault(e.target.checked)
                                  }
                                  className="w-4 h-4 mt-0.5 accent-[#1a5242] flex-shrink-0"
                                />
                                <div>
                                  <span className="text-[13.5px] font-semibold text-gray-800 block">
                                    Définir comme adresse principale
                                  </span>
                                  <span className="text-[11.5px] text-gray-500 mt-0.5 block">
                                    Elle sera sélectionnée automatiquement à
                                    l'avenir
                                  </span>
                                </div>
                              </label>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </FormSection>
              )}
            </form>
          </div>

          {/* ── Résumé ── */}
          <div className="co-summary">
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <p className="text-[16px] font-bold text-gray-900 mb-5 pb-4 border-b border-gray-100">
                Récapitulatif de la commande
              </p>
              <div className="space-y-3 mb-5">
                {cart.map((item) => {
                  const price = parseFloat(item.price) || 0;
                  const promoPrice = parseFloat(item.promo_price) || 0;
                  const hasPromo = promoPrice > 0 && promoPrice < price;
                  const display = hasPromo ? promoPrice : price;
                  return (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <div className="w-14 h-14 rounded-xl border border-gray-100 overflow-hidden bg-gray-50">
                          <img
                            src={`${STORAGE_URL}/${item.image}`}
                            alt={item.name}
                            className="w-full h-full object-contain p-1"
                          />
                        </div>
                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#1a5242] text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-semibold text-gray-800 leading-snug truncate">
                          {item.name}
                        </p>
                        {item.selectedSize && (
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            Taille :{" "}
                            <span className="font-semibold text-gray-600">
                              {item.selectedSize}
                            </span>
                          </p>
                        )}
                        {item.selectedColor && (
                          <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                            Couleur :{" "}
                            <span
                              className="w-3 h-3 rounded-full inline-block border border-gray-200"
                              style={{
                                backgroundColor: item.selectedColor.hex,
                              }}
                            />
                            <span className="font-semibold text-gray-600">
                              {item.selectedColor.name}
                            </span>
                          </p>
                        )}
                        {item.selectedAge && (
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            Âge :{" "}
                            <span className="font-semibold text-gray-600">
                              {item.selectedAge}
                              {item.selectedAgeColor &&
                                ` — ${item.selectedAgeColor}`}
                            </span>
                          </p>
                        )}
                      </div>
                      <span className="text-[13px] font-bold text-[#1a5242] flex-shrink-0">
                        {(display * item.quantity).toFixed(3)} DT
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="h-px bg-gray-100 mb-4" />
              <div className="space-y-2.5 mb-4">
                <div className="flex justify-between text-[13.5px] text-gray-500">
                  <span>
                    Sous-total ({totalItems} article{totalItems > 1 ? "s" : ""})
                  </span>
                  <span className="font-semibold text-gray-700">
                    {subtotal.toFixed(3)} DT
                  </span>
                </div>
                {promoCode && (
                  <div className="flex justify-between text-[13.5px] text-emerald-600">
                    <span>
                      Code promo ({promoCode.code} — -
                      {promoCode.discount_percentage}%)
                    </span>
                    <span className="font-semibold">
                      -{promoDiscount.toFixed(3)} DT
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-[13.5px] text-gray-500">
                  <span>Livraison</span>
                  <span
                    className={`font-semibold ${shippingCost === 0 ? "text-emerald-600" : "text-gray-700"}`}
                  >
                    {shippingCost === 0
                      ? "Gratuite"
                      : `${shippingCost.toFixed(3)} DT`}
                  </span>
                </div>
                {freeShippingEnabled && shippingCost > 0 && (
                  <div
                    className="flex items-center justify-center gap-1.5 text-[12px] font-medium px-3 py-2 rounded-lg"
                    style={{ background: "#FFF3B0", color: "#355847" }}
                  >
                    <Gift size={13} />
                    Plus que{" "}
                    {(freeShippingThreshold - subtotalAfterPromo).toFixed(3)} DT
                    pour la livraison gratuite !
                  </div>
                )}
              </div>

              {/* Rappel code promo */}
              <div className="mb-4">
                {promoCode ? (
                  <div className="flex items-center justify-between gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5">
                    <div className="flex items-center gap-2">
                      <Check
                        size={14}
                        className="text-emerald-600 flex-shrink-0"
                      />
                      <span className="text-[12.5px] font-semibold text-emerald-700">
                        {promoCode.code} appliqué (-
                        {promoCode.discount_percentage}%)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={removePromoCode}
                      className="text-emerald-600 hover:text-emerald-800 flex-shrink-0"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
                      <Tag size={13} className="text-gray-400 flex-shrink-0" />
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => {
                          setPromoInput(e.target.value.toUpperCase());
                          setPromoError("");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleApplyPromo();
                          }
                        }}
                        placeholder="Vous avez un code promo ?"
                        className="flex-1 bg-transparent border-none outline-none text-[12.5px] text-gray-700 py-1.5"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromo}
                        disabled={promoChecking || !promoInput.trim()}
                        className="flex items-center gap-1.5 text-[12px] font-bold text-[#1a5242] hover:opacity-70 transition-opacity disabled:opacity-40 flex-shrink-0"
                      >
                        {promoChecking && (
                          <Loader2 size={12} className="animate-spin" />
                        )}
                        Appliquer
                      </button>
                    </div>
                    {promoError && (
                      <p className="text-[11.5px] text-red-500 font-medium mt-1.5">
                        {promoError}
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="h-px bg-gray-100 mb-4" />
              <div className="flex justify-between items-center mb-5">
                <span className="text-[15px] font-bold text-gray-900">
                  Total à payer
                </span>
                <span className="text-[17px] font-extrabold text-[#1a5242]">
                  {total.toFixed(3)} DT
                </span>
              </div>
              <div className="flex items-center justify-center gap-2 bg-[#1a5242]/10 border border-[#1a5242]/20 text-[#1a5242] text-[13px] font-semibold py-3 rounded-xl">
                <Banknote size={16} />
                Paiement en espèces à la livraison
              </div>
            </div>
          </div>

          {/* ── Bouton submit ── */}
          <div className="co-submit flex justify-center px-1 sm:px-0 py-2 sm:py-0">
            <button
              type="submit"
              form="checkout-form"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 sm:py-3.5 rounded-2xl sm:rounded-xl font-bold text-[15px] sm:text-[14px] text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] hover:opacity-90 w-full sm:w-auto max-w-[420px] sm:max-w-none"
              style={{
                background: "linear-gradient(135deg, #1a5242 0%, #2d7a5f 100%)",
                boxShadow: "0 6px 20px rgba(26,82,66,0.35)",
              }}
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <CheckCircle size={19} />
                  Confirmer la commande
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .checkout-grid {
          display: grid;
          align-items: start;
          grid-template-columns: 1fr;
          grid-template-areas:
            "form"
            "summary"
            "submit";
        }
       .co-form { grid-area: form; min-width: 0; }
        .co-summary { grid-area: summary; min-width: 0; }
        .co-submit { grid-area: submit; min-width: 0; }
        .checkout-grid { min-width: 0; }

        @media (min-width: 1024px) {
          .checkout-grid {
            grid-template-columns: 1fr 400px;
            grid-template-areas:
              "form summary"
              "submit summary";
          }
        }
      `}</style>
    </div>
  );
}
