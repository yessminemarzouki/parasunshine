import { useState, useEffect } from "react";

import { NavLink, useNavigate, Outlet, useLocation } from "react-router-dom";
import { getAdminBadges } from "../services/adminApi";
import { Brain } from "lucide-react";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  PackageSearch,
  Gift,
  Users,
  Star,
  Mail,
  Megaphone,
  Tag,
  Menu,
  X,
  BookOpen,
  ChevronDown,
  LogOut,
  Sparkles,
  TrendingUp,
  Layers,
  Truck,
  Percent,
  Video,
  Image,
} from "lucide-react";
import {
  getAdminUser,
  adminLogout,
  isAdminAuthenticated,
} from "../services/adminApi";
import logo from "../../assets/logo.png";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/admin/dashboard" },
  { label: "Commandes", icon: ShoppingBag, to: "/admin/orders" },
  { label: "Produits", icon: Package, to: "/admin/products" },
  { label: "Coffrets", icon: Gift, to: "/admin/bundles" },
  {
    label: "Demandes de stock",
    icon: PackageSearch,
    to: "/admin/stock-requests",
  },
  { label: "Produits vedettes", icon: Star, to: "/admin/featured-section" },
  { label: "Clients", icon: Users, to: "/admin/users" },
  { label: "Avis Clients", icon: Star, to: "/admin/reviews" },
  { label: "Messages", icon: Mail, to: "/admin/contacts" },
  { label: "Newsletter", icon: Megaphone, to: "/admin/newsletter" },
  { label: "Catégories", icon: Tag, to: "/admin/categories" },
  { label: "Blog", icon: BookOpen, to: "/admin/blog" },
  { label: "Promotions", icon: Sparkles, to: "/admin/promotions" },
  { label: "Codes promo", icon: Percent, to: "/admin/promo-codes" },
  { label: "Vidéos accueil", icon: Video, to: "/admin/homepage-videos" },
  { label: "Carrousel", icon: Image, to: "/admin/hero-slides" },
  { label: "Livraison", icon: Truck, to: "/admin/shipping" },
  { label: "Bandeau Catégories", icon: Layers, to: "/admin/hygiene-section" },
  {
    label: "Catégories en vedette",
    icon: Layers,
    to: "/admin/category-showcase",
  },
  { label: "Quiz IA", icon: Brain, to: "/admin/quiz" },
];

export default function AdminLayout() {
  const [open, setOpen] = useState(true);
  const [userMenu, setUserMenu] = useState(false);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [newClients, setNewClients] = useState(0);
  const [pendingReviews, setPendingReviews] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [newSubscribers, setNewSubscribers] = useState(0);
  const [pendingStockRequests, setPendingStockRequests] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const user = getAdminUser();
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true,
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => {
      setIsDesktop(mq.matches);
      setOpen(mq.matches); // desktop: sidebar large ouverte par défaut / mobile: fermée
    };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate("/admin/login", { replace: true });
    } else {
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    const fetchBadges = () => {
      getAdminBadges()
        .then((data) => {
          setPendingOrders(data?.orders?.pending ?? 0);
          setNewClients(data?.clients?.new_last_24h ?? 0);
          setPendingReviews(data?.reviews?.pending ?? 0);
          setUnreadMessages(data?.unread_contacts ?? 0);
          setNewSubscribers(data?.newsletter_new_last_24h ?? 0);
          setPendingStockRequests(data?.stock_requests?.pending ?? 0);
        })
        .catch(() => {});
    };
    fetchBadges();
    const interval = setInterval(fetchBadges, 60000);
    return () => clearInterval(interval);
  }, [authChecked, location.pathname]);

  if (!authChecked) return null;

  const handleLogout = async () => {
    await adminLogout();
    navigate("/admin/login");
  };

  return (
    <div
      className="admin-root flex min-h-screen bg-gray-50"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* ── Overlay mobile ── */}
      {!isDesktop && open && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        className={`fixed top-0 left-0 h-screen z-50 flex flex-col bg-[#0f2a1e] border-r border-white/5 transition-all duration-200 ${
          isDesktop
            ? open
              ? "w-60"
              : "w-16"
            : `w-64 ${open ? "translate-x-0" : "-translate-x-full"}`
        }`}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-4 border-b border-white/5"
          style={{ minHeight: 60 }}
        >
          <img
            src={logo}
            alt="logo"
            className="w-8 h-8 rounded-lg object-cover flex-shrink-0 bg-white p-0.5"
          />
          {(open || !isDesktop) && (
            <div className="overflow-hidden">
              <p className="text-white text-[13px] font-bold leading-tight truncate">
                ParaSunshine
              </p>
              <p className="text-white/30 text-[10px] uppercase tracking-widest">
                Administration
              </p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav
          className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 space-y-0.5"
          style={{ scrollbarWidth: "none" }}
        >
          {navItems.map(({ label, icon: Icon, to }) => {
            const badge =
              to === "/admin/orders"
                ? pendingOrders
                : to === "/admin/users"
                  ? newClients
                  : to === "/admin/reviews"
                    ? pendingReviews
                    : to === "/admin/contacts"
                      ? unreadMessages
                      : to === "/admin/newsletter"
                        ? newSubscribers
                        : to === "/admin/stock-requests"
                          ? pendingStockRequests
                          : 0;
            return (
              <NavLink
                key={to}
                to={to}
                title={!open ? label : undefined}
                onClick={() => !isDesktop && setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-colors relative ${
                    isActive
                      ? "bg-[#1a4731]/50 text-white"
                      : "text-white/50 hover:bg-white/5 hover:text-white/80"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-[3px] bg-[#D4AF37] rounded-r" />
                    )}
                    <span className="relative flex-shrink-0">
                      <Icon size={18} />
                      {badge > 0 && !open && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 border border-[#0f2a1e]" />
                      )}
                    </span>
                    {open && (
                      <span className="flex-1 flex items-center justify-between min-w-0">
                        <span className="truncate">{label}</span>
                        {badge > 0 && (
                          <span className="ml-2 flex-shrink-0 text-[10.5px] font-bold min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white flex items-center justify-center">
                            {badge > 99 ? "99+" : badge}
                          </span>
                        )}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        {open && (
          <div className="px-4 py-3 border-t border-white/5">
            <p className="text-[10px] text-white/20 tracking-wide">
              v1.0.0 — 2026
            </p>
          </div>
        )}
      </aside>

      {/* ── MAIN ── */}
      <div
        className={`flex flex-col flex-1 transition-all duration-200 ${
          isDesktop ? (open ? "ml-60" : "ml-16") : "ml-0"
        }`}
      >
        {/* Topbar */}
        <header
          className="sticky top-0 z-40 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-6"
          style={{ height: 60 }}
        >
          <button
            onClick={() => setOpen(!open)}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setUserMenu(!userMenu)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-[#1a4731] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {user?.name?.charAt(0).toUpperCase() || "A"}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-semibold text-gray-800 leading-tight">
                    {user?.name || "Admin"}
                  </p>
                  <p className="text-[10px] text-gray-400 leading-tight">
                    Administrateur
                  </p>
                </div>
                <ChevronDown
                  size={14}
                  className={`text-gray-400 transition-transform ${userMenu ? "rotate-180" : ""}`}
                />
              </button>

              {userMenu && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl border border-gray-100 shadow-lg overflow-hidden z-50">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={15} />
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
