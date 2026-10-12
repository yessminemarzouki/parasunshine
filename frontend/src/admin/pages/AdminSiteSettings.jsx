import { useState, useEffect } from "react";
import {
  Save,
  MapPin,
  Phone,
  Mail,
  MessageSquare,
  Clock,
  Facebook,
  Instagram,
  Building2,
  Globe,
} from "lucide-react";
import { getSiteSettingsAdmin, updateSiteSettings } from "../services/adminApi";
import { invalidateSiteSettingsCache } from "../../services/api";
import {
  Btn,
  Input,
  Spinner,
  PageHeader,
  Label,
  Toast,
} from "../components/AdminShared";

export default function AdminSiteSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    getSiteSettingsAdmin()
      .then(setSettings)
      .catch(() => showToast("Erreur de chargement.", "error"))
      .finally(() => setLoading(false));
  }, []);

  const s = (key, val) => setSettings((p) => ({ ...p, [key]: val }));

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateSiteSettings(settings);
      invalidateSiteSettingsCache(); // force le frontend public à recharger
      showToast("Informations du site mises à jour.");
    } catch (err) {
      showToast(
        err.response?.data?.message || "Erreur lors de la sauvegarde.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) return <Spinner />;

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
        title="Informations du site"
        subtitle="Coordonnées, réseaux sociaux et informations légales"
        action={
          <Btn onClick={handleSave} disabled={saving}>
            {saving ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save size={14} /> Enregistrer
              </>
            )}
          </Btn>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── Coordonnées ── */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={16} className="text-[#1a4731]" />
            <p className="text-[13px] font-bold text-gray-700">Coordonnées</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Adresse complète</Label>
              <Input
                value={settings.address || ""}
                onChange={(e) => s("address", e.target.value)}
                placeholder="Route Gremda Km3, en face Clinique Chams, Sfax, Tunisie"
                className="w-full"
              />
            </div>
            <div>
              <Label>Téléphone</Label>
              <Input
                value={settings.phone || ""}
                onChange={(e) => s("phone", e.target.value)}
                placeholder="+216 94 169 416"
                className="w-full"
              />
            </div>
            <div>
              <Label>WhatsApp</Label>
              <Input
                value={settings.whatsapp || ""}
                onChange={(e) => s("whatsapp", e.target.value)}
                placeholder="+216 94 169 416"
                className="w-full"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={settings.email || ""}
                onChange={(e) => s("email", e.target.value)}
                placeholder="parasunshine25@gmail.com"
                className="w-full"
              />
            </div>
            <div>
              <Label>Horaires</Label>
              <Input
                value={settings.opening_hours || ""}
                onChange={(e) => s("opening_hours", e.target.value)}
                placeholder="Lun – Sam : 9h – 20h"
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* ── Réseaux sociaux ── */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={16} className="text-[#1a4731]" />
            <p className="text-[13px] font-bold text-gray-700">
              Réseaux sociaux
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <Label>Facebook (URL)</Label>
              <Input
                value={settings.facebook_url || ""}
                onChange={(e) => s("facebook_url", e.target.value)}
                placeholder="https://www.facebook.com/ParaSunShine"
                className="w-full"
              />
            </div>
            <div>
              <Label>Instagram (URL)</Label>
              <Input
                value={settings.instagram_url || ""}
                onChange={(e) => s("instagram_url", e.target.value)}
                placeholder="https://www.instagram.com/para_sunshine_tunisie"
                className="w-full"
              />
            </div>
            <div>
              <Label>TikTok (URL, optionnel)</Label>
              <Input
                value={settings.tiktok_url || ""}
                onChange={(e) => s("tiktok_url", e.target.value)}
                placeholder="https://www.tiktok.com/@..."
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* ── Informations légales ── */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={16} className="text-[#1a4731]" />
            <p className="text-[13px] font-bold text-gray-700">
              Informations légales
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <Label>Forme juridique</Label>
              <Input
                value={settings.legal_form || ""}
                onChange={(e) => s("legal_form", e.target.value)}
                placeholder="SARL / SUARL / Auto-entrepreneur..."
                className="w-full"
              />
            </div>
            <div>
              <Label>Capital social</Label>
              <Input
                value={settings.capital || ""}
                onChange={(e) => s("capital", e.target.value)}
                placeholder="Ex: 10 000 DT"
                className="w-full"
              />
            </div>
            <div>
              <Label>Hébergeur</Label>
              <Input
                value={settings.hosting_provider || ""}
                onChange={(e) => s("hosting_provider", e.target.value)}
                placeholder="Ex: OVH, Hostinger..."
                className="w-full"
              />
            </div>
            <div>
              <Label>Directeur de publication</Label>
              <Input
                value={settings.publication_director || ""}
                onChange={(e) => s("publication_director", e.target.value)}
                placeholder="Nom du gérant"
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* ── Aperçu ── */}
        <div className="bg-gray-50 rounded-xl border border-gray-100 p-5 lg:col-span-2">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
            Aperçu des coordonnées
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-gray-700">
            {settings.address && (
              <span className="flex items-center gap-2">
                <MapPin size={14} className="text-[#1a4731]" />
                {settings.address}
              </span>
            )}
            {settings.phone && (
              <span className="flex items-center gap-2">
                <Phone size={14} className="text-[#1a4731]" />
                {settings.phone}
              </span>
            )}
            {settings.email && (
              <span className="flex items-center gap-2">
                <Mail size={14} className="text-[#1a4731]" />
                {settings.email}
              </span>
            )}
            {settings.whatsapp && (
              <span className="flex items-center gap-2">
                <MessageSquare size={14} className="text-[#1a4731]" />
                WhatsApp : {settings.whatsapp}
              </span>
            )}
            {settings.opening_hours && (
              <span className="flex items-center gap-2">
                <Clock size={14} className="text-[#1a4731]" />
                {settings.opening_hours}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
