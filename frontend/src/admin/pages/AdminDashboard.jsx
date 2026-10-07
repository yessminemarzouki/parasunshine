import { useState, useEffect, useRef } from "react";
import {
  ShoppingBag,
  Users,
  Package,
  Star,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Mail,
  Megaphone,
  ShoppingCart,
  UserCheck,
} from "lucide-react";
import { getAdminStats, getAdminProducts } from "../services/adminApi";
import { useNavigate } from "react-router-dom";

const STATUS_MAP = {
  pending: {
    label: "En attente",
    cls: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  processing: {
    label: "En préparation",
    cls: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  shipped: {
    label: "Expédiée",
    cls: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  delivered: {
    label: "Livrée",
    cls: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  cancelled: {
    label: "Annulée",
    cls: "bg-red-50 text-red-700 border border-red-200",
  },
};

const STAT_GROUPS = (stats) => [
  {
    group: "Ventes",
    cards: [
      {
        label: "CA total livré",
        value: (stats?.revenue?.total ?? 0).toFixed(3) + " DT",
        icon: TrendingUp,
        bg: "bg-emerald-50",
        ic: "text-emerald-600",
        link: "/admin/orders?status=delivered",
      },
      {
        label: "Panier moyen",
        value: (stats?.average_order_value ?? 0).toFixed(3) + " DT",
        icon: ShoppingCart,
        bg: "bg-blue-50",
        ic: "text-blue-600",
        link: "/admin/orders?status=delivered",
      },
      {
        label: "Commandes en attente",
        value: stats?.orders?.pending ?? 0,
        icon: Clock,
        bg: "bg-amber-50",
        ic: "text-amber-600",
        link: "/admin/orders?status=pending",
      },
      {
        label: "Commandes aujourd'hui",
        value: stats?.orders?.today ?? 0,
        icon: ShoppingBag,
        bg: "bg-[#edf7f3]",
        ic: "text-[#1a4731]",
        link: "/admin/orders",
      },
    ],
  },
  {
    group: "Clients & Support",
    cards: [
      {
        label: "Clients inscrits",
        value: stats?.clients?.total ?? 0,
        icon: Users,
        bg: "bg-blue-50",
        ic: "text-blue-600",
        link: "/admin/users",
      },
      {
        label: "Paniers abandonnés",
        value: stats?.abandoned_carts ?? 0,
        icon: AlertTriangle,
        bg: "bg-red-50",
        ic: "text-red-600",
        link: null,
      },
      {
        label: "Avis à modérer",
        value: stats?.reviews?.pending ?? 0,
        icon: Star,
        bg: "bg-amber-50",
        ic: "text-amber-600",
        link: "/admin/reviews",
      },
      {
        label: "Messages non lus",
        value: stats?.unread_contacts ?? 0,
        icon: Mail,
        bg: "bg-blue-50",
        ic: "text-blue-600",
        link: "/admin/contacts",
      },
      {
        label: "Produits en rupture",
        value: stats?.products?.out_of_stock ?? 0,
        icon: AlertTriangle,
        bg: "bg-red-50",
        ic: "text-red-600",
        link: "/admin/products?stock=out",
      },
      {
        label: "Abonnés newsletter",
        value: stats?.newsletter_subs ?? 0,
        icon: Megaphone,
        bg: "bg-[#edf7f3]",
        ic: "text-[#1a4731]",
        link: "/admin/newsletter",
      },
    ],
  },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBestsellers, setShowBestsellers] = useState(false);
  const [bestsellers, setBestsellers] = useState([]);
  const [loadingBestsellers, setLoadingBestsellers] = useState(false);
  const [topPeriod, setTopPeriod] = useState("all"); // all | 7d | 30d | year | custom
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [topProductsLoading, setTopProductsLoading] = useState(false);
  const [showLoyalty, setShowLoyalty] = useState(false);
  const [showNeverSold, setShowNeverSold] = useState(false);
  const [neverSoldProducts, setNeverSoldProducts] = useState([]);
  const [loadingNeverSold, setLoadingNeverSold] = useState(false);
  const navigate = useNavigate();

  const openNeverSoldModal = async () => {
    setShowNeverSold(true);
    setLoadingNeverSold(true);
    try {
      const data = await getAdminProducts({ never_sold: 1, per_page: 100 });
      setNeverSoldProducts(data.data || []);
    } catch {
      setNeverSoldProducts([]);
    } finally {
      setLoadingNeverSold(false);
    }
  };

  const openBestsellersModal = async () => {
    setShowBestsellers(true);
    setLoadingBestsellers(true);
    try {
      const data = await getAdminProducts({
        bestseller: 1,
        per_page: 100,
        ...buildPeriodParams(),
      });
      const products = data.data || [];

      const statsMap = {};
      (stats?.products?.top_selling || []).forEach((p, i) => {
        statsMap[p.id] = {
          rank: i,
          total_sold: p.total_sold,
          total_revenue: p.total_revenue,
        };
      });

      const sorted = [...products]
        .map((p) => ({ ...p, _stats: statsMap[p.id] || null }))
        .sort((a, b) => {
          const rankA = a._stats?.rank ?? 9999;
          const rankB = b._stats?.rank ?? 9999;
          return rankA - rankB;
        });

      setBestsellers(sorted);
    } catch {
      setBestsellers([]);
    } finally {
      setLoadingBestsellers(false);
    }
  };

  const buildPeriodParams = () => {
    if (topPeriod === "all") return {};
    if (topPeriod === "7d") {
      return {
        top_products_from: new Date(Date.now() - 7 * 86400000)
          .toISOString()
          .slice(0, 10),
      };
    }
    if (topPeriod === "30d") {
      return {
        top_products_from: new Date(Date.now() - 30 * 86400000)
          .toISOString()
          .slice(0, 10),
      };
    }
    if (topPeriod === "year") {
      return {
        top_products_from: `${new Date().getFullYear()}-01-01`,
      };
    }
    if (topPeriod === "custom") {
      const params = {};
      if (customFrom) params.top_products_from = customFrom;
      if (customTo) params.top_products_to = customTo;
      return params;
    }
    return {};
  };

  // Premier chargement de la page — écran plein, une seule fois
  useEffect(() => {
    setLoading(true);
    getAdminStats(buildPeriodParams())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Changement de période — ne recharge QUE la card "Top produits",
  // jamais toute la page. Ignore le tout premier montage (déjà couvert
  // par l'effet ci-dessus) pour éviter un double appel au chargement.
  const isFirstPeriodRun = useRef(true);
  useEffect(() => {
    if (isFirstPeriodRun.current) {
      isFirstPeriodRun.current = false;
      return;
    }
    setTopProductsLoading(true);
    getAdminStats(buildPeriodParams())
      .then(setStats)
      .catch(() => {})
      .finally(() => setTopProductsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topPeriod, customFrom, customTo]);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400">
        <div className="w-7 h-7 border-2 border-gray-200 border-t-[#1a4731] rounded-full animate-spin" />
        <span className="text-sm">Chargement...</span>
      </div>
    );

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <div className="w-full flex flex-col items-start sm:flex-row sm:items-center justify-between mb-6 gap-3 sm:gap-4">
        <div className="text-left self-start">
          <h1 className="text-[22px] font-extrabold text-gray-900 tracking-tight leading-tight">
            Tableau de bord
          </h1>
          <p className="text-[13px] text-gray-400 mt-1">
            Vue d'ensemble de votre activité aujourd'hui
          </p>
        </div>
        <span className="text-[12.5px] text-gray-500 bg-white border border-gray-200 px-3.5 py-2 rounded-xl font-medium capitalize shadow-sm self-start sm:self-auto">
          {new Date().toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>
      </div>

      {/* Stat groups */}
      {STAT_GROUPS(stats).map((section) => (
        <div key={section.group} className="mb-6">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">
            {section.group}
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {section.cards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  onClick={() => card.link && navigate(card.link)}
                  className={`bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3.5 transition-all duration-150 ${
                    card.link
                      ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5"
                      : ""
                  }`}
                >
                  <div
                    className={`w-11 h-11 rounded-xl ${card.bg} flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon size={19} className={card.ic} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[19px] font-extrabold text-gray-900 leading-tight tracking-tight truncate">
                      {card.value}
                    </p>
                    <p className="text-[11.5px] text-gray-400 font-medium leading-tight mt-0.5">
                      {card.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Grid principal */}
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 mt-2">
        Analyse
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Revenus 7 jours — 3 cols */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <span className="text-[14px] font-bold text-gray-900">
                Revenus — 7 derniers jours
              </span>
              <p className="text-[12.5px] font-semibold text-gray-500 mt-0.5">
                {(stats?.revenue?.this_week ?? 0).toFixed(3)} DT cette semaine
              </p>
            </div>
            {(() => {
              const trend = stats?.revenue?.week_trend ?? 0;
              const isPositive = trend >= 0;
              return (
                <span
                  className={`flex items-center gap-1 text-[11.5px] font-bold px-2.5 py-1 rounded-md border ${
                    isPositive
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-red-50 text-red-700 border-red-200"
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp size={13} />
                  ) : (
                    <TrendingDown size={13} />
                  )}
                  {isPositive ? "+" : ""}
                  {trend}% vs semaine précédente
                </span>
              );
            })()}
          </div>
          <div className="p-6 pb-8">
            {(() => {
              // Génère toujours les 7 derniers jours calendaires, complétés avec 0 si pas de vente
              const days = [];
              for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().slice(0, 10);
                const found = stats?.revenue?.by_day?.find(
                  (x) => x.date === dateStr,
                );
                days.push({
                  date: dateStr,
                  revenue: found ? parseFloat(found.revenue) : 0,
                });
              }
              const max = Math.max(...days.map((d) => d.revenue), 1);

              return (
                <div className="flex items-end gap-1.5 sm:gap-3 h-56 sm:h-64 px-1">
                  {days.map((d) => {
                    const pct = (d.revenue / max) * 100;
                    const isToday =
                      d.date === new Date().toISOString().slice(0, 10);
                    const dateLabel = new Date(
                      d.date + "T00:00:00",
                    ).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                    });
                    return (
                      <div
                        key={d.date}
                        className="flex-1 flex flex-col items-center h-full group"
                      >
                        <div className="flex-1 w-full flex items-end justify-center relative">
                          {/* Info-bulle au survol */}
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap bg-gray-900 text-white text-[10.5px] font-semibold px-2 py-1 rounded-lg z-10">
                            {d.revenue.toFixed(3)} DT
                            <span className="text-gray-400 ml-1">
                              · {dateLabel}
                            </span>
                          </div>
                          <div
                            className="w-5 sm:w-8 rounded-t-lg transition-all duration-300"
                            style={{
                              height:
                                d.revenue > 0 ? `${Math.max(pct, 5)}%` : "3px",
                              background:
                                d.revenue > 0
                                  ? isToday
                                    ? "linear-gradient(180deg, #d4af37 0%, #a07c10 100%)"
                                    : "linear-gradient(180deg, #2d7a5e 0%, #1a4731 100%)"
                                  : "#e5e7eb",
                            }}
                          />
                        </div>
                        {/* Ligne de base */}
                        <div className="w-full h-px bg-gray-200 mt-1" />
                        <span
                          className={`text-[10.5px] font-medium capitalize mt-1.5 ${isToday ? "text-[#a07c10] font-bold" : "text-gray-400"}`}
                        >
                          {new Date(d.date + "T00:00:00").toLocaleDateString(
                            "fr-FR",
                            { weekday: "short" },
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Top produits — 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2.5">
              <div>
                <span className="text-[14px] font-bold text-gray-900">
                  Top 15 produits
                </span>
                {(stats?.products?.top_selling_count ?? 0) > 0 &&
                  (stats?.products?.top_selling_count ?? 0) <= 5 && (
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Il y a seulement {stats.products.top_selling_count}{" "}
                      produit{stats.products.top_selling_count > 1 ? "s" : ""}{" "}
                      top vendu{stats.products.top_selling_count > 1 ? "s" : ""}{" "}
                      pour cette periode
                    </p>
                  )}
              </div>
              {(stats?.products?.top_selling_count ?? 0) > 5 && (
                <button
                  onClick={openBestsellersModal}
                  className="text-[12.5px] text-[#1a4731] font-semibold hover:opacity-70 transition-opacity flex-shrink-0"
                >
                  Voir tout →
                </button>
              )}
            </div>
            <select
              value={topPeriod}
              onChange={(e) => setTopPeriod(e.target.value)}
              className="h-8 px-2.5 border border-gray-200 rounded-lg text-[12px] text-gray-700 bg-white outline-none focus:border-[#1a4731] transition-all"
            >
              <option value="all">Depuis toujours</option>
              <option value="7d">7 derniers jours</option>
              <option value="30d">30 derniers jours</option>
              <option value="year">Cette année</option>
              <option value="custom">Période personnalisée</option>
            </select>
            {topPeriod === "custom" && (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="h-8 px-2 border border-gray-200 rounded-lg text-[11.5px] text-gray-700 outline-none focus:border-[#1a4731]"
                />
                <span className="text-gray-400 text-[11px]">à</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="h-8 px-2 border border-gray-200 rounded-lg text-[11.5px] text-gray-700 outline-none focus:border-[#1a4731]"
                />
              </div>
            )}
          </div>
          <div className="relative">
            {topProductsLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-[1px] rounded-b-2xl">
                <div className="w-7 h-7 border-2 border-gray-200 border-t-[#1a4731] rounded-full animate-spin" />
              </div>
            )}
            {(stats?.products?.top_selling?.length ?? 0) > 0 ? (
              stats.products.top_selling.slice(0, 5).map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10.5px] font-bold flex-shrink-0 ${
                      i === 0
                        ? "bg-[#D4AF37]/20 text-[#a07c10]"
                        : i === 1
                          ? "bg-gray-100 text-gray-500"
                          : i === 2
                            ? "bg-orange-50 text-orange-600"
                            : "bg-gray-50 text-gray-400"
                    }`}
                  >
                    {i + 1}
                  </span>
                  {p.image && (
                    <img
                      src={`http://localhost/storage/${p.image}`}
                      alt={p.name}
                      className="w-9 h-9 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                      onError={(e) => (e.target.style.display = "none")}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-semibold text-gray-800 truncate">
                      {p.name}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {p.total_sold} vendus ·{" "}
                      {parseFloat(p.total_revenue).toFixed(3)} DT
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-32 text-[13px] text-gray-400">
                Aucune vente
              </div>
            )}
          </div>
        </div>

        {/* Commandes par statut */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <span className="text-[14px] font-bold text-gray-900">
              Commandes par statut
            </span>
            <button
              onClick={() => navigate("/admin/orders")}
              className="text-[12.5px] text-[#1a4731] font-semibold hover:opacity-70"
            >
              Gérer →
            </button>
          </div>
          <div>
            {Object.entries(STATUS_MAP).map(([key, val]) => (
              <div
                key={key}
                onClick={() => navigate(`/admin/orders?status=${key}`)}
                className="flex items-center justify-between px-5 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 cursor-pointer transition-colors"
              >
                <span
                  className={`text-[11.5px] font-semibold px-2.5 py-1 rounded-md ${val.cls}`}
                >
                  {val.label}
                </span>
                <span className="text-[15px] font-bold text-gray-800">
                  {stats?.orders?.by_status?.[key] ?? 0}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-[13px] font-semibold text-gray-500">
                Total
              </span>
              <span className="text-[16px] font-extrabold text-gray-900">
                {stats?.orders?.total ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* État du stock + fidélisation */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <span className="text-[14px] font-bold text-gray-900">
              Stock & Fidélisation
            </span>
            <button
              onClick={() => navigate("/admin/products")}
              className="text-[12.5px] text-[#1a4731] font-semibold hover:opacity-70"
            >
              Gérer →
            </button>
          </div>
          <div className="p-4 space-y-2.5">
            {[
              {
                icon: Package,
                label: "Total produits",
                val: stats?.products?.total ?? 0,
                cls: "bg-gray-50 border-gray-200",
                ic: "text-gray-400",
                link: "/admin/products",
              },
              {
                icon: AlertTriangle,
                label: "Stock faible (≤5)",
                val: stats?.products?.low_stock ?? 0,
                cls: "bg-amber-50 border-amber-200",
                ic: "text-amber-500",
                link: "/admin/products?stock=low",
              },
              {
                icon: XCircle,
                label: "Rupture de stock",
                val: stats?.products?.out_of_stock ?? 0,
                cls: "bg-red-50 border-red-200",
                ic: "text-red-500",
                link: "/admin/products?stock=out",
              },
              {
                icon: Package,
                label: "Jamais vendus",
                val: stats?.never_sold_products ?? 0,
                cls: "bg-purple-50 border-purple-200",
                ic: "text-purple-500",
                link: null,
                onClickCustom: openNeverSoldModal,
              },
              {
                icon: CheckCircle,
                label: "Nouveaux clients/mois",
                val: stats?.clients?.new_this_month ?? 0,
                cls: "bg-emerald-50 border-emerald-200",
                ic: "text-emerald-500",
                link: null,
              },
            ].map(
              ({ icon: Icon, label, val, cls, ic, link, onClickCustom }) => (
                <div
                  key={label}
                  onClick={() =>
                    onClickCustom ? onClickCustom() : link && navigate(link)
                  }
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg border ${cls} ${link || onClickCustom ? "cursor-pointer hover:brightness-95 transition-all" : ""}`}
                >
                  <Icon size={15} className={ic} />
                  <span className="flex-1 text-[13px] font-medium text-gray-700">
                    {label}
                  </span>
                  <strong className="text-[14px] font-bold text-gray-900">
                    {val}
                  </strong>
                </div>
              ),
            )}

            {/* Fidélisation clients */}
            {(() => {
              const repeat = stats?.clients_loyalty?.repeat ?? 0;
              const oneTime = stats?.clients_loyalty?.one_time ?? 0;
              const total = repeat + oneTime;
              const pct = total > 0 ? Math.round((repeat / total) * 100) : 0;
              return (
                <div
                  onClick={() => setShowLoyalty(true)}
                  className="px-3.5 py-3 rounded-xl border bg-indigo-50 border-indigo-200 cursor-pointer hover:brightness-95 transition-all"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <UserCheck size={15} className="text-indigo-500" />
                    <span className="flex-1 text-[13px] font-medium text-gray-700">
                      Clients fidèles (2+ commandes)
                    </span>
                    <strong className="text-[14px] font-bold text-gray-900">
                      {pct}%
                    </strong>
                  </div>
                  <div className="w-full h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[10.5px] text-gray-400 mt-1.5">
                    {repeat} client(s) fidèle(s) sur {total} client(s) ayant
                    déjà commandé
                  </p>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
      {/* Modal produits jamais vendus */}
      {showNeverSold && (
        <div
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)" }}
          onClick={() => setShowNeverSold(false)}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[85vh] sm:max-h-[80vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-[16px] font-bold text-gray-900">
                  Produits jamais vendus
                </h2>
                <p className="text-[12px] text-gray-400 mt-0.5">
                  {neverSoldProducts.length} produit(s) sans aucune vente
                </p>
              </div>
              <button
                onClick={() => setShowNeverSold(false)}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
              >
                <XCircle size={16} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-4">
              {loadingNeverSold ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-6 h-6 border-2 border-gray-200 border-t-[#1a4731] rounded-full animate-spin" />
                </div>
              ) : neverSoldProducts.length === 0 ? (
                <p className="text-center text-[13px] text-gray-400 py-10">
                  Tous vos produits ont déjà été vendus au moins une fois. 🎉
                </p>
              ) : (
                <div className="space-y-1.5">
                  {neverSoldProducts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setShowNeverSold(false);
                        navigate("/admin/products");
                      }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      {p.image ? (
                        <img
                          src={`http://localhost/storage/${p.image}`}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-semibold text-gray-800 truncate">
                          {p.name}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {parseFloat(p.price).toFixed(3)} DT · Créé le{" "}
                          {new Date(p.created_at).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      {p.stock === 0 ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded flex-shrink-0">
                          Rupture
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-gray-50 text-gray-500 border border-gray-200 rounded flex-shrink-0">
                          Stock: {p.stock}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Modal fidélisation clients */}
      {showLoyalty && (
        <div
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)" }}
          onClick={() => setShowLoyalty(false)}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[85vh] sm:max-h-[80vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-[16px] font-bold text-gray-900">
                  Fidélisation clients
                </h2>
                <p className="text-[12px] text-gray-400 mt-0.5">
                  Répartition des clients ayant déjà commandé
                </p>
              </div>
              <button
                onClick={() => setShowLoyalty(false)}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
              >
                <XCircle size={16} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-5">
              {/* Clients fidèles */}
              <div>
                <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest mb-2 px-1">
                  Clients fidèles — 2+ commandes (
                  {stats?.clients_loyalty?.repeat_list?.length ?? 0})
                </p>
                {(stats?.clients_loyalty?.repeat_list?.length ?? 0) === 0 ? (
                  <p className="text-[12.5px] text-gray-400 px-1">
                    Aucun client fidèle pour le moment.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {stats.clients_loyalty.repeat_list.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setShowLoyalty(false);
                          navigate("/admin/users");
                        }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-[12px] flex-shrink-0">
                          {(c.first_name || c.name || "?")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12.5px] font-semibold text-gray-800 truncate">
                            {c.first_name
                              ? `${c.first_name} ${c.last_name || ""}`
                              : c.name}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate">
                            {c.email}
                          </p>
                        </div>
                        <span className="text-[11px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md flex-shrink-0">
                          {c.orders_count} commandes
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Clients ponctuels */}
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                  Clients ponctuels — 1 commande (
                  {stats?.clients_loyalty?.one_time_list?.length ?? 0})
                </p>
                {(stats?.clients_loyalty?.one_time_list?.length ?? 0) === 0 ? (
                  <p className="text-[12.5px] text-gray-400 px-1">
                    Aucun client ponctuel pour le moment.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {stats.clients_loyalty.one_time_list.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setShowLoyalty(false);
                          navigate("/admin/users");
                        }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-[12px] flex-shrink-0">
                          {(c.first_name || c.name || "?")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12.5px] font-semibold text-gray-800 truncate">
                            {c.first_name
                              ? `${c.first_name} ${c.last_name || ""}`
                              : c.name}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate">
                            {c.email}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal tous les bestsellers */}
      {showBestsellers && (
        <div
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)" }}
          onClick={() => setShowBestsellers(false)}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[85vh] sm:max-h-[80vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-[16px] font-bold text-gray-900">
                  Tous les produits Bestseller
                </h2>
                <p className="text-[12px] text-gray-400 mt-0.5">
                  {bestsellers.length} produit(s) marqué(s) comme bestseller
                </p>
              </div>
              <button
                onClick={() => setShowBestsellers(false)}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
              >
                <XCircle size={16} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-4">
              {loadingBestsellers ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-6 h-6 border-2 border-gray-200 border-t-[#1a4731] rounded-full animate-spin" />
                </div>
              ) : bestsellers.length === 0 ? (
                <p className="text-center text-[13px] text-gray-400 py-10">
                  Aucun produit bestseller pour le moment.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {bestsellers.map((p, i) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setShowBestsellers(false);
                        navigate("/admin/products");
                      }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10.5px] font-bold flex-shrink-0 ${
                          i === 0
                            ? "bg-[#D4AF37]/20 text-[#a07c10]"
                            : i === 1
                              ? "bg-gray-100 text-gray-500"
                              : i === 2
                                ? "bg-orange-50 text-orange-600"
                                : "bg-gray-50 text-gray-400"
                        }`}
                      >
                        {i + 1}
                      </span>
                      {p.image ? (
                        <img
                          src={`http://localhost/storage/${p.image}`}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-semibold text-gray-800 truncate">
                          {p.name}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {p._stats
                            ? `${p._stats.total_sold} vendus (livrés) · ${parseFloat(p._stats.total_revenue).toFixed(3)} DT`
                            : `${parseFloat(p.price).toFixed(3)} DT`}
                        </p>
                      </div>
                      {p.stock === 0 ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded flex-shrink-0">
                          Rupture
                        </span>
                      ) : p.stock <= 5 ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded flex-shrink-0">
                          Stock: {p.stock}
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
