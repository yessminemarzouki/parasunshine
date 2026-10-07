import { useState } from "react";
import { STORAGE_URL } from "../config/api";
import { Link, useNavigate } from "react-router-dom";
import {
  Heart,
  Trash2,
  ShoppingCart,
  ArrowRight,
  ChevronRight,
  Gift,
  Bell,
  X,
  CheckCircle2,
} from "lucide-react";
import api from "../services/api";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { useNotification } from "../context/NotificationContext";

export default function Wishlist() {
  const navigate = useNavigate();
  const { wishlist, removeFromWishlist, removeBundleFromWishlist, loading } =
    useWishlist();
  const { addToCart, addBundleToCart } = useCart();
  const { showNotification } = useNotification();
  const [removingId, setRemovingId] = useState(null);
  const [notifyProduct, setNotifyProduct] = useState(null);
  const [notifyForm, setNotifyForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    quantity: 1,
  });
  const [notifySubmitting, setNotifySubmitting] = useState(false);
  const [notifyError, setNotifyError] = useState("");
  const [notifySuccess, setNotifySuccess] = useState(false);

  const handleRemove = async (productId) => {
    setRemovingId(productId);
    await removeFromWishlist(productId);
    setRemovingId(null);
  };

  const handleRemoveBundle = async (bundleId) => {
    setRemovingId(`bundle-${bundleId}`);
    await removeBundleFromWishlist(bundleId);
    setRemovingId(null);
  };

  const openNotify = (product) => {
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
    setNotifyProduct(product);
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
      await api.post(`/products/${notifyProduct.id}/notify`, notifyForm);
      setNotifySuccess(true);
    } catch (err) {
      setNotifyError(err.response?.data?.message || "Une erreur est survenue.");
    } finally {
      setNotifySubmitting(false);
    }
  };

  const handleAddToCart = (product) => {
    if (product.stock > 0 && !product.is_unavailable) {
      addToCart(product);
      showNotification(product, 1);
    }
  };

  const handleAddBundleToCart = (bundle) => {
    if (bundle.is_available !== false) {
      addBundleToCart(bundle, 1);
      showNotification(bundle, 1);
    }
  };

  const handleAddAllToCart = () => {
    wishlist.forEach((item) => {
      if (item.product?.stock > 0 && !item.product?.is_unavailable) {
        addToCart(item.product);
      }
      if (item.bundle && item.bundle.is_available !== false) {
        addBundleToCart(item.bundle, 1);
      }
    });
  };

  // ── Loading ──
  if (loading)
    return (
      <div
        style={{ background: "#f9fafb", minHeight: "100vh" }}
        className="flex flex-col items-center justify-center gap-4"
      >
        <div
          className="w-10 h-10 rounded-full animate-spin"
          style={{ border: "3px solid #e5e7eb", borderTopColor: "#1a5242" }}
        />
        <p className="text-gray-400 text-[14px]">
          Chargement de vos favoris...
        </p>
      </div>
    );

  // ── Empty ──
  if (wishlist.length === 0)
    return (
      <div
        style={{ background: "#f9fafb", minHeight: "100vh", paddingTop: 40 }}
      >
        <div
          className="min-h-[60vh] flex flex-col"
          style={{ maxWidth: 1330, margin: "0 auto", padding: "0 20px" }}
        >
          <Breadcrumb />
          <div className="flex-1 flex flex-col items-center justify-center py-20 gap-5">
            <div className="w-24 h-24 rounded-full bg-gray-50 flex items-center justify-center">
              <Heart size={42} strokeWidth={1.2} className="text-gray-300" />
            </div>
            <div className="text-center">
              <h2 className="text-[22px] font-bold text-gray-800 mb-2">
                Votre liste de favoris est vide
              </h2>
              <p className="text-gray-400 text-[14px] max-w-sm">
                Ajoutez vos produits préférés pour les retrouver facilement
              </p>
            </div>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-[14px] text-white transition-all hover:opacity-90 hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #2d7a5f 0%, #3f9973 100%)",
                boxShadow: "0 4px 12px rgba(45,122,95,0.25)",
              }}
            >
              <ShoppingCart size={17} />
              Découvrir nos produits
            </Link>
          </div>
        </div>
      </div>
    );

  return (
    <div
      style={{
        background: "#f9fafb",
        minHeight: "100vh",
        paddingTop: 40,
      }}
    >
      <div
        className="pb-20"
        style={{ maxWidth: 1330, margin: "0 auto", padding: "0 20px" }}
      >
        <Breadcrumb />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <p className="text-[22px] font-semibold text-gray-900">
              Mes Favoris
            </p>
            <span className="text-[13.5px] text-gray-400 font-medium">
              {wishlist.length} élément{wishlist.length > 1 ? "s" : ""}
            </span>
          </div>
          <button
            onClick={handleAddAllToCart}
            className="inline-flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl font-semibold text-[13.5px] text-white transition-all hover:opacity-90 hover:-translate-y-0.5 w-full sm:w-auto"
            style={{
              background: "linear-gradient(135deg, #2d7a5f 0%, #3f9973 100%)",
              boxShadow: "0 4px 12px rgba(45,122,95,0.25)",
            }}
          >
            <ShoppingCart size={16} />
            Tout ajouter au panier
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {wishlist.map((item) => {
            if (item.bundle) {
              return (
                <BundleWishlistCard
                  key={`bundle-${item.bundle.id}`}
                  bundle={item.bundle}
                  removing={removingId === `bundle-${item.bundle.id}`}
                  onRemove={() => handleRemoveBundle(item.bundle.id)}
                  onAddToCart={() => handleAddBundleToCart(item.bundle)}
                />
              );
            }

            const product = item.product;
            if (!product) return null;

            const price = parseFloat(product.price) || 0;
            const promoPrice = parseFloat(product.promo_price) || 0;
            const hasPromo = promoPrice > 0 && promoPrice < price;
            const display = hasPromo ? promoPrice : price;
            const discount = hasPromo
              ? Math.round(((price - promoPrice) / price) * 100)
              : 0;

            return (
              <div
                key={item.id}
                className="relative bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-[#1a5242]/15 group"
              >
                {/* Badge promo */}
                {hasPromo && (
                  <span
                    className="absolute top-3 left-3 z-10 text-white text-[12px] font-bold px-2.5 py-1 rounded-full shadow-sm"
                    style={{ background: "#e63946" }}
                  >
                    -{discount}%
                  </span>
                )}

                {/* Bouton supprimer */}
                <button
                  onClick={() => handleRemove(product.id)}
                  disabled={removingId === product.id}
                  className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all disabled:opacity-40 shadow-sm"
                >
                  {removingId === product.id ? (
                    <span className="w-3.5 h-3.5 border-2 border-gray-300 border-t-red-400 rounded-full animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>

                {/* Image */}
                <Link
                  to={`/products/${product.slug}`}
                  className="relative block bg-[#fafafa] overflow-hidden"
                  style={{ height: 220 }}
                >
                  <img
                    src={
                      product.image
                        ? `${STORAGE_URL}/${product.image}`
                        : "/images/placeholder-product.png"
                    }
                    alt={product.name}
                    loading="lazy"
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105 p-5"
                  />
                </Link>

                {/* Infos */}
                <div className="flex flex-col flex-1 p-4 gap-2 border-t border-gray-50">
                  {product.brand && (
                    <span
                      className="text-[10.5px] uppercase tracking-widest font-bold"
                      style={{ color: "#1a5242" }}
                    >
                      {product.brand.name}
                    </span>
                  )}

                  <Link
                    to={`/products/${product.slug}`}
                    className="text-[14px] font-semibold text-gray-800 leading-snug hover:text-[#1a5242] transition-colors line-clamp-2 min-h-[2.6em]"
                  >
                    {product.name}
                  </Link>

                  {/* Prix */}
                  <div className="flex items-center gap-2.5 mt-0.5">
                    <span
                      className="text-[17px] font-extrabold"
                      style={{ color: "#3f9973" }}
                    >
                      {display.toFixed(3)} DT
                    </span>
                    {hasPromo && (
                      <span className="text-[12.5px] text-gray-400 line-through">
                        {price.toFixed(3)} DT
                      </span>
                    )}
                  </div>

                  {/* Stock */}
                  <div className="flex items-center gap-1.5 text-[12px] font-semibold">
                    {product.stock > 0 && !product.is_unavailable ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                        <span className="text-emerald-600">En stock</span>
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                        <span className="text-red-500">Indisponible</span>
                      </>
                    )}
                  </div>

                  {/* Bouton panier */}
                  {product.stock === 0 || product.is_unavailable ? (
                    <button
                      onClick={() => openNotify(product)}
                      className="mt-auto flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-semibold text-[13.5px] transition-all hover:opacity-90 hover:-translate-y-0.5 border-2"
                      style={{
                        background: "#FEF3C7",
                        borderColor: "#FDE68A",
                        color: "#92400E",
                      }}
                    >
                      <Bell size={15} className="animate-bell-ring" />
                      M'avertir
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="mt-auto flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-semibold text-[13.5px] text-white transition-all hover:opacity-90 hover:-translate-y-0.5"
                      style={{
                        background:
                          "linear-gradient(135deg, #2d7a5f 0%, #3f9973 100%)",
                      }}
                    >
                      <ShoppingCart size={15} />
                      Ajouter au panier
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {notifyProduct && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)" }}
          onClick={() => setNotifyProduct(null)}
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
                  onClick={() => setNotifyProduct(null)}
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
                    onClick={() => setNotifyProduct(null)}
                    className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
                <p className="text-[13px] text-gray-500 mb-4">
                  Laissez vos coordonnées, nous vous appellerons dès que "
                  {notifyProduct.name}" sera de nouveau en stock.
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
    </div>
  );
}

// ── Carte coffret, style aligné sur la carte produit ci-dessus ──
const BundleWishlistCard = ({ bundle, removing, onRemove, onAddToCart }) => {
  const price = parseFloat(bundle.price) || 0;
  const promoPrice = parseFloat(bundle.promo_price) || 0;
  const hasPromo = promoPrice > 0 && promoPrice < price;
  const display = hasPromo ? promoPrice : price;
  const discount = hasPromo
    ? Math.round(((price - promoPrice) / price) * 100)
    : 0;
  const isAvailable = bundle.is_available !== false;

  return (
    <div className="relative bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-[#1a5242]/15 group">
      {/* Badge coffret */}
      <span
        className="absolute top-3 left-3 z-10 flex items-center gap-1.5 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm"
        style={{ background: "#1a5242" }}
      >
        <Gift size={11} /> Coffret
      </span>

      {/* Badge promo */}
      {hasPromo && (
        <span
          className="absolute top-3 left-[90px] z-10 text-white text-[12px] font-bold px-2.5 py-1 rounded-full shadow-sm"
          style={{ background: "#e63946" }}
        >
          -{discount}%
        </span>
      )}

      {/* Bouton supprimer */}
      <button
        onClick={onRemove}
        disabled={removing}
        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all disabled:opacity-40 shadow-sm"
      >
        {removing ? (
          <span className="w-3.5 h-3.5 border-2 border-gray-300 border-t-red-400 rounded-full animate-spin" />
        ) : (
          <Trash2 size={14} />
        )}
      </button>

      {/* Image */}
      <Link
        to={`/coffrets/${bundle.slug}`}
        className="relative block bg-[#fafafa] overflow-hidden"
        style={{ height: 220 }}
      >
        <img
          src={
            bundle.image
              ? `${STORAGE_URL}/${bundle.image}`
              : "/images/placeholder-product.png"
          }
          alt={bundle.name}
          loading="lazy"
          className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105 p-5"
        />
      </Link>

      {/* Infos */}
      <div className="flex flex-col flex-1 p-4 gap-2 border-t border-gray-50">
        {bundle.brand && (
          <span
            className="text-[10.5px] uppercase tracking-widest font-bold"
            style={{ color: "#1a5242" }}
          >
            {bundle.brand.name}
          </span>
        )}

        <Link
          to={`/coffrets/${bundle.slug}`}
          className="text-[14px] font-semibold text-gray-800 leading-snug hover:text-[#1a5242] transition-colors line-clamp-2 min-h-[2.6em]"
        >
          {bundle.name}
        </Link>

        {/* Prix */}
        <div className="flex items-center gap-2.5 mt-0.5">
          <span
            className="text-[17px] font-extrabold"
            style={{ color: "#3f9973" }}
          >
            {display.toFixed(3)} DT
          </span>
          {hasPromo && (
            <span className="text-[12.5px] text-gray-400 line-through">
              {price.toFixed(3)} DT
            </span>
          )}
        </div>

        {/* Disponibilité */}
        <div className="flex items-center gap-1.5 text-[12px] font-semibold">
          {isAvailable ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
              <span className="text-emerald-600">Disponible</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
              <span className="text-red-500">Indisponible</span>
            </>
          )}
        </div>

        {/* Bouton panier */}
        {isAvailable ? (
          <button
            onClick={onAddToCart}
            className="mt-auto flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-semibold text-[13.5px] text-white transition-all hover:opacity-90 hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(135deg, #2d7a5f 0%, #3f9973 100%)",
            }}
          >
            <ShoppingCart size={15} />
            Ajouter au panier
          </button>
        ) : (
          <Link
            to={`/coffrets/${bundle.slug}`}
            className="mt-auto flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-semibold text-[13.5px] transition-all hover:opacity-90 hover:-translate-y-0.5 border-2 no-underline"
            style={{
              background: "#FEF3C7",
              borderColor: "#FDE68A",
              color: "#92400E",
            }}
          >
            <Bell size={15} className="animate-bell-ring" />
            M'avertir
          </Link>
        )}
      </div>
    </div>
  );
};

const Breadcrumb = () => (
  <nav className="flex items-center gap-1.5 mb-6 text-[13px] text-gray-400 flex-wrap">
    <Link to="/" className="hover:text-[#1a5242] transition-colors">
      Accueil
    </Link>
    <ChevronRight size={13} />
    <span className="text-[#1a5242] font-semibold">Mes Favoris</span>
  </nav>
);

// Injecté une seule fois pour toute la page — évite la duplication de
// styles si plusieurs cartes indisponibles sont affichées simultanément.
if (
  typeof document !== "undefined" &&
  !document.getElementById("bell-ring-style")
) {
  const styleEl = document.createElement("style");
  styleEl.id = "bell-ring-style";
  styleEl.textContent = `
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
  `;
  document.head.appendChild(styleEl);
}
