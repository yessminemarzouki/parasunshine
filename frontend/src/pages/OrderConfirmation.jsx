import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { CheckCircle, Package, Truck, Home, MapPin, Mail } from "lucide-react";
import { getOrder } from "../services/api";

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchOrderDetails();
  }, [orderId, navigate]);

  const fetchOrderDetails = async () => {
    try {
      const response = await getOrder(orderId);
      setOrder(response.order || response);
    } catch (error) {
      console.error(error);
      navigate("/account");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div
          className="w-10 h-10 rounded-full animate-spin"
          style={{ border: "3px solid #e5e7eb", borderTopColor: "#1a5242" }}
        />
        <p className="text-gray-500 text-sm">
          Chargement de votre confirmation...
        </p>
      </div>
    );

  if (!order) return null;

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const steps = [
    { icon: CheckCircle, label: "Confirmée", sub: "Validée", done: true },
    { icon: Package, label: "Préparation", sub: "En cours", done: false },
    { icon: Truck, label: "Livraison", sub: "À venir", done: false },
  ];

  return (
    <div className="bg-gray-50 py-6 md:py-8 px-4 md:px-6">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Bandeau succès */}
        <div
          className="border border-gray-100 rounded-2xl px-6 md:px-10 py-8 md:py-10"
          style={{ background: "#f6f9f7" }}
        >
          <div className="max-w-2xl mx-auto text-center">
            <span
              className="inline-block text-[11px] font-bold uppercase tracking-widest mb-4 px-3 py-1 rounded-full"
              style={{ background: "#FFF3B0", color: "#355847" }}
            >
              Commande validée
            </span>
            <h1 className="text-[1.6rem] md:text-[2rem] font-bold text-gray-900 mb-3 leading-tight">
              Commande confirmée !
            </h1>
            <p className="text-gray-500 text-[14px] md:text-[15px] leading-relaxed">
              Merci pour votre confiance. Votre commande est en cours de
              traitement.
            </p>
          </div>
        </div>

        {/* N° commande + Paiement */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 px-5 md:px-6 py-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-widest mb-1">
                Numéro de commande
              </p>
              <p className="text-lg font-extrabold text-[#1a5242] tracking-tight">
                #{order.order_number || order.id || orderId}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#1a5242]/10 flex items-center justify-center flex-shrink-0">
              <Package size={17} className="text-[#1a5242]" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 px-5 md:px-6 py-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-widest mb-1">
                Mode de paiement
              </p>
              <p className="text-[14px] font-bold text-gray-800">
                {order.payment_method === "cash_on_delivery"
                  ? "Paiement à la livraison"
                  : order.payment_method || "—"}
              </p>
              <span
                className={`inline-flex mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                  order.payment_status === "paid"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {order.payment_status === "paid"
                  ? "Payé"
                  : "En attente de paiement"}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0 text-lg">
              💳
            </div>
          </div>
        </div>

        {/* Étapes suivi */}
        <div className="bg-white rounded-2xl border border-gray-100 px-3 sm:px-8 py-6 shadow-sm overflow-x-auto">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-5">
            Suivi de commande
          </p>
          <div className="flex items-center min-w-[360px] sm:min-w-0">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.label}
                  className="flex items-center flex-1 last:flex-none"
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center ${
                        step.done
                          ? "bg-[#1a5242] text-white"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      <Icon size={19} strokeWidth={2} />
                    </div>
                    <p
                      className={`text-[12px] font-bold ${step.done ? "text-[#1a5242]" : "text-gray-400"}`}
                    >
                      {step.label}
                    </p>
                    <p className="text-[11px] text-gray-400">{step.sub}</p>
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-3 mb-7 rounded-full ${step.done ? "bg-[#1a5242]" : "bg-gray-200"}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Adresse + Email + Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Adresse */}
          <div className="bg-white rounded-2xl border border-gray-100 px-5 md:px-6 py-5 shadow-sm">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#1a5242]/10 flex items-center justify-center">
                <MapPin size={15} className="text-[#1a5242]" />
              </div>
              <p className="text-[13.5px] font-bold text-gray-800">
                Adresse de livraison
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-0.5">
              <p className="text-[13.5px] font-semibold text-gray-800">
                {order.shipping_address}
              </p>
              <p className="text-[13px] text-gray-500">
                {order.shipping_city}
                {order.shipping_postal_code
                  ? `, ${order.shipping_postal_code}`
                  : ""}
              </p>
              {order.shipping_phone && (
                <p className="text-[13px] text-gray-500">
                  Tél : {order.shipping_phone}
                </p>
              )}
            </div>
          </div>

          {/* Email + boutons */}
          <div className="flex flex-col gap-3">
            {user.email && (
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Mail size={15} className="text-blue-600" />
                </div>
                <p className="text-[12.5px] text-blue-700 leading-snug">
                  Un récapitulatif a été envoyé à <strong>{user.email}</strong>
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 mt-auto">
              <Link
                to="/account"
                className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 font-semibold text-[13px] py-3 rounded-xl hover:bg-gray-50 transition-all"
              >
                <Package size={15} /> Mes commandes
              </Link>
              <Link
                to="/"
                className="flex items-center justify-center gap-2 bg-[#1a5242] text-white font-semibold text-[13px] py-3 rounded-xl hover:opacity-90 transition-all"
              >
                <Home size={15} /> Accueil
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
