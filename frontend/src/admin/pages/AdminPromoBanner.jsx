import { useState, useEffect } from "react";
import { Save, Plus, Trash2, Eye } from "lucide-react";
import { getPromoBanner, updatePromoBanner } from "../services/adminApi";
import {
  Btn,
  Input,
  Spinner,
  PageHeader,
  Toast,
  Label,
} from "../components/AdminShared";

const ICONS = [
  "Truck",
  "ShieldCheck",
  "Gift",
  "Star",
  "Package",
  "Phone",
  "Lock",
];

export default function AdminPromoBanner() {
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [preview, setPreview] = useState(false);

  const showToast = (message, type = "success") => setToast({ message, type });

  useEffect(() => {
    fetchBanner();
  }, []);

  const fetchBanner = async () => {
    try {
      setLoading(true);
      const data = await getPromoBanner();
      setBanner(data);
    } catch {
      showToast("Erreur lors du chargement.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updatePromoBanner(banner);
      showToast("Bannière mise à jour avec succès.");
    } catch {
      showToast("Erreur lors de la mise à jour.", "error");
    } finally {
      setSaving(false);
    }
  };

  const addMessage = () => {
    setBanner((b) => ({
      ...b,
      messages: [...b.messages, { icon: "Gift", text: "Nouveau message" }],
    }));
  };

  const removeMessage = (i) => {
    setBanner((b) => ({
      ...b,
      messages: b.messages.filter((_, idx) => idx !== i),
    }));
  };

  const updateMessage = (i, field, value) => {
    setBanner((b) => ({
      ...b,
      messages: b.messages.map((m, idx) =>
        idx === i ? { ...m, [field]: value } : m,
      ),
    }));
  };

  if (loading) return <Spinner />;

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <PageHeader
        title="Bannière promotionnelle"
        subtitle="Gérez le contenu et le design du bandeau en haut du site"
        action={
          <div className="flex gap-2">
            <Btn ghost onClick={() => setPreview((p) => !p)}>
              <Eye size={14} /> {preview ? "Masquer" : "Aperçu"}
            </Btn>
            <Btn onClick={handleSave} disabled={saving}>
              {saving ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={14} /> Enregistrer
                </>
              )}
            </Btn>
          </div>
        }
      />

      {/* Aperçu */}
      {preview && banner && (
        <div
          className="w-full py-2.5 text-center text-[13px] font-semibold tracking-wide rounded-xl mb-5"
          style={{
            background: banner.background_color,
            color: banner.text_color,
          }}
        >
          {banner.messages[0]?.text || "Aperçu du message"}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Design */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-[13px] font-bold text-gray-700 mb-4">Design</p>
          <div className="flex flex-col gap-4">
            <div>
              <Label>Couleur de fond</Label>
              <div className="flex items-center gap-3 mt-1.5">
                <input
                  type="color"
                  value={banner.background_color}
                  onChange={(e) =>
                    setBanner((b) => ({
                      ...b,
                      background_color: e.target.value,
                    }))
                  }
                  className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                />
                <Input
                  value={banner.background_color}
                  onChange={(e) =>
                    setBanner((b) => ({
                      ...b,
                      background_color: e.target.value,
                    }))
                  }
                  className="w-full"
                  placeholder="#d4af37"
                />
              </div>
            </div>
            <div>
              <Label>Couleur du texte</Label>
              <div className="flex items-center gap-3 mt-1.5">
                <input
                  type="color"
                  value={banner.text_color}
                  onChange={(e) =>
                    setBanner((b) => ({ ...b, text_color: e.target.value }))
                  }
                  className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                />
                <Input
                  value={banner.text_color}
                  onChange={(e) =>
                    setBanner((b) => ({ ...b, text_color: e.target.value }))
                  }
                  className="w-full"
                  placeholder="#1a3d2b"
                />
              </div>
            </div>
            <div>
              <Label>Intervalle de défilement (ms)</Label>
              <Input
                type="number"
                value={banner.interval}
                onChange={(e) =>
                  setBanner((b) => ({
                    ...b,
                    interval: parseInt(e.target.value),
                  }))
                }
                className="w-full mt-1.5"
                placeholder="3000"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                1000ms = 1 seconde — recommandé : 3000ms
              </p>
            </div>
            <div>
              <Label>Bannière active</Label>
              <label className="flex items-center gap-3 cursor-pointer mt-1.5">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={banner.is_active}
                    onChange={(e) =>
                      setBanner((b) => ({ ...b, is_active: e.target.checked }))
                    }
                    className="sr-only"
                  />
                  <div
                    className={`w-10 h-5 rounded-full transition-colors ${banner.is_active ? "bg-[#1a4731]" : "bg-gray-200"}`}
                  />
                  <div
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${banner.is_active ? "translate-x-5" : ""}`}
                  />
                </div>
                <span className="text-[13px] text-gray-700">
                  {banner.is_active ? "Visible sur le site" : "Masquée"}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[13px] font-bold text-gray-700">Messages</p>
            <Btn onClick={addMessage}>
              <Plus size={14} /> Ajouter
            </Btn>
          </div>
          <div className="flex flex-col gap-3">
            {banner.messages.map((msg, i) => (
              <div
                key={i}
                className="flex flex-col gap-2 p-3 border border-gray-200 rounded-xl bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11.5px] font-bold text-gray-500">
                    Message {i + 1}
                  </span>
                  <button
                    onClick={() => removeMessage(i)}
                    disabled={banner.messages.length === 1}
                    className="w-6 h-6 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 disabled:opacity-30"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <div>
                  <Label>Icône</Label>
                  <select
                    value={msg.icon}
                    onChange={(e) => updateMessage(i, "icon", e.target.value)}
                    className="w-full h-9 px-3 border border-gray-200 rounded-lg text-[13px] text-gray-700 bg-white outline-none focus:border-[#1a4731] mt-1"
                  >
                    {ICONS.map((icon) => (
                      <option key={icon} value={icon}>
                        {icon}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Texte</Label>
                  <Input
                    value={msg.text}
                    onChange={(e) => updateMessage(i, "text", e.target.value)}
                    className="w-full mt-1"
                    placeholder="Texte du message..."
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
