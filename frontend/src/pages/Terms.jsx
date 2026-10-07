import { Link } from "react-router-dom";
import { ChevronRight, ArrowLeft } from "lucide-react";

const SECTIONS = [
  {
    num: "1",
    title: "Objet",
    content: (
      <p className="text-[13.5px] text-gray-600 leading-relaxed">
        Les présentes conditions générales d'utilisation (ci-après « CGU »)
        régissent l'accès et l'utilisation du site ParaSunshine (ci-après le «
        Site »). L'utilisation du Site implique l'acceptation pleine et entière
        des présentes CGU.
      </p>
    ),
  },
  {
    num: "2",
    title: "Inscription et compte utilisateur",
    content: (
      <div>
        <p className="text-[13.5px] text-gray-600 leading-relaxed mb-3">
          Pour passer commande, vous devez créer un compte en fournissant des
          informations exactes et à jour. Vous êtes responsable de la
          confidentialité de vos identifiants de connexion.
        </p>
        <ul className="space-y-1.5 pl-2">
          {[
            "Vous devez être majeur pour créer un compte",
            "Vous vous engagez à fournir des informations exactes et à jour",
            "Vous êtes responsable de toutes les activités effectuées depuis votre compte",
            "Vous devez informer immédiatement ParaSunshine de toute utilisation non autorisée",
          ].map((i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-[13px] text-gray-600"
            >
              <span
                className="w-1 h-1 rounded-full flex-shrink-0 mt-2"
                style={{ background: "#355847" }}
              />
              {i}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    num: "3",
    title: "Commandes et paiement",
    content: (
      <div className="space-y-4">
        <p className="text-[13.5px] text-gray-600 leading-relaxed">
          Toute commande passée sur le Site constitue un contrat de vente entre
          vous et ParaSunshine. Les prix sont indiqués en dinars tunisiens (TND)
          et incluent la TVA.
        </p>
        <div>
          <p className="text-[13px] font-bold text-gray-700 mb-2">
            3.1 Processus de commande
          </p>
          <ul className="space-y-1.5 pl-2">
            {[
              "Sélection des produits et ajout au panier",
              "Vérification du panier et des quantités",
              "Saisie des informations de livraison",
              "Confirmation de la commande",
            ].map((i) => (
              <li
                key={i}
                className="flex items-center gap-2 text-[13px] text-gray-600"
              >
                <span
                  className="w-1 h-1 rounded-full flex-shrink-0"
                  style={{ background: "#355847" }}
                />
                {i}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[13px] font-bold text-gray-700 mb-2">
            3.2 Mode de paiement
          </p>
          <p className="text-[13.5px] text-gray-600 leading-relaxed mb-2">
            ParaSunshine accepte{" "}
            <strong className="text-gray-800">
              uniquement le paiement à la livraison
            </strong>
            . Vous payez votre commande en espèces directement au livreur lors
            de la réception de votre colis.
          </p>
          <ul className="space-y-1.5 pl-2 mb-3">
            {[
              "Aucun paiement en ligne requis",
              "Paiement en espèces uniquement",
              "Vérifiez votre commande avant de payer",
              "Vous pouvez refuser la livraison si le colis est endommagé",
            ].map((i) => (
              <li
                key={i}
                className="flex items-center gap-2 text-[13px] text-gray-600"
              >
                <span
                  className="w-1 h-1 rounded-full flex-shrink-0"
                  style={{ background: "#355847" }}
                />
                {i}
              </li>
            ))}
          </ul>
          <div
            className="flex items-start gap-2.5 text-[12.5px] text-gray-600 px-3.5 py-3 rounded-lg"
            style={{ background: "#f9fafb" }}
          >
            ℹ️ Nous vous recommandons de préparer le montant exact pour
            faciliter la transaction.
          </div>
        </div>
      </div>
    ),
  },
  {
    num: "4",
    title: "Livraison",
    content: (
      <div>
        <p className="text-[13.5px] text-gray-600 leading-relaxed mb-3">
          Les délais de livraison sont communiqués à titre indicatif et peuvent
          varier selon la disponibilité des produits et votre localisation.
        </p>
        <ul className="space-y-1.5 pl-2">
          {[
            "Livraison gratuite pour toute commande supérieure à 99 DT",
            "Frais de livraison : 7 DT pour les commandes inférieures",
            "Délai de livraison : 2 à 5 jours ouvrables",
            "Livraison en Tunisie uniquement",
          ].map((i) => (
            <li
              key={i}
              className="flex items-center gap-2 text-[13px] text-gray-600"
            >
              <span
                className="w-1 h-1 rounded-full flex-shrink-0"
                style={{ background: "#355847" }}
              />
              {i}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    num: "5",
    title: "Droit de rétractation",
    content: (
      <div>
        <p className="text-[13.5px] text-gray-600 leading-relaxed mb-3">
          Conformément à la réglementation en vigueur, vous disposez d'un délai
          de 7 jours à compter de la réception de votre commande pour exercer
          votre droit de rétractation.
        </p>
        <div
          className="flex items-start gap-2.5 text-[12.5px] text-amber-800 px-3.5 py-3 rounded-lg border"
          style={{ background: "#fef3c7", borderColor: "#fde68a" }}
        >
          ⚠️ Les produits de parapharmacie ouverts, descellés ou utilisés ne
          peuvent être retournés pour des raisons d'hygiène et de sécurité.
        </div>
      </div>
    ),
  },
  {
    num: "6",
    title: "Garanties",
    content: (
      <ul className="space-y-1.5 pl-2">
        {[
          "Tous nos produits sont 100% authentiques",
          "Nous garantissons la conformité de nos produits",
          "Les produits défectueux peuvent être échangés ou remboursés",
        ].map((i) => (
          <li
            key={i}
            className="flex items-center gap-2 text-[13px] text-gray-600"
          >
            <span
              className="w-1 h-1 rounded-full flex-shrink-0"
              style={{ background: "#355847" }}
            />
            {i}
          </li>
        ))}
      </ul>
    ),
  },
  {
    num: "7",
    title: "Propriété intellectuelle",
    content: (
      <p className="text-[13.5px] text-gray-600 leading-relaxed">
        L'ensemble du contenu du Site (textes, images, logos, etc.) est protégé
        par les droits de propriété intellectuelle. Toute reproduction ou
        utilisation non autorisée est interdite.
      </p>
    ),
  },
  {
    num: "8",
    title: "Protection des données personnelles",
    content: (
      <p className="text-[13.5px] text-gray-600 leading-relaxed">
        Vos données personnelles sont traitées conformément à notre{" "}
        <Link
          to="/politique-confidentialite"
          className="underline underline-offset-2 hover:opacity-70 transition-opacity"
          style={{ color: "#1a5242" }}
        >
          Politique de confidentialité
        </Link>
        .
      </p>
    ),
  },
  {
    num: "9",
    title: "Responsabilité",
    content: (
      <p className="text-[13.5px] text-gray-600 leading-relaxed">
        ParaSunshine s'efforce d'assurer l'exactitude des informations diffusées
        sur le Site mais ne peut garantir l'absence d'erreurs ou d'omissions.
      </p>
    ),
  },
  {
    num: "10",
    title: "Contact",
    content: (
      <div className="space-y-2 text-[13.5px] text-gray-600">
        <p>
          Pour toute question concernant ces CGU, vous pouvez nous contacter :
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
        <p>
          <strong className="text-gray-800 font-semibold">Adresse :</strong>{" "}
          Route Gremda Km3 en face Clinique Chams, Sfax, Tunisie
        </p>
      </div>
    ),
  },
];

export default function Terms() {
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
              Conditions générales
            </span>
          </nav>

          <div className="max-w-2xl text-left">
            <span
              className="inline-block text-[11px] font-bold uppercase tracking-widest mb-4 px-3 py-1 rounded-full"
              style={{ background: "#FFF3B0", color: "#355847" }}
            >
              Document légal
            </span>
            <h1 className="text-[1.6rem] md:text-[2rem] font-bold text-gray-900 mb-4 leading-tight">
              Conditions Générales d'Utilisation
            </h1>
            <p className="text-gray-500 text-[15px] md:text-[16px] leading-relaxed">
              Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}
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
