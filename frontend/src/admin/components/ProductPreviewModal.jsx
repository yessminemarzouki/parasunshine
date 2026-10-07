// ✅ Après
import { useState, useEffect } from "react";
import { X, Package, Star } from "lucide-react";
import { getProductStats } from "../services/adminApi";
function CountdownTimer({ endDate }) {
  const getTimeLeft = () => {
    const end = new Date(endDate.replace(" ", "T"));
    const now = new Date();
    const diff = end - now;

    if (diff <= 0) return null;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds };
  };

  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  if (!timeLeft)
    return (
      <p className="text-[11px] font-bold text-red-600">Promotion expirée</p>
    );

  return (
    <div>
      <p className="text-[11px] text-amber-600 mb-1">Temps restant</p>
      <div className="flex gap-2">
        {[
          { val: timeLeft.days, label: "j" },
          { val: timeLeft.hours, label: "h" },
          { val: timeLeft.minutes, label: "min" },
          { val: timeLeft.seconds, label: "sec" },
        ].map(({ val, label }) => (
          <div
            key={label}
            className="flex flex-col items-center px-2 py-1 bg-amber-100 border border-amber-200 rounded-lg min-w-[36px]"
          >
            <span className="text-[14px] font-extrabold text-amber-800 leading-tight">
              {String(val).padStart(2, "0")}
            </span>
            <span className="text-[9px] text-amber-600 font-semibold">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
export default function ProductPreviewModal({ product, onClose }) {
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!product) return;
    const fetchStats = async () => {
      try {
        const data = await getProductStats(product.id);
        setStats(data);
      } catch {
        setStats(null);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, [product?.id]);

  if (!product) return null;

  const price = parseFloat(product.price) || 0;
  const promoPrice = parseFloat(product.promo_price) || 0;
  const hasPromo = promoPrice > 0 && promoPrice < price;
  const discount = hasPromo
    ? Math.round(((price - promoPrice) / price) * 100)
    : 0;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1a4731]/10 flex items-center justify-center">
              <Package size={15} className="text-[#1a4731]" />
            </div>
            <p className="text-[14px] font-bold text-gray-900">
              Aperçu du produit
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ── Gauche : Image + infos de base ── */}
            <div className="lg:col-span-1">
              <div
                className="rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 mb-4 flex items-center justify-center"
                style={{ height: 220 }}
              >
                {product.image ? (
                  <img
                    src={`http://localhost/storage/${product.image}`}
                    alt={product.name}
                    className="w-full h-full object-contain p-4"
                  />
                ) : (
                  <Package size={48} className="text-gray-200" />
                )}
              </div>

              {/* Galerie d'images supplémentaires */}
              {product.images?.length > 0 && (
                <div className="flex gap-2 mb-4">
                  {product.images.map((img, i) => (
                    <div
                      key={i}
                      className="w-1/3 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center"
                      style={{ height: 60 }}
                    >
                      <img
                        src={`http://localhost/storage/${img}`}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {product.is_featured && (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-[#fffbeb] text-[#92660a] border border-[#fde68a] rounded-full">
                    Vedette
                  </span>
                )}
                {product.is_new && (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0] rounded-full">
                    Nouveau
                  </span>
                )}
                {product.is_promo && (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-[#fefce8] text-[#854d0e] border border-[#fef08a] rounded-full">
                    Promo
                  </span>
                )}
                {product.is_bestseller && (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-[#f5f5dc] text-[#713f12] border border-[#d6c896] rounded-full">
                    Bestseller
                  </span>
                )}
                {product.has_sizes && (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                    Tailles
                  </span>
                )}
                {product.has_colors && (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-pink-50 text-pink-700 border border-pink-200 rounded-full">
                    Couleurs
                  </span>
                )}
              </div>

              {/* Stats rapides */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                  <span className="text-[12px] text-gray-500">Stock</span>
                  <span
                    className={`text-[12px] font-bold ${product.stock === 0 ? "text-red-600" : product.stock <= 5 ? "text-amber-600" : "text-emerald-600"}`}
                  >
                    {product.stock === 0
                      ? "Rupture"
                      : `${product.stock} unités`}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                  <span className="text-[12px] text-gray-500">Note</span>
                  <div className="flex items-center gap-1">
                    <Star
                      size={12}
                      fill={product.rating > 0 ? "#f4c430" : "#e5e7eb"}
                      stroke={product.rating > 0 ? "#f4c430" : "#e5e7eb"}
                    />
                    <span className="text-[12px] font-bold text-gray-700">
                      {product.rating > 0
                        ? parseFloat(product.rating).toFixed(1)
                        : "—"}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      ({product.reviews_count || 0} avis)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                  <span className="text-[12px] text-gray-500">Réf.</span>
                  <span className="text-[12px] font-bold text-gray-700">
                    {product.reference || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                  <span className="text-[12px] text-gray-500">Catégorie</span>
                  <span className="text-[12px] font-bold text-gray-700">
                    {product.category?.name || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                  <span className="text-[12px] text-gray-500">Marque</span>
                  <span className="text-[12px] font-bold text-[#d4af37]">
                    {product.brand?.name || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                  <span className="text-[12px] text-gray-500">Modifié le</span>
                  <span className="text-[12px] font-bold text-gray-700">
                    {new Date(product.updated_at).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Droite : Détails ── */}
            <div className="lg:col-span-2 space-y-5">
              {/* Nom + Prix */}
              <div>
                <p
                  className="text-[16px] font-bold text-gray-900 mb-3 leading-snug"
                  dangerouslySetInnerHTML={{ __html: product.name }}
                />
                <div className="flex items-center gap-3">
                  {hasPromo ? (
                    <>
                      <span className="text-[20px] font-extrabold text-emerald-600">
                        {promoPrice.toFixed(3).replace(".", ",")} DT
                      </span>
                      <span className="text-[14px] text-gray-400 line-through">
                        {price.toFixed(3).replace(".", ",")} DT
                      </span>
                      <span className="px-2 py-0.5 bg-red-50 text-red-600 border border-red-100 rounded-lg text-[12px] font-bold">
                        -{discount}%
                      </span>
                    </>
                  ) : (
                    <span className="text-[20px] font-extrabold text-[#1a4731]">
                      {price.toFixed(3).replace(".", ",")} DT
                    </span>
                  )}
                </div>
              </div>

              {/* Description courte */}
              {product.short_description && (
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Description courte
                  </p>
                  <div
                    className="text-[13px] text-gray-600 leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: product.short_description,
                    }}
                  />
                </div>
              )}

              {/* Tailles */}
              {product.has_sizes && product.sizes?.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Tailles disponibles
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                      <span
                        key={size}
                        className="px-3 py-1 border border-gray-200 rounded-lg text-[12px] font-semibold text-gray-700"
                      >
                        {size}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Couleurs */}
              {product.has_colors && product.colors?.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Couleurs disponibles
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {product.colors.map((color) => (
                      <div key={color.hex} className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full border border-gray-200"
                          style={{ backgroundColor: color.hex }}
                        />
                        <span className="text-[12px] text-gray-600">
                          {color.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Campagne de promotion */}
              {product.promo_campaign && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
                  <p className="text-[11px] font-bold text-purple-700 uppercase tracking-widest mb-2">
                    Campagne de promotion
                  </p>
                  <p className="text-[13px] font-bold text-purple-900">
                    {product.promo_campaign.name}
                  </p>
                  <p className="text-[12px] text-purple-700 mt-1">
                    -{product.promo_campaign.discount_percentage}% ·{" "}
                    {product.promo_campaign.starts_at
                      ? new Date(
                          product.promo_campaign.starts_at.replace(" ", "T"),
                        ).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "sans date de début"}{" "}
                    →{" "}
                    {product.promo_campaign.ends_at
                      ? new Date(
                          product.promo_campaign.ends_at.replace(" ", "T"),
                        ).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "sans date de fin"}
                  </p>
                  <p className="text-[11px] text-purple-600 mt-1.5">
                    {product.promo_campaign.is_active
                      ? "Campagne active"
                      : "Campagne actuellement désactivée"}
                  </p>
                </div>
              )}

              {/* Dates promo */}
              {product.is_promo && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-[11px] font-bold text-amber-700 uppercase tracking-widest mb-2">
                    Promotion active
                  </p>
                  {product.promo_starts_at || product.promo_ends_at ? (
                    <div className="space-y-2">
                      <div className="flex gap-4">
                        {product.promo_starts_at && (
                          <div>
                            <p className="text-[11px] text-amber-600">Début</p>
                            <p className="text-[12px] font-bold text-amber-800">
                              {new Date(
                                product.promo_starts_at.replace(" ", "T"),
                              ).toLocaleDateString("fr-FR", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        )}
                        {product.promo_ends_at && (
                          <div>
                            <p className="text-[11px] text-amber-600">Fin</p>
                            <p className="text-[12px] font-bold text-amber-800">
                              {new Date(
                                product.promo_ends_at.replace(" ", "T"),
                              ).toLocaleDateString("fr-FR", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        )}
                      </div>
                      {product.promo_ends_at && (
                        <CountdownTimer endDate={product.promo_ends_at} />
                      )}
                    </div>
                  ) : (
                    <p className="text-[12px] text-amber-700">
                      Aucune date définie
                    </p>
                  )}
                </div>
              )}

              {/* Slug */}
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                  URL du produit
                </p>

                <a
                  href={`http://localhost:3000/products/${product.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] text-[#1a4731] font-semibold hover:underline break-all"
                >
                  /products/{product.slug}
                </a>
              </div>
              {/* Stats commandes */}
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Statistiques de vente
                </p>
                {loadingStats ? (
                  <div className="flex items-center gap-2 text-[12px] text-gray-400">
                    <span className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                    Chargement...
                  </div>
                ) : stats ? (
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
                    <div className="p-3 bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl text-center">
                      <p className="text-[18px] font-extrabold text-[#166534]">
                        {stats.total_orders}
                      </p>
                      <p className="text-[11px] text-[#166534] font-semibold">
                        Commandes
                      </p>
                    </div>
                    <div className="p-3 bg-[#fffbeb] border border-[#fde68a] rounded-xl text-center">
                      <p className="text-[18px] font-extrabold text-[#92660a]">
                        {stats.total_quantity}
                      </p>
                      <p className="text-[11px] text-[#92660a] font-semibold">
                        Unités livrées
                      </p>
                    </div>
                    <div className="p-3 bg-[#f5f5dc] border border-[#d6c896] rounded-xl text-center">
                      <p className="text-[16px] font-extrabold text-[#713f12]">
                        {parseFloat(stats.total_revenue)
                          .toFixed(3)
                          .replace(".", ",")}
                      </p>
                      <p className="text-[11px] text-[#713f12] font-semibold">
                        CA livré (DT)
                      </p>
                    </div>
                  </div>
                ) : null}

                {/* Dernières commandes */}
                {stats?.recent_orders?.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                      Dernières commandes
                    </p>
                    <div className="space-y-1.5">
                      {stats.recent_orders.map((order, i) => (
                        <div
                          key={i}
                          className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 bg-gray-50 rounded-xl text-[12px]"
                        >
                          <span className="font-bold text-[#1a4731]">
                            #{order.order_number}
                          </span>
                          <span className="text-gray-500">{order.date}</span>
                          <span className="text-gray-600">
                            {order.quantity} unité(s)
                          </span>
                          <span className="font-bold text-gray-800">
                            {parseFloat(order.total).toFixed(3)} DT
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              order.status === "delivered"
                                ? "bg-green-50 text-green-700"
                                : order.status === "pending"
                                  ? "bg-amber-50 text-amber-700"
                                  : order.status === "cancelled"
                                    ? "bg-red-50 text-red-700"
                                    : "bg-blue-50 text-blue-700"
                            }`}
                          >
                            {order.status === "delivered"
                              ? "Livrée"
                              : order.status === "pending"
                                ? "En attente"
                                : order.status === "cancelled"
                                  ? "Annulée"
                                  : order.status === "processing"
                                    ? "En préparation"
                                    : order.status === "shipped"
                                      ? "Expédiée"
                                      : order.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
