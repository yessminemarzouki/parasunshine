import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
} from "lucide-react";
import { STORAGE_URL } from "../../config/api";
import ImageDropzone from "../components/ImageDropzone";
import {
  getAdminHeroSlides,
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
  toggleHeroSlide,
  reorderHeroSlides,
} from "../services/adminApi";
import {
  Btn,
  Input,
  Label,
  Spinner,
  PageHeader,
  Toast,
} from "../components/AdminShared";

const EMPTY_FORM = {
  title: "",
  subtitle: "",
  link: "",
  button_text: "",
  order: 0,
  is_active: true,
};

// ── Modal de confirmation custom ──
const ConfirmModal = ({ title, onConfirm, onCancel, deleting }) => (
  <div
    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
    style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }}
  >
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
      <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-4">
        <Trash2 size={22} className="text-red-500" />
      </div>
      <p className="text-[15px] font-bold text-gray-900 text-center mb-2">
        Confirmer la suppression
      </p>
      <p className="text-[13.5px] text-gray-500 text-center mb-6">
        Voulez-vous vraiment supprimer <strong>"{title}"</strong> ?
      </p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={deleting}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-[13.5px] font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Non, annuler
        </button>
        <button
          onClick={onConfirm}
          disabled={deleting}
          className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-[13.5px] font-semibold hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {deleting && (
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          Oui, supprimer
        </button>
      </div>
    </div>
  </div>
);

export default function AdminHeroSlides() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = (message, type = "success") => setToast({ message, type });

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    setLoading(true);
    try {
      const data = await getAdminHeroSlides();
      setSlides(data);
    } catch {
      showToast("Erreur lors du chargement.", "error");
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditingSlide(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview(null);
    setShowForm(true);
  };

  const openEdit = (slide) => {
    setEditingSlide(slide);
    setForm({
      title: slide.title || "",
      subtitle: slide.subtitle || "",
      link: slide.link || "",
      button_text: slide.button_text || "",
      order: slide.order || 0,
      is_active: slide.is_active,
    });
    setImageFile(null);
    setImagePreview(`${STORAGE_URL}/${slide.image}`);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!editingSlide && !imageFile) {
      showToast("L'image est obligatoire.", "error");
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (typeof v === "boolean") fd.append(k, v ? "1" : "0");
        else if (v !== null && v !== undefined) fd.append(k, v ?? "");
      });
      if (imageFile) fd.append("image", imageFile);

      if (editingSlide) {
        await updateHeroSlide(editingSlide.id, fd);
        showToast("Slide modifié avec succès.");
      } else {
        await createHeroSlide(fd);
        showToast("Slide ajouté avec succès.");
      }

      setShowForm(false);
      fetchSlides();
    } catch (err) {
      showToast(
        err.response?.data?.message || "Erreur lors de la sauvegarde.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const requestDelete = (slide) => setConfirmDelete(slide);

  const confirmDeleteSlide = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deleteHeroSlide(confirmDelete.id);
      setConfirmDelete(null);
      fetchSlides();
      showToast("Slide supprimé.");
    } catch {
      showToast("Erreur lors de la suppression.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await toggleHeroSlide(id);
      fetchSlides();
    } catch {
      showToast("Erreur lors du changement de statut.", "error");
    }
  };

  const handleMove = async (index, direction) => {
    const newSlides = [...slides];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newSlides.length) return;
    [newSlides[index], newSlides[targetIndex]] = [
      newSlides[targetIndex],
      newSlides[index],
    ];
    setSlides(newSlides);
    try {
      await reorderHeroSlides(newSlides.map((s) => s.id));
      showToast("Ordre mis à jour.");
    } catch {
      showToast("Erreur lors du réordonnancement.", "error");
      fetchSlides();
    }
  };

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {confirmDelete && (
        <ConfirmModal
          title={confirmDelete.title || "Sans titre"}
          onConfirm={confirmDeleteSlide}
          onCancel={() => setConfirmDelete(null)}
          deleting={deleting}
        />
      )}

      <PageHeader
        title="Carrousel d'accueil"
        subtitle={`${slides.length} slide(s) configuré(s)`}
        action={
          <Btn onClick={openAdd}>
            <Plus size={14} /> Ajouter un slide
          </Btn>
        }
      />

      {/* Formulaire */}
      {showForm && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
            <p className="text-[15px] font-bold text-gray-900">
              {editingSlide ? "Modifier le slide" : "Nouveau slide"}
            </p>
            <button
              onClick={() => setShowForm(false)}
              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Colonne gauche : image */}
            <div>
              <Label>Image du slide *</Label>
              <ImageDropzone
                preview={imagePreview}
                onFileSelect={(file) => {
                  setImageFile(file);
                  setImagePreview(URL.createObjectURL(file));
                }}
                onClear={() => {
                  setImageFile(null);
                  setImagePreview(null);
                }}
                existingImage={editingSlide?.image}
              />
              <p className="text-[11.5px] text-gray-400 mt-2">
                Format recommandé : 1500×500 px, JPG ou WebP, max 4 Mo.
              </p>
            </div>

            {/* Colonne droite : infos */}
            <div className="space-y-4">
              <div>
                <Label>Titre (optionnel)</Label>
                <Input
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="Ex: Découvrez notre gamme solaire"
                  className="w-full"
                />
              </div>

              <div>
                <Label>Sous-titre (optionnel)</Label>
                <Input
                  value={form.subtitle}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, subtitle: e.target.value }))
                  }
                  placeholder="Ex: Jusqu'à -30% sur une sélection"
                  className="w-full"
                />
              </div>

              <div>
                <Label>Lien (optionnel)</Label>
                <Input
                  value={form.link}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, link: e.target.value }))
                  }
                  placeholder="Ex: /products?category=solaire"
                  className="w-full"
                />
                <p className="text-[11.5px] text-gray-400 mt-1">
                  L'utilisateur sera redirigé ici au clic sur le slide.
                </p>
              </div>

              <div>
                <Label>Texte du bouton (optionnel)</Label>
                <Input
                  value={form.button_text}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, button_text: e.target.value }))
                  }
                  placeholder="Ex: Découvrir"
                  className="w-full"
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label>Ordre d'affichage</Label>
                  <Input
                    type="number"
                    value={form.order}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        order: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer mt-6">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, is_active: e.target.checked }))
                    }
                    className="w-4 h-4 accent-[#1a4731]"
                  />
                  <span className="text-[13px] text-gray-700 font-medium">
                    Actif
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Btn ghost onClick={() => setShowForm(false)}>
                  <X size={14} /> Annuler
                </Btn>
                <Btn onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  {editingSlide ? "Enregistrer" : "Créer"}
                </Btn>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Liste des slides */}
      {loading ? (
        <Spinner />
      ) : slides.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-[15px] mb-4">Aucun slide configuré.</p>
          <Btn onClick={openAdd}>
            <Plus size={14} /> Ajouter le premier slide
          </Btn>
        </div>
      ) : (
        <div className="space-y-3">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm"
            >
              {/* Image */}
              <div className="w-40 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                <img
                  src={`${STORAGE_URL}/${slide.image}`}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-gray-900 truncate">
                  {slide.title || (
                    <span className="text-gray-400 italic">Sans titre</span>
                  )}
                </p>
                {slide.subtitle && (
                  <p className="text-[12.5px] text-gray-500 truncate">
                    {slide.subtitle}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-1.5 text-[11.5px] text-gray-400">
                  <span>Ordre : {slide.order}</span>
                  {slide.link && <span>→ {slide.link}</span>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => handleMove(index, -1)}
                  disabled={index === 0}
                  className="w-8 h-8 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 disabled:opacity-30 flex items-center justify-center"
                  title="Monter"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  onClick={() => handleMove(index, 1)}
                  disabled={index === slides.length - 1}
                  className="w-8 h-8 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 disabled:opacity-30 flex items-center justify-center"
                  title="Descendre"
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  onClick={() => handleToggle(slide.id)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    slide.is_active
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-gray-100 text-gray-400"
                  }`}
                  title={slide.is_active ? "Désactiver" : "Activer"}
                >
                  {slide.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button
                  onClick={() => openEdit(slide)}
                  className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center"
                  title="Modifier"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => requestDelete(slide)}
                  className="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center"
                  title="Supprimer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
