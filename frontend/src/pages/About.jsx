import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

import {
  Shield,
  Award,
  Truck,
  HeadphonesIcon,
  Package,
  CheckCircle,
  Leaf,
  MapPin,
  Clock,
  Phone,
  Mail,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { getShippingSettings } from "../services/api";

export default function About() {
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

  const stats = [
    { val: "500+", label: "Produits référencés" },
    ...(shipping.free_shipping_enabled
      ? [
          {
            val: `${shipping.free_shipping_threshold} DT`,
            label: "Livraison gratuite dès",
          },
        ]
      : []),
    { val: "100%", label: "Produits authentiques" },
    {
      val: `${shipping.delivery_days_min}–${shipping.delivery_days_max}j`,
      label: "Délai de livraison",
    },
  ];

  const values = [
    {
      icon: Shield,
      title: "Authenticité garantie",
      text: "Tous nos produits sont 100% authentiques, provenant directement des laboratoires et marques officielles.",
    },
    {
      icon: Award,
      title: "Qualité premium",
      text: "Nous travaillons exclusivement avec des marques reconnues et réputées.",
    },
    {
      icon: Truck,
      title: "Livraison rapide",
      text: `Livraison dans toute la Tunisie sous ${shipping.delivery_days_min} à ${shipping.delivery_days_max} jours ouvrables.${shipping.free_shipping_enabled ? ` Gratuite dès ${shipping.free_shipping_threshold} DT.` : ""}`,
    },
    {
      icon: HeadphonesIcon,
      title: "Service client dédié",
      text: "Notre équipe est à votre écoute du lundi au samedi.",
    },
  ];

  const engagements = [
    {
      icon: Package,
      title: "Emballage soigné",
      text: "Colis discrets et sécurisés pour garantir l'intégrité de vos produits jusqu'à votre domicile.",
    },
    {
      icon: CheckCircle,
      title: "Satisfaction client",
      text: "En cas de problème avec votre commande, nous trouvons une solution rapidement.",
    },
    {
      icon: Leaf,
      title: "Produits naturels",
      text: "Une sélection de cosmétiques bio et respectueux de l'environnement.",
    },
  ];

  const contact = [
    {
      icon: MapPin,
      label: "Adresse",
      val: "Route Gremda Km3, en face Clinique Chams, Sfax, Tunisie",
    },
    { icon: Clock, label: "Horaires", val: "Lundi – Samedi : 9h – 20h" },
    { icon: Phone, label: "Téléphone", val: "+216 94 169 416" },
    { icon: Mail, label: "Email", val: "parasunshine25@gmail.com" },
  ];

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
            <span className="text-[#1a5242] font-semibold">À propos</span>
          </nav>

          <div className="max-w-2xl text-left">
            <span
              className="inline-block text-[11px] font-bold uppercase tracking-widest mb-4 px-3 py-1 rounded-full"
              style={{ background: "#FFF3B0", color: "#355847" }}
            >
              Notre histoire
            </span>
            <h1 className="text-[1.6rem] md:text-[2rem] font-bold text-gray-900 mb-4 leading-tight">
              Votre parapharmacie de confiance en Tunisie
            </h1>
            <p className="text-gray-500 text-[15px] md:text-[16px] leading-relaxed">
              Produits authentiques, conseils personnalisés, service dédié —
              depuis Sfax, pour toute la Tunisie.
            </p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1300, margin: "0 auto", padding: "0 24px" }}>
        {/* ── Histoire + Stats ── */}
        <section className="py-16 border-b border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr] gap-8 md:gap-10 max-w-[1100px] mx-auto">
            <div>
              <p className="text-[15px] text-gray-600 leading-relaxed mb-4">
                Fondée en Tunisie, ParaSunshine est née de la volonté de rendre
                accessibles à tous des produits de parapharmacie authentiques et
                de qualité. Située à Sfax, nous combinons l'expertise d'une
                équipe passionnée avec la commodité d'un service en ligne.
              </p>
              <p className="text-[15px] text-gray-600 leading-relaxed">
                Nous croyons que prendre soin de soi devrait être simple et
                accessible. Chaque produit de notre catalogue est sélectionné
                rigoureusement pour vous garantir efficacité et authenticité.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-6 content-start">
              {stats.map(({ val, label }) => (
                <div key={label}>
                  <p
                    className="text-[1.9rem] font-bold"
                    style={{ color: "#1a5242" }}
                  >
                    {val}
                  </p>
                  <p className="text-[12.5px] text-gray-400 font-medium mt-0.5">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Valeurs ── */}
        <section className="py-16 border-b border-gray-100">
          <h2 className="text-[13px] font-bold text-gray-900 uppercase tracking-widest mb-8">
            Ce qui nous définit
          </h2>
          <div className="space-y-0">
            {values.map(({ icon: Icon, title, text }, i) => (
              <div
                key={title}
                className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-3 md:gap-8 py-6 md:py-8"
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
                  <h3 className="text-[14.5px] font-bold text-gray-900 leading-snug pt-1.5">
                    {title}
                  </h3>
                </div>
                <p className="text-[13.5px] text-gray-500 leading-relaxed">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Engagements ── */}
        <section className="py-16 border-b border-gray-100">
          <h2 className="text-[13px] font-bold text-gray-900 uppercase tracking-widest mb-8">
            Notre engagement
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {engagements.map(({ icon: Icon, title, text }) => (
              <div key={title}>
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: "#FFF3B0" }}
                >
                  <Icon size={17} style={{ color: "#355847" }} />
                </div>
                <h3 className="text-[14px] font-bold text-gray-900 mb-1.5">
                  {title}
                </h3>
                <p className="text-[13px] text-gray-500 leading-relaxed">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Équipe ── */}
        <section className="py-16 border-b border-gray-100">
          <div className="max-w-xl mx-auto md:mx-0">
            <h2 className="text-[13px] font-bold text-gray-900 uppercase tracking-widest mb-4">
              Notre équipe
            </h2>
            <p className="text-[15px] text-gray-600 leading-relaxed">
              ParaSunshine, c'est avant tout une équipe passionnée et à
              l'écoute, composée de professionnels du secteur de la
              parapharmacie. Nous sommes là pour vous accompagner dans vos choix
              et vous conseiller sur les produits les mieux adaptés à vos
              besoins.
            </p>
          </div>
        </section>

        {/* ── Point de vente ── */}
        <section className="py-16 border-b border-gray-100">
          <h2 className="text-[13px] font-bold text-gray-900 uppercase tracking-widest mb-8">
            Retrouvez-nous à Sfax
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {contact.map(({ icon: Icon, label, val }) => (
              <div key={label} className="flex items-start gap-3">
                <Icon
                  size={16}
                  style={{ color: "#355847" }}
                  className="flex-shrink-0 mt-0.5"
                />
                <div>
                  <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">
                    {label}
                  </p>
                  <p className="text-[13.5px] font-medium text-gray-800">
                    {val}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 md:gap-6 border border-gray-100 rounded-2xl px-5 md:px-8 py-7 md:py-8">
            <div>
              <p className="text-[16px] font-bold text-gray-900 mb-1">
                Prêt à découvrir nos produits ?
              </p>
              <p className="text-[13.5px] text-gray-400">
                Explorez notre gamme et profitez de nos conseils personnalisés.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-[13.5px] border border-gray-200 text-gray-600 hover:border-[#1a5242] hover:text-[#1a5242] transition-all"
              >
                Nous contacter
              </Link>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-[13.5px] transition-opacity hover:opacity-90"
                style={{ background: "#1a5242", color: "white" }}
              >
                Voir nos produits
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
