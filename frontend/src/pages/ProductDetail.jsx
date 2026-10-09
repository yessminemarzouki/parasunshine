import { useState, useEffect, useRef } from "react";
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
  ChevronDown,
  ChevronUp,
  ZoomIn,
  Facebook,
  Instagram,
  X,
  CheckCircle2,
  Bell,
  Tag,
  FolderOpen,
} from "lucide-react";
import api, {
  fetchProduct,
  getProductReviews,
  submitReview,
  checkUserReview,
  deleteReview,
} from "../services/api";
import { STORAGE_URL } from "../config/api";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import CartNotification from "../components/CartNotification";
import ImageLightbox from "../components/ImageLightbox";

// ── Petite pastille "sonnette" affichée sous une variante indisponible ──
const NotifyBell = ({ onClick, title }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center hover:bg-amber-200 transition-colors z-10"
  >
    <Bell size={10} className="text-amber-700" />
  </button>
);

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedAge, setSelectedAge] = useState(null);
  const [selectedAgeColor, setSelectedAgeColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [sizeError, setSizeError] = useState(false);
  const [colorError, setColorError] = useState(false);
  const [ageError, setAgeError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [cartNotif, setCartNotif] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [overrideImage, setOverrideImage] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [myReview, setMyReview] = useState(null);

  const [confirmDeleteReview, setConfirmDeleteReview] = useState(false);
  const [deletingReview, setDeletingReview] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [shareToast, setShareToast] = useState("");
  const tabsRef = useRef(null);
  const reviewsSectionRef = useRef(null);
  const tabButtonRefs = useRef({});

  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyForm, setNotifyForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    size: "",
    color: "",
    age: "",
    quantity: 1,
  });
  const [notifyLocked, setNotifyLocked] = useState([]); // champs pré-remplis non modifiables
  const [notifySubmitting, setNotifySubmitting] = useState(false);
  const [notifyError, setNotifyError] = useState("");
  const [notifySuccess, setNotifySuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const resetSelection = () => {
      setSelectedImage(0);
      setSelectedSize(null);
      setSelectedColor(null);
      setSelectedAge(null);
      setSelectedAgeColor(null);
      setSizeError(false);
      setColorError(false);
      setAgeError(false);
      setOverrideImage(null);
    };

    const loadReviews = (productId) => {
      setReviewsLoading(true);
      getProductReviews(productId)
        .then((r) => {
          if (!cancelled) setReviews(r.reviews || r.data || r || []);
        })
        .catch(() => {
          if (!cancelled) setReviews([]);
        })
        .finally(() => {
          if (!cancelled) setReviewsLoading(false);
        });

      if (localStorage.getItem("auth_token")) {
        checkUserReview(productId)
          .then((r) => {
            if (!cancelled) setMyReview(r.has_review ? r.review : null);
          })
          .catch(() => {
            if (!cancelled) setMyReview(null);
          });
      }
    };

    // Hydratation instantanée : si l'utilisateur a survolé ce produit dans
    // une liste (Home, ProductList...) juste avant de cliquer, ProductCard
    // a déjà pré-chargé sa fiche complète en session — on l'affiche
    // immédiatement, sans spinner, pendant que le cache mémoire se
    // rafraîchit en arrière-plan pour la prochaine visite.
    let hydrated = false;
    const cachedRaw = sessionStorage.getItem(`product_${slug}`);
    const cachedTime = sessionStorage.getItem(`product_${slug}_time`);
    if (
      cachedRaw &&
      cachedTime &&
      Date.now() - parseInt(cachedTime, 10) < 30000
    ) {
      try {
        const p = JSON.parse(cachedRaw);
        if (p && p.slug === slug) {
          setProduct(p);
          resetSelection();
          setLoading(false);
          loadReviews(p.id);
          hydrated = true;
        }
      } catch {}
    }

    if (!hydrated) setLoading(true);

    fetchProduct(slug)
      .then((data) => {
        if (cancelled) return;
        const p = data.product || data;
        setProduct(p);
        if (!hydrated) {
          resetSelection();
          loadReviews(p.id);
        }
      })
      .catch(() => {
        if (!cancelled) navigate("/404");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug, navigate]);

  useEffect(() => {
    tabButtonRefs.current[activeTab]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeTab]);

  useEffect(() => {
    if (!product) return;
    const token = localStorage.getItem("auth_token");
    const pendingId = sessionStorage.getItem("pending_notify_product_id");
    const isUnavailableNow = product.is_unavailable || product.stock === 0;

    if (token && pendingId && parseInt(pendingId, 10) === product.id) {
      sessionStorage.removeItem("pending_notify_product_id");
      sessionStorage.removeItem("redirect_after_login");
      if (isUnavailableNow) {
        autoSubmitNotify();
      }
    }
  }, [product]);

  // Évite de garder une quantité dépassant le stock de la nouvelle variante
  useEffect(() => {
    setQuantity(1);
  }, [selectedSize, selectedColor, selectedAge, selectedAgeColor]);

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

  if (!product) return null;

  const images = [
    ...(product.image ? [product.image] : []),
    ...(Array.isArray(product.images) ? product.images : []),
  ];

  const price = parseFloat(product.price) || 0;
  const promoPrice = parseFloat(product.promo_price) || 0;
  const hasPromo = promoPrice > 0 && promoPrice < price;
  const displayPrice = hasPromo ? promoPrice : price;
  const inWishlist = isInWishlist(product.id);
  const isUnavailable = product.is_unavailable || product.stock === 0;

  // ── Disponibilité des variantes ──
  const sizesExhausted =
    product.has_sizes &&
    (product.sizes || []).every((s) => (s.stock ?? 0) <= 0);

  const colorsOnlyExhausted =
    product.has_colors &&
    !product.has_age &&
    (product.colors || []).every((c) => (c.stock ?? 0) <= 0);

  const agesOnlyExhausted =
    product.has_age &&
    !product.has_colors &&
    (product.ages || []).every((a) => (a.stock ?? 0) <= 0);

  const comboExhausted =
    product.has_age &&
    product.has_colors &&
    (product.ages || []).every(
      (a) => !(a.colors || []).some((c) => (c.stock ?? 0) > 0),
    );

  const variantsExhausted = product.has_sizes
    ? sizesExhausted
    : product.has_age && product.has_colors
      ? comboExhausted
      : product.has_age
        ? agesOnlyExhausted
        : product.has_colors
          ? colorsOnlyExhausted
          : false;

  // Stock max autorisé pour le sélecteur de quantité, selon la variante
  // précise choisie (pas le stock global 999) — 0 tant qu'aucune variante
  // obligatoire n'est encore sélectionnée n'est pas pertinent ici, on
  // retombe alors sur le stock global comme plafond neutre.
  const getMaxQuantity = () => {
    if (product.has_sizes) {
      if (!selectedSize) return product.stock || 99;
      const s = product.sizes.find((x) => x.label === selectedSize);
      return s ? Math.max(0, s.stock ?? 0) : 0;
    }
    if (product.has_age && product.has_colors) {
      if (!selectedAge || !selectedAgeColor) return product.stock || 99;
      const ageObj = product.ages.find((a) => a.label === selectedAge);
      const c = ageObj?.colors?.find((x) => x.name === selectedAgeColor);
      return c ? Math.max(0, c.stock ?? 0) : 0;
    }
    if (product.has_age) {
      if (!selectedAge) return product.stock || 99;
      const a = product.ages.find((x) => x.label === selectedAge);
      return a ? Math.max(0, a.stock ?? 0) : 0;
    }
    if (product.has_colors) {
      if (!selectedColor) return product.stock || 99;
      const c = product.colors.find((x) => x.name === selectedColor.name);
      return c ? Math.max(0, c.stock ?? 0) : 0;
    }
    return product.stock || 99;
  };

  const maxQuantity = getMaxQuantity();

  const handleAddToCart = () => {
    if (product.has_sizes && !selectedSize) {
      setSizeError(true);
      return;
    }
    if (product.has_colors && !product.has_age && !selectedColor) {
      setColorError(true);
      return;
    }
    if (product.has_age && !selectedAge) {
      setAgeError(true);
      return;
    }
    if (
      product.has_age &&
      product.has_colors &&
      selectedAge &&
      !selectedAgeColor
    ) {
      setAgeError(true);
      return;
    }

    for (let i = 0; i < quantity; i++) {
      addToCart({
        ...product,
        selectedSize,
        selectedColor,
        selectedAge,
        selectedAgeColor,
      });
    }
    setCartNotif(true);
    setTimeout(() => setCartNotif(false), 3000);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate("/checkout");
  };

  const handleWishlist = () => {
    if (inWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product.id);
    }
  };

  const handleShare = () => setShareMenuOpen((v) => !v);

  const shareUrl = encodeURIComponent(window.location.href);
  const shareTitle = encodeURIComponent(product.name);

  const handleFacebookShare = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
      "_blank",
      "noopener,noreferrer",
    );
    setShareMenuOpen(false);
  };

  const handleWhatsappShare = () => {
    window.open(
      `https://wa.me/?text=${shareTitle}%20${shareUrl}`,
      "_blank",
      "noopener,noreferrer",
    );
    setShareMenuOpen(false);
  };

  const handleInstagramShare = async () => {
    setShareMenuOpen(false);
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          url: window.location.href,
        });
      } catch {}
    } else {
      navigator.clipboard?.writeText(window.location.href);
      setShareToast(
        "Lien copié ! Collez-le dans votre story ou message Instagram.",
      );
      setTimeout(() => setShareToast(""), 3500);
    }
  };

  const getStoredUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  };

  const buildNotifyFormFromUser = () => {
    const u = getStoredUser();
    return {
      first_name: u?.first_name || u?.name?.split(" ")[0] || "",
      last_name: u?.last_name || u?.name?.split(" ").slice(1).join(" ") || "",
      phone: u?.phone || "",
    };
  };

  // ── Ouvre le formulaire "Me notifier", avec variante pré-remplie/verrouillée ──
  const openNotify = (preset = {}, locked = []) => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      sessionStorage.setItem("pending_notify_product_id", String(product.id));
      sessionStorage.setItem("redirect_after_login", `/products/${slug}`);
      navigate("/login");
      return;
    }
    const base = buildNotifyFormFromUser();
    setNotifyForm({
      ...base,
      size: preset.size || "",
      color: preset.color || "",
      age: preset.age || "",
      quantity: 1,
    });
    setNotifyLocked(locked);
    setNotifySuccess(false);
    setNotifyError("");
    setNotifyOpen(true);
  };

  const handleNotifyClick = () => openNotify({}, []);

  const autoSubmitNotify = async () => {
    const hasVariants =
      product.has_sizes || product.has_colors || product.has_age;
    const payload = buildNotifyFormFromUser();

    // Produit avec variantes ou téléphone manquant → l'utilisateur doit
    // choisir manuellement, on ouvre simplement le formulaire pré-rempli.
    if (!payload.phone || hasVariants) {
      openNotify({}, []);
      return;
    }

    try {
      await api.post(`/products/${product.id}/notify`, {
        ...payload,
        quantity: 1,
      });
      setNotifyForm({ ...payload, size: "", color: "", age: "", quantity: 1 });
      setNotifySuccess(true);
      setNotifyOpen(true);
    } catch {
      // échec silencieux — l'utilisateur peut relancer manuellement
    }
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
    if (product.has_sizes && !notifyForm.size) {
      setNotifyError("Veuillez sélectionner une taille.");
      return;
    }
    if (product.has_colors && !product.has_age && !notifyForm.color) {
      setNotifyError("Veuillez sélectionner une couleur.");
      return;
    }
    if (product.has_age && !notifyForm.age) {
      setNotifyError("Veuillez sélectionner un âge.");
      return;
    }
    if (product.has_age && product.has_colors && !notifyForm.color) {
      setNotifyError("Veuillez sélectionner une couleur.");
      return;
    }
    if (!notifyForm.quantity || notifyForm.quantity < 1) {
      setNotifyError("Quantité invalide.");
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

  // Options de couleur pour le select "Couleur" du formulaire notify,
  // dans le cas âge+couleur combinés selon l'âge choisi dans le formulaire.
  const currentUserEmail = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null")?.email;
    } catch {
      return null;
    }
  })();

  const openEditMyReview = () => {
    setReviewForm({ rating: myReview.rating, comment: myReview.comment });
    setEditingMyReview(true);
    setReviewError("");
    setReviewSuccess(false);
  };

  const handleUpdateMyReview = async () => {
    if (!reviewForm.comment.trim()) {
      setReviewError("Le commentaire est obligatoire.");
      return;
    }
    setReviewSubmitting(true);
    setReviewError("");
    try {
      const res = await updateReview(myReview.id, {
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });
      setMyReview(res.review);
      setEditingMyReview(false);
      setReviewSuccess(true);
    } catch (err) {
      setReviewError(
        err?.response?.data?.message || "Erreur lors de la modification.",
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleDeleteMyReview = async () => {
    setDeletingReview(true);
    try {
      await deleteReview(myReview.id);
      setMyReview(null);
      setReviews((prev) => prev.filter((r) => r.id !== myReview.id));
      setConfirmDeleteReview(false);
    } catch {
      // échec silencieux, l'utilisateur peut réessayer
    } finally {
      setDeletingReview(false);
    }
  };

  const notifyAgeObj = product.ages?.find((a) => a.label === notifyForm.age);
  const notifyColorOptions =
    product.has_age && product.has_colors
      ? notifyAgeObj?.colors || []
      : product.colors || [];

  const faqs = [
    {
      q: "Quelle est la politique de retour ?",
      a: "Vous disposez de 30 jours pour retourner votre produit dans son état d'origine.",
    },
    {
      q: "Les produits sont-ils authentiques ?",
      a: "Oui, tous nos produits sont 100% authentiques et proviennent directement des fabricants ou distributeurs officiels.",
    },
    {
      q: "Quels sont les délais de livraison ?",
      a: "La livraison est effectuée sous 24 à 48h ouvrables dans toute la Tunisie.",
    },
  ];

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
            to={(() => {
              // Reconstruit l'URL précédente avec tous ses filtres
              const prevSearch = sessionStorage.getItem(
                "productlist_last_search",
              );
              return `/products${prevSearch || ""}`;
            })()}
            className="hover:text-[#1a5242] transition-colors"
          >
            Produits
          </Link>
          {product.category && (
            <>
              <ChevronRight size={13} />
              <Link
                to={`/products?category=${product.category.slug}`}
                className="hover:text-[#1a5242] transition-colors"
              >
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronRight size={13} />
          <span className="text-gray-600 font-medium truncate max-w-[420px]">
            {product.name}
          </span>
        </nav>

        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 mb-10 items-start">
          {/* ══════════ Colonne gauche ══════════ */}
          <div className="flex flex-col md:pr-10 md:border-r border-gray-200">
            {/* Image principale */}
            <div
              className="relative w-full overflow-hidden rounded-xl group cursor-zoom-in mb-3"
              onClick={() => {
                setLightboxIndex(selectedImage);
                setLightboxOpen(true);
              }}
            >
              {images.length > 0 ? (
                <img
                  src={`${STORAGE_URL}/${overrideImage || images[selectedImage]}`}
                  alt={product.name}
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
                {hasPromo && (
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-red-500 text-white shadow-sm">
                    -
                    {product.discount_percentage ||
                      Math.round(((price - promoPrice) / price) * 100)}
                    %
                  </span>
                )}
              </div>

              <div className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-white/85 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-sm">
                <ZoomIn size={16} className="text-[#1a5242]" />
              </div>
            </div>

            {/* Miniatures */}
            {images.length > 1 && (
              <div className="flex gap-2 mb-4">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedImage(i);
                      setOverrideImage(null);
                    }}
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

            {/* Réf / Catégorie / Marque */}
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
              <div className="flex items-center gap-2 text-[13px]">
                <Tag size={13} className="text-gray-400 flex-shrink-0" />
                <span className="text-gray-500 font-medium">Référence :</span>
                <span className="font-bold text-gray-900">
                  {product.reference || "—"}
                </span>
              </div>
              {(() => {
                const displayedCategories = [
                  product.display_category1 !== false && product.category
                    ? product.category
                    : null,
                  product.display_category2 && product.category2
                    ? product.category2
                    : null,
                ].filter(Boolean);

                if (displayedCategories.length === 0) return null;

                return (
                  <div className="flex items-center gap-2 text-[13px] flex-wrap">
                    <FolderOpen
                      size={13}
                      className="text-gray-400 flex-shrink-0"
                    />
                    <span className="text-gray-500 font-medium">
                      Catégorie{displayedCategories.length > 1 ? "s" : ""} :
                    </span>
                    {displayedCategories.map((cat, i) => (
                      <span key={cat.slug} className="flex items-center gap-2">
                        {i > 0 && (
                          <span className="text-gray-300 font-bold">·</span>
                        )}
                        <Link
                          to={`/products?category=${cat.slug}`}
                          className="font-bold text-gray-900 hover:text-[#1a5242] hover:underline transition-colors"
                        >
                          {cat.name}
                        </Link>
                      </span>
                    ))}
                  </div>
                );
              })()}
              <div className="flex items-center gap-2 text-[13px] flex-wrap">
                {product.brand?.logo || product.brand?.parent?.logo ? (
                  <img
                    src={`${STORAGE_URL}/${product.brand.logo || product.brand.parent.logo}`}
                    alt=""
                    className="w-3.5 h-3.5 object-contain flex-shrink-0"
                  />
                ) : (
                  <Star size={13} className="text-gray-400 flex-shrink-0" />
                )}
                <span className="text-gray-500 font-medium">Marque :</span>
                {product.brand ? (
                  product.brand.parent ? (
                    <>
                      <Link
                        to={`/products?brand=${product.brand.parent.slug}`}
                        className="font-bold text-gray-900 hover:text-[#1a5242] hover:underline transition-colors"
                      >
                        {product.brand.parent.name}
                      </Link>
                      <span className="text-gray-500 font-bold">:</span>
                      <Link
                        to={`/products?brand=${product.brand.slug}`}
                        className="font-bold text-gray-900 hover:text-[#1a5242] hover:underline transition-colors"
                      >
                        {product.brand.name}
                      </Link>
                    </>
                  ) : (
                    <Link
                      to={`/products?brand=${product.brand.slug}`}
                      className="font-bold text-gray-900 hover:text-[#1a5242] hover:underline transition-colors"
                    >
                      {product.brand.name}
                    </Link>
                  )
                ) : (
                  <span className="font-bold text-gray-900">—</span>
                )}
              </div>
            </div>
          </div>

          {/* ══════════ Colonne droite ══════════ */}
          <div className="flex flex-col">
            <h1
              className="text-[18px] md:text-[22px] font-semibold text-gray-900 leading-snug mb-3"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {product.name}
            </h1>

            {/* Note + lien avis */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              {product.rating > 0 && (
                <>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={17}
                        className={
                          s <= Math.round(product.rating)
                            ? "text-amber-400 fill-amber-400"
                            : "text-gray-200 fill-gray-200"
                        }
                      />
                    ))}
                  </div>
                  <span className="text-[14px] font-bold text-gray-800">
                    {parseFloat(product.rating).toFixed(1)}
                  </span>
                  <span className="text-[13px] text-gray-500">
                    ({product.reviews_count || 0} avis)
                  </span>
                </>
              )}
              <button
                onClick={() => {
                  setActiveTab("reviews");
                  setTimeout(() => {
                    reviewsSectionRef.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                  }, 80);
                }}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                {product.rating > 0 ? (
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
                  {product.rating > 0 ? "Voir les avis" : "Donnez votre avis"}
                </span>
              </button>
            </div>

            {/* Prix */}
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

            {/* Description courte */}
            {product.short_description && (
              <div
                className="text-[15px] text-gray-600 leading-relaxed border-l-4 pl-4 mb-6"
                style={{ borderColor: "#FDE68A" }}
                dangerouslySetInnerHTML={{ __html: product.short_description }}
              />
            )}

            {/* Tailles */}
            {product.has_sizes && product.sizes?.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2.5">
                  <p className="text-[13.5px] font-bold text-gray-800">
                    Taille
                  </p>
                  {selectedSize && (
                    <span className="text-[12px] font-semibold text-[#3f9973] bg-[#3f9973]/10 px-2 py-0.5 rounded-md">
                      {selectedSize}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => {
                    const outOfStock = (size.stock ?? 0) <= 0;
                    return (
                      <div key={size.label} className="relative">
                        <button
                          type="button"
                          disabled={outOfStock}
                          onClick={() => {
                            if (outOfStock) return;
                            setSelectedSize(size.label);
                            setSizeError(false);
                          }}
                          className={`min-w-[44px] h-10 px-3 rounded-xl border-2 text-[13px] font-bold transition-all ${
                            outOfStock
                              ? "border-gray-100 text-gray-300 bg-gray-50 line-through cursor-not-allowed"
                              : selectedSize === size.label
                                ? "border-[#3f9973] bg-[#3f9973] text-white"
                                : "border-gray-200 text-gray-700 hover:border-[#3f9973] hover:text-[#3f9973]"
                          }`}
                        >
                          {size.label}
                        </button>
                        {outOfStock && (
                          <NotifyBell
                            title={`Me notifier pour la taille ${size.label}`}
                            onClick={() =>
                              openNotify({ size: size.label }, ["size"])
                            }
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
                {sizeError && (
                  <p className="text-red-500 text-[12.5px] font-semibold mt-2 flex items-center gap-1.5">
                    <span>⚠</span> Veuillez sélectionner une taille avant
                    d'ajouter au panier
                  </p>
                )}
              </div>
            )}

            {/* Couleurs (mode simple, sans âge) */}
            {product.has_colors &&
              !product.has_age &&
              product.colors?.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2.5">
                    <p className="text-[13.5px] font-bold text-gray-800">
                      Couleur
                    </p>
                    {selectedColor && (
                      <span className="text-[12px] font-semibold text-[#3f9973] bg-[#3f9973]/10 px-2 py-0.5 rounded-md flex items-center gap-1.5">
                        <span
                          className="w-3 h-3 rounded-full border border-white shadow-sm inline-block"
                          style={{ backgroundColor: selectedColor.hex }}
                        />
                        {selectedColor.name}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {product.colors.map((color) => {
                      const outOfStock = (color.stock ?? 0) <= 0;
                      return (
                        <div key={color.name} className="relative">
                          <button
                            type="button"
                            title={color.name}
                            disabled={outOfStock}
                            onClick={() => {
                              if (outOfStock) return;
                              setSelectedColor(color);
                              setColorError(false);
                              setOverrideImage(color.image || null);
                            }}
                            className={`relative transition-all ${
                              outOfStock
                                ? "opacity-35 cursor-not-allowed"
                                : selectedColor?.name === color.name
                                  ? "scale-110"
                                  : "hover:scale-105 opacity-80 hover:opacity-100"
                            }`}
                          >
                            {color.image ? (
                              <div
                                className={`w-11 h-11 rounded-xl overflow-hidden border-2 transition-all ${
                                  selectedColor?.name === color.name
                                    ? "border-[#3f9973] shadow-md"
                                    : "border-gray-200"
                                }`}
                              >
                                <img
                                  src={`${STORAGE_URL}/${color.image}`}
                                  alt={color.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div
                                className={`w-9 h-9 rounded-full border-2 transition-all ${
                                  selectedColor?.name === color.name
                                    ? "border-[#3f9973] shadow-md ring-2 ring-[#3f9973]/30"
                                    : "border-gray-300"
                                }`}
                                style={{ backgroundColor: color.hex }}
                              />
                            )}
                            {selectedColor?.name === color.name && (
                              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#3f9973] rounded-full flex items-center justify-center text-white text-[9px] font-bold shadow-sm">
                                ✓
                              </span>
                            )}
                          </button>
                          {outOfStock && (
                            <NotifyBell
                              title={`Me notifier pour la couleur ${color.name}`}
                              onClick={() =>
                                openNotify({ color: color.name }, ["color"])
                              }
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {colorError && (
                    <p className="text-red-500 text-[12.5px] font-semibold mt-2 flex items-center gap-1.5">
                      <span>⚠</span> Veuillez sélectionner une couleur avant
                      d'ajouter au panier
                    </p>
                  )}
                </div>
              )}

            {/* Âge (seul ou combiné avec couleurs) */}
            {product.has_age && product.ages?.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2.5">
                  <p className="text-[13.5px] font-bold text-gray-800">Âge</p>
                  {selectedAge && (
                    <span className="text-[12px] font-semibold text-[#3f9973] bg-[#3f9973]/10 px-2 py-0.5 rounded-md">
                      {selectedAge}
                      {selectedAgeColor ? ` — ${selectedAgeColor}` : ""}
                    </span>
                  )}
                </div>

                {!product.has_colors ? (
                  // ── Âge seul ──
                  <div className="flex flex-wrap gap-2">
                    {product.ages.map((age) => {
                      const outOfStock = (age.stock ?? 0) <= 0;
                      return (
                        <div key={age.label} className="relative">
                          <button
                            type="button"
                            disabled={outOfStock}
                            onClick={() => {
                              if (outOfStock) return;
                              setSelectedAge(age.label);
                              setAgeError(false);
                            }}
                            className={`min-w-[44px] h-10 px-3 rounded-xl border-2 text-[13px] font-bold transition-all ${
                              outOfStock
                                ? "border-gray-100 text-gray-300 bg-gray-50 line-through cursor-not-allowed"
                                : selectedAge === age.label
                                  ? "border-[#3f9973] bg-[#3f9973] text-white"
                                  : "border-gray-200 text-gray-700 hover:border-[#3f9973] hover:text-[#3f9973]"
                            }`}
                          >
                            {age.label}
                          </button>
                          {outOfStock && (
                            <NotifyBell
                              title={`Me notifier pour ${age.label}`}
                              onClick={() =>
                                openNotify({ age: age.label }, ["age"])
                              }
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  // ── Âge + Couleur combinés ──
                  <>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {product.ages.map((age) => {
                        const hasAvailableColor = (age.colors || []).some(
                          (c) => (c.stock ?? 0) > 0,
                        );
                        const outOfStock = !hasAvailableColor;
                        return (
                          <div key={age.label} className="relative">
                            <button
                              type="button"
                              disabled={outOfStock}
                              onClick={() => {
                                if (outOfStock) return;
                                setSelectedAge(age.label);
                                setSelectedAgeColor(null);
                                setAgeError(false);
                              }}
                              className={`min-w-[44px] h-10 px-3 rounded-xl border-2 text-[13px] font-bold transition-all ${
                                outOfStock
                                  ? "border-gray-100 text-gray-300 bg-gray-50 line-through cursor-not-allowed"
                                  : selectedAge === age.label
                                    ? "border-[#3f9973] bg-[#3f9973] text-white"
                                    : "border-gray-200 text-gray-700 hover:border-[#3f9973] hover:text-[#3f9973]"
                              }`}
                            >
                              {age.label}
                            </button>
                            {outOfStock && (
                              <NotifyBell
                                title={`Me notifier pour ${age.label}`}
                                onClick={() =>
                                  openNotify({ age: age.label }, ["age"])
                                }
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {(() => {
                      // Union de toutes les couleurs déclarées sur au moins un âge
                      // — affichée même avant que l'utilisateur ait choisi un âge,
                      // mais désactivée avec l'invite "Choisir l'âge d'abord".
                      const allAgeColorNames = new Set();
                      (product.ages || []).forEach((a) =>
                        (a.colors || []).forEach((c) =>
                          allAgeColorNames.add(c.name),
                        ),
                      );
                      const allColors = (product.colors || []).filter((c) =>
                        allAgeColorNames.has(c.name),
                      );

                      if (allColors.length === 0) return null;

                      const ageObj = selectedAge
                        ? product.ages.find((a) => a.label === selectedAge)
                        : null;
                      const colorsForAge = ageObj?.colors || [];

                      return (
                        <div>
                          <p className="text-[12px] text-gray-500 mb-2">
                            {selectedAge ? (
                              <>Couleur pour {selectedAge} :</>
                            ) : (
                              <span className="text-amber-600 font-semibold">
                                Choisir l'âge d'abord
                              </span>
                            )}
                          </p>
                          <div className="flex flex-wrap gap-2.5">
                            {allColors.map((c) => {
                              const ac = colorsForAge.find(
                                (x) => x.name === c.name,
                              );
                              // Couleur non déclarée pour l'âge choisi, ou âge
                              // pas encore choisi, ou stock épuisé pour cette
                              // combinaison précise.
                              const notOfferedForAge = selectedAge && !ac;
                              const outOfStock =
                                !selectedAge ||
                                notOfferedForAge ||
                                (ac?.stock ?? 0) <= 0;
                              const disabled = !selectedAge || outOfStock;

                              return (
                                <div key={c.name} className="relative">
                                  <button
                                    type="button"
                                    title={
                                      !selectedAge
                                        ? "Choisissez un âge d'abord"
                                        : c.name
                                    }
                                    disabled={disabled}
                                    onClick={() => {
                                      if (disabled) return;
                                      setSelectedAgeColor(c.name);
                                      setAgeError(false);
                                    }}
                                    className={`relative transition-all ${
                                      disabled
                                        ? "opacity-35 cursor-not-allowed"
                                        : selectedAgeColor === c.name
                                          ? "scale-110"
                                          : "hover:scale-105 opacity-80 hover:opacity-100"
                                    }`}
                                  >
                                    {c.image ? (
                                      <div
                                        className={`w-11 h-11 rounded-xl overflow-hidden border-2 transition-all ${
                                          selectedAgeColor === c.name
                                            ? "border-[#3f9973] shadow-md"
                                            : "border-gray-200"
                                        }`}
                                      >
                                        <img
                                          src={`${STORAGE_URL}/${c.image}`}
                                          alt={c.name}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    ) : (
                                      <div
                                        className={`w-9 h-9 rounded-full border-2 transition-all ${
                                          selectedAgeColor === c.name
                                            ? "border-[#3f9973] shadow-md ring-2 ring-[#3f9973]/30"
                                            : "border-gray-300"
                                        }`}
                                        style={{
                                          backgroundColor: c.hex || "#d1d5db",
                                        }}
                                      />
                                    )}
                                    {selectedAgeColor === c.name && (
                                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#3f9973] rounded-full flex items-center justify-center text-white text-[9px] font-bold shadow-sm">
                                        ✓
                                      </span>
                                    )}
                                  </button>
                                  {selectedAge && outOfStock && (
                                    <NotifyBell
                                      title={`Me notifier pour ${selectedAge} — ${c.name}`}
                                      onClick={() =>
                                        openNotify(
                                          { age: selectedAge, color: c.name },
                                          ["age", "color"],
                                        )
                                      }
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </>
                )}

                {ageError && (
                  <p className="text-red-500 text-[12.5px] font-semibold mt-2 flex items-center gap-1.5">
                    <span>⚠</span> Veuillez sélectionner{" "}
                    {product.has_colors ? "un âge et une couleur" : "un âge"}{" "}
                    avant d'ajouter au panier
                  </p>
                )}
              </div>
            )}

            {/* Statut stock */}
            <div className="mb-5">
              {isUnavailable ? (
                <span className="inline-flex items-center gap-1.5 text-[12px] font-bold px-3 py-1 rounded-full bg-red-50 text-red-600 border border-red-200">
                  <X size={13} /> Rupture de stock
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[12px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 size={13} /> En stock
                </span>
              )}
            </div>

            {/* Quantité + Favoris + Partager */}
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
                      setQuantity((q) => Math.min(maxQuantity || 1, q + 1))
                    }
                    disabled={quantity >= maxQuantity}
                    className="w-11 h-12 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors text-lg font-bold disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  >
                    +
                  </button>
                </div>
                {quantity >= maxQuantity && maxQuantity > 0 && (
                  <p className="text-[11px] text-orange-500 font-semibold mt-1.5">
                    C'est la quantité max
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleWishlist}
                  title="Ajouter aux favoris"
                  className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                    inWishlist
                      ? "border-red-300 bg-red-50 text-red-500"
                      : "border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50"
                  }`}
                >
                  <Heart
                    size={19}
                    className={inWishlist ? "fill-red-500" : ""}
                  />
                </button>

                <div className="relative flex-shrink-0">
                  <button
                    onClick={handleShare}
                    title="Partager"
                    className="w-12 h-12 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-400 hover:border-[#1a5242] hover:text-[#1a5242] transition-all"
                  >
                    <Share2 size={19} />
                  </button>

                  {shareMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShareMenuOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 z-50 bg-white rounded-xl border border-gray-100 shadow-lg p-2 flex flex-col gap-1 w-44">
                        <button
                          onClick={handleFacebookShare}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                        >
                          <Facebook size={16} className="text-[#1877f2]" />
                          <span className="text-[13px] font-medium text-gray-700">
                            Facebook
                          </span>
                        </button>
                        <button
                          onClick={handleWhatsappShare}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="#25d366"
                          >
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
                          </svg>
                          <span className="text-[13px] font-medium text-gray-700">
                            WhatsApp
                          </span>
                        </button>
                        <button
                          onClick={handleInstagramShare}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                        >
                          <Instagram size={16} className="text-[#e1306c]" />
                          <span className="text-[13px] font-medium text-gray-700">
                            Instagram
                          </span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Boutons Ajouter au panier / Achat express / Me notifier */}
            {isUnavailable || variantsExhausted ? (
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

            {/* Stock faible */}
            {product.stock > 0 &&
              product.stock <= 10 &&
              !product.is_unavailable && (
                <p className="text-orange-500 text-[12.5px] font-semibold flex items-center gap-1.5 mb-4">
                  ⚠ Plus que {product.stock} en stock — commandez vite !
                </p>
              )}

            {/* Garanties */}
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

        {/* ── Tabs ── */}
        <div
          ref={tabsRef}
          className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden mb-10"
        >
          <div className="relative border-b border-gray-100">
            <div className="flex gap-2 md:gap-1 overflow-x-auto px-4 md:px-2 py-3 md:py-0 scrollbar-hide">
              {[
                { key: "description", label: "Description" },
                { key: "benefits", label: "Bienfaits" },
                { key: "usage", label: "Conseils d'utilisation" },
                {
                  key: "reviews",
                  label: `Avis (${product.reviews_count || 0})`,
                },
                { key: "faq", label: "FAQ" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  ref={(el) => (tabButtonRefs.current[key] = el)}
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
            <div className="md:hidden pointer-events-none absolute top-0 bottom-0 left-0 w-6 bg-gradient-to-r from-white to-transparent" />
            <div className="md:hidden pointer-events-none absolute top-0 bottom-0 right-0 w-6 bg-gradient-to-l from-white to-transparent" />
          </div>

          <div className="p-7">
            {activeTab === "description" &&
              (product.description ? (
                <div
                  className="blog-content prose prose-sm max-w-none text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              ) : (
                <p className="text-gray-400 text-[14px]">
                  Aucune description disponible.
                </p>
              ))}
            {activeTab === "benefits" &&
              (product.benefits ? (
                <div
                  className="blog-content prose prose-sm max-w-none text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: product.benefits }}
                />
              ) : (
                <p className="text-gray-400 text-[14px]">
                  Aucune information sur les bienfaits.
                </p>
              ))}
            {activeTab === "usage" &&
              (product.usage_tips ? (
                <div
                  className="blog-content prose prose-sm max-w-none text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: product.usage_tips }}
                />
              ) : (
                <p className="text-gray-400 text-[14px]">
                  Aucun conseil d'utilisation disponible.
                </p>
              ))}
            {activeTab === "reviews" && (
              <div ref={reviewsSectionRef}>
                {localStorage.getItem("auth_token") ? (
                  myReview ? (
                    <div className="border border-[#1a5242]/20 bg-[#1a5242]/5 rounded-xl p-5 mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[13.5px] font-bold text-gray-800">
                          Votre avis
                        </p>
                        <span
                          className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${
                            myReview.is_approved
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : myReview.is_rejected
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {myReview.is_approved
                            ? "Publié"
                            : myReview.is_rejected
                              ? "Refusé"
                              : "En attente de validation"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={15}
                            className={
                              s <= myReview.rating
                                ? "text-amber-400 fill-amber-400"
                                : "text-gray-200 fill-gray-200"
                            }
                          />
                        ))}
                      </div>
                      <p className="text-[13.5px] text-gray-700 leading-relaxed mb-3">
                        {myReview.comment}
                      </p>
                      {myReview.is_rejected ? (
                        <p className="text-[12px] text-gray-400 italic">
                          Cet avis n'a pas été retenu par notre équipe et ne
                          peut ni être modifié ni supprimé.
                        </p>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteReview(true)}
                          className="px-4 py-1.5 rounded-lg border border-red-200 text-red-500 text-[12.5px] font-semibold hover:bg-red-50 transition-all"
                        >
                          Supprimer
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="border border-gray-100 rounded-xl p-5 mb-6 bg-gray-50/50">
                      <p className="text-[13.5px] font-bold text-gray-800 mb-3">
                        Laisser un avis
                      </p>
                      {reviewError && (
                        <p className="text-red-500 text-[12.5px] mb-2">
                          {reviewError}
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
                        placeholder="Votre avis sur ce produit..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-[#1a5242] mb-3"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            if (!reviewForm.comment.trim()) {
                              setReviewError("Le commentaire est obligatoire.");
                              return;
                            }
                            setReviewSubmitting(true);
                            setReviewError("");
                            try {
                              const res = await submitReview(product.id, {
                                rating: reviewForm.rating,
                                comment: reviewForm.comment,
                              });
                              setMyReview(res.review);
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
                    </div>
                  )
                ) : (
                  <p className="text-[13px] text-gray-500 mb-6">
                    <Link
                      to="/login"
                      className="text-[#1a5242] font-semibold underline"
                    >
                      Connectez-vous
                    </Link>{" "}
                    pour laisser un avis sur ce produit.
                  </p>
                )}

                {confirmDeleteReview && (
                  <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    style={{
                      background: "rgba(0,0,0,0.5)",
                      backdropFilter: "blur(3px)",
                    }}
                    onClick={() => setConfirmDeleteReview(false)}
                  >
                    <div
                      className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <p className="text-[15px] font-bold text-gray-900 mb-2">
                        Supprimer votre avis ?
                      </p>
                      <p className="text-[13px] text-gray-500 mb-5">
                        Cette action est irréversible.
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setConfirmDeleteReview(false)}
                          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-[13.5px] font-semibold hover:bg-gray-50"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={handleDeleteMyReview}
                          disabled={deletingReview}
                          className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-[13.5px] font-semibold hover:bg-red-600 disabled:opacity-50"
                        >
                          {deletingReview ? "Suppression..." : "Supprimer"}
                        </button>
                      </div>
                    </div>
                  </div>
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
                              {currentUserEmail &&
                                review.customer_email === currentUserEmail && (
                                  <span className="ml-1.5 text-[11px] font-semibold text-[#1a5242]">
                                    (Vous)
                                  </span>
                                )}
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
                    Aucun avis pour ce produit.
                  </p>
                )}
              </div>
            )}
            {activeTab === "faq" && (
              <div className="space-y-3">
                {faqs.map((faq, i) => (
                  <div
                    key={i}
                    className="border border-gray-100 rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() =>
                        setExpandedFaq(expandedFaq === i ? null : i)
                      }
                      className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-[13.5px] font-semibold text-gray-800">
                        {faq.q}
                      </span>
                      {expandedFaq === i ? (
                        <ChevronUp
                          size={16}
                          className="text-gray-400 flex-shrink-0"
                        />
                      ) : (
                        <ChevronDown
                          size={16}
                          className="text-gray-400 flex-shrink-0"
                        />
                      )}
                    </button>
                    {expandedFaq === i && (
                      <div className="px-5 pb-4 text-[13.5px] text-gray-600 leading-relaxed border-t border-gray-100 bg-gray-50/50">
                        <p className="pt-3">{faq.a}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Lightbox */}
        {lightboxOpen && (
          <ImageLightbox
            images={images}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxOpen(false)}
          />
        )}

        <style>{`
          .blog-content strong,
          .blog-content em,
          .blog-content u {
            color: inherit !important;
          }
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { scrollbar-width: none; -ms-overflow-style: none; }
        `}</style>

        {/* Toast partage */}
        {shareToast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-gray-900 text-white text-[13px] font-semibold px-4 py-2.5 rounded-xl shadow-lg max-w-xs text-center">
            {shareToast}
          </div>
        )}

        {/* Cart notification */}
        <CartNotification
          isVisible={cartNotif}
          product={product}
          quantity={quantity}
          onClose={() => setCartNotif(false)}
        />

        {/* Modal "Me notifier" */}
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
              className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
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
                    onClick={() => {
                      setNotifyOpen(false);
                      setNotifySuccess(false);
                      setNotifyForm({
                        first_name: "",
                        last_name: "",
                        phone: "",
                        size: "",
                        color: "",
                        age: "",
                        quantity: 1,
                      });
                      setNotifyLocked([]);
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

                    {/* Taille */}
                    {product.has_sizes && (
                      <div>
                        <label className="block text-[11.5px] font-semibold text-gray-500 mb-1">
                          Taille
                        </label>
                        {notifyLocked.includes("size") ? (
                          <div className="h-10 px-3 flex items-center border border-gray-200 rounded-lg text-[13.5px] bg-gray-50 text-gray-700 font-semibold">
                            {notifyForm.size}
                          </div>
                        ) : (
                          <select
                            value={notifyForm.size}
                            onChange={(e) =>
                              setNotifyForm((f) => ({
                                ...f,
                                size: e.target.value,
                              }))
                            }
                            className="w-full h-10 px-3 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-[#1a5242] bg-white"
                          >
                            <option value="">Sélectionner une taille</option>
                            {(product.sizes || []).map((s) => (
                              <option key={s.label} value={s.label}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}

                    {/* Âge (si combiné avec couleurs, affiché avant couleur) */}
                    {product.has_age && (
                      <div>
                        <label className="block text-[11.5px] font-semibold text-gray-500 mb-1">
                          Âge
                        </label>
                        {notifyLocked.includes("age") ? (
                          <div className="h-10 px-3 flex items-center border border-gray-200 rounded-lg text-[13.5px] bg-gray-50 text-gray-700 font-semibold">
                            {notifyForm.age}
                          </div>
                        ) : (
                          <select
                            value={notifyForm.age}
                            onChange={(e) =>
                              setNotifyForm((f) => ({
                                ...f,
                                age: e.target.value,
                                color: "",
                              }))
                            }
                            className="w-full h-10 px-3 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-[#1a5242] bg-white"
                          >
                            <option value="">Sélectionner un âge</option>
                            {(product.ages || []).map((a) => (
                              <option key={a.label} value={a.label}>
                                {a.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}

                    {/* Couleur (mode simple OU combiné avec âge) */}
                    {product.has_colors &&
                      (!product.has_age || notifyForm.age) && (
                        <div>
                          <label className="block text-[11.5px] font-semibold text-gray-500 mb-1">
                            Couleur
                          </label>
                          {notifyLocked.includes("color") ? (
                            <div className="h-10 px-3 flex items-center border border-gray-200 rounded-lg text-[13.5px] bg-gray-50 text-gray-700 font-semibold">
                              {notifyForm.color}
                            </div>
                          ) : (
                            <select
                              value={notifyForm.color}
                              onChange={(e) =>
                                setNotifyForm((f) => ({
                                  ...f,
                                  color: e.target.value,
                                }))
                              }
                              className="w-full h-10 px-3 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-[#1a5242] bg-white"
                            >
                              <option value="">Sélectionner une couleur</option>
                              {notifyColorOptions.map((c) => (
                                <option key={c.name} value={c.name}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      )}

                    {/* Quantité */}
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
    </div>
  );
}
