// ── SHARED TAILWIND COMPONENTS ──────────────────────────────────

import { ChevronLeft, ChevronRight } from "lucide-react";

// Badges
export const Badge = ({ type = "gray", children }) => {
  const cls =
    {
      success: "bg-emerald-50 text-emerald-700 border-emerald-200",
      warning: "bg-amber-50 text-amber-700 border-amber-200",
      danger: "bg-red-50 text-red-700 border-red-200",
      info: "bg-blue-50 text-blue-700 border-blue-200",
      gray: "bg-gray-100 text-gray-600 border-gray-200",
      gold: "bg-yellow-50 text-yellow-800 border-yellow-200",
    }[type] || "bg-gray-100 text-gray-600 border-gray-200";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11.5px] font-semibold border ${cls}`}
    >
      {children}
    </span>
  );
};

// Action button
export const ActionBtn = ({ type = "ghost", onClick, title, children }) => {
  const cls = {
    info: "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100",
    success:
      "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100",
    warning: "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100",
    danger: "bg-red-50 text-red-600 border-red-200 hover:bg-red-100",
    ghost: "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100",
  }[type];

  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-colors ${cls}`}
    >
      {children}
    </button>
  );
};

// Primary button
export const Btn = ({
  onClick,
  children,
  ghost = false,
  danger = false,
  type = "button",
  disabled = false,
}) => {
  let cls = "bg-[#1a4731] text-white hover:bg-[#153d29] shadow-sm";
  if (ghost)
    cls = "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50";
  if (danger) cls = "bg-red-600 text-white hover:bg-red-700";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 px-4 py-2 h-9 rounded-lg text-[13.5px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${cls}`}
    >
      {children}
    </button>
  );
};

// Input
export const Input = ({
  value,
  onChange,
  placeholder,
  type = "text",
  className = "",
  ...props
}) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={`h-9 px-3 border border-gray-200 rounded-lg text-[13.5px] text-gray-800 bg-white outline-none focus:border-[#1a4731] focus:ring-2 focus:ring-[#1a4731]/10 transition-all placeholder:text-gray-400 ${className}`}
    {...props}
  />
);
// Select
export const Select = ({
  value,
  onChange,
  children,
  className = "",
  ...props
}) => (
  <select
    value={value}
    onChange={onChange}
    className={`h-9 px-3 border border-gray-200 rounded-lg text-[13.5px] text-gray-800 bg-white outline-none focus:border-[#1a4731] focus:ring-2 focus:ring-[#1a4731]/10 transition-all ${className}`}
    {...props}
  >
    {children}
  </select>
);

// Table wrapper
export const TableWrap = ({ children }) => (
  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
    {children}
  </div>
);

// Table
export const Table = ({ headers, children, empty }) => (
  <div className="overflow-x-auto">
    <table className="w-full border-collapse text-[13.5px]">
      <thead>
        <tr>
          {headers.map((h) => (
            <th
              key={h}
              className="bg-gray-50 text-gray-400 font-semibold text-[11px] uppercase tracking-widest px-4 py-2.5 text-left border-b border-gray-100 whitespace-nowrap"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
    {empty && (
      <div className="text-center py-16 text-[13.5px] text-gray-400">
        {empty}
      </div>
    )}
  </div>
);

// TR
export const TR = ({ children, onClick, className = "" }) => (
  <tr
    onClick={onClick}
    className={`border-b border-gray-50 last:border-0 ${onClick ? "cursor-pointer" : ""} hover:bg-gray-50/50 transition-colors ${className}`}
  >
    {children}
  </tr>
);

// TD
export const TD = ({ children, className = "" }) => (
  <td className={`px-4 py-3 text-gray-700 align-middle ${className}`}>
    {children}
  </td>
);

// Pagination
export const Pagination = ({ meta, page, setPage }) => {
  if (!meta?.last_page || meta.last_page <= 1) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 text-[13px] text-gray-500">
      <span>
        Page {meta.current_page} sur {meta.last_page} — {meta.total} résultats
      </span>
      <div className="flex gap-1">
        <button
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={14} />
        </button>
        {Array.from(
          { length: Math.min(meta.last_page, 5) },
          (_, i) => i + 1,
        ).map((p) => (
          <button
            key={p}
            onClick={() => setPage(p)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg text-[13px] font-medium transition-colors ${
              p === page
                ? "bg-[#1a4731] text-white border border-[#1a4731]"
                : "border border-gray-200 bg-white hover:bg-gray-50 text-gray-600"
            }`}
          >
            {p}
          </button>
        ))}
        <button
          disabled={page >= meta.last_page}
          onClick={() => setPage(page + 1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

// Modal
export const Modal = ({ onClose, title, children, maxWidth = "max-w-3xl" }) => (
  <div
    className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-0 sm:p-6"
    style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }}
    onClick={onClose}
  >
    <div
      className={`bg-white rounded-t-2xl sm:rounded-2xl w-full ${maxWidth} max-h-[92vh] sm:max-h-[88vh] overflow-y-auto shadow-2xl`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100 rounded-t-2xl">
        <h2 className="text-[15px] font-bold text-gray-900">{title}</h2>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 text-lg leading-none transition-colors flex-shrink-0"
        >
          ×
        </button>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  </div>
);

// Spinner
export const Spinner = () => (
  <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
    <div className="w-7 h-7 border-2 border-gray-200 border-t-[#1a4731] rounded-full animate-spin" />
    <span className="text-[13px]">Chargement...</span>
  </div>
);

// Page header
export const PageHeader = ({ title, subtitle, action }) => (
  <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-7 gap-3 sm:gap-4">
    <div>
      <h1 className="text-[21px] font-extrabold text-gray-900 tracking-tight leading-tight">
        {title}
      </h1>
      {subtitle && <p className="text-[13px] text-gray-400 mt-1">{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

// Form label
export const Label = ({ children }) => (
  <label className="block text-[12.5px] font-semibold text-gray-600 mb-1.5">
    {children}
  </label>
);
// Toast notification
import { useEffect } from "react";
import { AlertCircle, CheckCircle, X } from "lucide-react";

export const Toast = ({ message, type = "error", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, []);

  const cls = {
    error: "bg-red-50 border-red-200 text-red-700",
    success: "bg-emerald-50 border-emerald-200 text-emerald-700",
    warning: "bg-amber-50 border-amber-200 text-amber-700",
  }[type];

  const Icon = type === "success" ? CheckCircle : AlertCircle;

  return (
    <div
      className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-5 sm:top-5 z-[9999] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg sm:max-w-sm ${cls} animate-in`}
      style={{ animation: "slideIn 0.2s ease" }}
    >
      <Icon size={16} className="flex-shrink-0" />
      <p className="text-[13.5px] font-semibold flex-1">{message}</p>
      <button
        onClick={onClose}
        className="opacity-50 hover:opacity-100 transition-opacity"
      >
        <X size={14} />
      </button>
    </div>
  );
};
