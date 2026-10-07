import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  ShoppingCart,
  Package,
  CreditCard,
  CheckCircle,
  Zap,
  Box,
  History,
  Heart,
  Gift,
  ChevronRight,
  Lock,
  Lightbulb,
} from "lucide-react";
import { getShippingSettings } from "../services/api";

const getSteps = (shipping) => [
  {
    icon: ShoppingCart,
    num: "01",
    title: "Sélection des produits",
    items: [
      "Parcourez notre catalogue de produits",
      "Utilisez les filtres pour trouver rapidement ce que vous cherchez",
      "Cliquez sur un produit pour voir les détails",
      "Choisissez la quantité et ajoutez au panier",
    ],
    tip: "Ajoutez vos produits préférés à votre liste de favoris pour les retrouver facilement.",
  },
  {
    icon: Package,
    num: "02",
    title: "Vérification du panier",
    items: [
      "Cliquez sur l'icône panier en haut à droite",
      "Vérifiez les produits et quantités",
      "Modifiez les quantités si nécessaire",
      "Cliquez sur « Passer la commande »",
    ],
    tip: shipping.free_shipping_enabled
      ? `Livraison gratuite dès ${shipping.free_shipping_threshold} DT d'achat !`
      : `Frais de livraison : ${shipping.shipping_cost} DT.`,
  },
  {
    icon: CreditCard,
    num: "03",
    title: "Informations de livraison",
    items: [
      "Connectez-vous à votre compte ou créez-en un",
      "Renseignez votre adresse de livraison complète",
      "Vérifiez votre numéro de téléphone",
    ],
    tip: "Vos informations sont sauvegardées pour vos prochaines commandes.",
  },
  {
    icon: CheckCircle,
    num: "04",
    title: "Confirmation",
    items: [
      "Vérifiez une dernière fois toutes les informations",
      "Cliquez sur « Valider ma commande »",
      "Vous recevez immédiatement un email de confirmation",
      "Suivez votre commande depuis votre compte",
    ],
    tip: `C'est fait ! Livraison estimée en ${shipping.delivery_days_min ?? 2} à ${shipping.delivery_days_max ?? 5} jours.`,
  },
];

const ACCOUNT_BENEFITS = [
  {
    icon: Zap,
    title: "Commande rapide",
    text: "Vos informations sont sauvegardées pour les prochaines fois",
  },
  {
    icon: Box,
    title: "Suivi de commandes",
    text: "Suivez l'état de toutes vos commandes en temps réel",
  },
  {
    icon: History,
    title: "Historique",
    text: "Accédez à l'historique complet de vos achats",
  },
  {
    icon: Heart,
    title: "Liste de favoris",
    text: "Enregistrez vos produits préférés",
  },
  {
    icon: Gift,
    title: "Offres exclusives",
    text: "Recevez des promotions en avant-première",
  },
];

const FAQS = [
  {
    q: "Puis-je commander sans créer de compte ?",
    a: "Oui, vous pouvez commander en tant qu'invité. Cependant, créer un compte vous permet de bénéficier de nombreux avantages.",
  },
  {
    q: "Puis-je modifier ma commande après validation ?",
    a: "Vous avez 2 heures maximum après la validation pour modifier votre commande en nous contactant au +216 94 169 416.",
  },
  {
    q: "Quand ma commande sera-t-elle expédiée ?",
    a: "Les commandes passées avant 14h sont expédiées le jour même. Après 14h, elles sont expédiées le lendemain.",
  },
];

export default function HowToOrder() {
  const [shipping, setShipping] = useState({
    free_shipping_enabled: false,
    free_shipping_threshold: null,
    shipping_cost: 7,
    delivery_days_min: 2,
    delivery_days_max: 5,
  });

  useEffect(() => {
    getShippingSettings()
      .then(setShipping)
      .catch(() => {});
  }, []);

  const STEPS = getSteps(shipping);

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
            <span className="text-[#1a5242] font-semibold">
              Comment commander
            </span>
          </nav>

          <div className="max-w-2xl text-left">
            <span
              className="inline-block text-[11px] font-bold uppercase tracking-widest mb-4 px-3 py-1 rounded-full"
              style={{ background: "#FFF3B0", color: "#355847" }}
            >
              Guide d'achat
            </span>
            <h1 className="text-[1.6rem] md:text-[2rem] font-bold text-gray-900 mb-4 leading-tight">
              Commander en 4 étapes simples
            </h1>
            <p className="text-gray-500 text-[15px] md:text-[16px] leading-relaxed">
              Un guide complet pour passer votre commande en toute simplicité.
            </p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto" }} className="px-5 md:px-6">
        {/* ── 4 étapes ── */}
        <section className="py-16 border-b border-gray-100">
          <div className="space-y-0">
            {STEPS.map(({ icon: Icon, num, title, items, tip }, i) => (
              <div
                key={num}
                className="grid grid-cols-[50px_1fr] md:grid-cols-[80px_1fr] gap-4 md:gap-8 py-7 md:py-10"
                style={{
                  borderTop: i === 0 ? "none" : "1px solid #f3f4f6",
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "#FFF3B0" }}
                  >
                    <Icon size={16} style={{ color: "#355847" }} />
                  </div>
                  <p
                    className="text-[13px] font-bold"
                    style={{ color: "#355847" }}
                  >
                    {num}
                  </p>
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-gray-900 mb-4">
                    {title}
                  </h3>
                  <ul className="space-y-2 mb-4">
                    {items.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2.5 text-[13.5px] text-gray-600"
                      >
                        <span
                          className="w-1 h-1 rounded-full flex-shrink-0 mt-2"
                          style={{ background: "#355847" }}
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-start gap-2 text-[12.5px] text-gray-500 italic">
                    <Lightbulb
                      size={13}
                      className="flex-shrink-0 mt-0.5"
                      style={{ color: "#355847" }}
                    />
                    {tip}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Mode de paiement ── */}
        <section className="py-16 border-b border-gray-100">
          <h2 className="text-[13px] font-bold text-gray-900 uppercase tracking-widest mb-8">
            Mode de paiement
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <CreditCard size={18} style={{ color: "#355847" }} />
                <p className="text-[14.5px] font-bold text-gray-900">
                  Paiement à la livraison
                </p>
              </div>
              <ul className="space-y-2 mb-4">
                {[
                  "Aucune avance de frais nécessaire",
                  "Payez en espèces à la réception du colis",
                  "Vérifiez votre commande avant de payer",
                  "Le livreur vous remet une facture",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-[13.5px] text-gray-600"
                  >
                    <span
                      className="w-1 h-1 rounded-full flex-shrink-0 mt-2"
                      style={{ background: "#355847" }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-[12.5px] text-gray-500 italic">
                Astuce : préparez l'appoint si possible pour faciliter la
                transaction.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <Lock size={18} style={{ color: "#355847" }} />
                <p className="text-[14.5px] font-bold text-gray-900">
                  Pourquoi uniquement à la livraison ?
                </p>
              </div>
              <div className="space-y-3">
                {[
                  {
                    label: "Confiance",
                    text: "vous ne payez qu'après avoir reçu et vérifié votre commande",
                  },
                  {
                    label: "Simplicité",
                    text: "pas besoin de carte bancaire ou de compte en ligne",
                  },
                  {
                    label: "Sécurité",
                    text: "aucun risque lié aux paiements en ligne",
                  },
                  {
                    label: "Flexibilité",
                    text: "vous pouvez refuser le colis s'il est endommagé",
                  },
                ].map(({ label, text }) => (
                  <p key={label} className="text-[13.5px] text-gray-600">
                    <strong className="text-gray-900">{label} :</strong> {text}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Avantages compte ── */}
        <section className="py-16 border-b border-gray-100">
          <h2 className="text-[13px] font-bold text-gray-900 uppercase tracking-widest mb-8">
            Pourquoi créer un compte ?
          </h2>
          <div
            className="grid gap-x-8 gap-y-6 mb-8"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            }}
          >
            {ACCOUNT_BENEFITS.map(({ icon: Icon, title, text }) => (
              <div key={title}>
                <Icon
                  size={17}
                  style={{ color: "#355847" }}
                  className="mb-2.5"
                />
                <p className="text-[13.5px] font-bold text-gray-900 mb-1">
                  {title}
                </p>
                <p className="text-[12.5px] text-gray-500 leading-relaxed">
                  {text}
                </p>
              </div>
            ))}
          </div>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-[13.5px] transition-opacity hover:opacity-90"
            style={{ background: "#1a5242" }}
          >
            Créer mon compte
            <ChevronRight size={15} />
          </Link>
        </section>

        {/* ── FAQ rapide ── */}
        <section className="py-16">
          <h2 className="text-[13px] font-bold text-gray-900 uppercase tracking-widest mb-8">
            Questions fréquentes
          </h2>
          <div className="border-t border-gray-100">
            {FAQS.map(({ q, a }) => (
              <div key={q} className="border-b border-gray-100 py-5">
                <p className="text-[14px] font-semibold text-gray-900 mb-1.5">
                  {q}
                </p>
                <p className="text-[13.5px] text-gray-500 leading-relaxed max-w-lg">
                  {a}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
