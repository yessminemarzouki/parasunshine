import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  Mail,
  Phone,
  Clock,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { getShippingSettings } from "../services/api";

const getFaqData = (shipping) => [
  {
    category: "Commandes",
    questions: [
      {
        q: "Comment passer une commande ?",
        a: "Ajoutez vos produits au panier, cliquez sur 'Commander', renseignez vos informations de livraison et validez. Vous recevrez une confirmation par email.",
      },
      {
        q: "Puis-je modifier ma commande après validation ?",
        a: "Vous pouvez modifier votre commande dans les 2 heures suivant sa validation en nous contactant au +216 94 169 416. Passé ce délai, la commande est en cours de préparation et ne peut plus être modifiée.",
      },
      {
        q: "Comment suivre ma commande ?",
        a: "Vous recevez un email de confirmation dès l'expédition. Vous pouvez également suivre votre commande depuis votre compte dans 'Mes commandes'.",
      },
      {
        q: "Je n'ai pas reçu ma confirmation de commande ?",
        a: "Vérifiez d'abord vos spams. Si vous ne trouvez pas l'email, connectez-vous à votre compte pour vérifier que la commande a bien été enregistrée, ou contactez-nous.",
      },
    ],
  },
  {
    category: "Livraison",
    questions: [
      {
        q: "Quels sont les délais de livraison ?",
        a: `Nous livrons en ${shipping.delivery_days_min ?? 2} à ${shipping.delivery_days_max ?? 5} jours ouvrables dans toute la Tunisie. Les commandes passées avant 14h sont expédiées le jour même (produits en stock).`,
      },
      {
        q: "Quels sont les frais de livraison ?",
        a: shipping.free_shipping_enabled
          ? `Les frais de livraison sont de ${shipping.shipping_cost} DT. La livraison est GRATUITE pour toute commande supérieure à ${shipping.free_shipping_threshold} DT.`
          : `Les frais de livraison sont de ${shipping.shipping_cost} DT, appliqués sur toutes les commandes.`,
      },
      {
        q: "Livrez-vous dans toute la Tunisie ?",
        a: "Oui, nous livrons dans toutes les gouvernorats de la Tunisie.",
      },
      {
        q: "Que faire si je suis absent lors de la livraison ?",
        a: "Le livreur tentera de vous contacter par téléphone. Un deuxième passage sera programmé ou vous pourrez récupérer votre colis au point relais le plus proche.",
      },
    ],
  },
  {
    category: "Paiement",
    questions: [
      {
        q: "Quel mode de paiement acceptez-vous ?",
        a: "Nous acceptons uniquement le paiement à la livraison en espèces. Vous payez votre commande directement au livreur lors de la réception.",
      },
      {
        q: "Puis-je payer par carte bancaire ?",
        a: "Non, actuellement seul le paiement en espèces à la livraison est disponible.",
      },
      {
        q: "Y a-t-il des frais pour le paiement à la livraison ?",
        a: "Non, le paiement à la livraison est gratuit. Aucun frais supplémentaire n'est appliqué.",
      },
      {
        q: "Que faire si je n'ai pas l'appoint ?",
        a: "Nous vous recommandons de préparer l'appoint si possible. Nos livreurs ont généralement de la monnaie. Contactez-nous avant la livraison si besoin.",
      },
      {
        q: "Puis-je refuser de payer si le colis est endommagé ?",
        a: "Oui, absolument. Si le colis est endommagé ou si le contenu ne correspond pas à votre commande, vous pouvez refuser la livraison et nous contacter.",
      },
    ],
  },
  {
    category: "Retours & Échanges",
    questions: [
      {
        q: "Puis-je retourner un produit ?",
        a: "Oui, vous disposez de 7 jours pour retourner un produit non ouvert et dans son emballage d'origine. Les produits ouverts ne peuvent être repris pour des raisons d'hygiène.",
      },
      {
        q: "Comment effectuer un retour ?",
        a: "Contactez notre service client au +216 94 169 416 ou par email pour obtenir un numéro de retour. Renvoyez le produit dans son emballage d'origine à nos frais.",
      },
      {
        q: "Quel est le délai de remboursement ?",
        a: "Une fois le produit retourné et vérifié, le remboursement est effectué sous 7 à 10 jours ouvrables.",
      },
      {
        q: "Que faire si je reçois un produit défectueux ?",
        a: "Contactez-nous immédiatement avec une photo du produit. Nous procéderons à un échange ou un remboursement dans les plus brefs délais, sans frais pour vous.",
      },
    ],
  },
  {
    category: "Produits",
    questions: [
      {
        q: "Les produits sont-ils authentiques ?",
        a: "Oui, 100%. Tous nos produits proviennent directement des laboratoires et distributeurs officiels.",
      },
      {
        q: "Comment vérifier la date de péremption ?",
        a: "La date est indiquée sur chaque produit. Nous garantissons une durée de validité minimum de 6 mois.",
      },
      {
        q: "Proposez-vous des échantillons ?",
        a: "Nous ajoutons régulièrement des échantillons gratuits dans vos commandes selon les disponibilités.",
      },
      {
        q: "Un produit est en rupture, quand sera-t-il disponible ?",
        a: 'Utilisez le bouton "Me notifier de la disponibilité" sur la fiche produit — nous vous contacterons dès son retour en stock.',
      },
    ],
  },
  {
    category: "Compte client",
    questions: [
      {
        q: "Comment créer un compte ?",
        a: "Cliquez sur 'Se connecter' puis 'Créer un compte'. Vous pouvez également créer un compte lors de votre première commande.",
      },
      {
        q: "J'ai oublié mon mot de passe, que faire ?",
        a: "Cliquez sur 'Mot de passe oublié' sur la page de connexion. Vous recevrez un email avec un lien pour réinitialiser votre mot de passe.",
      },
      {
        q: "Comment modifier mes informations personnelles ?",
        a: "Connectez-vous, allez dans 'Mon compte' puis 'Informations personnelles'.",
      },
      {
        q: "Comment supprimer mon compte ?",
        a: "Contactez notre service client. Nous procéderons à la suppression dans un délai de 48h conformément à la réglementation.",
      },
    ],
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);
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

  const FAQ_DATA = getFaqData(shipping);

  const toggle = (catIdx, qIdx) => {
    const key = `${catIdx}-${qIdx}`;
    setOpenIndex(openIndex === key ? null : key);
  };

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
            <span className="text-[#1a5242] font-semibold">FAQ</span>
          </nav>

          <div className="max-w-2xl text-left">
            <span
              className="inline-block text-[11px] font-bold uppercase tracking-widest mb-4 px-3 py-1 rounded-full"
              style={{ background: "#FFF3B0", color: "#355847" }}
            >
              Centre d'aide
            </span>
            <h1 className="text-[1.6rem] md:text-[2rem] font-bold text-gray-900 mb-4 leading-tight">
              Questions fréquentes
            </h1>
            <p className="text-gray-500 text-[15px] md:text-[16px] leading-relaxed">
              Trouvez rapidement les réponses à vos questions.
            </p>
          </div>
        </div>
      </div>

      <div
        style={{ maxWidth: 800, margin: "0 auto" }}
        className="px-5 py-10 md:px-6 md:py-16"
      >
        {/* ── FAQ par catégorie ── */}
        <div className="space-y-12">
          {FAQ_DATA.map((cat, catIdx) => (
            <div key={catIdx}>
              <h2 className="text-[13px] font-bold text-gray-900 uppercase tracking-widest mb-5">
                {cat.category}
              </h2>

              <div className="border-t border-gray-100">
                {cat.questions.map((item, qIdx) => {
                  const key = `${catIdx}-${qIdx}`;
                  const isOpen = openIndex === key;
                  return (
                    <div key={qIdx} className="border-b border-gray-100">
                      <button
                        onClick={() => toggle(catIdx, qIdx)}
                        className="w-full flex items-center justify-between gap-4 py-4 text-left"
                      >
                        <span className="text-[14px] font-semibold text-gray-900">
                          {item.q}
                        </span>
                        <ChevronDown
                          size={16}
                          className="flex-shrink-0 text-gray-400 transition-transform"
                          style={{
                            transform: isOpen ? "rotate(180deg)" : "none",
                            color: isOpen ? "#355847" : undefined,
                          }}
                        />
                      </button>
                      {isOpen && (
                        <p className="text-[13.5px] text-gray-500 leading-relaxed pb-5 max-w-lg">
                          {item.a}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ── Contact ── */}
        <div className="mt-16 border border-gray-100 rounded-2xl px-5 md:px-8 py-6 md:py-8">
          <p className="text-[16px] font-bold text-gray-900 mb-1">
            Vous ne trouvez pas la réponse ?
          </p>
          <p className="text-[13.5px] text-gray-400 mb-6">
            Notre équipe est à votre disposition pour vous aider.
          </p>

          <div className="flex items-center gap-6 flex-wrap mb-6">
            {[
              {
                icon: Mail,
                label: "parasunshine25@gmail.com",
                href: "mailto:parasunshine25@gmail.com",
              },
              {
                icon: Phone,
                label: "+216 94 169 416",
                href: "tel:+21694169416",
              },
              { icon: Clock, label: "Lun – Sam : 9h – 20h", href: null },
            ].map(({ icon: Icon, label, href }) => (
              <div
                key={label}
                className="flex items-center gap-2 text-gray-500 text-[13.5px]"
              >
                <Icon size={15} style={{ color: "#355847" }} />
                {href ? (
                  <a
                    href={href}
                    className="hover:text-[#1a5242] transition-colors font-medium"
                  >
                    {label}
                  </a>
                ) : (
                  <span>{label}</span>
                )}
              </div>
            ))}
          </div>

          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-[13.5px] transition-opacity hover:opacity-90"
            style={{ background: "#1a5242", color: "white" }}
          >
            Nous contacter
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}
