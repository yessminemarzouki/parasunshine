import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import { sendPasswordResetLink } from "../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await sendPasswordResetLink(email);
      setSuccess(true);
    } catch (err) {
      setError(err?.response?.data?.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div
        className="bg-white min-h-screen py-10 md:py-16 px-5"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <div className="max-w-[420px] mx-auto text-center">
          <h1 className="text-[1.6rem] md:text-[1.8rem] font-bold text-gray-900 mb-2">
            Email envoyé !
          </h1>
          <p className="text-gray-500 text-[14px] mb-6">
            Nous avons envoyé un lien de réinitialisation à{" "}
            <strong className="text-gray-800">{email}</strong>
          </p>
          <p className="text-gray-500 text-[13.5px] leading-relaxed mb-8">
            Vérifiez votre boîte mail et cliquez sur le lien pour créer un
            nouveau mot de passe. Pensez à vérifier vos spams.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2.5 w-full sm:w-auto px-8 py-3.5 rounded-xl text-white font-bold text-[14px] hover:opacity-90 transition-opacity"
            style={{ background: "#1a5242" }}
          >
            Retour à la connexion
          </Link>
          <div className="mt-6">
            <Link
              to="/"
              className="text-[13px] text-gray-400 hover:text-gray-600 transition-colors"
            >
              ← Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white min-h-screen py-10 md:py-16 px-5"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="max-w-[420px] mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-[1.6rem] md:text-[1.8rem] font-bold text-gray-900 mb-2">
            Mot de passe oublié ?
          </h1>
          <p className="text-gray-500 text-[14px]">
            Entrez votre email pour recevoir un lien de réinitialisation
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-5 text-[13.5px] font-medium">
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-[13px] font-semibold text-gray-700 mb-1.5"
            >
              Adresse email
            </label>
            <div className="relative">
              <Mail
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="email"
                id="email"
                name="email"
                placeholder="votreemail@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-xl text-[13.5px] text-gray-800 outline-none focus:border-[#1a5242] focus:ring-2 focus:ring-[#1a5242]/10 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-white font-bold text-[14px] transition-all disabled:opacity-60 hover:opacity-90 mt-2"
            style={{ background: loading ? "#9ca3af" : "#1a5242" }}
          >
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <Mail size={18} />
                Envoyer le lien
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[13.5px] mt-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 font-semibold hover:underline"
            style={{ color: "#1a5242" }}
          >
            <ArrowLeft size={14} />
            Retour à la connexion
          </Link>
        </p>

        <div className="text-center mt-5">
          <Link
            to="/"
            className="text-[13px] text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
