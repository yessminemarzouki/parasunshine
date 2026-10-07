import { Link, useLocation } from "react-router-dom";
import { Sparkles } from "lucide-react";

export default function FloatingQuizButton() {
  const location = useLocation();

  if (location.pathname === "/quiz") return null;

  return (
    <Link
      to="/quiz"
      className="fixed z-[999] rounded-full flex flex-col items-center justify-center no-underline cursor-pointer box-border
        bottom-5 right-4 w-16 h-16 p-2
        md:bottom-7 md:right-7 md:w-[84px] md:h-[84px] md:p-1"
      style={{
        background: "rgba(255, 243, 176, 0.9)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.7)",
        boxShadow: "0 10px 30px rgba(53, 88, 71, 0.15)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px) scale(1.03)";
        e.currentTarget.style.boxShadow = "0 14px 34px rgba(53, 88, 71, 0.25)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0) scale(1)";
        e.currentTarget.style.boxShadow = "0 10px 30px rgba(53, 88, 71, 0.15)";
      }}
    >
      <div
        className="rounded-full bg-white flex items-center justify-center mb-0.5
          w-7 h-7 md:w-9 md:h-9"
        style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
      >
        <Sparkles
          size={14}
          color="#355847"
          strokeWidth={2.2}
          className="md:hidden"
        />
        <Sparkles
          size={16}
          color="#355847"
          strokeWidth={2.2}
          className="hidden md:block"
        />
      </div>
      <span
        className="text-center leading-tight text-[8px] md:text-[9.5px] font-bold max-w-[56px] md:max-w-[64px]"
        style={{ fontFamily: "'Inter', sans-serif", color: "#355847" }}
      >
        Mon diagnostic
      </span>
    </Link>
  );
}
