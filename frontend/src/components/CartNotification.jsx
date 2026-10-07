import { X, ShoppingCart, Truck, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getShippingSettings } from "../services/api";
import { STORAGE_URL } from "../config/api";

const CartNotification = ({ product, quantity, onClose, isVisible }) => {
  const { cart } = useCart();

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

  useEffect(() => {
    if (!isVisible) return;

    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.overflow = "hidden";

    const preventTouch = (e) => e.preventDefault();
    document.addEventListener("touchmove", preventTouch, { passive: false });

    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
      window.scrollTo(0, scrollY);
      document.removeEventListener("touchmove", preventTouch);
    };
  }, [isVisible]);

  // Fermeture au clavier (touche Échap)
  useEffect(() => {
    if (!isVisible) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVisible, onClose]);

  if (!isVisible || !product) return null;

  const originalPrice = parseFloat(product.price) || 0;
  const promoPrice = parseFloat(product.promo_price) || 0;
  const hasPromo = promoPrice > 0 && promoPrice < originalPrice;
  const displayPrice = hasPromo ? promoPrice : originalPrice;
  const savings = hasPromo ? (originalPrice - promoPrice) * quantity : 0;

  const cartTotal = cart.reduce((total, item) => {
    const price = parseFloat(item.price) || 0;
    const itemPromoPrice = parseFloat(item.promo_price) || 0;
    const final =
      itemPromoPrice > 0 && itemPromoPrice < price ? itemPromoPrice : price;
    return total + final * item.quantity;
  }, 0);

  const freeShippingEnabled = shipping.free_shipping_enabled;
  const freeShippingThreshold =
    parseFloat(shipping.free_shipping_threshold) || 0;
  const shippingCostValue = parseFloat(shipping.shipping_cost) || 0;

  const shippingCost =
    freeShippingEnabled && cartTotal >= freeShippingThreshold
      ? 0
      : shippingCostValue;
  const totalTTC = cartTotal + shippingCost;
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
  const remaining = freeShippingEnabled
    ? Math.max(freeShippingThreshold - cartTotal, 0)
    : 0;

  return createPortal(
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-[99998] transition-opacity"
        style={{
          background: "rgba(15, 23, 42, 0.45)",
          backdropFilter: "blur(3px)",
          animation: "fadeInOverlay 0.25s ease",
        }}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Produit ajouté au panier"
        className="fixed top-0 bottom-0 right-0 z-[99999] flex flex-col shadow-2xl w-full sm:w-[460px]"
        style={{
          background: "white",
          fontFamily: "'Inter', sans-serif",
          animation: "slideIn 0.35s cubic-bezier(0.4,0,0.2,1)",
          overscrollBehavior: "none",
          touchAction: "pan-y",
        }}
      >
        <style>{`
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to   { transform: translateX(0);    opacity: 1; }
          }
          @keyframes fadeInOverlay {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          @keyframes popIn {
            0%   { transform: scale(0.85); opacity: 0; }
            60%  { transform: scale(1.05); }
            100% { transform: scale(1);    opacity: 1; }
          }
        `}</style>

        {/* Header */}
        <div
          className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-gray-100 flex-shrink-0"
          style={{ background: "#FEF3C7" }}
        >
          <div
            className="flex items-center gap-2.5"
            style={{ color: "#92400E" }}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "#FDE68A", animation: "popIn 0.4s ease" }}
            >
              <ShoppingCart size={16} />
            </div>
            <div>
              <p className="text-[14px] font-bold leading-tight">
                Ajouté au panier
              </p>
              <p
                className="text-[11px] leading-tight"
                style={{ opacity: 0.75 }}
              >
                {totalItems} article{totalItems > 1 ? "s" : ""} dans votre
                panier
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
            style={{ background: "#FDE68A", color: "#92400E" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Produit ajouté */}
        <div className="px-4 md:px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-4">
            <div className="relative w-20 h-20 flex-shrink-0">
              {hasPromo && (
                <span className="absolute -top-2 -left-2 z-10 text-[10px] font-bold px-2 py-1 rounded-full text-white shadow-sm bg-red-500">
                  -
                  {Math.round(
                    ((originalPrice - promoPrice) / originalPrice) * 100,
                  )}
                  %
                </span>
              )}
              <div className="w-20 h-20 rounded-xl border border-gray-200 bg-white flex items-center justify-center overflow-hidden">
                <img
                  src={`${STORAGE_URL}/${product.image}`}
                  alt={product.name}
                  className="w-full h-full object-contain p-1"
                />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] font-semibold text-gray-900 leading-snug line-clamp-2">
                {product.name}
              </p>
              {product.brand && (
                <p
                  className="text-[11.5px] font-semibold mt-0.5"
                  style={{ color: "#92400E" }}
                >
                  {product.brand.name}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span
                  className="text-[15px] font-extrabold"
                  style={{ color: "#1a5242" }}
                >
                  {displayPrice.toFixed(3)} DT
                </span>
                {hasPromo && (
                  <span className="text-[12px] text-gray-400 line-through">
                    {originalPrice.toFixed(3)} DT
                  </span>
                )}
                <span className="text-[12px] text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full font-medium">
                  Qté : {quantity}
                </span>
              </div>
              {hasPromo && savings > 0 && (
                <p
                  className="text-[11px] font-semibold mt-1"
                  style={{ color: "#92400E" }}
                >
                  Vous économisez {savings.toFixed(3)} DT
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bannière livraison gratuite */}
        {freeShippingEnabled && cartTotal < freeShippingThreshold && (
          <div
            className="mx-4 md:mx-6 mt-4 px-4 py-3 rounded-xl border flex-shrink-0"
            style={{ background: "#FEF3C7", borderColor: "#FDE68A" }}
          >
            <div className="flex items-center gap-2.5">
              <Truck
                size={15}
                style={{ color: "#92400E" }}
                className="flex-shrink-0"
              />
              <div className="flex-1">
                <p
                  className="text-[12.5px] font-medium mb-1.5"
                  style={{ color: "#92400E" }}
                >
                  Plus que <strong>{remaining.toFixed(3)} DT</strong> pour la
                  livraison gratuite !
                </p>
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ background: "#FDE68A" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min((cartTotal / (freeShippingThreshold || 1)) * 100, 100)}%`,
                      background: "#92400E",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        {freeShippingEnabled && cartTotal >= freeShippingThreshold && (
          <div
            className="mx-4 md:mx-6 mt-4 px-4 py-2.5 rounded-xl flex items-center gap-2 border flex-shrink-0"
            style={{ background: "#edf7f3", borderColor: "#a7f3d0" }}
          >
            <Sparkles size={14} className="text-emerald-600" />
            <p className="text-[12.5px] font-semibold text-emerald-700">
              Vous bénéficiez de la livraison gratuite !
            </p>
          </div>
        )}

        {/* Résumé panier */}
        <div className="flex-1 px-4 md:px-6 py-5 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[13px] font-bold text-gray-700">
              Résumé du panier
            </p>
            <span className="text-[12px] text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full font-medium">
              {totalItems} article{totalItems > 1 ? "s" : ""}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-[13.5px] text-gray-500">
              <span>Sous-total</span>
              <span className="font-semibold text-gray-700">
                {cartTotal.toFixed(3)} DT
              </span>
            </div>
            <div className="flex justify-between text-[13.5px] text-gray-500">
              <span>Frais de livraison</span>
              <span
                className={`font-semibold ${shippingCost === 0 ? "text-emerald-600" : "text-gray-700"}`}
              >
                {shippingCost === 0
                  ? "Gratuit"
                  : `${shippingCost.toFixed(3)} DT`}
              </span>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex justify-between items-center">
              <span className="text-[15px] font-bold text-gray-900">
                Total TTC
              </span>
              <span
                className="text-[16px] font-extrabold"
                style={{ color: "#1a5242" }}
              >
                {totalTTC.toFixed(3)} DT
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div
          className="px-4 md:px-6 space-y-3 border-t border-gray-100 pt-4 flex-shrink-0"
          style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}
        >
          <Link
            to="/cart"
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-white font-bold text-[14px] transition-opacity hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #2d7a5f 0%, #3f9973 100%)",
            }}
          >
            Voir mon panier & Commander
            <ArrowRight size={16} />
          </Link>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl border-2 text-[13.5px] font-semibold transition-all hover:bg-gray-50"
            style={{
              borderColor: "#FDE68A",
              color: "#92400E",
              background: "white",
            }}
          >
            Continuer mes achats
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
};

export default CartNotification;
