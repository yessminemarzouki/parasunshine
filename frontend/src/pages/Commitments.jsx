import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Shield,
  Package,
  Clock,
  RefreshCw,
  Leaf,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { getShippingSettings } from "../services/api";

const getCommitments = (shipping) => [
  {
    icon: Shield,
    title: "Authenticité garantie",
    text: "Produits authentiques provenant directement des laboratoires et marques officielles.",
    items: [
      "Produits d'origine garantie",
      "Partenariats directs avec les laboratoires",
      "Traçabilité complète",
      "Certificats d'authenticité sur demande",
    ],
  },
  {
    icon: Package,
    title: "Emballage soigné",
    text: "Vos produits sont notre responsabilité jusqu'à leur réception.",
    items: [
      "Emballage sécurisé et discret",
      "Protection optimale contre les chocs",
      "Respect de la chaîne du froid si nécessaire",
      "Suivi de colis en temps réel",
    ],
  },
  {
    icon: Clock,
    title: "Livraison rapide",
    text: "Traitement et expédition dans les plus brefs délais.",
    items: [
      "Expédition sous 24h pour les produits en stock",
      `Livraison en ${shipping.delivery_days_min ?? 2} à ${shipping.delivery_days_max ?? 5} jours ouvrables`,
      ...(shipping.free_shipping_enabled
        ? [
            `Livraison gratuite dès ${shipping.free_shipping_threshold} DT d'achat`,
          ]
        : []),
      "Notification à chaque étape",
    ],
  },
  {
    icon: RefreshCw,
    title: "Retours & échanges",
    text: "Votre satisfaction est primordiale.",
    items: [
      "Droit de rétractation de 7 jours",
      "Échange ou remboursement possible",
      "Produits défectueux remplacés gratuitement",
      "Service client à votre écoute",
    ],
  },
  {
    icon: Leaf,
    title: "Impact environnemental",
    text: "Des pratiques durables et responsables.",
    items: [
      "Emballages recyclables",
      "Sélection de produits éco-responsables",
      "Partenariat avec des marques engagées",
      "Réduction des déchets plastiques",
    ],
  },
];

const CHARTER = [
  {
    title: "Sélection rigoureuse",
    text: "Chaque produit est choisi avec soin par notre équipe.",
  },
  {
    title: "Contrôle qualité",
    text: "Vérification systématique des dates et de l'état des produits.",
  },
  {
    title: "Service réactif",
    text: "Réponse à vos questions sous 24h maximum.",
  },
  {
    title: "Amélioration continue",
    text: "Nous écoutons vos retours pour progresser.",
  },
];

export default function Commitments() {
  const [shipping, setShipping] = useState({
    free_shipping_enabled: false,
    free_shipping_threshold: null,
    delivery_days_min: 2,
    delivery_days_max: 5,
  });

  useEffect(() => {
    getShippingSettings()
      .then(setShipping)
      .catch(() => {});
  }, []);

  const COMMITMENTS = getCommitments(shipping);

  return (
    <div
      className="bg-white min-h-screen"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Hero ── */}
      <div
        className="border-b border-gray-100"
        style={{ background: "#f6f9f7" }}
      >
        <div
          style={{
            maxWidth: 1300,
            margin: "0 auto",
            padding: "48px 20px 40px",
          }}
          className="md:!py-16 md:!px-8"
        >
          <nav className="flex items-center gap-1.5 text-[13px] text-gray-400 mb-8">
            <Link to="/" className="hover:text-[#1a5242] transition-colors">
              Accueil
            </Link>
            <ChevronRight size={13} />
            <span className="text-[#1a5242] font-semibold">Engagements</span>
          </nav>

          <div className="max-w-2xl text-left">
            <span
              className="inline-block text-[11px] font-bold uppercase tracking-widest mb-4 px-3 py-1 rounded-full"
              style={{ background: "#FFF3B0", color: "#355847" }}
            >
              Notre promesse
            </span>
            <h1 className="text-[1.6rem] md:text-[2rem] font-bold text-gray-900 mb-4 leading-tight">
              Ce que vous pouvez attendre de nous
            </h1>
            <p className="text-gray-500 text-[15px] md:text-[16px] leading-relaxed">
              Cinq principes simples qui guident chaque commande, chaque colis,
              chaque échange.
            </p>
          </div>
        </div>
      </div>

      {/* ── Engagements ── */}
      <div
        style={{ maxWidth: 900, margin: "0 auto" }}
        className="px-5 py-10 md:px-6 md:py-16"
      >
        <div className="space-y-0">
          {COMMITMENTS.map(({ icon: Icon, title, text, items }, i) => (
            <div
              key={title}
              className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4 md:gap-8 py-7 md:py-10"
              style={{
                borderTop: i === 0 ? "none" : "1px solid #f3f4f6",
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "#FFF3B0" }}
                >
                  <Icon size={17} style={{ color: "#355847" }} />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-gray-900 leading-snug">
                    {title}
                  </h3>
                  <p className="text-[13px] text-gray-400 mt-1 leading-relaxed">
                    {text}
                  </p>
                </div>
              </div>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li
                    key={item}
                    className="flex items-baseline gap-2.5 text-[13.5px] text-gray-600"
                  >
                    <span
                      className="w-1 h-1 rounded-full flex-shrink-0"
                      style={{ background: "#355847" }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Charte ── */}
      <div
        className="border-t border-gray-100"
        style={{ background: "#fafafa" }}
      >
        <div
          style={{ maxWidth: 900, margin: "0 auto" }}
          className="px-5 py-10 md:px-6 md:py-16"
        >
          <h2 className="text-[13px] font-bold text-gray-900 uppercase tracking-widest mb-8">
            Notre charte qualité
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {CHARTER.map(({ title, text }) => (
              <div key={title}>
                <div
                  className="w-8 h-0.5 mb-4"
                  style={{ background: "#355847" }}
                />
                <h3 className="text-[14px] font-bold text-gray-900 mb-1.5">
                  {title}
                </h3>
                <p className="text-[13px] text-gray-500 leading-relaxed">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div
        style={{ maxWidth: 900, margin: "0 auto" }}
        className="px-5 py-10 md:px-6 md:py-16"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 md:gap-6 border border-gray-100 rounded-2xl px-5 md:px-8 py-7 md:py-8">
          <div>
            <p className="text-[16px] font-bold text-gray-900 mb-1">
              Une question sur nos engagements ?
            </p>
            <p className="text-[13.5px] text-gray-400">
              Notre équipe vous répond sous 24h.
            </p>
          </div>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-[13.5px] transition-opacity hover:opacity-90"
            style={{ background: "#1a5242", color: "white" }}
          >
            Contactez-nous
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}
