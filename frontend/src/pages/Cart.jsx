import { useState, useEffect } from "react";
import { X, AlertTriangle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { setPostLoginRedirect } from "../utils/authRedirect";
import { getShippingSettings, validatePromoCode } from "../services/api";
import { STORAGE_URL } from "../config/api";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Truck,
  Shield,
  ArrowRight,
  Tag,
  ChevronRight,
  Check,
  Loader2,
} from "lucide-react";

const COLS = "1.5fr 110px 150px 100px 40px";

export default function Cart() {
  const navigate = useNavigate();
  const {
    cart,
    removeFromCart,
    updateQuantity,
    cartTotal,
    promoCode: promoApplied,
    applyPromoCode,
    removePromoCode,
  } = useCart();

  const handleCheckoutClick = () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setPostLoginRedirect("/checkout");
      navigate("/login");
      return;
    }
    navigate("/checkout");
  };
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 900 : true,
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 900px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

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

  // ── Code promo ──
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
    } catch (err) {
      setPromoError(
        err.response?.data?.message || "Ce code promo n'est pas valide.",
      );
    } finally {
      setPromoChecking(false);
    }
  };

  const handleRemovePromo = () => {
    removePromoCode();
    setPromoError("");
    setPromoInput("");
  };

  const freeShippingEnabled = shipping.free_shipping_enabled;
  const freeShippingThreshold =
    parseFloat(shipping.free_shipping_threshold) || 0;
  const shippingCostValue = parseFloat(shipping.shipping_cost) || 0;

  const subtotal = cartTotal;
  const promoDiscount = promoApplied?.discount_amount || 0;
  const subtotalAfterPromo = Math.max(0, subtotal - promoDiscount);
  const shippingCost =
    freeShippingEnabled && subtotalAfterPromo >= freeShippingThreshold
      ? 0
      : shippingCostValue;
  const total = subtotalAfterPromo + shippingCost;
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
  const progressToFreeShipping = freeShippingEnabled
    ? Math.min((cartTotal / (freeShippingThreshold || 1)) * 100, 100)
    : 0;
  const remainingForFreeShipping = freeShippingEnabled
    ? Math.max(freeShippingThreshold - cartTotal, 0)
    : 0;

  if (cart.length === 0)
    return (
      <div
        style={{
          fontFamily: "'Inter', sans-serif",
          background: "#f9fafb",
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          padding: "60px 20px",
        }}
      >
        <div style={{ maxWidth: 1330, margin: "0 auto", width: "100%" }}>
          <div
            style={{
              background: "white",
              borderRadius: 20,
              border: "1px solid #f3f4f6",
              boxShadow: "0 1px 8px rgba(0,0,0,0.05)",
              padding: "80px 40px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20,
              textAlign: "center",
            }}
          >
            <ShoppingBag
              size={72}
              strokeWidth={1}
              style={{ color: "#1a5242", opacity: 0.25 }}
            />
            <div>
              <p
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#111827",
                  marginBottom: 8,
                }}
              >
                Votre panier est vide
              </p>
              <p style={{ fontSize: 14, color: "#9ca3af" }}>
                Découvrez notre sélection de produits de qualité
              </p>
            </div>
            <Link
              to="/products"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "linear-gradient(135deg, #2d7a5f 0%, #3f9973 100%)",
                color: "white",
                padding: "12px 24px",
                borderRadius: 12,
                fontWeight: 600,
                fontSize: 14,
                textDecoration: "none",
                boxShadow: "0 4px 12px rgba(45,122,95,0.25)",
                transition: "opacity 0.2s, transform 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.9";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <ShoppingBag size={17} /> Découvrir nos produits
            </Link>
          </div>
        </div>
      </div>
    );

  return (
    <div
      style={{
        fontFamily: "'Inter', sans-serif",
        background: "#f9fafb",
        minHeight: "100vh",
        padding: "40px 0 64px",
      }}
    >
      <div style={{ maxWidth: 1330, margin: "0 auto", padding: "0 20px" }}>
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[13px] text-gray-400 mb-6">
          <Link to="/" className="hover:text-[#1a5242] transition-colors">
            Accueil
          </Link>
          <ChevronRight size={13} />
          <span className="text-[#1a5242] font-semibold">Panier</span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between mb-7">
          <p className="text-[22px] font-semibold text-gray-900">Mon Panier</p>
          <span className="text-[13.5px] text-gray-400 font-medium">
            {totalItems} article{totalItems > 1 ? "s" : ""}
          </span>
        </div>

        {/* Bannière livraison */}
        {!freeShippingEnabled ? null : cartTotal < freeShippingThreshold ? (
          <div
            style={{
              background: "white",
              border: "1px solid #355847",
              borderRadius: 12,
              padding: "16px 20px",
              marginBottom: 24,
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Truck size={18} style={{ color: "#355847", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontSize: 13.5,
                    color: "#355847",
                    margin: "0 0 8px",
                  }}
                >
                  Plus que{" "}
                  <strong>{remainingForFreeShipping.toFixed(3)} DT</strong> pour
                  la livraison gratuite !
                </p>
                <div
                  style={{
                    height: 7,
                    background: "white",
                    border: "1px solid #FFF3B0",
                    borderRadius: 999,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${progressToFreeShipping}%`,
                      background: "#FFF3B0",
                      borderRadius: 999,
                      transition: "width 0.5s ease",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              borderLeft: "4px solid #1a5242",
              borderRadius: 12,
              padding: "14px 20px",
              marginBottom: 24,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Truck size={17} style={{ color: "#059669" }} />
              <p
                style={{
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: "#065f46",
                  margin: 0,
                }}
              >
                🎉 Félicitations ! Vous bénéficiez de la livraison gratuite
              </p>
            </div>
          </div>
        )}

        {/* Layout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isDesktop ? "1fr 380px" : "1fr",
            gap: isDesktop ? 24 : 16,
            alignItems: "start",
          }}
        >
          {/* ── Produits ── */}
          <div
            style={{
              background: "white",
              borderRadius: 20,
              border: "1px solid #f3f4f6",
              boxShadow: "0 1px 8px rgba(0,0,0,0.05)",
              overflow: "hidden",
            }}
          >
            {/* En-tête (desktop uniquement) */}
            {isDesktop && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: COLS,
                  gap: 16,
                  padding: "12px 24px",
                  borderBottom: "1px solid #f3f4f6",
                  background: "#f9fafb",
                }}
              >
                {["Produit", "Prix unitaire", "Quantité", "Total", ""].map(
                  (h, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#9ca3af",
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                        textAlign: i > 0 ? "center" : "left",
                      }}
                    >
                      {h}
                    </span>
                  ),
                )}
              </div>
            )}

            {/* Items */}
            {cart.map((item, idx) => {
              const price = parseFloat(item.price) || 0;
              const promoPrice = parseFloat(item.promo_price) || 0;
              const hasPromo = promoPrice > 0 && promoPrice < price;
              const display = hasPromo ? promoPrice : price;
              const itemTotal = (display * item.quantity).toFixed(3);
              const discPct = hasPromo
                ? Math.round(((price - promoPrice) / price) * 100)
                : 0;

              return isDesktop ? (
                <div
                  key={item.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: COLS,
                    gap: 16,
                    padding: "20px 24px",
                    alignItems: "center",
                    borderBottom:
                      idx < cart.length - 1 ? "1px solid #f3f4f6" : "none",
                  }}
                >
                  {/* Produit */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        width: 80,
                        height: 80,
                        borderRadius: 12,
                        background: "#f9fafb",
                        border: "1px solid #f3f4f6",
                        flexShrink: 0,
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {item.image ? (
                        <img
                          src={`${STORAGE_URL}/${item.image}`}
                          alt={item.name}
                          loading="lazy"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            padding: 4,
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: 28 }}>🧴</span>
                      )}
                      {hasPromo && (
                        <span
                          style={{
                            position: "absolute",
                            top: 4,
                            left: 4,
                            background: "#ef4444",
                            color: "white",
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "2px 6px",
                            borderRadius: 999,
                          }}
                        >
                          -{discPct}%
                        </span>
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <Link
                        to={`/products/${item.slug}`}
                        style={{
                          display: "block",
                          fontSize: 13.5,
                          fontWeight: 600,
                          color: "#1f2937",
                          textDecoration: "none",
                          lineHeight: 1.4,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        onMouseEnter={(e) => (e.target.style.color = "#1a5242")}
                        onMouseLeave={(e) => (e.target.style.color = "#1f2937")}
                      >
                        {item.name}
                      </Link>
                      {item.brand && (
                        <p
                          style={{
                            fontSize: 11.5,
                            fontWeight: 600,
                            color: "#d4af37",
                            margin: "3px 0 0",
                          }}
                        >
                          {item.brand.name}
                        </p>
                      )}
                      {item.reference && (
                        <p
                          style={{
                            fontSize: 11,
                            color: "#9ca3af",
                            margin: "2px 0 0",
                          }}
                        >
                          Réf: {item.reference}
                        </p>
                      )}
                      {item.selectedSize && (
                        <p
                          style={{
                            fontSize: 11.5,
                            color: "#6b7280",
                            margin: "2px 0 0",
                          }}
                        >
                          Taille : <strong>{item.selectedSize}</strong>
                        </p>
                      )}
                      {item.selectedColor && (
                        <p
                          style={{
                            fontSize: 11.5,
                            color: "#6b7280",
                            margin: "2px 0 0",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          Couleur :{" "}
                          <span
                            style={{
                              width: 12,
                              height: 12,
                              borderRadius: "50%",
                              backgroundColor: item.selectedColor.hex,
                              display: "inline-block",
                              border: "1px solid #e5e7eb",
                            }}
                          />
                          <strong>{item.selectedColor.name}</strong>
                        </p>
                      )}
                      {item.selectedAge && (
                        <p
                          style={{
                            fontSize: 11.5,
                            color: "#6b7280",
                            margin: "2px 0 0",
                          }}
                        >
                          Âge : <strong>{item.selectedAge}</strong>
                          {item.selectedAgeColor && (
                            <>
                              {" "}
                              — <strong>{item.selectedAgeColor}</strong>
                            </>
                          )}
                        </p>
                      )}
                      <p
                        style={{
                          fontSize: 11.5,
                          fontWeight: 500,
                          margin: "4px 0 0",
                          color: item.stock > 0 ? "#059669" : "#ef4444",
                        }}
                      >
                        {item.stock > 0 ? "✓ En stock" : "Rupture de stock"}
                      </p>
                    </div>
                  </div>

                  {/* Prix unitaire */}
                  <div style={{ textAlign: "center" }}>
                    {hasPromo ? (
                      <>
                        <p
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#ef4444",
                            margin: 0,
                          }}
                        >
                          {display.toFixed(3)} DT
                        </p>
                        <p
                          style={{
                            fontSize: 12,
                            color: "#9ca3af",
                            textDecoration: "line-through",
                            margin: "2px 0 0",
                          }}
                        >
                          {price.toFixed(3)} DT
                        </p>
                      </>
                    ) : (
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#374151",
                          margin: 0,
                        }}
                      >
                        {display.toFixed(3)} DT
                      </p>
                    )}
                  </div>

                  {/* Quantité */}
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        border: "1px solid #e5e7eb",
                        borderRadius: 10,
                        overflow: "hidden",
                        background: "#f9fafb",
                        height: 38,
                      }}
                    >
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        disabled={item.quantity <= 1}
                        style={{
                          width: 36,
                          height: "100%",
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          color: "#1a5242",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          opacity: item.quantity <= 1 ? 0.3 : 1,
                        }}
                      >
                        <Minus size={14} />
                      </button>
                      <span
                        style={{
                          width: 36,
                          textAlign: "center",
                          fontWeight: 700,
                          fontSize: 14,
                          background: "white",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderLeft: "1px solid #e5e7eb",
                          borderRight: "1px solid #e5e7eb",
                        }}
                      >
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        disabled={item.quantity >= item.stock}
                        style={{
                          width: 36,
                          height: "100%",
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          color: "#1a5242",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          opacity: item.quantity >= item.stock ? 0.3 : 1,
                        }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Total */}
                  <div style={{ textAlign: "center" }}>
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 800,
                        color: "#1a5242",
                      }}
                    >
                      {itemTotal} DT
                    </span>
                  </div>

                  {/* Supprimer */}
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        border: "1px solid #fee2e2",
                        background: "#fef2f2",
                        color: "#f87171",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#fee2e2";
                        e.currentTarget.style.color = "#ef4444";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#fef2f2";
                        e.currentTarget.style.color = "#f87171";
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                // ══════════ Carte mobile ══════════
                <div
                  key={item.id}
                  style={{
                    margin: "10px 12px",
                    padding: "14px",
                    background: "#f9fafb",
                    borderRadius: 14,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", gap: 12 }}>
                    <div
                      style={{
                        position: "relative",
                        width: 64,
                        height: 64,
                        borderRadius: 10,
                        background: "#f9fafb",
                        border: "1px solid #f3f4f6",
                        flexShrink: 0,
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {item.image ? (
                        <img
                          src={`${STORAGE_URL}/${item.image}`}
                          alt={item.name}
                          loading="lazy"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            padding: 3,
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: 22 }}>🧴</span>
                      )}
                      {hasPromo && (
                        <span
                          style={{
                            position: "absolute",
                            top: 3,
                            left: 3,
                            background: "#ef4444",
                            color: "white",
                            fontSize: 9,
                            fontWeight: 700,
                            padding: "1px 5px",
                            borderRadius: 999,
                          }}
                        >
                          -{discPct}%
                        </span>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link
                        to={`/products/${item.slug}`}
                        style={{
                          display: "block",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#1f2937",
                          textDecoration: "none",
                          lineHeight: 1.35,
                        }}
                      >
                        {item.name}
                      </Link>
                      {item.brand && (
                        <p
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: "#d4af37",
                            margin: "2px 0 0",
                          }}
                        >
                          {item.brand.name}
                        </p>
                      )}
                      {(item.selectedSize ||
                        item.selectedColor ||
                        item.selectedAge) && (
                        <p
                          style={{
                            fontSize: 11,
                            color: "#6b7280",
                            margin: "2px 0 0",
                          }}
                        >
                          {item.selectedSize && `Taille: ${item.selectedSize}`}
                          {item.selectedSize && item.selectedColor && " · "}
                          {item.selectedColor && `${item.selectedColor.name}`}
                          {(item.selectedSize || item.selectedColor) &&
                            item.selectedAge &&
                            " · "}
                          {item.selectedAge && `${item.selectedAge}`}
                          {item.selectedAge &&
                            item.selectedAgeColor &&
                            ` (${item.selectedAgeColor})`}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        border: "1px solid #fee2e2",
                        background: "#fef2f2",
                        color: "#f87171",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        border: "1px solid #e5e7eb",
                        borderRadius: 10,
                        overflow: "hidden",
                        background: "#f9fafb",
                        height: 34,
                      }}
                    >
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        disabled={item.quantity <= 1}
                        style={{
                          width: 32,
                          height: "100%",
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          color: "#1a5242",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          opacity: item.quantity <= 1 ? 0.3 : 1,
                        }}
                      >
                        <Minus size={13} />
                      </button>
                      <span
                        style={{
                          width: 32,
                          textAlign: "center",
                          fontWeight: 700,
                          fontSize: 13,
                          background: "white",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderLeft: "1px solid #e5e7eb",
                          borderRight: "1px solid #e5e7eb",
                        }}
                      >
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        disabled={item.quantity >= item.stock}
                        style={{
                          width: 32,
                          height: "100%",
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          color: "#1a5242",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          opacity: item.quantity >= item.stock ? 0.3 : 1,
                        }}
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      {hasPromo && (
                        <span
                          style={{
                            fontSize: 11,
                            color: "#9ca3af",
                            textDecoration: "line-through",
                            marginRight: 6,
                          }}
                        >
                          {(price * item.quantity).toFixed(3)} DT
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: 800,
                          color: "#1a5242",
                        }}
                      >
                        {itemTotal} DT
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Actions */}
            <div
              style={{
                display: "flex",
                flexDirection: isDesktop ? "row" : "column",
                alignItems: isDesktop ? "center" : "stretch",
                justifyContent: "space-between",
                gap: isDesktop ? 0 : 10,
                padding: isDesktop ? "0 24px 20px" : "4px 20px 20px",
              }}
            >
              <Link
                to="/products"
                style={
                  isDesktop
                    ? {
                        fontSize: 13.5,
                        fontWeight: 600,
                        color: "#3b82f6",
                        textDecoration: "underline",
                      }
                    : {
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13.5,
                        fontWeight: 600,
                        color: "#1a5242",
                        textDecoration: "none",
                        border: "1.5px solid #1a5242",
                        borderRadius: 10,
                        padding: "10px 0",
                      }
                }
              >
                Continuer mes achats
              </Link>
              <button
                onClick={() => setShowClearConfirm(true)}
                style={
                  isDesktop
                    ? {
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 13.5,
                        fontWeight: 600,
                        color: "#ef4444",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }
                    : {
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        fontSize: 13.5,
                        fontWeight: 600,
                        color: "#ef4444",
                        background: "#fef2f2",
                        border: "none",
                        borderRadius: 10,
                        padding: "10px 0",
                        cursor: "pointer",
                      }
                }
              >
                <Trash2 size={14} /> Vider le panier
              </button>
            </div>
          </div>

          {/* ── Résumé ── */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              position: isDesktop ? "sticky" : "static",
              top: isDesktop ? 20 : undefined,
            }}
          >
            <div
              style={{
                background: "white",
                borderRadius: 20,
                border: "1px solid #f3f4f6",
                padding: 24,
                boxShadow: "0 1px 8px rgba(0,0,0,0.05)",
              }}
            >
              <p
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#111827",
                  margin: "0 0 20px",
                  paddingBottom: 16,
                  borderBottom: "1px solid #f3f4f6",
                }}
              >
                Résumé de la commande
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13.5,
                    color: "#6b7280",
                  }}
                >
                  <span>
                    Sous-total ({totalItems} article{totalItems > 1 ? "s" : ""})
                  </span>
                  <span style={{ fontWeight: 600, color: "#374151" }}>
                    {subtotal.toFixed(3)} DT
                  </span>
                </div>
                {promoApplied && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13.5,
                      color: "#059669",
                    }}
                  >
                    <span>
                      Code promo ({promoApplied.code} — -
                      {promoApplied.discount_percentage}%)
                    </span>
                    <span style={{ fontWeight: 600 }}>
                      -{promoDiscount.toFixed(3)} DT
                    </span>
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13.5,
                    color: "#6b7280",
                  }}
                >
                  <span>Frais de livraison</span>
                  <span
                    style={{
                      fontWeight: 600,
                      color: shippingCost === 0 ? "#059669" : "#374151",
                    }}
                  >
                    {shippingCost === 0
                      ? "Gratuit"
                      : `${shippingCost.toFixed(3)} DT`}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingTop: 14,
                    borderTop: "1px solid #f3f4f6",
                  }}
                >
                  <span
                    style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}
                  >
                    Total TTC
                  </span>
                  <span
                    style={{ fontSize: 16, fontWeight: 800, color: "#1a5242" }}
                  >
                    {total.toFixed(3)} DT
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCheckoutClick}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  width: "100%",
                  background:
                    "linear-gradient(135deg, #2d7a5f 0%, #3f9973 100%)",
                  color: "white",
                  padding: "14px 24px",
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 14,
                  border: "none",
                  cursor: "pointer",
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Passer la commande <ArrowRight size={17} />
              </button>

              <div
                style={{
                  marginTop: 20,
                  paddingTop: 16,
                  borderTop: "1px solid #f3f4f6",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {[{ icon: Truck, text: "Livraison rapide en Tunisie" }].map(
                  ({ icon: Icon, text }) => (
                    <div
                      key={text}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        fontSize: 12.5,
                        color: "#9ca3af",
                      }}
                    >
                      <Icon
                        size={14}
                        style={{ color: "#d4af37", flexShrink: 0 }}
                      />{" "}
                      {text}
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Code promo */}
            <div
              style={{
                background: "white",
                borderRadius: 20,
                border: "1px solid #f3f4f6",
                padding: "20px 24px",
                boxShadow: "0 1px 8px rgba(0,0,0,0.05)",
              }}
            >
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#1f2937",
                  margin: "0 0 12px",
                }}
              >
                Avez-vous un code promo ?
              </p>

              {promoApplied ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    background: "#ecfdf5",
                    border: "1px solid #a7f3d0",
                    borderRadius: 12,
                    padding: "10px 14px",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <Check size={15} style={{ color: "#059669" }} />
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#065f46",
                      }}
                    >
                      {promoApplied.code} appliqué (-
                      {promoApplied.discount_percentage}%)
                    </span>
                  </div>
                  <button
                    onClick={handleRemovePromo}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#059669",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    Retirer
                  </button>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: "#f9fafb",
                      border: `1px solid ${promoError ? "#fca5a5" : "#e5e7eb"}`,
                      borderRadius: 12,
                      padding: "6px 12px",
                    }}
                  >
                    <Tag
                      size={14}
                      style={{ color: "#9ca3af", flexShrink: 0 }}
                    />
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
                      placeholder="Entrez votre code"
                      style={{
                        flex: 1,
                        border: "none",
                        background: "transparent",
                        fontSize: 13.5,
                        color: "#374151",
                        outline: "none",
                        padding: "6px 0",
                        textTransform: "uppercase",
                      }}
                    />
                    <button
                      onClick={handleApplyPromo}
                      disabled={promoChecking || !promoInput.trim()}
                      style={{
                        background: "#d4af37",
                        color: "white",
                        border: "none",
                        padding: "7px 14px",
                        borderRadius: 8,
                        fontSize: 12.5,
                        fontWeight: 700,
                        cursor: "pointer",
                        flexShrink: 0,
                        opacity: promoChecking || !promoInput.trim() ? 0.6 : 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {promoChecking && (
                        <Loader2 size={13} className="animate-spin" />
                      )}
                      Appliquer
                    </button>
                  </div>
                  {promoError && (
                    <p
                      style={{
                        fontSize: 12.5,
                        color: "#ef4444",
                        marginTop: 8,
                        fontWeight: 500,
                      }}
                    >
                      {promoError}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation vider le panier */}
      {showClearConfirm && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)" }}
          onClick={() => setShowClearConfirm(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowClearConfirm(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
            >
              <X size={16} />
            </button>
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={26} className="text-red-500" />
            </div>
            <p className="text-[15px] font-bold text-gray-900 text-center mb-2">
              Vider votre panier ?
            </p>
            <p className="text-[13.5px] text-gray-500 text-center mb-6">
              Les {totalItems} article{totalItems > 1 ? "s" : ""} de votre
              panier seront supprimés. Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-[13.5px] font-semibold hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  cart.forEach((i) => removeFromCart(i.id));
                  setShowClearConfirm(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-[13.5px] font-semibold hover:bg-red-600 transition-colors"
              >
                Vider le panier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
