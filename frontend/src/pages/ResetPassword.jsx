import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Eye, EyeOff } from "lucide-react";
import { resetPassword } from "../services/api";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    email: "",
    token: "",
    password: "",
    password_confirmation: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      setError("Lien de réinitialisation invalide");
      return;
    }

    setFormData((prev) => ({ ...prev, token, email }));
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.password_confirmation) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(formData);
      navigate("/login?reset=success");
    } catch (err) {
      setError(err?.response?.data?.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div
      className="bg-white min-h-screen py-10 md:py-16 px-5"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="max-w-[420px] mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-[1.6rem] md:text-[1.8rem] font-bold text-gray-900 mb-2">
            Nouveau mot de passe
          </h1>
          <p className="text-gray-500 text-[14px]">
            Créez un nouveau mot de passe sécurisé
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
              htmlFor="password"
              className="block text-[13px] font-semibold text-gray-700 mb-1.5"
            >
              Nouveau mot de passe
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
                placeholder="Min 8 caractères"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
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

          <div>
            <label
              htmlFor="password_confirmation"
              className="block text-[13px] font-semibold text-gray-700 mb-1.5"
            >
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <Lock
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type={showPasswordConfirm ? "text" : "password"}
                id="password_confirmation"
                name="password_confirmation"
                placeholder="Confirmer le mot de passe"
                value={formData.password_confirmation}
                onChange={handleChange}
                required
                autoComplete="new-password"
                className="w-full h-11 pl-10 pr-11 border border-gray-200 rounded-xl text-[13.5px] text-gray-800 outline-none focus:border-[#1a5242] focus:ring-2 focus:ring-[#1a5242]/10 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirm((prev) => !prev)}
                aria-label="Afficher le mot de passe"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswordConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
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
                Réinitialisation...
              </>
            ) : (
              <>
                <Lock size={18} />
                Réinitialiser le mot de passe
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[13.5px] mt-6">
          <Link
            to="/login"
            className="font-semibold hover:underline"
            style={{ color: "#1a5242" }}
          >
            ← Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
