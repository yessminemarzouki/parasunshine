import { Link } from "react-router-dom";
import { ChevronRight, ArrowLeft } from "lucide-react";

const SECTIONS = [
  {
    num: "1",
    title: "Introduction",
    content: (
      <p className="text-[13.5px] text-gray-600 leading-relaxed">
        ParaSunshine accorde une grande importance à la protection de vos
        données personnelles. Cette politique de confidentialité vous informe
        sur la manière dont nous collectons, utilisons et protégeons vos
        données.
      </p>
    ),
  },
  {
    num: "2",
    title: "Données collectées",
    content: (
      <div className="space-y-4">
        <p className="text-[13.5px] text-gray-600">
          Nous collectons les données suivantes :
        </p>
        {[
          {
            sub: "2.1 Données d'identification",
            items: [
              "Nom et prénom",
              "Adresse email",
              "Numéro de téléphone",
              "Adresse de livraison",
            ],
          },
          {
            sub: "2.2 Données de commande",
            items: [
              "Historique des commandes",
              "Produits achetés",
              "Montants des transactions",
            ],
          },
          {
            sub: "2.3 Données de navigation",
            items: ["Adresse IP", "Pages visitées", "Durée de visite"],
          },
        ].map(({ sub, items }) => (
          <div key={sub}>
            <p className="text-[13px] font-bold text-gray-700 mb-2">{sub}</p>
            <ul className="space-y-1.5 pl-2">
              {items.map((i) => (
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
        ))}
      </div>
    ),
  },
  {
    num: "3",
    title: "Utilisation des données",
    content: (
      <div>
        <p className="text-[13.5px] text-gray-600 mb-3">
          Vos données sont utilisées pour :
        </p>
        <ul className="space-y-1.5 pl-2">
          {[
            "Traiter et gérer vos commandes",
            "Vous envoyer des confirmations de commande",
            "Gérer votre compte client",
            "Améliorer nos services",
            "Vous informer de nos offres (avec votre consentement)",
            "Prévenir la fraude",
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
    num: "4",
    title: "Conservation des données",
    content: (
      <div>
        <p className="text-[13.5px] text-gray-600 mb-3">
          Vos données personnelles sont conservées pendant la durée nécessaire
          aux finalités pour lesquelles elles ont été collectées :
        </p>
        <ul className="space-y-1.5 pl-2">
          {[
            "Données de compte : jusqu'à la suppression de votre compte",
            "Données de commande : 10 ans (obligations légales)",
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
    title: "Sécurité des données",
    content: (
      <div>
        <p className="text-[13.5px] text-gray-600 leading-relaxed mb-3">
          Nous mettons en œuvre des mesures techniques et organisationnelles
          appropriées pour protéger vos données personnelles contre la perte,
          l'utilisation abusive, l'accès non autorisé, la divulgation,
          l'altération ou la destruction.
        </p>
        <ul className="space-y-1.5 pl-2">
          {[
            "Chiffrement SSL/TLS",
            "Authentification sécurisée",
            "Sauvegardes régulières",
            "Accès restreint aux données",
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
    num: "6",
    title: "Vos droits",
    content: (
      <div>
        <p className="text-[13.5px] text-gray-600 mb-3">
          Conformément à la réglementation, vous disposez des droits suivants :
        </p>
        <ul className="space-y-2.5 pl-2">
          {[
            {
              label: "Droit d'accès",
              text: "Vous pouvez demander l'accès à vos données personnelles",
            },
            {
              label: "Droit de rectification",
              text: "Vous pouvez demander la correction de vos données",
            },
            {
              label: "Droit à l'effacement",
              text: "Vous pouvez demander la suppression de vos données",
            },
            {
              label: "Droit d'opposition",
              text: "Vous pouvez vous opposer au traitement de vos données",
            },
            {
              label: "Droit à la portabilité",
              text: "Vous pouvez récupérer vos données dans un format structuré",
            },
          ].map(({ label, text }) => (
            <li
              key={label}
              className="flex items-start gap-2 text-[13px] text-gray-600"
            >
              <span
                className="w-1 h-1 rounded-full flex-shrink-0 mt-2"
                style={{ background: "#355847" }}
              />
              <span>
                <strong className="text-gray-800 font-semibold">
                  {label} :
                </strong>{" "}
                {text}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-[13px] text-gray-600 mt-3">
          Pour exercer ces droits, contactez-nous à :{" "}
          <a
            href="mailto:parasunshine25@gmail.com"
            className="underline underline-offset-2 hover:opacity-70 transition-opacity"
            style={{ color: "#1a5242" }}
          >
            parasunshine25@gmail.com
          </a>
        </p>
      </div>
    ),
  },
  {
    num: "7",
    title: "Partage des données",
    content: (
      <div>
        <p className="text-[13.5px] text-gray-600 leading-relaxed mb-3">
          Nous ne vendons ni ne louons vos données personnelles. Vos données
          peuvent être partagées avec :
        </p>
        <ul className="space-y-1.5 pl-2">
          {[
            "Nos prestataires de services (livraison, paiement)",
            "Les autorités légales si requis par la loi",
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
    num: "8",
    title: "Modifications",
    content: (
      <p className="text-[13.5px] text-gray-600 leading-relaxed">
        Nous nous réservons le droit de modifier cette politique de
        confidentialité. Les modifications seront publiées sur cette page avec
        une nouvelle date de mise à jour.
      </p>
    ),
  },
  {
    num: "9",
    title: "Contact",
    content: (
      <div className="space-y-2 text-[13.5px] text-gray-600">
        <p>
          Pour toute question concernant cette politique de confidentialité :
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
];

export default function PrivacyPolicy() {
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
              Confidentialité
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
              Politique de confidentialité
            </h1>
            <p className="text-gray-500 text-[15px] md:text-[16px] leading-relaxed">
              Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}
            </p>
          </div>
        </div>
      </div>

      {/* ── Contenu ── */}
      <div
        style={{ maxWidth: 700, margin: "0 auto" }}
        className="px-5 py-10 md:px-6 md:py-16"
      >
        <div className="space-y-0">
          {SECTIONS.map(({ num, title, content }, i) => (
            <div
              key={num}
              className="py-8"
              style={{ borderTop: i === 0 ? "none" : "1px solid #f3f4f6" }}
            >
              <div className="flex items-center gap-3 mb-4">
                <span
                  className="text-[13px] font-bold"
                  style={{ color: "#355847" }}
                >
                  {num}
                </span>
                <h2 className="text-[15px] font-bold text-gray-900">{title}</h2>
              </div>
              {content}
            </div>
          ))}
        </div>

        {/* Retour */}
        <div className="mt-8 pt-8 border-t border-gray-100 flex justify-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-[13.5px] border border-gray-200 text-gray-600 hover:border-[#1a5242] hover:text-[#1a5242] transition-all"
          >
            <ArrowLeft size={15} /> Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
