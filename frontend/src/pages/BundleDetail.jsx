import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Zap,
  Heart,
  Plus,
  Eye,
  Star,
  ChevronRight,
  Share2,
  Shield,
  Truck,
  RotateCcw,
  ZoomIn,
  X,
  Gift,
  Tag,
  Bell,
  CheckCircle2,
} from "lucide-react";
import api, {
  getBundle,
  getBundleReviews,
  submitBundleReview,
} from "../services/api";
import { STORAGE_URL } from "../config/api";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import CartNotification from "../components/CartNotification";
import ImageLightbox from "../components/ImageLightbox";
export default function BundleDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addBundleToCart } = useCart();
  const { isBundleInWishlist, addBundleToWishlist, removeBundleFromWishlist } =
    useWishlist();

  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [cartNotif, setCartNotif] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);

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

  useEffect(() => {
    setLoading(true);
    getBundle(slug)
      .then((data) => {
        setBundle(data);
        setSelectedImage(0);

        setReviewsLoading(true);
        getBundleReviews(data.id)
          .then((r) => setReviews(r.reviews || []))
          .catch(() => setReviews([]))
          .finally(() => setReviewsLoading(false));
      })
      .catch(() => navigate("/404"))
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div
          className="w-10 h-10 rounded-full animate-spin"
          style={{ border: "3px solid #e5e7eb", borderTopColor: "#1a5242" }}
        />
      </div>
    );
  }

  if (!bundle) return null;

  const images = [
    ...(bundle.image ? [bundle.image] : []),
    ...(Array.isArray(bundle.images) ? bundle.images : []),
  ];

  const price = parseFloat(bundle.price) || 0;
  const promoPrice = parseFloat(bundle.promo_price) || 0;
  const hasPromo = promoPrice > 0 && promoPrice < price;
  const displayPrice = hasPromo ? promoPrice : price;
  const isUnavailable = bundle.is_available === false;
  const giftValue = parseFloat(bundle.gift_value) || 0;

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addBundleToCart(bundle, 1);
    }
    setCartNotif(true);
    setTimeout(() => setCartNotif(false), 3000);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate("/checkout");
  };

  const handleNotifyClick = () => {
    const token = localStorage.getItem("auth_token");
    let base = { first_name: "", last_name: "", phone: "" };
    if (token) {
      try {
        const u = JSON.parse(localStorage.getItem("user") || "null");
        base = {
          first_name: u?.first_name || u?.name?.split(" ")[0] || "",
          last_name:
            u?.last_name || u?.name?.split(" ").slice(1).join(" ") || "",
          phone: u?.phone || "",
        };
      } catch {}
    }
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
      await api.post(`/bundles/${bundle.id}/notify`, notifyForm);
      setNotifySuccess(true);
    } catch (err) {
      setNotifyError(err.response?.data?.message || "Une erreur est survenue.");
    } finally {
      setNotifySubmitting(false);
    }
  };

  const isFavorite = isBundleInWishlist(bundle.id);

  const handleWishlist = () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      navigate("/login");
      return;
    }
    if (isFavorite) {
      removeBundleFromWishlist(bundle.id);
    } else {
      addBundleToWishlist(bundle.id);
    }
  };

  return (
    <div
      className="bg-gray-50 min-h-screen"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div
        style={{ maxWidth: 1330, margin: "0 auto", padding: "24px 20px 60px" }}
      >
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[13px] text-gray-400 mb-6 flex-wrap">
          <Link to="/" className="hover:text-[#1a5242] transition-colors">
            Accueil
          </Link>
          <ChevronRight size={13} />
          <Link
            to="/coffrets"
            className="hover:text-[#1a5242] transition-colors"
          >
            Nos coffrets
          </Link>
          <ChevronRight size={13} />
          <span className="text-gray-600 font-medium truncate max-w-[420px]">
            {bundle.name}
          </span>
        </nav>

        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 mb-10 items-start">
          {/* ══════════ Colonne gauche ══════════ */}
          <div className="flex flex-col md:pr-10 md:border-r border-gray-200">
            <div
              className="relative w-full overflow-hidden rounded-xl group cursor-zoom-in mb-3"
              onClick={() => setLightboxOpen(true)}
            >
              {images.length > 0 ? (
                <img
                  src={`${STORAGE_URL}/${images[selectedImage]}`}
                  alt={bundle.name}
                  className="w-full h-auto object-contain transition-transform duration-300 group-hover:scale-105 max-h-[320px] md:max-h-[520px]"
                />
              ) : (
                <div
                  className="w-full flex items-center justify-center bg-gray-50 rounded-xl"
                  style={{ minHeight: 440 }}
                >
                  <span className="text-gray-300 text-[13px]">
                    Aucune image
                  </span>
                </div>
              )}

              <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
                <span className="flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-[#1a5242] text-white shadow-sm">
                  <Gift size={12} /> Coffret
                </span>
                {hasPromo && (
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-red-500 text-white shadow-sm">
                    -
                    {bundle.discount_percentage ||
                      Math.round(((price - promoPrice) / price) * 100)}
                    %
                  </span>
                )}
              </div>

              <div className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-white/85 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-sm">
                <ZoomIn size={16} className="text-[#1a5242]" />
              </div>
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 mb-4">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-16 h-16 rounded-lg border-2 overflow-hidden bg-white transition-all flex-shrink-0 ${
                      selectedImage === i
                        ? "border-[#1a5242] shadow-md"
                        : "border-gray-200 hover:border-gray-300 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={`${STORAGE_URL}/${img}`}
                      alt=""
                      className="w-full h-full object-contain p-1"
                    />
                  </button>
                ))}
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
              {bundle.category && (
                <div className="flex items-center gap-2 text-[13px]">
                  <Tag size={13} className="text-gray-400 flex-shrink-0" />
                  <span className="text-gray-500 font-medium">Catégorie :</span>
                  <span className="font-bold text-gray-900">
                    {bundle.category.name}
                  </span>
                </div>
              )}
              {bundle.brand && (
                <div className="flex items-center gap-2 text-[13px]">
                  {bundle.brand.logo ? (
                    <img
                      src={`${STORAGE_URL}/${bundle.brand.logo}`}
                      alt=""
                      className="w-3.5 h-3.5 object-contain flex-shrink-0"
                    />
                  ) : (
                    <Star size={13} className="text-gray-400 flex-shrink-0" />
                  )}
                  <span className="text-gray-500 font-medium">Marque :</span>
                  <span className="font-bold text-gray-900">
                    {bundle.brand.name}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ══════════ Colonne droite ══════════ */}
          <div className="flex flex-col">
            <h1
              className="text-[18px] md:text-[22px] font-semibold text-gray-900 leading-snug mb-3"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {bundle.name}
            </h1>

            <div className="flex items-center gap-3 mb-5 flex-wrap">
              {bundle.rating > 0 && (
                <>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={17}
                        className={
                          s <= Math.round(bundle.rating)
                            ? "text-amber-400 fill-amber-400"
                            : "text-gray-200 fill-gray-200"
                        }
                      />
                    ))}
                  </div>
                  <span className="text-[14px] font-bold text-gray-800">
                    {parseFloat(bundle.rating).toFixed(1)}
                  </span>
                  <span className="text-[13px] text-gray-500">
                    ({bundle.reviews_count || 0} avis)
                  </span>
                </>
              )}
              <button
                onClick={() => setActiveTab("reviews")}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                {bundle.rating > 0 ? (
                  <Eye size={14} className="text-gray-500" />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-white border-2 border-emerald-500 flex items-center justify-center flex-shrink-0">
                    <Plus
                      size={9}
                      className="text-emerald-500"
                      strokeWidth={3}
                    />
                  </div>
                )}
                <span className="text-[12.5px] font-semibold text-gray-700">
                  {bundle.rating > 0 ? "Voir les avis" : "Donnez votre avis"}
                </span>
              </button>
            </div>

            <div className="flex items-baseline gap-3 mb-5">
              <span
                className="text-[21px] md:text-[26px] font-semibold"
                style={{ color: "#3f9973" }}
              >
                {displayPrice.toFixed(3)} DT
              </span>
              {hasPromo && (
                <span className="text-[16px] text-gray-400 line-through font-medium">
                  {price.toFixed(3)} DT
                </span>
              )}
              {hasPromo && (
                <span className="text-[13px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-lg">
                  Économisez {(price - promoPrice).toFixed(3)} DT
                </span>
              )}
            </div>

            {bundle.description && (
              <div
                className="text-[15px] text-gray-600 leading-relaxed border-l-4 pl-4 mb-6"
                style={{ borderColor: "#FDE68A" }}
              >
                {bundle.description}
              </div>
            )}

            {/* Contenu du coffret */}
            <div className="mb-6">
              <div className="space-y-2.5">
                {bundle.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 bg-gray-50 rounded-xl p-2.5"
                  >
                    <div className="w-11 h-11 rounded-lg border border-gray-100 bg-white flex-shrink-0 overflow-hidden">
                      {item.product?.image && (
                        <img
                          src={`${STORAGE_URL}/${item.product.image}`}
                          alt=""
                          className="w-full h-full object-contain p-1"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold text-gray-900 truncate">
                        {item.product?.name || item.custom_name}
                        {item.quantity > 1 && (
                          <span className="text-gray-400 font-normal">
                            {" "}
                            (x{item.quantity})
                          </span>
                        )}
                        {item.is_free && (
                          <span className="text-emerald-600 font-bold">
                            {" "}
                            (offert)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {giftValue > 0 && (
                <div className="mt-3 flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <Gift size={15} className="text-emerald-600 flex-shrink-0" />
                  <p className="text-[12.5px] font-semibold text-emerald-700">
                    Montant gagné : {giftValue.toFixed(3)} DT
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
              <div>
                <p className="text-[11.5px] font-bold text-gray-500 uppercase tracking-wide mb-2">
                  Quantité
                </p>
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden flex-shrink-0">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-11 h-12 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors text-lg font-bold disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  >
                    −
                  </button>
                  <span className="w-12 h-12 flex items-center justify-center text-[15px] font-bold text-gray-800 border-x border-gray-200">
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity((q) => Math.min(bundle.stock || 99, q + 1))
                    }
                    className="w-11 h-12 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors text-lg font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleWishlist}
                  title="Ajouter aux favoris"
                  className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                    isFavorite
                      ? "border-red-300 bg-red-50 text-red-500"
                      : "border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50"
                  }`}
                >
                  <Heart
                    size={19}
                    className={isFavorite ? "fill-red-500" : ""}
                  />
                </button>
              </div>
            </div>

            {isUnavailable ? (
              <button
                onClick={handleNotifyClick}
                className="w-full h-12 flex items-center justify-center gap-2.5 rounded-xl font-bold text-[14px] transition-all hover:opacity-90 active:scale-[0.98] mb-3"
                style={{
                  background: "#FEF3C7",
                  color: "#92400E",
                  border: "2px solid #FDE68A",
                }}
              >
                <Bell size={18} />
                Demander la disponibilité
              </button>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
                <button
                  onClick={handleAddToCart}
                  className="h-12 flex items-center justify-center gap-2 rounded-xl font-bold text-[13.5px] text-white transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{
                    background:
                      "linear-gradient(135deg, #2d7a5f 0%, #3f9973 100%)",
                    boxShadow: "0 4px 12px rgba(45,122,95,0.3)",
                  }}
                >
                  <ShoppingCart size={17} />
                  Ajouter au panier
                </button>
                <button
                  onClick={handleBuyNow}
                  className="h-12 flex items-center justify-center gap-2 rounded-xl font-bold text-[13.5px] transition-all hover:opacity-90 active:scale-[0.98] border-2"
                  style={{
                    background: "#FEF3C7",
                    borderColor: "#FDE68A",
                    color: "#92400E",
                  }}
                >
                  <Zap size={17} />
                  Commander maintenant
                </button>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 md:gap-3 mt-6 pt-4 border-t border-gray-100">
              {[
                { icon: Truck, text: "Livraison 24-48h" },
                { icon: Shield, text: "Produits authentiques" },
                { icon: RotateCcw, text: "Retour 30 jours" },
              ].map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  className="flex flex-col items-center gap-1.5 bg-gray-50 rounded-xl p-2 md:p-3 text-center"
                >
                  <Icon size={18} className="text-[#1a5242]" />
                  <span className="text-[10px] md:text-[11.5px] font-semibold text-gray-600 leading-tight">
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tabs : Description + Avis uniquement ── */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden mb-10">
          <div className="border-b border-gray-100">
            <div className="flex gap-2 md:gap-1 overflow-x-auto px-4 md:px-2 py-3 md:py-0 scrollbar-hide">
              {[
                { key: "description", label: "Description" },
                {
                  key: "reviews",
                  label: `Avis (${bundle.reviews_count || 0})`,
                },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex-shrink-0 whitespace-nowrap transition-all
                    md:px-6 md:py-4 md:rounded-none md:border-b-2 md:border-t-0 md:border-l-0 md:border-r-0 md:-mb-px md:bg-transparent md:text-[13.5px] md:font-semibold
                    px-4 py-2 rounded-full text-[13px] font-bold border-2 ${
                      activeTab === key
                        ? "md:border-[#1a5242] md:text-[#1a5242] bg-[#edf7f3] border-[#1a5242] text-[#1a5242]"
                        : "md:border-transparent md:text-gray-500 md:hover:text-gray-700 bg-white border-gray-200 text-gray-600"
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-7">
            {activeTab === "description" &&
              (bundle.description ? (
                <p className="text-gray-700 leading-relaxed text-[14px]">
                  {bundle.description}
                </p>
              ) : (
                <p className="text-gray-400 text-[14px]">
                  Aucune description disponible.
                </p>
              ))}

            {activeTab === "reviews" && (
              <div>
                {localStorage.getItem("auth_token") ? (
                  <div className="border border-gray-100 rounded-xl p-5 mb-6 bg-gray-50/50">
                    <p className="text-[13.5px] font-bold text-gray-800 mb-3">
                      Laisser un avis
                    </p>
                    {reviewError && (
                      <p className="text-red-500 text-[12.5px] mb-2">
                        {reviewError}
                      </p>
                    )}
                    {reviewSuccess && (
                      <p className="text-emerald-600 text-[12.5px] mb-2">
                        Merci, votre avis a été soumis et sera visible après
                        validation.
                      </p>
                    )}
                    <div className="flex items-center gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() =>
                            setReviewForm((f) => ({ ...f, rating: s }))
                          }
                        >
                          <Star
                            size={20}
                            className={
                              s <= reviewForm.rating
                                ? "text-amber-400 fill-amber-400"
                                : "text-gray-200 fill-gray-200"
                            }
                          />
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={reviewForm.comment}
                      onChange={(e) =>
                        setReviewForm((f) => ({
                          ...f,
                          comment: e.target.value,
                        }))
                      }
                      rows={3}
                      placeholder="Votre avis sur ce coffret..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-[#1a5242] mb-3"
                    />
                    <button
                      onClick={async () => {
                        if (!reviewForm.comment.trim()) {
                          setReviewError("Le commentaire est obligatoire.");
                          return;
                        }
                        setReviewSubmitting(true);
                        setReviewError("");
                        try {
                          await submitBundleReview(bundle.id, {
                            rating: reviewForm.rating,
                            comment: reviewForm.comment,
                          });
                          setReviewSuccess(true);
                          setReviewForm({ rating: 5, comment: "" });
                        } catch (err) {
                          setReviewError(
                            err?.response?.data?.message ||
                              "Erreur lors de l'envoi de votre avis.",
                          );
                        } finally {
                          setReviewSubmitting(false);
                        }
                      }}
                      disabled={reviewSubmitting}
                      className="px-5 py-2 rounded-xl bg-[#1a5242] text-white text-[13px] font-semibold hover:opacity-90 disabled:opacity-50"
                    >
                      {reviewSubmitting ? "Envoi..." : "Envoyer mon avis"}
                    </button>
                  </div>
                ) : (
                  <p className="text-[13px] text-gray-500 mb-6">
                    <Link
                      to="/login"
                      className="text-[#1a5242] font-semibold underline"
                    >
                      Connectez-vous
                    </Link>{" "}
                    pour laisser un avis sur ce coffret.
                  </p>
                )}

                {reviewsLoading ? (
                  <p className="text-gray-400 text-[14px]">
                    Chargement des avis...
                  </p>
                ) : reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div
                        key={review.id}
                        className="border border-gray-100 rounded-xl p-5"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-9 h-9 rounded-full bg-[#1a5242]/10 flex items-center justify-center">
                            <span className="text-[13px] font-bold text-[#1a5242]">
                              {review.customer_name?.[0] || "U"}
                            </span>
                          </div>
                          <div>
                            <p className="text-[13.5px] font-bold text-gray-800">
                              {review.customer_name || "Anonyme"}
                            </p>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  size={12}
                                  className={
                                    s <= review.rating
                                      ? "text-amber-400 fill-amber-400"
                                      : "text-gray-200 fill-gray-200"
                                  }
                                />
                              ))}
                            </div>
                          </div>
                          <span className="ml-auto text-[12px] text-gray-400">
                            {new Date(review.created_at).toLocaleDateString(
                              "fr-FR",
                            )}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-[13.5px] text-gray-600 leading-relaxed">
                            {review.comment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-[14px]">
                    Aucun avis pour ce coffret.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {lightboxOpen && (
          <ImageLightbox
            images={images}
            initialIndex={selectedImage}
            onClose={() => setLightboxOpen(false)}
          />
        )}

        <style>{`
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { scrollbar-width: none; -ms-overflow-style: none; }
        `}</style>

        {notifyOpen && (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(3px)",
            }}
            onClick={() => {
              setNotifyOpen(false);
              setNotifySuccess(false);
              setNotifyError("");
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
                    Nous vous contacterons dès que ce coffret sera de nouveau
                    disponible.
                  </p>
                  <button
                    onClick={() => {
                      setNotifyOpen(false);
                      setNotifySuccess(false);
                    }}
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
                    {bundle.name}" sera de nouveau disponible.
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
          isVisible={cartNotif}
          product={bundle}
          quantity={quantity}
          onClose={() => setCartNotif(false)}
        />
      </div>
    </div>
  );
}
