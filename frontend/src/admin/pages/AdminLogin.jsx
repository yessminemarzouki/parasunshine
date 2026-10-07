import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { adminLogin } from "../services/adminApi";
import logo from "../../assets/logo.png";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await adminLogin(email, password);
      if (data.user?.role !== "admin") {
        setError("Accès refusé. Droits administrateur requis.");
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
        return;
      }
      navigate("/admin/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message || "Email ou mot de passe incorrect.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        background:
          "linear-gradient(135deg, #0f2a1e 0%, #1a4731 55%, #2d7a5e 100%)",
      }}
    >
      <div className="w-full max-w-[400px] bg-white rounded-2xl shadow-2xl p-6 sm:p-10">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src={logo}
            alt="ParaSunshine"
            className="w-16 h-16 rounded-2xl object-cover shadow-md"
          />
        </div>

        <h1 className="text-center text-[22px] font-extrabold text-gray-900 tracking-tight mb-1">
          Administration
        </h1>
        <p className="text-center text-[13px] text-gray-400 mb-7">
          Connectez-vous à votre espace administrateur
        </p>

        {error && (
          <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-[13px] font-medium mb-5">
            <AlertCircle size={15} className="flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12.5px] font-semibold text-gray-600 mb-1.5">
              Adresse email
            </label>
            <div className="relative">
              <Mail
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@parasunshine.tn"
                required
                autoFocus
                className="w-full pl-10 pr-4 h-[40px] border border-gray-200 rounded-xl text-[13.5px] text-gray-900 outline-none focus:border-[#1a4731] focus:ring-2 focus:ring-[#1a4731]/10 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12.5px] font-semibold text-gray-600 mb-1.5">
              Mot de passe
            </label>
            <div className="relative">
              <Lock
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-10 h-[40px] border border-gray-200 rounded-xl text-[13.5px] text-gray-900 outline-none focus:border-[#1a4731] focus:ring-2 focus:ring-[#1a4731]/10 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[42px] bg-[#1a4731] hover:bg-[#153d29] text-white text-[14px] font-bold rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2 flex items-center justify-center"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Se connecter"
            )}
          </button>
        </form>

        <div className="text-center mt-5">
          <a
            href="/"
            className="text-[12px] text-gray-400 hover:text-[#1a4731] transition-colors"
          >
            ← Retour au site
          </a>
        </div>
      </div>
    </div>
  );
}
