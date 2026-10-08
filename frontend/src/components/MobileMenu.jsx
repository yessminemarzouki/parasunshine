import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { X, ChevronDown, Gift, Home, Package } from "lucide-react";
import { useCategories } from "../hooks/useCategories";

export default function MobileMenu({ isOpen, onClose }) {
  const { categories } = useCategories();
  const [expanded, setExpanded] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;

    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.overflow = "hidden";

    const preventTouch = (e) => {
      if (!e.target.closest("[data-mobile-menu-scrollable]")) {
        e.preventDefault();
      }
    };
    document.addEventListener("touchmove", preventTouch, { passive: false });

    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
      window.scrollTo(0, scrollY);
      document.removeEventListener("touchmove", preventTouch);
    };
  }, [isOpen]);

  const toggleExpand = (slug) =>
    setExpanded((prev) => (prev === slug ? null : slug));

  const handleNavigate = (to) => {
    onClose();
    navigate(to);
  };

  // (handleSearch retiré — barre de recherche supprimée)

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 z-[1100] transition-opacity duration-300 md:hidden ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 bottom-0 left-0 w-[86vw] max-w-[360px] bg-white z-[1101] flex flex-col shadow-2xl transition-transform duration-300 md:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ overscrollBehavior: "contain" }}
      >
        {/* Header du drawer */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <span className="font-bold text-[#1a5242] text-[1.05rem]">Menu</span>
          <button
            onClick={onClose}
            aria-label="Fermer le menu"
            className="w-9 h-9 rounded-lg flex items-center justify-center bg-gray-50 text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* (barre de recherche retirée — déjà présente dans le Header) */}

        {/* Liste scrollable */}
        <div
          data-mobile-menu-scrollable
          className="flex-1 overflow-y-auto"
          style={{ touchAction: "pan-y", overscrollBehavior: "contain" }}
        >
          <button
            onClick={() => handleNavigate("/")}
            className="flex items-center gap-3 w-full text-left px-5 py-3.5 border-b border-gray-100 text-gray-900 font-medium text-[0.95rem]"
          >
            <Home size={16} className="text-[#2d5f4f]" />
            Accueil
          </button>

          {categories.map((cat) => {
            const hasChildren = cat.children?.length > 0;
            const isExpanded = expanded === cat.slug;
            return (
              <div key={cat.id} className="border-b border-gray-100">
                <div className="flex items-center w-full px-5 py-3.5">
                  {/* Nom de la catégorie : navigue ou ouvre */}
                  <button
                    onClick={() => {
                      if (hasChildren) {
                        // 1er clic : ouvre le sous-menu
                        // 2ᵉ clic (si déjà ouvert) : navigue vers la catégorie
                        if (isExpanded) {
                          handleNavigate(`/products?category=${cat.slug}`);
                        } else {
                          toggleExpand(cat.slug);
                        }
                      } else {
                        handleNavigate(`/products?category=${cat.slug}`);
                      }
                    }}
                    className="flex-1 text-left text-gray-900 font-medium text-[0.95rem]"
                  >
                    {cat.name}
                  </button>

                  {/* Flèche : ouvre/ferme uniquement (ne navigue pas) */}
                  {hasChildren && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(cat.slug);
                      }}
                      aria-label={isExpanded ? "Fermer" : "Ouvrir"}
                      className="w-8 h-8 flex items-center justify-center -mr-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <ChevronDown
                        size={16}
                        className={`transition-transform duration-300 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  )}
                </div>

                {hasChildren && (
                  <div
                    className="grid transition-[grid-template-rows] duration-300 ease-in-out"
                    style={{
                      gridTemplateRows: isExpanded ? "1fr" : "0fr",
                    }}
                  >
                    <div className="overflow-hidden">
                      <div className="pb-2 bg-gray-50">
                        {cat.children.map((child) => (
                          <div key={child.id}>
                            <button
                              onClick={() =>
                                handleNavigate(
                                  `/products?category=${child.slug}`,
                                )
                              }
                              className="block w-full text-left pl-9 pr-5 py-2.5 text-[0.87rem] font-semibold text-gray-700"
                            >
                              {child.name}
                            </button>
                            {child.children?.length > 0 && (
                              <div className="pb-1.5">
                                {child.children.map((sub) => (
                                  <button
                                    key={sub.id}
                                    onClick={() =>
                                      handleNavigate(
                                        `/products?category=${sub.slug}`,
                                      )
                                    }
                                    className="block w-full text-left pl-12 pr-5 py-2 text-[0.83rem] text-gray-500"
                                  >
                                    {sub.name}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <button
            onClick={() => handleNavigate("/products?promo=true")}
            className="flex items-center gap-2 w-full text-left px-5 py-3.5 font-semibold text-[0.95rem] border-b border-gray-100"
            style={{ color: "#c62828" }}
          >
            <Gift size={16} /> Promotions
          </button>

          <button
            onClick={() => handleNavigate("/coffrets")}
            className="flex items-center gap-2 w-full text-left px-5 py-3.5 font-semibold text-[0.95rem]"
            style={{ color: "#1a5242" }}
          >
            <Package size={16} /> Nos coffrets
          </button>
        </div>
      </div>
    </>
  );
}
