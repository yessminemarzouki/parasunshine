import { useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  CheckCircle,
  X,
  MessageSquare,
  Facebook,
  Instagram,
  ChevronRight,
} from "lucide-react";
import { sendContact } from "../services/api";

const INPUT_CLS =
  "w-full h-10 px-3 border border-gray-200 rounded-xl text-[13.5px] text-gray-800 outline-none focus:border-[#1a5242] focus:ring-2 focus:ring-[#1a5242]/10 transition-all bg-white placeholder:text-gray-400";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await sendContact(form);
      if (data.success) {
        setShowSuccess(true);
        setForm({ name: "", email: "", phone: "", subject: "", message: "" });
      } else {
        setError(data.message || "Une erreur est survenue.");
      }
    } catch (err) {
      const errors = err?.response?.data?.errors;
      setError(
        errors
          ? Object.values(errors)[0][0]
          : err?.response?.data?.message ||
              "Impossible d'envoyer le message. Vérifiez votre connexion.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="bg-white min-h-screen"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Popup Succès ── */}
      {showSuccess && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setShowSuccess(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowSuccess(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors"
            >
              <X size={15} />
            </button>
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: "#FFF3B0" }}
            >
              <CheckCircle size={32} style={{ color: "#355847" }} />
            </div>
            <h2 className="text-[20px] font-bold text-gray-900 mb-2">
              Message envoyé !
            </h2>
            <p className="text-[14px] text-gray-500 leading-relaxed mb-6">
              Merci pour votre message. Notre équipe vous répondra dans les{" "}
              <strong className="text-gray-800">24 heures</strong> ouvrables.
            </p>
            <button
              onClick={() => setShowSuccess(false)}
              className="w-full py-2.5 rounded-xl text-white font-semibold text-[14px] hover:opacity-90 transition-opacity"
              style={{ background: "#1a5242" }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}

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
            <span className="text-[#1a5242] font-semibold">Contact</span>
          </nav>

          <div className="max-w-2xl text-left">
            <span
              className="inline-block text-[11px] font-bold uppercase tracking-widest mb-4 px-3 py-1 rounded-full"
              style={{ background: "#FFF3B0", color: "#355847" }}
            >
              Nous contacter
            </span>
            <h1 className="text-[1.6rem] md:text-[2rem] font-bold text-gray-900 mb-4 leading-tight">
              Une question ? Nous sommes là
            </h1>
            <p className="text-gray-500 text-[15px] md:text-[16px] leading-relaxed">
              Notre équipe est disponible pour répondre à toutes vos questions.
            </p>
          </div>
        </div>
      </div>

      {/* ── Main ── */}
      <div
        style={{ maxWidth: 1300, margin: "0 auto" }}
        className="px-5 py-10 md:px-8 md:py-16"
      >
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-10 lg:gap-12 items-start">
          {/* ── Infos gauche ── */}
          <div>
            <p className="text-[14px] text-gray-500 leading-relaxed mb-8">
              Vous avez une question sur un produit, une commande ou un conseil
              beauté ? Écrivez-nous.
            </p>

            <div className="space-y-6 mb-10">
              {[
                {
                  icon: MapPin,
                  title: "Adresse",
                  main: "Route Gremda Km3, en face Clinique Chams",
                  sub: "Sfax, Tunisie",
                },
                {
                  icon: Phone,
                  title: "Téléphone",
                  main: "+216 94 169 416",
                  sub: "Lun–Sam : 9h – 20h",
                },
                {
                  icon: Mail,
                  title: "Email",
                  main: "parasunshine25@gmail.com",
                  sub: "Réponse sous 24h",
                },
                {
                  icon: Clock,
                  title: "Horaires",
                  main: "Lundi – Samedi",
                  sub: "9h – 20h",
                },
              ].map(({ icon: Icon, title, main, sub }) => (
                <div key={title} className="flex items-start gap-3">
                  <Icon
                    size={16}
                    style={{ color: "#355847" }}
                    className="flex-shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">
                      {title}
                    </p>
                    <p className="text-[13.5px] font-medium text-gray-800">
                      {main}
                    </p>
                    {sub && (
                      <p className="text-[12.5px] text-gray-400 mt-0.5">
                        {sub}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Réseaux sociaux */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-3">
                Suivez-nous
              </p>
              <div className="flex gap-2.5">
                <a
                  href="https://www.facebook.com/ParaSunShine"
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#1a5242] hover:text-[#1a5242] transition-colors"
                >
                  <Facebook size={17} />
                </a>
                <a
                  href="https://www.instagram.com/para_sunshine_tunisie"
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#1a5242] hover:text-[#1a5242] transition-colors"
                >
                  <Instagram size={17} />
                </a>
                <a
                  href="https://wa.me/21624702829"
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#1a5242] hover:text-[#1a5242] transition-colors"
                >
                  <MessageSquare size={17} />
                </a>
              </div>
            </div>
          </div>

          {/* ── Formulaire droite ── */}
          <div className="border border-gray-100 rounded-2xl p-5 md:p-8">
            <h2 className="text-[16px] font-bold text-gray-900 mb-6">
              Envoyez-nous un message
            </h2>

            {error && (
              <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-5 text-[13.5px] font-medium">
                <X size={15} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12.5px] font-semibold text-gray-600 mb-1.5">
                    Nom complet *
                  </label>
                  <input
                    name="name"
                    type="text"
                    placeholder="Votre nom"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className={INPUT_CLS}
                  />
                </div>
                <div>
                  <label className="block text-[12.5px] font-semibold text-gray-600 mb-1.5">
                    Email *
                  </label>
                  <input
                    name="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className={INPUT_CLS}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12.5px] font-semibold text-gray-600 mb-1.5">
                    Téléphone
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    placeholder="+216 XX XXX XXX"
                    value={form.phone}
                    onChange={handleChange}
                    className={INPUT_CLS}
                  />
                </div>
                <div>
                  <label className="block text-[12.5px] font-semibold text-gray-600 mb-1.5">
                    Sujet *
                  </label>
                  <select
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    required
                    className={INPUT_CLS + " cursor-pointer"}
                  >
                    <option value="">Choisir un sujet</option>
                    <option value="Commande">Question sur une commande</option>
                    <option value="Produit">Conseil produit</option>
                    <option value="Livraison">Livraison</option>
                    <option value="Retour">Retour / Remboursement</option>
                    <option value="Partenariat">Partenariat</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[12.5px] font-semibold text-gray-600 mb-1.5">
                  Message *
                </label>
                <textarea
                  name="message"
                  placeholder="Décrivez votre demande en détail..."
                  value={form.message}
                  onChange={handleChange}
                  rows={6}
                  required
                  maxLength={2000}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[13.5px] text-gray-800 outline-none focus:border-[#1a5242] focus:ring-2 focus:ring-[#1a5242]/10 transition-all resize-none placeholder:text-gray-400"
                />
                <p className="text-right text-[12px] text-gray-400 mt-1">
                  {form.message.length}/2000
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-white font-bold text-[14px] transition-all disabled:opacity-60 hover:opacity-90"
                style={{ background: loading ? "#9ca3af" : "#1a5242" }}
              >
                {loading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send size={17} />
                    Envoyer le message
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
