import { Link } from "react-router-dom";
import { ChevronRight, ArrowLeft } from "lucide-react";

const SECTIONS = [
  {
    num: "1",
    title: "Éditeur du site",
    content: (
      <div className="space-y-2 text-[13.5px] text-gray-600 leading-relaxed">
        <p>
          <strong className="text-gray-800 font-semibold">
            Nom de l'entreprise :
          </strong>{" "}
          ParaSunshine
        </p>
        <p>
          <strong className="text-gray-800 font-semibold">
            Forme juridique :
          </strong>{" "}
          <span className="text-gray-400 italic">[À compléter]</span>
        </p>
        <p>
          <strong className="text-gray-800 font-semibold">
            Capital social :
          </strong>{" "}
          <span className="text-gray-400 italic">[À compléter]</span>
        </p>
        <p>
          <strong className="text-gray-800 font-semibold">
            Siège social :
          </strong>{" "}
          Route Gremda Km3, en face Clinique Chams, Sfax, Tunisie
        </p>
        <p>
          <strong className="text-gray-800 font-semibold">Email :</strong>{" "}
          <a
            href="mailto:parasunshine25@gmail.com"
            className="underline underline-offset-2 hover:opacity-70 transition-opacity"
            style={{ color: "#1a5242" }}
          >
            parasunshine25@gmail.com
          </a>
        </p>
        <p>
          <strong className="text-gray-800 font-semibold">Téléphone :</strong>{" "}
          +216 94 169 416
        </p>
      </div>
    ),
  },
  {
    num: "2",
    title: "Directeur de la publication",
    content: (
      <div className="space-y-2 text-[13.5px] text-gray-600">
        <p>
          <strong className="text-gray-800 font-semibold">Nom :</strong>{" "}
          <span className="text-gray-400 italic">[À compléter]</span>
        </p>
        <p>
          <strong className="text-gray-800 font-semibold">Fonction :</strong>{" "}
          Gérant
        </p>
      </div>
    ),
  },
  {
    num: "3",
    title: "Hébergement",
    content: (
      <div className="space-y-2 text-[13.5px] text-gray-600">
        <p>
          <strong className="text-gray-800 font-semibold">Hébergeur :</strong>{" "}
          <span className="text-gray-400 italic">
            [À compléter lors du déploiement]
          </span>
        </p>
        <p>
          <strong className="text-gray-800 font-semibold">Adresse :</strong>{" "}
          <span className="text-gray-400 italic">[À compléter]</span>
        </p>
      </div>
    ),
  },
  {
    num: "4",
    title: "Propriété intellectuelle",
    content: (
      <p className="text-[13.5px] text-gray-600 leading-relaxed">
        L'ensemble du contenu présent sur le site ParaSunshine (structure,
        textes, logos, images, etc.) est la propriété exclusive de ParaSunshine
        ou de ses partenaires. Toute reproduction, distribution, modification,
        adaptation, retransmission ou publication de ces différents éléments est
        strictement interdite sans l'accord exprès par écrit de ParaSunshine.
      </p>
    ),
  },

  {
    num: "5",
    title: "Données personnelles",
    content: (
      <p className="text-[13.5px] text-gray-600 leading-relaxed">
        Les données personnelles collectées sur le site sont traitées
        conformément à notre{" "}
        <Link
          to="/politique-confidentialite"
          className="underline underline-offset-2 hover:opacity-70 transition-opacity"
          style={{ color: "#1a5242" }}
        >
          Politique de confidentialité
        </Link>
        . Conformément à la loi, vous disposez d'un droit d'accès, de
        rectification et de suppression de vos données personnelles.
      </p>
    ),
  },
  {
    num: "6",
    title: "Litiges",
    content: (
      <p className="text-[13.5px] text-gray-600 leading-relaxed">
        En cas de litige, une solution amiable sera recherchée avant toute
        action judiciaire. À défaut, les tribunaux tunisiens seront seuls
        compétents.
      </p>
    ),
  },
];

export default function LegalNotice() {
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
              Mentions légales
            </span>
          </nav>

          <div className="max-w-2xl text-left">
            <span
              className="inline-block text-[11px] font-bold uppercase tracking-widest mb-4 px-3 py-1 rounded-full"
              style={{ background: "#FFF3B0", color: "#355847" }}
            >
              Informations légales
            </span>
            <h1 className="text-[1.6rem] md:text-[2rem] font-bold text-gray-900 mb-4 leading-tight">
              Mentions légales
            </h1>
            <p className="text-gray-500 text-[15px] md:text-[16px] leading-relaxed">
              Dernière mise à jour : 2025
            </p>
          </div>
        </div>
      </div>

      {/* ── Contenu ── */}
      <div
        style={{ maxWidth: 800, margin: "0 auto" }}
        className="px-5 py-10 md:px-6 md:py-16"
      >
        <div className="space-y-4">
          {SECTIONS.map(({ num, title, content }) => (
            <div
              key={num}
              className="border border-gray-100 rounded-2xl overflow-hidden hover:shadow-sm transition-shadow"
            >
              {/* Header section */}
              <div
                className="flex items-center gap-3 px-4 md:px-6 py-4 border-b border-gray-100"
                style={{ background: "#f9fafb" }}
              >
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-extrabold text-white flex-shrink-0"
                  style={{ background: "#1a5242" }}
                >
                  {num}
                </span>
                <h2 className="text-[14.5px] font-bold text-gray-900">
                  {title}
                </h2>
              </div>
              {/* Contenu section */}
              <div className="px-4 md:px-6 py-5">{content}</div>
            </div>
          ))}
        </div>

        {/* Retour */}
        <div className="mt-10 pt-8 border-t border-gray-100 flex justify-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border-2 font-semibold text-[13.5px] transition-all hover:text-white"
            style={{ borderColor: "#1a5242", color: "#1a5242" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#1a5242";
              e.currentTarget.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#1a5242";
            }}
          >
            <ArrowLeft size={15} /> Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
