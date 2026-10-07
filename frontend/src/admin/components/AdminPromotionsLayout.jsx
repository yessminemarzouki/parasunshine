import { NavLink, Outlet } from "react-router-dom";
import { Sparkles, TrendingUp, Wand2, Tag } from "lucide-react";

const TABS = [
  { to: "banniere", label: "Bannière Promo", icon: Sparkles },
  { to: "top-promo", label: "Top Promo", icon: TrendingUp },
  { to: "assistant", label: "Assistant Promotions", icon: Wand2 },
  { to: "campagnes", label: "Campagnes", icon: Tag },
];

export default function AdminPromotionsLayout() {
  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="mb-6">
        <h1 className="text-[21px] font-extrabold text-gray-900 tracking-tight leading-tight mb-1">
          Promotions
        </h1>
        <p className="text-[13px] text-gray-400">
          Gérez la bannière promotionnelle, la section Top Promo et les
          promotions produits
        </p>
      </div>

      <div className="flex gap-0.5 bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto">
        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-white text-[#1a4731] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`
            }
          >
            <Icon size={15} />
            {label}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  );
}
