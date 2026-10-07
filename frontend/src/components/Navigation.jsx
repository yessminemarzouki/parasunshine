import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Gift, PackageOpen } from "lucide-react";
import { useCategories } from "../hooks/useCategories";
import { STORAGE_URL } from "../config/api";

import visagephoto from "../assets/image.png";
import corps from "../assets/Banner_categorie_Soin-corps.webp";
import cheuveuxxx from "../assets/cheuveuxx.png";

const CAT_IMAGES = {
  visage: visagephoto,
  corps: corps,
  capillaire: cheuveuxxx,
};

const SOIN_CHILDREN_ORDER = ["visage", "corps", "capillaire"];

const NO_MEGA = [];

const sortByOrder = (arr, order, key = "slug") =>
  [...arr].sort((a, b) => {
    const ia = order.indexOf(a[key]);
    const ib = order.indexOf(b[key]);
    if (ia === -1 && ib === -1) return 0;
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

export default function Navigation() {
  const [activeMenu, setActiveMenu] = useState(null);
  const { categories } = useCategories();
  const timerRef = useRef(null);

  const enter = (slug) => {
    clearTimeout(timerRef.current);
    setActiveMenu(slug);
  };
  const leave = () => {
    timerRef.current = setTimeout(() => setActiveMenu(null), 120);
  };
  const NavLinkText = ({ children }) => (
    <span className="relative inline-block transition-colors duration-200 group-hover:text-[#1a5242]">
      {children}
      <span
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-[3px] rounded-full transition-all duration-300 group-hover:w-full"
        style={{ background: "linear-gradient(90deg, #1a5242, #d4af37)" }}
      />
    </span>
  );

  const renderSoinMenu = (cat) => {
    const sortedChildren = sortByOrder(cat.children || [], SOIN_CHILDREN_ORDER);
    return (
      <div
        className="absolute z-[1001] bg-white border border-gray-100 rounded-b-xl overflow-hidden"
        style={{
          top: 60,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100vw",
          maxWidth: 1200,
          boxShadow:
            "0 10px 25px rgba(0,0,0,0.06), 0 20px 50px rgba(0,0,0,0.08)",
          animation: "megaFade 0.25s ease",
        }}
      >
        <div className="px-10 pt-9 pb-7">
          <div
            className="grid gap-10"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            }}
          >
            {sortedChildren.map((child) => (
              <div
                key={child.id}
                className="min-w-[180px] bg-[#fafafa] p-2.5 rounded-xl transition-all hover:bg-white hover:shadow-md"
              >
                <Link
                  to={`/products?category=${child.slug}`}
                  className="block text-[0.72rem] tracking-[1.8px] font-extrabold uppercase text-gray-900 mb-3.5 pb-2 border-b border-gray-100 transition-colors hover:text-[#2d5f4f] hover:border-[#2d5f4f]"
                >
                  {child.name.toUpperCase()}
                </Link>
                {CAT_IMAGES[child.slug] && (
                  <img
                    src={CAT_IMAGES[child.slug]}
                    alt={child.name}
                    className="w-full rounded-lg mb-2.5 transition-transform duration-300"
                    style={{ height: 80, objectFit: "cover" }}
                  />
                )}
                {child.children?.length > 0 && (
                  <ul className="list-none p-0 m-0">
                    {child.children.map((sub) => (
                      <li key={sub.id} className="mb-1.5">
                        <Link
                          to={`/products?category=${sub.slug}`}
                          className="text-[0.87rem] text-gray-500 font-normal transition-all hover:text-[#2d5f4f] hover:pl-1 inline-block"
                        >
                          {sub.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderStandardMenu = (cat) => {
    const brands = cat.brands || [];
    const promo = cat.bundle
      ? {
          img: cat.bundle.image,
          title: cat.promo_title || cat.bundle.name,
          text: cat.promo_text,
          link: `/coffrets/${cat.bundle.slug}`,
          cta: cat.promo_cta || "Découvrir le coffret",
        }
      : null;
    return (
      <div
        className="absolute z-[1001] bg-white border border-gray-100 rounded-b-xl overflow-hidden"
        style={{
          top: 60,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100vw",
          maxWidth: 1200,
          boxShadow:
            "0 10px 25px rgba(0,0,0,0.06), 0 20px 50px rgba(0,0,0,0.08)",
          animation: "megaFade 0.25s ease",
        }}
      >
        <div className="px-10 pt-9 pb-7">
          <div className="grid gap-6 lg:gap-8 items-start w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_220px_300px]">
            <div className="flex flex-col gap-2.5 mt-11">
              {cat.children?.map((child) => (
                <div key={child.id} className="min-w-[180px]">
                  <Link
                    to={`/products?category=${child.slug}`}
                    className="block text-[0.72rem] tracking-[1.8px] font-extrabold uppercase text-gray-900 mb-3.5 pb-2 border-b border-gray-100 transition-colors hover:text-[#2d5f4f] hover:border-[#2d5f4f]"
                  >
                    {child.name.toUpperCase()}
                  </Link>
                  {child.children?.length > 0 && (
                    <ul className="list-none p-0 m-0 mt-1.5">
                      {child.children.map((sub) => (
                        <li key={sub.id} className="mb-1.5">
                          <Link
                            to={`/products?category=${sub.slug}`}
                            className="text-[0.87rem] text-gray-500 font-normal transition-all hover:text-[#2d5f4f] hover:pl-1 inline-block"
                          >
                            {sub.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            {brands.length > 0 && (
              <div className="min-w-[180px]">
                <span className="block text-[0.72rem] tracking-[1.5px] font-extrabold text-gray-400 mb-4 pb-2 border-b border-gray-100">
                  MARQUES POPULAIRES
                </span>
                <div
                  className="grid gap-2.5"
                  style={{ gridTemplateColumns: "1fr 1fr" }}
                >
                  {brands.map((b) => (
                    <Link
                      key={b.slug}
                      to={`/products?brand=${b.slug}`}
                      className="block"
                    >
                      <img
                        src={
                          b.logo?.startsWith("http")
                            ? b.logo
                            : `${STORAGE_URL}/${b.logo}`
                        }
                        alt={b.name}
                        className="w-full bg-white border border-gray-100 rounded-md p-2 object-contain"
                        style={{ height: 60, maxWidth: 110 }}
                      />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {promo && (
              <div className="hidden lg:block border-l border-gray-100 pl-7 min-w-0">
                <div>
                  {promo.img && (
                    <img
                      src={`${STORAGE_URL}/${promo.img}`}
                      alt={promo.title}
                      className="w-full block object-cover"
                      style={{ height: 140 }}
                    />
                  )}
                  <div className="pt-3">
                    <h4 className="text-[0.85rem] text-gray-900 mb-1.5">
                      {promo.title}
                    </h4>
                    <p className="text-[0.75rem] text-gray-500 leading-relaxed mb-2.5">
                      {promo.text}
                    </p>
                    <Link
                      to={promo.link}
                      className="text-[0.75rem] font-bold text-[#2d5f4f] no-underline hover:underline"
                    >
                      {promo.cta}
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="bg-[#f2f2e9] border-t border-gray-100 py-3.5 text-center">
          <Link
            to={`/products?category=${cat.slug}`}
            className="text-[0.88rem] font-semibold text-[#2d5f4f] no-underline hover:underline"
          >
            Voir tous les produits {cat.name.toLowerCase()} →
          </Link>
        </div>
      </div>
    );
  };
  const hasMegaMenu = (cat) =>
    cat.children?.length > 0 && !NO_MEGA.includes(cat.slug);
  const isSoin = (cat) => cat.slug === "soin";
  const sortedCats = categories; // déjà trié par useCategories

  return (
    <nav
      className="bg-white border-b-2 border-gray-100 relative"
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
    >
      <style>{`
        @keyframes megaFade {
          from { opacity: 0; transform: translate(-50%, 10px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
        @media (max-width: 768px) {
          .main-nav { display: none; }
        }
      `}</style>
      <div
        className="main-nav max-w-[1300px] mx-auto flex justify-center items-center relative"
        style={{ height: 60 }}
      >
        <Link
          to="/"
          className="group h-full px-4 flex items-center gap-1.5 text-gray-900 font-medium text-[0.92rem] no-underline transition-colors duration-200 hover:bg-[#1a5242]/[0.04]"
        >
          <NavLinkText>Accueil</NavLinkText>
        </Link>

        {sortedCats.map((cat) => (
          <div
            key={cat.id}
            className="h-full flex items-center"
            onMouseEnter={() => (hasMegaMenu(cat) ? enter(cat.slug) : null)}
            onMouseLeave={hasMegaMenu(cat) ? leave : null}
          >
            <Link
              to={`/products?category=${cat.slug}`}
              className="group h-full px-4 flex items-center gap-1.5 text-gray-900 font-medium text-[0.92rem] no-underline transition-colors duration-200 hover:bg-[#1a5242]/[0.04]"
            >
              <NavLinkText>{cat.name}</NavLinkText>
              {hasMegaMenu(cat) && (
                <ChevronDown
                  size={13}
                  className="text-[#1a5242] transition-transform duration-200 group-hover:rotate-180"
                />
              )}
            </Link>
            {activeMenu === cat.slug &&
              hasMegaMenu(cat) &&
              (isSoin(cat) ? renderSoinMenu(cat) : renderStandardMenu(cat))}
          </div>
        ))}

        <Link
          to="/products?promo=true"
          className="group relative h-full px-4 flex items-center gap-1.5 font-semibold text-[0.92rem] no-underline transition-colors duration-200 hover:bg-[#c62828]/[0.05]"
          style={{ color: "#c62828" }}
        >
          <Gift
            size={14}
            className="transition-transform duration-200 group-hover:scale-110"
          />
          <span className="relative inline-block">
            Promotions
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-[3px] rounded-full bg-[#c62828] transition-all duration-300 group-hover:w-full" />
          </span>
        </Link>

        <Link
          to="/coffrets"
          className="group h-full px-4 flex items-center gap-1.5 text-gray-900 font-medium text-[0.92rem] no-underline transition-colors duration-200 hover:bg-[#1a5242]/[0.04]"
        >
          <PackageOpen
            size={14}
            className="text-[#d4af37] transition-transform duration-200 group-hover:-translate-y-0.5"
          />
          <NavLinkText>Nos coffrets</NavLinkText>
        </Link>
      </div>
    </nav>
  );
}
