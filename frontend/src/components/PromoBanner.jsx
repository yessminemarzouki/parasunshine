import { useState, useEffect } from "react";
import {
  Truck,
  Lock,
  ShieldCheck,
  Gift,
  Star,
  Package,
  Phone,
} from "lucide-react";
import api from "../services/api";

const ICON_MAP = {
  Truck,
  Lock,
  ShieldCheck,
  Gift,
  Star,
  Package,
  Phone,
};

const PromoBanner = () => {
  const [current, setCurrent] = useState(0);
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    api
      .get("/promo-banner")
      .then((res) => {
        if (res.data?.is_active) setBanner(res.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!banner?.messages?.length) return;
    const interval = setInterval(() => {
      setCurrent((i) => (i + 1) % banner.messages.length);
    }, banner.interval || 3000);
    return () => clearInterval(interval);
  }, [banner]);

  if (!banner || !banner.is_active || !banner.messages?.length) return null;

  const { icon, text } = banner.messages[current];
  const Icon = ICON_MAP[icon] || Gift;

  return (
    <div
      className="w-full py-2.5 text-center text-[13px] font-semibold tracking-wide"
      style={{ background: banner.background_color, color: banner.text_color }}
    >
      <span
        key={current}
        className="inline-flex items-center gap-2"
        style={{ animation: "fadeIn 0.5s ease" }}
      >
        <Icon size={14} strokeWidth={2.5} />
        {text}
      </span>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default PromoBanner;
