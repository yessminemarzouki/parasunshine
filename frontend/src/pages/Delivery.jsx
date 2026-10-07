import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Truck,
  Package,
  MapPin,
  Clock,
  RefreshCw,
  ChevronRight,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import { getShippingSettings } from "../services/api";

const GOVERNORATS = [
  "Tunis",
  "Ariana",
  "Ben Arous",
  "Manouba",
  "Nabeul",
  "Zaghouan",
  "Bizerte",
  "Béja",
  "Jendouba",
  "Le Kef",
  "Siliana",
  "Sousse",
  "Monastir",
  "Mahdia",
  "Sfax",
  "Kairouan",
  "Kasserine",
  "Sidi Bouzid",
  "Gabès",
  "Médenine",
  "Tataouine",
  "Gafsa",
  "Tozeur",
  "Kébili",
];

const STATUSES = [
  {
    label: "En attente",
    text: "Votre commande a été reçue et est en cours de vérification.",
  },
  {
    label: "En préparation",
    text: "Votre commande est en cours de préparation dans notre entrepôt.",
  },
  {
    label: "Expédiée",
    text: "Votre colis a été expédié et est en route vers vous.",
  },
  { label: "Livrée", text: "Votre commande a été livrée avec succès." },
];

const RETURN_STEPS = [
  {
    num: "01",
    title: "Contactez-nous",
    text: "Appelez-nous au +216 94 169 416 ou écrivez à parasunshine25@gmail.com avec votre numéro de commande et le motif du retour.",
  },
  {
    num: "02",
    title: "Obtenez votre numéro",
    text: "Nous vous fournirons un numéro de retour et l'adresse de renvoi.",
  },
  {
    num: "03",
    title: "Renvoyez le produit",
    text: "Emballez soigneusement le produit dans son emballage d'origine et renvoyez-le à nos frais.",
  },
  {
    num: "04",
    title: "Remboursement",
    text: "Une fois le produit reçu et vérifié, nous procédons au remboursement sous 7–10 jours ouvrables.",
  },
];

export default function Delivery() {
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
              Livraison & Retours
            </span>
          </nav>

          <div className="max-w-2xl text-left">
            <span
              className="inline-block text-[11px] font-bold uppercase tracking-widest mb-4 px-3 py-1 rounded-full"
              style={{ background: "#FFF3B0", color: "#355847" }}
            >
              Informations logistique
            </span>
            <h1 className="text-[1.6rem] md:text-[2rem] font-bold text-gray-900 mb-4 leading-tight">
              Livraison et retours
            </h1>
            <p className="text-gray-500 text-[15px] md:text-[16px] leading-relaxed">
              Toutes les informations sur nos services de livraison et notre
              politique de retour.
            </p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto" }} className="px-5 md:px-6">
        {/* ══ LIVRAISON ══ */}
        <section className="py-16 border-b border-gray-100">
          <h2 className="text-[13px] font-bold text-gray-900 uppercase tracking-widest mb-8">
            Livraison
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 mb-10">
            {/* Frais */}
            <div>
              <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Frais de livraison
              </p>
              <div className="space-y-2.5 text-[13.5px]">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Livraison standard</span>
                  <span className="font-bold text-gray-900">
                    {shipping.shipping_cost} DT
                  </span>
                </div>
                {shipping.free_shipping_enabled && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-600">
                      Commande ≥ {shipping.free_shipping_threshold} DT
                    </span>
                    <span className="font-bold" style={{ color: "#355847" }}>
                      Gratuit
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Délai */}
            <div>
              <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Délai de livraison
              </p>
              <p className="text-[13.5px] text-gray-600 leading-relaxed">
                Comptez entre{" "}
                <strong className="text-gray-900">
                  {shipping.delivery_days_min} et {shipping.delivery_days_max}{" "}
                  jours
                </strong>{" "}
                ouvrables, dans toute la Tunisie.
              </p>
              <div className="flex items-start gap-2 mt-4 text-[12.5px] text-gray-500 italic">
                <Lightbulb
                  size={13}
                  className="flex-shrink-0 mt-0.5"
                  style={{ color: "#355847" }}
                />
                Les délais sont indicatifs et peuvent varier selon les
                conditions de transport.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
            {/* Préparation */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <Clock size={16} style={{ color: "#355847" }} />
                <p className="text-[14px] font-bold text-gray-900">
                  Préparation & expédition
                </p>
              </div>
              <ul className="space-y-2.5">
                {[
                  "Commandes passées avant 14h expédiées le jour même",
                  "Après 14h ou le weekend : expédition le jour ouvrable suivant",
                  "Email de confirmation dès l'expédition",
                  "SMS envoyé la veille de la livraison",
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
            </div>

            {/* Paiement livraison */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <Package size={16} style={{ color: "#355847" }} />
                <p className="text-[14px] font-bold text-gray-900">
                  Paiement à la livraison
                </p>
              </div>
              <ul className="space-y-2.5 mb-3">
                {[
                  "Le livreur vous contacte avant d'arriver",
                  "Vous vérifiez l'état du colis avant de l'ouvrir",
                  "Si tout est correct, vous payez en espèces",
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
                Si le colis est endommagé, vous pouvez refuser la livraison et
                ne pas payer.
              </p>
            </div>
          </div>
        </section>

        {/* Zones */}
        <section className="py-12 border-b border-gray-100">
          <h2 className="text-[13px] font-bold text-gray-900 uppercase tracking-widest mb-5">
            Zones de livraison — tous les gouvernorats
          </h2>
          <div className="flex flex-wrap gap-2">
            {GOVERNORATS.map((g) => (
              <span
                key={g}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-[12.5px] font-medium text-gray-600"
              >
                {g}
              </span>
            ))}
          </div>
        </section>

        {/* Problèmes */}
        <section className="py-12 border-b border-gray-100">
          <h2 className="text-[13px] font-bold text-gray-900 uppercase tracking-widest mb-6">
            En cas de problème
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            {[
              {
                label: "Colis non reçu",
                text: "Contactez-nous avec votre numéro de commande.",
              },
              {
                label: "Colis endommagé",
                text: "Refusez le colis et contactez-nous immédiatement.",
              },
              {
                label: "Absent lors de la livraison",
                text: "Le livreur vous contactera pour reprogrammer.",
              },
              {
                label: "Problème de paiement",
                text: "Si vous n'avez pas l'appoint, appelez-nous avant.",
              },
            ].map(({ label, text }) => (
              <div key={label}>
                <p className="text-[13.5px] font-bold text-gray-900 mb-1">
                  {label}
                </p>
                <p className="text-[13px] text-gray-500">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══ RETOURS ══ */}
        <section className="py-16 border-b border-gray-100">
          <h2 className="text-[13px] font-bold text-gray-900 uppercase tracking-widest mb-8">
            Retours & échanges
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 mb-10">
            <div>
              <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Produits acceptés
              </p>
              <ul className="space-y-2.5 mb-4">
                {[
                  "Produits non ouverts, dans leur emballage d'origine",
                  "Produits non utilisés et non descellés",
                  "Étiquettes et notices intactes",
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
              <p className="text-[13px] text-gray-500">
                Délai de retour :{" "}
                <strong className="text-gray-900">7 jours</strong> après
                réception.
              </p>
            </div>
            <div>
              <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Produits non retournables
              </p>
              <ul className="space-y-2.5 mb-4">
                {[
                  "Produits ouverts ou descellés",
                  "Produits utilisés",
                  "Cosmétiques et produits d'hygiène",
                  "Compléments alimentaires",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-[13.5px] text-gray-600"
                  >
                    <span className="w-1 h-1 rounded-full flex-shrink-0 mt-2 bg-gray-300" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-[13px] text-gray-500">
                Pour des raisons d'hygiène et de sécurité.
              </p>
            </div>
          </div>

          {/* Étapes retour */}
          <div className="mb-10">
            <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide mb-5">
              Comment effectuer un retour ?
            </p>
            <div className="space-y-0">
              {RETURN_STEPS.map(({ num, title, text }, i) => (
                <div
                  key={num}
                  className="grid gap-6 py-5"
                  style={{
                    gridTemplateColumns: "50px 1fr",
                    borderTop: i === 0 ? "none" : "1px solid #f3f4f6",
                  }}
                >
                  <p
                    className="text-[13px] font-bold"
                    style={{ color: "#355847" }}
                  >
                    {num}
                  </p>
                  <div>
                    <p className="text-[14px] font-bold text-gray-900 mb-1">
                      {title}
                    </p>
                    <p className="text-[13.5px] text-gray-500 leading-relaxed">
                      {text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Remboursement + Défectueux */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
            <div>
              <p className="text-[14px] font-bold text-gray-900 mb-3">
                Modalités de remboursement
              </p>
              <ul className="space-y-2.5">
                {[
                  "Remboursement par virement bancaire ou bon d'achat",
                  "Frais de livraison initiaux non remboursés (sauf produit défectueux)",
                  "Email de confirmation dès que le remboursement est traité",
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
            </div>
            <div>
              <p className="text-[14px] font-bold text-gray-900 mb-3">
                Produit défectueux ou erreur
              </p>
              <ul className="space-y-2.5">
                {[
                  "Refusez la livraison si vous constatez le problème avant paiement",
                  "Contactez-nous immédiatement avec une photo du produit",
                  "Nous prenons en charge les frais de retour et de réexpédition",
                  "Échange ou remboursement intégral selon votre préférence",
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
            </div>
          </div>
        </section>

        {/* ══ SUIVI ══ */}
        <section className="py-16 border-b border-gray-100">
          <h2 className="text-[13px] font-bold text-gray-900 uppercase tracking-widest mb-6">
            Suivi de commande
          </h2>

          <p className="text-[13.5px] text-gray-600 mb-8 max-w-lg">
            Connectez-vous à votre compte et accédez à{" "}
            <Link
              to="/account"
              className="font-semibold underline underline-offset-2"
              style={{ color: "#1a5242" }}
            >
              "Mes commandes"
            </Link>{" "}
            pour suivre l'état de votre commande en temps réel.
          </p>

          <div
            className="grid gap-x-8 gap-y-6"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            }}
          >
            {STATUSES.map(({ label, text }) => (
              <div key={label}>
                <p
                  className="text-[12px] font-bold uppercase tracking-wide mb-2"
                  style={{ color: "#355847" }}
                >
                  {label}
                </p>
                <p className="text-[13px] text-gray-500 leading-relaxed">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 md:gap-6 border border-gray-100 rounded-2xl px-5 md:px-8 py-7 md:py-8">
            <div>
              <p className="text-[16px] font-bold text-gray-900 mb-1">
                Une question sur la livraison ?
              </p>
              <p className="text-[13.5px] text-gray-400">
                Notre équipe est à votre disposition.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                to="/faq"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-[13.5px] border border-gray-200 text-gray-600 hover:border-[#1a5242] hover:text-[#1a5242] transition-all"
              >
                Voir la FAQ
              </Link>
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
        </section>
      </div>
    </div>
  );
}
