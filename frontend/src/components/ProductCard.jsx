import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, Bell, X, CheckCircle2 } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import CartNotification from "./CartNotification";
import { STORAGE_URL } from "../config/api";
import api from "../services/api";

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const [showNotification, setShowNotification] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyForm, setNotifyForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    quantity: 1,
  });
  const [notifySubmitting, setNotifySubmitting] = useState(false);
  const [notifyError, setNotifyError] = useState("");
  const [notifySuccess, setNotifySuccess] = useState(false);

  const isFavorite = isInWishlist(product.id);

  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem("auth_token");
    if (!token) {
      navigate("/login");
      return;
    }

    if (isFavorite) {
      await removeFromWishlist(product.id);
    } else {
      await addToWishlist(product.id);
    }
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.has_sizes || product.has_colors || product.has_age) {
      navigate(`/products/${product.slug}`);
      return;
    }

    if (product.stock > 0) {
      addToCart(product);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
    }
  };

  const handleNotifyClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem("auth_token");
    if (!token) {
      sessionStorage.setItem("pending_notify_product_id", String(product.id));
      sessionStorage.setItem(
        "redirect_after_login",
        `/products/${product.slug}`,
      );
      navigate("/login");
      return;
    }

    let base = { first_name: "", last_name: "", phone: "" };
    try {
      const u = JSON.parse(localStorage.getItem("user") || "null");
      base = {
        first_name: u?.first_name || u?.name?.split(" ")[0] || "",
        last_name: u?.last_name || u?.name?.split(" ").slice(1).join(" ") || "",
        phone: u?.phone || "",
      };
    } catch {}

    setNotifyForm({ ...base, quantity: 1 });
    setNotifySuccess(false);
    setNotifyError("");
    setNotifyOpen(true);
  };

  const handleNotifySubmit = async () => {
    setNotifyError("");
    if (!notifyForm.first_name.trim() || !notifyForm.last_name.trim()) {
      setNotifyError("Le prénom et le nom sont obligatoires.");
      return;
    }
    if (!notifyForm.phone.trim()) {
      setNotifyError("Le numéro de téléphone est obligatoire.");
      return;
    }
    setNotifySubmitting(true);
    try {
      await api.post(`/products/${product.id}/notify`, notifyForm);
      setNotifySuccess(true);
    } catch (err) {
      setNotifyError(err.response?.data?.message || "Une erreur est survenue.");
    } finally {
      setNotifySubmitting(false);
    }
  };

  const handleMouseEnter = () => {
    const cached = sessionStorage.getItem(`product_${product.slug}_time`);
    if (cached && Date.now() - parseInt(cached) < 30000) {
      return;
    }

    api
      .get(`/products/${product.slug}`)
      .then((res) => {
        sessionStorage.setItem(
          `product_${product.slug}`,
          JSON.stringify(res.data),
        );
        sessionStorage.setItem(`product_${product.slug}_time`, Date.now());
      })
      .catch(() => {});
  };

  const discountPercentage = product.promo_price
    ? Math.round(((product.price - product.promo_price) / product.price) * 100)
    : product.discount_percentage;

  return (
    <>
      <div
        onMouseEnter={handleMouseEnter}
        className="relative bg-white border border-gray-200 md:border-[#e8e8e8] rounded-xl md:rounded-lg overflow-hidden flex flex-col transition-all duration-300 hover:border-[#1a5242] hover:shadow-md group"
      >
        {/* Badges */}
        {product.is_promo && discountPercentage && (
          <div className="absolute top-2 left-2 md:top-3 md:left-3 z-[2] px-2 py-0.5 md:px-2.5 md:py-1 rounded-md text-[11px] md:text-[0.75rem] font-bold uppercase tracking-wide text-white bg-[#e63946]">
            -{discountPercentage}%
          </div>
        )}

        {(product.stock === 0 || product.is_unavailable) && (
          <div className="absolute top-2 left-2 md:top-3 md:left-3 z-[2] px-2 py-0.5 md:px-2.5 md:py-1 rounded-md text-[11px] md:text-[0.75rem] font-bold uppercase tracking-wide text-white bg-[#666666]">
            Rupture
          </div>
        )}

        {/* Favoris */}
        <button
          onClick={handleFavoriteClick}
          aria-label="Ajouter aux favoris"
          className={`absolute top-2 right-2 md:top-3 md:right-3 z-[2] w-7 h-7 md:w-9 md:h-9 rounded-full flex items-center justify-center transition-all shadow-sm hover:scale-110 ${
            isFavorite ? "bg-[#ffe5e8]" : "bg-white"
          }`}
        >
          <Heart
            size={15}
            className="md:hidden"
            fill={isFavorite ? "#e63946" : "none"}
            stroke={isFavorite ? "#e63946" : "#666"}
          />
          <Heart
            size={20}
            className="hidden md:block"
            fill={isFavorite ? "#e63946" : "none"}
            stroke={isFavorite ? "#e63946" : "#666"}
          />
        </button>

        {/* Image */}
        <Link
          to={`/products/${product.slug}`}
          className="relative block w-full overflow-hidden bg-[#f9f9f9]"
          style={{ paddingTop: "90%" }}
        >
          <img
            src={
              product.image
                ? `${STORAGE_URL}/${product.image}`
                : "/images/placeholder-product.png"
            }
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>

        {/* Infos */}
        <div className="flex flex-col flex-1 items-center text-center gap-1 md:gap-1.5 p-2.5 md:p-3">
          {product.brand && (
            <p className="text-[10px] md:text-[0.75rem] font-semibold uppercase tracking-wide text-[#1a5242] m-0">
              {product.brand.parent?.name || product.brand.name}
            </p>
          )}

          <Link
            to={`/products/${product.slug}`}
            className="text-[12.5px] md:text-[0.85rem] font-medium text-[#1a1a1a] leading-snug hover:text-[#1a5242] transition-colors no-underline"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              minHeight: "2.4em",
            }}
          >
            {product.name}
          </Link>

          <div className="flex items-center justify-center gap-1.5 md:gap-2 w-full flex-wrap">
            {product.promo_price ? (
              <>
                <span className="text-[13.5px] md:text-[1rem] font-bold text-[#e63946]">
                  {parseFloat(product.promo_price).toFixed(3).replace(".", ",")}{" "}
                  DT
                </span>
                <span className="text-[11px] md:text-[0.9rem] font-normal text-gray-400 line-through">
                  {parseFloat(product.price).toFixed(3).replace(".", ",")} DT
                </span>
              </>
            ) : (
              <span className="text-[13.5px] md:text-[1rem] font-bold text-[#1a1a1a]">
                {parseFloat(product.price).toFixed(3).replace(".", ",")} DT
              </span>
            )}
          </div>

          {product.stock === 0 || product.is_unavailable ? (
            <button
              onClick={handleNotifyClick}
              className="w-full md:w-[90%] md:max-w-[200px] mt-1.5 md:mt-3 py-2 md:py-2.5 rounded-lg font-semibold text-[12px] md:text-[0.85rem] flex items-center justify-center gap-1.5 md:gap-2 transition-all hover:-translate-y-0.5 border-2"
              style={{
                background: "#FEF3C7",
                borderColor: "#FDE68A",
                color: "#92400E",
              }}
            >
              <Bell size={15} className="md:hidden animate-bell-ring" />
              <Bell size={18} className="hidden md:block animate-bell-ring" />
              M'avertir
            </button>
          ) : (
            <button
              onClick={handleAddToCart}
              className="w-full md:w-[90%] md:max-w-[200px] mt-1.5 md:mt-3 py-2 md:py-2.5 rounded-lg text-white font-semibold text-[12px] md:text-[0.85rem] flex items-center justify-center gap-1.5 md:gap-2 transition-all hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #34926f 0%, #4aab88 100%)",
              }}
            >
              {product.has_sizes || product.has_colors || product.has_age ? (
                <>Voir les détails</>
              ) : (
                <>
                  <ShoppingCart size={15} className="md:hidden" />
                  <ShoppingCart size={18} className="hidden md:block" />
                  Ajouter
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {notifyOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)" }}
          onClick={(e) => {
            e.stopPropagation();
            setNotifyOpen(false);
          }}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {notifySuccess ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={28} className="text-emerald-500" />
                </div>
                <p className="text-[15px] font-bold text-gray-900 mb-2">
                  C'est noté !
                </p>
                <p className="text-[13.5px] text-gray-500 mb-5">
                  Nous vous contacterons dès que ce produit sera de nouveau
                  disponible.
                </p>
                <button
                  onClick={() => setNotifyOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-[#1a5242] text-white text-[13.5px] font-semibold hover:opacity-90"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                      <Bell size={16} className="text-amber-600" />
                    </div>
                    <p className="text-[15px] font-bold text-gray-900">
                      Me notifier
                    </p>
                  </div>
                  <button
                    onClick={() => setNotifyOpen(false)}
                    className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
                <p className="text-[13px] text-gray-500 mb-4">
                  Laissez vos coordonnées, nous vous appellerons dès que "
                  {product.name}" sera de nouveau en stock.
                </p>
                {notifyError && (
                  <p className="text-red-500 text-[12.5px] mb-3">
                    {notifyError}
                  </p>
                )}
                <div className="space-y-3 mb-4">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Prénom"
                      value={notifyForm.first_name}
                      onChange={(e) =>
                        setNotifyForm((f) => ({
                          ...f,
                          first_name: e.target.value,
                        }))
                      }
                      className="h-10 px-3 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-[#1a5242]"
                    />
                    <input
                      type="text"
                      placeholder="Nom"
                      value={notifyForm.last_name}
                      onChange={(e) =>
                        setNotifyForm((f) => ({
                          ...f,
                          last_name: e.target.value,
                        }))
                      }
                      className="h-10 px-3 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-[#1a5242]"
                    />
                  </div>
                  <input
                    type="tel"
                    placeholder="Numéro de téléphone"
                    value={notifyForm.phone}
                    onChange={(e) =>
                      setNotifyForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    className="w-full h-10 px-3 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-[#1a5242]"
                  />
                  <div>
                    <label className="block text-[11.5px] font-semibold text-gray-500 mb-1">
                      Quantité souhaitée
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={notifyForm.quantity}
                      onChange={(e) =>
                        setNotifyForm((f) => ({
                          ...f,
                          quantity: Math.max(
                            1,
                            parseInt(e.target.value, 10) || 1,
                          ),
                        }))
                      }
                      className="w-full h-10 px-3 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-[#1a5242]"
                    />
                  </div>
                </div>
                <button
                  onClick={handleNotifySubmit}
                  disabled={notifySubmitting}
                  className="w-full py-2.5 rounded-xl bg-[#1a5242] text-white text-[13.5px] font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {notifySubmitting
                    ? "Envoi..."
                    : "M'avertir dès disponibilité"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <CartNotification
        product={product}
        quantity={1}
        isVisible={showNotification}
        onClose={() => setShowNotification(false)}
      />
      <style>{`
        @keyframes bellRing {
          0%, 100% { transform: rotate(0deg); }
          10% { transform: rotate(14deg); }
          20% { transform: rotate(-12deg); }
          30% { transform: rotate(10deg); }
          40% { transform: rotate(-8deg); }
          50% { transform: rotate(4deg); }
          60% { transform: rotate(0deg); }
        }
        .animate-bell-ring {
          animation: bellRing 1.8s ease-in-out infinite;
          transform-origin: top center;
        }
      `}</style>
    </>
  );
};

export default ProductCard;
