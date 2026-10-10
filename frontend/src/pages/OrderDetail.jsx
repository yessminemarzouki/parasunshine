import { useState, useEffect } from "react";
import { STORAGE_URL } from "../config/api";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  ArrowLeft,
  MapPin,
  Phone,
  CreditCard,
  ChevronRight,
  Home,
  Store,
} from "lucide-react";
import { getOrder } from "../services/api";

const STATUS_MAP = {
  pending: {
    label: "En attente",
    icon: Clock,
    color: "#f59e0b",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    desc: "Votre commande est en cours de traitement",
  },
  processing: {
    label: "En préparation",
    icon: Package,
    color: "#3b82f6",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    desc: "Votre commande est en cours de préparation",
  },
  shipped: {
    label: "Expédiée",
    icon: Truck,
    color: "#8b5cf6",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    desc: "Votre commande a été expédiée",
  },
  delivered: {
    label: "Livrée",
    icon: CheckCircle,
    color: "#10b981",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    desc: "Votre commande a été livrée avec succès",
  },
  cancelled: {
    label: "Annulée",
    icon: XCircle,
    color: "#ef4444",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    desc: "Cette commande a été annulée",
  },
};

const STEP_ORDER = ["pending", "processing", "shipped", "delivered"];

export default function OrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem("auth_token")) {
      navigate("/login");
      return;
    }
    fetchOrder();
  }, [orderId, navigate]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await getOrder(orderId);
      setOrder(res.order);
    } catch {
      setError("Impossible de charger les détails de la commande");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div
          className="w-10 h-10 rounded-full animate-spin"
          style={{ border: "3px solid #e5e7eb", borderTopColor: "#1a5242" }}
        />
        <p className="text-gray-400 text-[14px]">Chargement des détails...</p>
      </div>
    );

  if (error || !order)
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <XCircle size={56} className="text-red-400" />
        <p className="text-[18px] font-semibold text-gray-700">
          {error || "Commande introuvable"}
        </p>
        <Link
          to="/account"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-[13.5px] hover:opacity-90 transition-opacity"
          style={{ background: "#1a5242" }}
        >
          <ArrowLeft size={15} />
          Retour à mon compte
        </Link>
      </div>
    );

  const isStorePickup = order.payment_method === "store_pickup";

  const s = STATUS_MAP[order.status] || STATUS_MAP.pending;
  const StatusIcon = s.icon;
  const currentStepIdx = STEP_ORDER.indexOf(order.status);

  // Étapes dynamiques : le dernier step change selon le mode de réception
  const STEPS = [
    { key: "pending", icon: Clock, label: "En attente" },
    { key: "processing", icon: Package, label: "En préparation" },
    {
      key: "shipped",
      icon: Truck,
      label: isStorePickup ? "Prête" : "Expédiée",
    },
    {
      key: "delivered",
      icon: CheckCircle,
      label: isStorePickup ? "Retirée" : "Livrée",
    },
  ];

  return (
    <div
      className="bg-gray-50 min-h-screen py-8"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[13px] text-gray-400 mb-6 flex-wrap">
          <Link to="/" className="hover:text-[#1a5242] transition-colors">
            Accueil
          </Link>
          <ChevronRight size={13} />
          <Link
            to="/account"
            className="hover:text-[#1a5242] transition-colors"
          >
            Mon compte
          </Link>
          <ChevronRight size={13} />
          <span className="text-[#1a5242] font-semibold">
            Commande #{order.order_number}
          </span>
        </nav>

        {/* Bouton retour */}
        <Link
          to="/account"
          className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-[#1a5242] hover:opacity-70 transition-opacity mb-6"
        >
          <ArrowLeft size={15} />
          Retour à mes commandes
        </Link>

        {/* Header */}
        <div className="bg-white border border-gray-100 rounded-2xl px-4 md:px-6 py-5 flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5 shadow-sm">
          <div>
            <p className="text-[22px] font-bold text-gray-900">
              Commande #{order.order_number}
            </p>
            <p className="text-[13px] text-gray-400 mt-1">
              Passée le{" "}
              {new Date(order.created_at).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[13px] font-bold ${s.bg} ${s.text} ${s.border}`}
          >
            <StatusIcon size={15} />
            {s.label}
          </div>
        </div>

        {/* Status card */}
        <div
          className={`flex items-center gap-4 px-6 py-4 rounded-2xl border mb-5 ${s.bg} ${s.border}`}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/60 flex-shrink-0">
            <StatusIcon size={22} style={{ color: s.color }} />
          </div>
          <div>
            <p className={`text-[15px] font-bold ${s.text}`}>{s.label}</p>
            <p className="text-[13px] text-gray-500">
              {isStorePickup && order.status === "delivered"
                ? "Votre commande a été retirée en magasin"
                : isStorePickup && order.status === "shipped"
                  ? "Votre commande est prête à être retirée en magasin"
                  : s.desc}
            </p>
          </div>
        </div>

        {/* Timeline */}
        {order.status !== "cancelled" && (
          <div className="bg-white border border-gray-100 rounded-2xl px-3 sm:px-8 py-6 mb-6 shadow-sm overflow-x-auto">
            <div className="flex items-center min-w-[420px] sm:min-w-0">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                const done = i <= currentStepIdx;
                const isLast = i === STEPS.length - 1;
                return (
                  <div
                    key={step.key}
                    className="flex items-center flex-1 last:flex-none"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                          done
                            ? "bg-[#1a5242] text-white"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        <Icon size={18} strokeWidth={2} />
                      </div>
                      <span
                        className={`text-[11.5px] font-semibold text-center ${done ? "text-[#1a5242]" : "text-gray-400"}`}
                      >
                        {step.label}
                      </span>
                    </div>
                    {!isLast && (
                      <div
                        className={`flex-1 h-0.5 mx-2 mb-5 rounded-full ${
                          i < currentStepIdx ? "bg-[#1a5242]" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Grid principale */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5 items-start">
          {/* Produits */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 md:p-6 shadow-sm">
            <p className="text-[16px] font-bold text-gray-900 mb-5 pb-4 border-b border-gray-100">
              Produits ({order.items?.length || 0})
            </p>
            <div className="space-y-3">
              {order.items?.length > 0 ? (
                order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100/50 transition-colors"
                  >
                    {/* Image */}
                    <div className="w-20 h-20 rounded-xl bg-white border border-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.product?.image ? (
                        <img
                          src={`${STORAGE_URL}/${item.product.image}`}
                          alt={item.product?.name}
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <Package size={24} className="text-gray-300" />
                      )}
                    </div>
                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/products/${item.product?.slug}`}
                        className="block text-[14px] font-semibold text-gray-800 hover:text-[#1a5242] transition-colors truncate"
                      >
                        {item.product?.name || "Produit"}
                      </Link>
                      {item.product?.brand && (
                        <p className="text-[11.5px] text-gray-400 uppercase tracking-wide mt-0.5">
                          {item.product.brand.name}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5 text-[12.5px] text-gray-500">
                        <span>
                          Qté :{" "}
                          <strong className="text-gray-700">
                            {item.quantity}
                          </strong>
                        </span>
                        <span>·</span>
                        <span>
                          Prix unitaire :{" "}
                          <strong className="text-gray-700">
                            {parseFloat(item.price).toFixed(3)} DT
                          </strong>
                        </span>
                      </div>
                    </div>
                    {/* Total */}
                    <p className="font-extrabold text-[15px] text-[#1a5242] flex-shrink-0">
                      {parseFloat(item.total).toFixed(3)} DT
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-400 text-[14px] py-8">
                  Aucun produit trouvé
                </p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Résumé */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <p className="text-[15px] font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">
                Résumé
              </p>
              <div className="space-y-2.5">
                <div className="flex justify-between text-[13.5px] text-gray-500">
                  <span>Sous-total</span>
                  <span className="font-semibold text-gray-700">
                    {parseFloat(order.subtotal).toFixed(3)} DT
                  </span>
                </div>
                {order.promo_code && (
                  <div className="flex justify-between text-[13.5px] text-emerald-600">
                    <span>
                      Code promo ({order.promo_code}
                      {order.promo_discount_percentage &&
                        ` — -${order.promo_discount_percentage}%`}
                      )
                    </span>
                    <span className="font-semibold">
                      -{parseFloat(order.promo_discount_amount || 0).toFixed(3)}{" "}
                      DT
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-[13.5px] text-gray-500">
                  <span>{isStorePickup ? "Retrait" : "Livraison"}</span>
                  <span
                    className={`font-semibold ${parseFloat(order.shipping_cost) === 0 ? "text-emerald-600" : "text-gray-700"}`}
                  >
                    {isStorePickup
                      ? "Gratuit"
                      : parseFloat(order.shipping_cost) === 0
                        ? "Gratuite"
                        : `${parseFloat(order.shipping_cost).toFixed(3)} DT`}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-100">
                  <span className="text-[15px] font-bold text-gray-900">
                    Total TTC
                  </span>
                  <span className="text-[15px] font-extrabold text-[#1a5242]">
                    {parseFloat(order.total).toFixed(3)} DT
                  </span>
                </div>
              </div>
            </div>

            {/* Adresse ou Retrait magasin */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                {isStorePickup ? (
                  <Store size={15} className="text-[#1a5242]" />
                ) : (
                  <MapPin size={15} className="text-[#1a5242]" />
                )}
                <p className="text-[15px] font-bold text-gray-900">
                  {isStorePickup
                    ? "Retrait en magasin"
                    : "Adresse de livraison"}
                </p>
              </div>

              {isStorePickup ? (
                <div className="space-y-1.5 text-[13.5px] text-gray-600">
                  <p className="font-semibold text-gray-800">
                    Vous viendrez retirer votre commande en magasin
                  </p>
                  <p className="text-gray-500">
                    Vous serez contacté par téléphone dès qu'elle sera prête.
                  </p>
                  <div className="flex items-center gap-1.5 mt-2 text-gray-500">
                    <Phone size={13} />
                    <span>{order.shipping_phone}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 text-[13.5px] text-gray-600">
                  <p className="font-semibold text-gray-800">
                    {order.shipping_address}
                  </p>
                  <p>
                    {order.shipping_city}
                    {order.shipping_postal_code
                      ? `, ${order.shipping_postal_code}`
                      : ""}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2 text-gray-500">
                    <Phone size={13} />
                    <span>{order.shipping_phone}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Paiement */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                <CreditCard size={15} className="text-[#1a5242]" />
                <p className="text-[15px] font-bold text-gray-900">Paiement</p>
              </div>
              <p className="text-[13.5px] text-gray-600 mb-3">
                {isStorePickup
                  ? "Paiement lors du retrait en magasin"
                  : order.payment_method === "cash" ||
                      order.payment_method === "cash_on_delivery"
                    ? "Paiement à la livraison"
                    : order.payment_method === "card"
                      ? "Carte bancaire"
                      : order.payment_method}
              </p>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-bold border ${
                  order.payment_status === "paid"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {order.payment_status === "paid"
                  ? "✓ Payé"
                  : isStorePickup
                    ? "⏳ À régler lors du retrait"
                    : "⏳ En attente"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
