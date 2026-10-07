import { useState } from "react";
import { peekPostLoginRedirect } from "../utils/authRedirect";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Phone, Eye, EyeOff, UserPlus } from "lucide-react";
import { register, getGoogleAuthUrl } from "../services/api";

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    civility: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [gdprAccepted, setGdprAccepted] = useState(false);
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    const newErrors = {};

    if (!formData.first_name.trim())
      newErrors.first_name = "Le prénom est requis";
    if (!formData.last_name.trim()) newErrors.last_name = "Le nom est requis";
    if (!formData.email.trim()) newErrors.email = "L'email est requis";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "L'email doit être valide";
    if (!formData.phone.trim()) newErrors.phone = "Le téléphone est requis";
    if (!formData.password) newErrors.password = "Le mot de passe est requis";
    else if (formData.password.length < 8)
      newErrors.password =
        "Le mot de passe doit contenir au moins 8 caractères";
    if (!formData.password_confirmation)
      newErrors.password_confirmation = "Veuillez confirmer le mot de passe";
    else if (formData.password !== formData.password_confirmation)
      newErrors.password_confirmation =
        "Les mots de passe ne correspondent pas";
    if (!acceptTerms)
      newErrors.terms = "Vous devez accepter les conditions générales";
    if (!gdprAccepted)
      newErrors.gdpr =
        "Vous devez accepter le traitement de vos données personnelles";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await register({
        ...formData,
        newsletter_opt_in: newsletterOptIn,
        gdpr_accepted: gdprAccepted,
      });
      localStorage.setItem("auth_token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));

      const redirectTo =
        localStorage.getItem("checkout_redirect_after_login") ||
        sessionStorage.getItem("redirect_after_login") ||
        "/account";
      localStorage.removeItem("checkout_redirect_after_login");
      sessionStorage.removeItem("redirect_after_login");
      window.location.href = redirectTo;
    } catch (err) {
      const serverErrors = {};
      if (err?.response?.data?.errors) {
        Object.keys(err.response.data.errors).forEach((key) => {
          serverErrors[key] = err.response.data.errors[key][0];
        });
      } else if (err?.response?.data?.message) {
        serverErrors.general = err.response.data.message;
      } else {
        serverErrors.general = "Une erreur est survenue lors de l'inscription";
      }
      setErrors(serverErrors);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);
      const data = await getGoogleAuthUrl();
      window.location.href = data.url;
    } catch {
      setErrors({ general: "Impossible de se connecter avec Google" });
      setLoading(false);
    }
  };

  const inputCls =
    "w-full h-11 pl-10 pr-4 border rounded-xl text-[13.5px] text-gray-800 outline-none focus:ring-2 transition-all";
  const inputBorder = (field) =>
    errors[field]
      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
      : "border-gray-200 focus:border-[#1a5242] focus:ring-[#1a5242]/10";

  return (
    <div
      className="bg-white min-h-screen py-10 md:py-16 px-5"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="max-w-[460px] mx-auto">
        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-[1.6rem] md:text-[1.8rem] font-bold text-gray-900 mb-2">
            Créer un compte
          </h1>
          <p className="text-gray-500 text-[14px]">
            Rejoignez notre communauté et profitez de tous nos avantages
          </p>
        </div>

        {errors.general && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-5 text-[13.5px] font-medium">
            ⚠ {errors.general}
          </div>
        )}

        {/* GOOGLE BUTTON */}
        <button
          type="button"
          onClick={handleGoogleSignup}
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
          S'inscrire avec Google
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-[12.5px] text-gray-400">ou</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Civilité */}
          <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
              Civilité
            </label>
            <div className="flex gap-5">
              {["M.", "Mme"].map((c) => (
                <label
                  key={c}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="civility"
                    value={c}
                    checked={formData.civility === c}
                    onChange={handleChange}
                    className="w-4 h-4 accent-[#1a5242]"
                  />
                  <span className="text-[13.5px] text-gray-700">{c}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Prénom + Nom */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                Prénom
              </label>
              <div className="relative">
                <User
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  type="text"
                  name="first_name"
                  placeholder="Votre prénom"
                  value={formData.first_name}
                  onChange={handleChange}
                  className={`${inputCls} ${inputBorder("first_name")}`}
                />
              </div>
              {errors.first_name && (
                <span className="block text-red-500 text-[12px] mt-1">
                  {errors.first_name}
                </span>
              )}
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                Nom
              </label>
              <div className="relative">
                <User
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  type="text"
                  name="last_name"
                  placeholder="Votre nom"
                  value={formData.last_name}
                  onChange={handleChange}
                  className={`${inputCls} ${inputBorder("last_name")}`}
                />
              </div>
              {errors.last_name && (
                <span className="block text-red-500 text-[12px] mt-1">
                  {errors.last_name}
                </span>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="email"
                name="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={handleChange}
                className={`${inputCls} ${inputBorder("email")}`}
              />
            </div>
            {errors.email && (
              <span className="block text-red-500 text-[12px] mt-1">
                {errors.email}
              </span>
            )}
          </div>

          {/* Téléphone */}
          <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
              Téléphone
            </label>
            <div className="relative">
              <Phone
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="tel"
                name="phone"
                placeholder="+216 20 123 456"
                value={formData.phone}
                onChange={handleChange}
                className={`${inputCls} ${inputBorder("phone")}`}
              />
            </div>
            {errors.phone && (
              <span className="block text-red-500 text-[12px] mt-1">
                {errors.phone}
              </span>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
              Mot de passe
            </label>
            <div className="relative">
              <Lock
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Min 8 caractères"
                value={formData.password}
                onChange={handleChange}
                className={`${inputCls} ${inputBorder("password")} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.password && (
              <span className="block text-red-500 text-[12px] mt-1">
                {errors.password}
              </span>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <Lock
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type={showPasswordConfirm ? "text" : "password"}
                name="password_confirmation"
                placeholder="Confirmer mot de passe"
                value={formData.password_confirmation}
                onChange={handleChange}
                className={`${inputCls} ${inputBorder("password_confirmation")} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswordConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.password_confirmation && (
              <span className="block text-red-500 text-[12px] mt-1">
                {errors.password_confirmation}
              </span>
            )}
          </div>

          {/* Terms */}
          <div>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="w-4 h-4 accent-[#1a5242] mt-0.5 flex-shrink-0"
              />
              <span className="text-[13px] text-gray-600">
                J'accepte les{" "}
                <Link
                  to="/terms"
                  target="_blank"
                  className="font-semibold hover:underline"
                  style={{ color: "#d4af37" }}
                >
                  conditions générales
                </Link>
              </span>
            </label>
            {errors.terms && (
              <span className="block text-red-500 text-[12px] mt-1 pl-6">
                {errors.terms}
              </span>
            )}
          </div>

          {/* Newsletter */}
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={newsletterOptIn}
              onChange={(e) => setNewsletterOptIn(e.target.checked)}
              className="w-4 h-4 accent-[#1a5242] mt-0.5 flex-shrink-0"
            />
            <span className="text-[13px] text-gray-600">
              Recevoir les offres et actualités par email
            </span>
          </label>

          {/* RGPD */}
          <div>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={gdprAccepted}
                onChange={(e) => setGdprAccepted(e.target.checked)}
                className="w-4 h-4 accent-[#1a5242] mt-0.5 flex-shrink-0"
              />
              <span className="text-[13px] text-gray-600">
                Message concernant la confidentialité des données clients
              </span>
            </label>
            <p className="text-[11.5px] text-gray-400 italic mt-1.5 pl-6 leading-relaxed">
              Conformément aux dispositions de la loi n°2004-63 relative à la
              protection des données à caractère personnel, vous disposez d'un
              droit d'accès, de rectification et d'opposition sur les données
              vous concernant.
            </p>
            {errors.gdpr && (
              <span className="block text-red-500 text-[12px] mt-1 pl-6">
                {errors.gdpr}
              </span>
            )}
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
                Création...
              </>
            ) : (
              <>
                <UserPlus size={18} />
                Créer mon compte
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[13.5px] text-gray-500 mt-6">
          Vous avez déjà un compte ?{" "}
          <Link
            to="/login"
            className="font-semibold hover:underline"
            style={{ color: "#d4af37" }}
          >
            Se connecter
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

export default Register;
