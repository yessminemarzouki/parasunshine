import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { subscribeNewsletter } from "../services/api";
import {
  MapPin,
  Phone,
  Mail,
  Facebook,
  Instagram,
  Clock,
  CheckCircle,
  X,
} from "lucide-react";
export default function Footer() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);
  const [error, setError] = useState(null);
  const [userAlreadyOptedIn, setUserAlreadyOptedIn] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const user = JSON.parse(stored);
        if (user?.email) setEmail(user.email);
        if (user?.newsletter_opt_in) setUserAlreadyOptedIn(true);
      } catch {}
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);
    try {
      const data = await subscribeNewsletter(email);
      if (data.success) {
        setAlreadySubscribed(!!data.already_subscribed);
        setShowSuccess(true);
        setEmail("");
      } else {
        setError(data.message || "Une erreur est survenue.");
      }
    } catch {
      setError("Impossible de s'inscrire. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── Popup succès newsletter ── */}
      {showSuccess && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowSuccess(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-10 text-center relative"
            style={{ animation: "slideUp 0.3s ease" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowSuccess(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors"
            >
              <X size={15} />
            </button>
            <div
              className="mb-4"
              style={{ animation: "bounce 0.5s ease", color: "#FFF3B0" }}
            >
              <CheckCircle size={52} className="mx-auto" />
            </div>
            <h3
              className="text-[20px] font-extrabold mb-3"
              style={{ color: "#1a5242" }}
            >
              {alreadySubscribed
                ? "Déjà des nôtres ! 💚"
                : "Inscription réussie ! 🎉"}
            </h3>
            <p className="text-[14px] text-gray-500 leading-relaxed mb-6">
              {alreadySubscribed ? (
                <>
                  Vous êtes déjà inscrit(e) à notre newsletter — merci de votre
                  fidélité,{" "}
                  <strong className="text-gray-800">ParaSunshine</strong> vous
                  en remercie !
                </>
              ) : (
                <>
                  Merci de rejoindre la communauté{" "}
                  <strong className="text-gray-800">ParaSunshine</strong>.
                  <br />
                  Vous recevrez nos{" "}
                  <strong className="text-gray-800">
                    offres exclusives
                  </strong>{" "}
                  directement dans votre boîte mail.
                </>
              )}
            </p>
            <button
              onClick={() => setShowSuccess(false)}
              className="px-8 py-2.5 rounded-xl text-white font-bold text-[14px] hover:opacity-90 transition-opacity"
              style={{
                background: "linear-gradient(135deg, #1a5242, #2d7a5e)",
              }}
            >
              Parfait !
            </button>
          </div>
          <style>{`
            @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            @keyframes bounce { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.2); } 100% { transform: scale(1); opacity: 1; } }
          `}</style>
        </div>
      )}

      {/* ── Newsletter ── */}
      <div
        className="border-b border-gray-100"
        style={{ background: "#fcfcf9", padding: "28px 0" }}
      >
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px" }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 md:gap-8">
            <div>
              <h3
                className="text-[1.2rem] font-bold mb-1"
                style={{ color: "#1a5242" }}
              >
                Inscrivez-vous à notre newsletter
              </h3>
              <p className="text-[13.5px] text-gray-400">
                {userAlreadyOptedIn
                  ? "Vous êtes déjà abonné(e) à nos offres — merci !"
                  : "Recevez nos offres exclusives et nouveautés en avant-première"}
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full md:min-w-[320px] md:max-w-[480px] md:w-auto">
              <form
                onSubmit={handleSubmit}
                className="flex items-stretch bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
                style={{ boxShadow: "0 4px 20px rgba(26,82,66,0.08)" }}
              >
                <input
                  type="email"
                  placeholder="Votre adresse email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  required
                  className="flex-1 px-4 py-3 text-[13.5px] text-gray-700 outline-none bg-transparent placeholder:text-gray-400"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 text-white text-[11px] font-bold uppercase tracking-widest transition-all hover:opacity-90 disabled:opacity-60 flex items-center"
                  style={{
                    background:
                      "linear-gradient(135deg, #2d7a5f 0%, #3f9973 100%)",
                  }}
                >
                  {loading ? (
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    "S'inscrire"
                  )}
                </button>
              </form>
              {error && (
                <p className="flex items-center gap-1.5 text-[12px] text-red-400">
                  <X size={12} />
                  {error}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main footer ── */}
      <div
        className="bg-white border-b border-gray-100"
        style={{ padding: "40px 0 32px" }}
      >
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px" }}>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-9 md:gap-10">
            {/* À propos */}
            <div>
              <h4
                className="text-[11.5px] font-bold uppercase tracking-widest mb-5 relative pb-3"
                style={{ color: "#1a5242" }}
              >
                À propos
                <span
                  className="absolute bottom-0 left-0 w-7 h-0.5 rounded-full"
                  style={{ background: "#d4af37" }}
                />
              </h4>
              <ul className="space-y-3">
                {[
                  { to: "/about", label: "Qui sommes-nous ?" },
                  { to: "/engagement", label: "Nos engagements" },
                  { to: "/blog", label: "Notre blog" },
                  { to: "/faq", label: "Questions fréquentes" },
                  { to: "/contact", label: "Nous contacter" },
                ].map(({ to, label }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="text-[13.5px] text-gray-500 hover:text-[#d4af37] hover:pl-1.5 transition-all duration-200"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Service client */}
            <div>
              <h4
                className="text-[11.5px] font-bold uppercase tracking-widest mb-5 relative pb-3"
                style={{ color: "#1a5242" }}
              >
                Service client
                <span
                  className="absolute bottom-0 left-0 w-7 h-0.5 rounded-full"
                  style={{ background: "#d4af37" }}
                />
              </h4>
              <ul className="space-y-3">
                {[
                  { to: "/livraison", label: "Livraison & Retours" },
                  { to: "/paiement", label: "Comment commander" },
                  { to: "/garantie", label: "Garantie authenticité" },
                ].map(({ to, label }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="text-[13.5px] text-gray-500 hover:text-[#d4af37] hover:pl-1.5 transition-all duration-200"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Nos produits */}
            <div>
              <h4
                className="text-[11.5px] font-bold uppercase tracking-widest mb-5 relative pb-3"
                style={{ color: "#1a5242" }}
              >
                Nos produits
                <span
                  className="absolute bottom-0 left-0 w-7 h-0.5 rounded-full"
                  style={{ background: "#d4af37" }}
                />
              </h4>
              <ul className="space-y-3">
                {[
                  {
                    to: "/products?category=soin",
                    label: "Soins visage & corps",
                  },
                  {
                    to: "/products?category=solaire",
                    label: "Protection solaire",
                  },
                  {
                    to: "/products?category=bebe-et-maman",
                    label: "Bébé & Maman",
                  },
                  {
                    to: "/products?category=complements-alimentaires",
                    label: "Compléments alimentaires",
                  },
                  { to: "/products?category=hygiene", label: "Hygiène" },
                  {
                    to: "/products?category=paramedicaux",
                    label: "Paramédicaux",
                  },
                ].map(({ to, label }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="text-[13.5px] text-gray-500 hover:text-[#d4af37] hover:pl-1.5 transition-all duration-200"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4
                className="text-[11.5px] font-bold uppercase tracking-widest mb-5 relative pb-3"
                style={{ color: "#1a5242" }}
              >
                Nous contacter
                <span
                  className="absolute bottom-0 left-0 w-7 h-0.5 rounded-full"
                  style={{ background: "#d4af37" }}
                />
              </h4>
              <div className="space-y-3.5 mb-6">
                {[
                  {
                    icon: MapPin,
                    text: "Route Gremda Km3, en face Clinique Chams, Sfax, Tunisie",
                    href: null,
                  },
                  {
                    icon: Phone,
                    text: "+216 94 169 416",
                    href: "tel:+21694169416",
                  },
                  {
                    icon: Mail,
                    text: "parasunshine25@gmail.com",
                    href: "mailto:parasunshine25@gmail.com",
                  },
                  { icon: Clock, text: "Lun – Sam : 9h – 20h", href: null },
                ].map(({ icon: Icon, text, href }) => (
                  <div key={text} className="flex items-start gap-3">
                    <Icon
                      size={15}
                      className="flex-shrink-0 mt-0.5"
                      style={{ color: "#d4af37" }}
                    />
                    {href ? (
                      <a
                        href={href}
                        className="text-[13px] text-gray-500 hover:text-[#1a5242] transition-colors break-all min-w-0"
                      >
                        {text}
                      </a>
                    ) : (
                      <span className="text-[13px] text-gray-500 break-words min-w-0">
                        {text}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Réseaux sociaux */}
              <div className="flex gap-2.5">
                {[
                  {
                    href: "https://www.facebook.com/ParaSunShine",
                    icon: Facebook,
                    label: "Facebook",
                  },
                  {
                    href: "https://instagram.com",
                    icon: Instagram,
                    label: "Instagram",
                  },
                ].map(({ href, icon: Icon, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full flex items-center justify-center border border-gray-200 text-gray-500 hover:border-[#1a5242] hover:text-white hover:bg-[#1a5242] transition-all duration-200"
                    aria-label={label}
                  >
                    <Icon size={17} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer bottom ── */}
      <div style={{ background: "#FFF3B0", padding: "18px 0" }}>
        <div
          style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px" }}
          className="flex flex-col sm:flex-row items-center sm:justify-between gap-2 sm:gap-3 text-center"
        >
          <p className="text-[13px] font-medium text-black/70">
            © {new Date().getFullYear()} ParaSunshine. Tous droits réservés.
          </p>
          <div className="flex items-center gap-4">
            <Link
              to="/mentions-legales"
              className="text-[13px] text-black/70 hover:text-black transition-colors"
            >
              Mentions légales
            </Link>
            <span className="text-black/30">•</span>
            <Link
              to="/politique-confidentialite"
              className="text-[13px] text-black/70 hover:text-black transition-colors"
            >
              Confidentialité
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
