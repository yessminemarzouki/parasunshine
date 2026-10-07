import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, Bell } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import CartNotification from "./CartNotification";
import { STORAGE_URL } from "../config/api";

const BundleCard = ({ bundle }) => {
  const navigate = useNavigate();
  const { addBundleToCart } = useCart();
  const { isBundleInWishlist, addBundleToWishlist, removeBundleFromWishlist } =
    useWishlist();
  const [showNotification, setShowNotification] = useState(false);

  const isFavorite = isBundleInWishlist(bundle.id);
  const isAvailable = bundle.is_available !== false;

  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem("auth_token");
    if (!token) {
      navigate("/login");
      return;
    }

    if (isFavorite) {
      await removeBundleFromWishlist(bundle.id);
    } else {
      await addBundleToWishlist(bundle.id);
    }
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isAvailable) {
      addBundleToCart(bundle, 1);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
    }
  };

  const discountPercentage = bundle.promo_price
    ? Math.round(((bundle.price - bundle.promo_price) / bundle.price) * 100)
    : bundle.discount_percentage;

  return (
    <>
      <div className="relative bg-white border border-gray-200 md:border-[#e8e8e8] rounded-xl md:rounded-lg overflow-hidden flex flex-col transition-all duration-300 hover:border-[#1a5242] hover:shadow-md group">
        {/* Badge promo / indisponible uniquement — pas de badge "Coffret" */}
        <div className="absolute top-2 left-2 md:top-3 md:left-3 z-[2] flex flex-col gap-1.5">
          {bundle.promo_price && discountPercentage && (
            <div className="px-2 py-0.5 md:px-2.5 md:py-1 rounded-md text-[11px] md:text-[0.75rem] font-bold uppercase tracking-wide text-white bg-[#e63946]">
              -{discountPercentage}%
            </div>
          )}
          {!isAvailable && (
            <div className="px-2 py-0.5 md:px-2.5 md:py-1 rounded-md text-[11px] md:text-[0.75rem] font-bold uppercase tracking-wide text-white bg-[#666666]">
              Indisponible
            </div>
          )}
        </div>

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
          to={`/coffrets/${bundle.slug}`}
          className="relative block w-full overflow-hidden bg-[#f9f9f9]"
          style={{ paddingTop: "90%" }}
        >
          <img
            src={
              bundle.image
                ? `${STORAGE_URL}/${bundle.image}`
                : "/images/placeholder-product.png"
            }
            alt={bundle.name}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="hidden md:block absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[#1a5242]/8" />
        </Link>

        {/* Infos */}
        <div className="flex flex-col flex-1 items-center text-center gap-0.5 p-2.5 md:p-3">
          {bundle.brand && (
            <p className="text-[10px] md:text-[0.75rem] font-semibold uppercase tracking-wide text-[#1a5242] m-0">
              {bundle.brand.name}
            </p>
          )}

          <Link
            to={`/coffrets/${bundle.slug}`}
            className="text-[12.5px] md:text-[0.85rem] font-medium text-[#1a1a1a] leading-snug hover:text-[#1a5242] transition-colors no-underline"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              minHeight: "2.4em",
            }}
          >
            {bundle.name}
          </Link>

          <div className="flex items-center justify-center gap-1.5 md:gap-2 w-full flex-wrap">
            {bundle.promo_price ? (
              <>
                <span className="text-[13.5px] md:text-[1rem] font-bold text-[#e63946]">
                  {parseFloat(bundle.promo_price).toFixed(3).replace(".", ",")}{" "}
                  DT
                </span>
                <span className="text-[11px] md:text-[0.9rem] font-normal text-gray-400 line-through">
                  {parseFloat(bundle.price).toFixed(3).replace(".", ",")} DT
                </span>
              </>
            ) : (
              <span className="text-[13.5px] md:text-[1rem] font-bold text-[#1a1a1a]">
                {parseFloat(bundle.price).toFixed(3).replace(".", ",")} DT
              </span>
            )}
          </div>

          {isAvailable ? (
            <button
              onClick={handleAddToCart}
              className="w-[70%] md:w-[65%] md:max-w-[150px] mt-1 py-1.5 md:py-2 rounded-lg text-white font-semibold text-[11.5px] md:text-[0.78rem] flex items-center justify-center gap-1.5 transition-all hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #2d7a5f 0%, #3f9973 100%)",
              }}
            >
              <ShoppingCart size={13} className="md:hidden" />
              <ShoppingCart size={15} className="hidden md:block" />
              Ajouter
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate(`/coffrets/${bundle.slug}`);
              }}
              className="w-[70%] md:w-[65%] md:max-w-[150px] mt-1 py-1.5 md:py-2 rounded-lg font-semibold text-[11.5px] md:text-[0.78rem] flex items-center justify-center gap-1.5 transition-all hover:-translate-y-0.5 border-2"
              style={{
                background: "#FEF3C7",
                borderColor: "#FDE68A",
                color: "#92400E",
              }}
            >
              <Bell size={13} className="md:hidden animate-bell-ring" />
              <Bell size={15} className="hidden md:block animate-bell-ring" />
              M'avertir
            </button>
          )}
        </div>
      </div>

      <CartNotification
        product={bundle}
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

export default BundleCard;
