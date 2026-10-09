import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react";
import { login, getGoogleAuthUrl } from "../services/api";
import { peekPostLoginRedirect } from "../utils/authRedirect";

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const redirectTarget =
      localStorage.getItem("checkout_redirect_after_login") ||
      sessionStorage.getItem("redirect_after_login") ||
      "/account";

    try {
      const response = await login(formData);
      localStorage.setItem("auth_token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      if (rememberMe) localStorage.setItem("remember_me", "true");

      // La clé checkout n'est PAS supprimée ici : c'est /checkout qui la
      // consomme (ou la page Account qui redirige si on y atterrit).
      const target =
        peekPostLoginRedirect() ||
        sessionStorage.getItem("redirect_after_login") ||
        "/account";
      sessionStorage.removeItem("redirect_after_login");
      window.location.href = target;
    } catch (err) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.email?.[0] ||
        "Email ou mot de passe incorrect";
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const data = await getGoogleAuthUrl();
      window.location.href = data.url;
    } catch {
      setError("Impossible de se connecter avec Google");
      setLoading(false);
    }
  };

  return (
    <div
      className="bg-white min-h-screen py-10 md:py-16 px-5"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="max-w-[420px] mx-auto">
        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-[1.6rem] md:text-[1.8rem] font-bold text-gray-900 mb-2">
            Connexion
          </h1>
          <p className="text-gray-500 text-[14px]">
            Connectez-vous pour accéder à votre compte
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-5 text-[13.5px] font-medium">
            ⚠ {error}
          </div>
        )}

        {/* GOOGLE BUTTON */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-gray-200 text-[14px] font-medium text-gray-800 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-60 mb-5"
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path
              fill="#4285F4"
              d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18Z"
            />
            <path
              fill="#34A853"
              d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17Z"
            />
            <path
              fill="#FBBC05"
              d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07Z"
            />
            <path
              fill="#EA4335"
              d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3Z"
            />
          </svg>
          Continuer avec Google
        </button>

        {/* DIVIDER */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-[12.5px] text-gray-400">ou</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* FORM */}
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
                placeholder="email@exemple.com"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-xl text-[13.5px] text-gray-800 outline-none focus:border-[#1a5242] focus:ring-2 focus:ring-[#1a5242]/10 transition-all"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-[13px] font-semibold text-gray-700 mb-1.5"
            >
              Mot de passe
            </label>
            <div className="relative">
              <Lock
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                className="w-full h-11 pl-10 pr-11 border border-gray-200 rounded-xl text-[13.5px] text-gray-800 outline-none focus:border-[#1a5242] focus:ring-2 focus:ring-[#1a5242]/10 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label="Afficher le mot de passe"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 accent-[#1a5242]"
              />
              <span className="text-[13px] text-gray-600">
                Se souvenir de moi
              </span>
            </label>
            <Link
              to="/forgot-password"
              className="text-[13px] font-semibold hover:underline"
              style={{ color: "#1a5242" }}
            >
              Mot de passe oublié ?
            </Link>
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
                Connexion...
              </>
            ) : (
              <>
                <LogIn size={18} />
                Se connecter
              </>
            )}
          </button>
        </form>

        {/* FOOTER */}
        <p className="text-center text-[13.5px] text-gray-500 mt-6">
          Vous n'avez pas de compte ?{" "}
          <Link
            to="/register"
            className="font-semibold hover:underline"
            style={{ color: "#d4af37" }}
          >
            Créer un compte
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
};

export default Login;
