import { useState, useEffect } from "react";
import { Save, Truck, Gift } from "lucide-react";
import {
  getShippingSettingsAdmin,
  updateShippingSettings,
} from "../services/adminApi";
import {
  Btn,
  Input,
  Spinner,
  PageHeader,
  Label,
} from "../components/AdminShared";

export default function AdminShipping() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await getShippingSettingsAdmin();
      setSettings(data);
    } catch {
      showToast("Erreur lors du chargement.", "error");
    } finally {
      setLoading(false);
    }
  };

  const s = (key, val) => setSettings((p) => ({ ...p, [key]: val }));

  const handleSave = async () => {
    if (
      settings.free_shipping_enabled &&
      (settings.free_shipping_threshold === "" ||
        settings.free_shipping_threshold === null ||
        parseFloat(settings.free_shipping_threshold) < 0)
    ) {
      showToast("Précisez un seuil de livraison gratuite valide.", "error");
      return;
    }
    if (
      settings.shipping_cost === "" ||
      settings.shipping_cost === null ||
      parseFloat(settings.shipping_cost) < 0
    ) {
      showToast("Précisez des frais de livraison valides.", "error");
      return;
    }
    if (
      !settings.delivery_days_min ||
      !settings.delivery_days_max ||
      parseInt(settings.delivery_days_max) <
        parseInt(settings.delivery_days_min)
    ) {
      showToast("Précisez un délai de livraison valide (max ≥ min).", "error");
      return;
    }

    try {
      setSaving(true);
      await updateShippingSettings({
        free_shipping_enabled: settings.free_shipping_enabled,
        free_shipping_threshold: settings.free_shipping_enabled
          ? parseFloat(settings.free_shipping_threshold)
          : null,
        shipping_cost: parseFloat(settings.shipping_cost),
        delivery_days_min: parseInt(settings.delivery_days_min),
        delivery_days_max: parseInt(settings.delivery_days_max),
      });
      showToast("Paramètres de livraison mis à jour avec succès.");
    } catch (err) {
      showToast(
        err.response?.data?.message || "Erreur lors de la mise à jour.",
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
        <div
          className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-5 sm:top-5 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-[13.5px] font-semibold ${
            toast.type === "error"
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0]"
          }`}
        >
          {toast.message}
        </div>
      )}

      <PageHeader
        title="Livraison"
        subtitle="Gérez les frais et le seuil de livraison gratuite"
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
        {/* Frais de livraison */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Truck size={16} className="text-[#1a4731]" />
            <p className="text-[13px] font-bold text-gray-700">
              Frais de livraison standard
            </p>
          </div>
          <Label>Montant (DT)</Label>
          <Input
            type="number"
            value={settings.shipping_cost}
            onChange={(e) => s("shipping_cost", e.target.value)}
            placeholder="Ex: 7"
            className="w-full mt-1"
          />
          <p className="text-[11.5px] text-gray-400 mt-2 mb-4">
            Frais appliqués lorsque la commande ne bénéficie pas de la livraison
            gratuite.
          </p>

          <Label>Délai de livraison estimé (jours)</Label>
          <div className="flex items-center gap-2 mt-1">
            <Input
              type="number"
              min="1"
              value={settings.delivery_days_min ?? ""}
              onChange={(e) => s("delivery_days_min", e.target.value)}
              placeholder="Min"
              className="w-full"
            />
            <span className="text-gray-400 text-[13px]">à</span>
            <Input
              type="number"
              min="1"
              value={settings.delivery_days_max ?? ""}
              onChange={(e) => s("delivery_days_max", e.target.value)}
              placeholder="Max"
              className="w-full"
            />
          </div>
          <p className="text-[11.5px] text-gray-400 mt-2">
            Ex: 2 à 5 jours — affiché aux clients sur le site.
          </p>
        </div>

        {/* Livraison gratuite */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Gift size={16} className="text-[#1a4731]" />
            <p className="text-[13px] font-bold text-gray-700">
              Livraison gratuite
            </p>
          </div>

          <label className="flex items-center gap-3 cursor-pointer mb-4">
            <div className="relative">
              <input
                type="checkbox"
                checked={settings.free_shipping_enabled}
                onChange={(e) => s("free_shipping_enabled", e.target.checked)}
                className="sr-only"
              />
              <div
                className={`w-10 h-5 rounded-full transition-colors ${settings.free_shipping_enabled ? "bg-[#1a4731]" : "bg-gray-200"}`}
              />
              <div
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.free_shipping_enabled ? "translate-x-5" : ""}`}
              />
            </div>
            <span className="text-[13px] text-gray-700 font-medium">
              {settings.free_shipping_enabled
                ? "Activée"
                : "Désactivée — livraison toujours payante"}
            </span>
          </label>

          {settings.free_shipping_enabled && (
            <>
              <Label>Seuil de commande (DT)</Label>
              <Input
                type="number"
                value={settings.free_shipping_threshold ?? ""}
                onChange={(e) => s("free_shipping_threshold", e.target.value)}
                placeholder="Ex: 99"
                className="w-full mt-1"
              />
              <p className="text-[11.5px] text-gray-400 mt-2">
                La livraison devient gratuite à partir de ce montant de
                commande.
              </p>
            </>
          )}
        </div>

        {/* Aperçu */}
        <div className="col-span-1 lg:col-span-2 bg-gray-50 rounded-xl border border-gray-100 p-5">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
            Aperçu
          </p>
          <p className="text-[13px] text-gray-700">
            {settings.free_shipping_enabled ? (
              <>
                Livraison à <strong>{settings.shipping_cost || 0} DT</strong> —{" "}
                <strong>
                  gratuite dès {settings.free_shipping_threshold || 0} DT
                </strong>{" "}
                d'achat. Délai estimé :{" "}
                <strong>
                  {settings.delivery_days_min}-{settings.delivery_days_max}{" "}
                  jours
                </strong>
                .
              </>
            ) : (
              <>
                Livraison toujours à{" "}
                <strong>{settings.shipping_cost || 0} DT</strong>, aucun seuil
                de gratuité. Délai estimé :{" "}
                <strong>
                  {settings.delivery_days_min}-{settings.delivery_days_max}{" "}
                  jours
                </strong>
                .
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
