import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div
      className="min-h-[70vh] flex flex-col items-center justify-center gap-5 px-6 text-center"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <p className="text-[80px] font-extrabold text-[#1a5242] leading-none">
        404
      </p>
      <h1 className="text-[22px] font-bold text-gray-900">Page introuvable</h1>
      <p className="text-[14px] text-gray-500 max-w-md">
        La page que vous cherchez n'existe pas ou a été déplacée.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-[14px] text-white transition-opacity hover:opacity-90"
        style={{ background: "#1a5242" }}
      >
        <Home size={16} />
        Retour à l'accueil
      </Link>
    </div>
  );
}
