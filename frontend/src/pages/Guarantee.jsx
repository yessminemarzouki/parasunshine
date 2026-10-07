import { Link } from "react-router-dom";
import {
  CheckCircle,
  AlertTriangle,
  Mail,
  Phone,
  MessageSquare,
  ChevronRight,
} from "lucide-react";

const GUARANTEE_STEPS = [
  {
    title: "Approvisionnement direct",
    text: "Nous travaillons exclusivement avec des distributeurs agréés et des laboratoires officiels.",
    items: [
      "Partenariats directs avec les marques",
      "Circuit d'approvisionnement contrôlé",
      "Pas d'intermédiaires douteux",
      "Traçabilité complète de chaque produit",
    ],
  },
  {
    title: "Vérification systématique",
    text: "Chaque produit reçu fait l'objet d'un contrôle qualité rigoureux avant d'être mis en vente.",
    items: [
      "Vérification des numéros de lot",
      "Contrôle des dates de péremption (min. 6 mois)",
      "Inspection des emballages et sceaux",
      "Vérification des hologrammes de sécurité",
    ],
  },
  {
    title: "Conditions de stockage optimales",
    text: "Nos produits sont stockés dans des conditions optimales pour préserver leur qualité.",
    items: [
      "Température contrôlée",
      "Protection contre la lumière et l'humidité",
      "Respect de la chaîne du froid si nécessaire",
      "Rotation des stocks (FIFO)",
    ],
  },
  {
    title: "Certificats disponibles",
    text: "Sur demande, nous fournissons les certificats d'authenticité de nos fournisseurs.",
    items: [
      "Certificats de conformité",
      "Factures d'achat des distributeurs officiels",
      "Autorisation de mise sur le marché (AMM)",
      "Coordonnées des laboratoires",
    ],
  },
];

const BRANDS = [
  "La Roche-Posay",
  "Vichy",
  "Avène",
  "Bioderma",
  "Eucerin",
  "Nuxe",
  "Caudalie",
  "SVR",
  "Ducray",
  "Mustela",
  "A-Derma",
  "Klorane",
];

const AUTHENTICITY_SIGNS = [
  {
    label: "Emballage intact",
    text: "Pas de traces d'ouverture, scellés intacts",
  },
  {
    label: "Étiquetage clair",
    text: "Informations lisibles en français ou arabe",
  },
  { label: "Numéro de lot", text: "Présent et clairement visible" },
  {
    label: "Date de péremption",
    text: "Imprimée (pas collée) et suffisamment éloignée",
  },
  { label: "Code-barres", text: "Lisible et correspondant au produit" },
  { label: "Notice", text: "Présente et dans la langue appropriée" },
];

const COUNTERFEIT_SIGNS = [
  "Prix anormalement bas par rapport au marché",
  "Vendeurs non identifiés ou sans adresse physique",
  "Emballages différents de l'original",
  "Fautes d'orthographe sur l'étiquette",
  "Absence de numéro de lot ou de date de péremption",
  "Texture, couleur ou odeur inhabituelles",
];

export default function Guarantee() {
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
              Garantie authenticité
            </span>
          </nav>

          <div className="max-w-2xl text-left">
            <span
              className="inline-block text-[11px] font-bold uppercase tracking-widest mb-4 px-3 py-1 rounded-full"
              style={{ background: "#FFF3B0", color: "#355847" }}
            >
              Notre promesse
            </span>
            <h1 className="text-[1.6rem] md:text-[2rem] font-bold text-gray-900 mb-4 leading-tight">
              Garantie d'authenticité
            </h1>
            <p className="text-gray-500 text-[15px] md:text-[16px] leading-relaxed">
              100% de produits authentiques garantis — votre santé est notre
              priorité.
            </p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto" }} className="px-5 md:px-6">
        {/* ── Stats ── */}
        <section className="py-14 border-b border-gray-100">
          <div className="grid grid-cols-3 gap-4 md:gap-8">
            {[
              { val: "100%", label: "Produits authentiques" },
              { val: "0", label: "Contrefaçon tolérée" },
              { val: "50+", label: "Marques partenaires" },
            ].map(({ val, label }) => (
              <div key={label}>
                <p
                  className="text-[2rem] font-bold"
                  style={{ color: "#1a5242" }}
                >
                  {val}
                </p>
                <p className="text-[13px] text-gray-400 font-medium mt-1">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 4 étapes garantie ── */}
        <section className="py-16 border-b border-gray-100">
          <h2 className="text-[13px] font-bold text-gray-900 uppercase tracking-widest mb-8">
            Comment nous garantissons l'authenticité
          </h2>
          <div className="space-y-0">
            {GUARANTEE_STEPS.map(({ title, text, items }, i) => (
              <div
                key={title}
                className="grid grid-cols-[36px_1fr] md:grid-cols-[50px_1fr] gap-4 md:gap-8 py-6 md:py-8"
                style={{
                  borderTop: i === 0 ? "none" : "1px solid #f3f4f6",
                }}
              >
                <p
                  className="text-[13px] font-bold"
                  style={{ color: "#355847" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </p>
                <div>
                  <h3 className="text-[14.5px] font-bold text-gray-900 mb-2">
                    {title}
                  </h3>
                  <p className="text-[13.5px] text-gray-500 leading-relaxed mb-3">
                    {text}
                  </p>
                  <ul className="space-y-1.5">
                    {items.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2.5 text-[13px] text-gray-600"
                      >
                        <span
                          className="w-1 h-1 rounded-full flex-shrink-0 mt-2"
                          style={{ background: "#355847" }}
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Marques ── */}
        <section className="py-16 border-b border-gray-100">
          <h2 className="text-[13px] font-bold text-gray-900 uppercase tracking-widest mb-2">
            Nos marques partenaires
          </h2>
          <p className="text-[13.5px] text-gray-400 mb-6 max-w-md">
            Les plus grandes marques de parapharmacie reconnues mondialement.
          </p>
          <div className="flex flex-wrap gap-2">
            {BRANDS.map((brand) => (
              <span
                key={brand}
                className="px-3.5 py-1.5 rounded-lg border border-gray-200 text-[12.5px] font-medium text-gray-600"
              >
                {brand}
              </span>
            ))}
            <span className="px-3.5 py-1.5 rounded-lg border border-dashed border-gray-200 text-[12.5px] text-gray-400 italic">
              Et bien d'autres...
            </span>
          </div>
        </section>

        {/* ── Reconnaître un produit authentique ── */}
        <section className="py-16 border-b border-gray-100">
          <h2 className="text-[13px] font-bold text-gray-900 uppercase tracking-widest mb-8">
            Comment reconnaître un produit authentique ?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
            {/* Signes d'authenticité */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <CheckCircle size={16} style={{ color: "#355847" }} />
                <p className="text-[14px] font-bold text-gray-900">
                  Signes à vérifier
                </p>
              </div>
              <div className="space-y-3">
                {AUTHENTICITY_SIGNS.map(({ label, text }) => (
                  <p key={label} className="text-[13.5px] text-gray-600">
                    <strong className="text-gray-900">{label} :</strong> {text}
                  </p>
                ))}
              </div>
            </div>

            {/* Attention contrefaçons */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <AlertTriangle size={16} className="text-red-500" />
                <p className="text-[14px] font-bold text-gray-900">
                  Attention aux contrefaçons
                </p>
              </div>
              <p className="text-[13.5px] text-gray-500 leading-relaxed mb-4">
                Les produits contrefaits peuvent contenir des substances
                dangereuses. Soyez vigilant :
              </p>
              <ul className="space-y-2.5">
                {COUNTERFEIT_SIGNS.map((sign) => (
                  <li
                    key={sign}
                    className="flex items-start gap-2.5 text-[13.5px] text-gray-600"
                  >
                    <span className="w-1 h-1 rounded-full flex-shrink-0 mt-2 bg-red-400" />
                    {sign}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── En cas de doute ── */}
        <section className="py-16 border-b border-gray-100">
          <h2 className="text-[13px] font-bold text-gray-900 uppercase tracking-widest mb-2">
            Que faire en cas de doute ?
          </h2>
          <p className="text-[13.5px] text-gray-400 mb-8 max-w-md">
            Si vous avez le moindre doute sur l'authenticité d'un produit reçu,
            contactez-nous immédiatement.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: Mail,
                label: "Email",
                val: "parasunshine25@gmail.com",
                href: "mailto:parasunshine25@gmail.com",
              },
              {
                icon: Phone,
                label: "Téléphone",
                val: "+216 94 169 416",
                href: "tel:+21694169416",
              },
              {
                icon: MessageSquare,
                label: "WhatsApp",
                val: "+216 94 169 416",
                href: "https://wa.me/21694169416",
              },
            ].map(({ icon: Icon, label, val, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col gap-2 p-4 border border-gray-100 rounded-xl hover:border-[#1a5242] transition-colors"
              >
                <Icon size={17} style={{ color: "#355847" }} />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    {label}
                  </p>
                  <p className="text-[13px] font-semibold text-gray-800">
                    {val}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* ── Promesse finale ── */}
        <section className="py-16">
          <div className="border border-gray-100 rounded-2xl p-6 md:p-10 text-center">
            <p
              className="text-[11px] font-bold uppercase tracking-widest mb-4 px-3 py-1 rounded-full inline-block"
              style={{ background: "#FFF3B0", color: "#355847" }}
            >
              Notre engagement
            </p>
            <blockquote className="text-[15px] text-gray-600 leading-relaxed max-w-xl mx-auto mb-4 italic">
              "Nous nous engageons à ne jamais compromettre la qualité et
              l'authenticité de nos produits. Si un produit ne répond pas à nos
              standards, nous le retirons immédiatement de notre catalogue."
            </blockquote>
            <p className="text-[13px] font-bold" style={{ color: "#1a5242" }}>
              — L'équipe ParaSunshine
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
