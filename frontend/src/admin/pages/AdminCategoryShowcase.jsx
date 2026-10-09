import { useState, useEffect } from "react";
import { STORAGE_URL } from "../../config/api";
import {
  Plus,
  Trash2,
  Edit,
  ToggleLeft,
  ToggleRight,
  X,
  Upload,
  GripVertical,
} from "lucide-react";
import {
  getCategoryShowcase,
  createCategoryShowcase,
  updateCategoryShowcase,
  deleteCategoryShowcase,
  reorderCategoryShowcase,
  getAdminCategories,
} from "../services/adminApi";
import {
  PageHeader,
  Btn,
  Modal,
  Spinner,
  Badge,
  ActionBtn,
  Toast,
} from "../components/AdminShared";

const emptyForm = { title: "", subtitle: "", link: "", is_active: true };

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

export default function AdminCategoryShowcase() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [dragIdx, setDragIdx] = useState(null);
  const [imageDragOver, setImageDragOver] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = (message, type = "success") => setToast({ message, type });

  useEffect(() => {
    fetchItems();
    getAdminCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      setItems(await getCategoryShowcase());
    } catch {
      showToast("Erreur lors du chargement.", "error");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setImageFile(null);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      title: item.title,
      subtitle: item.subtitle || "",
      link: item.link,
      is_active: item.is_active,
    });
    setImageFile(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.link.trim()) {
      showToast("Titre et catégorie sont obligatoires.", "error");
      return;
    }
    if (!editing && !imageFile) {
      showToast("Une image est requise pour une nouvelle carte.", "error");
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (typeof v === "boolean") fd.append(k, v ? "1" : "0");
        else fd.append(k, v);
      });
      if (imageFile) fd.append("image", imageFile);

      if (editing) {
        await updateCategoryShowcase(editing.id, fd);
        showToast("Carte mise à jour.");
      } else {
        await createCategoryShowcase(fd);
        showToast("Carte créée.");
      }
      setModalOpen(false);
      fetchItems();
    } catch {
      showToast("Erreur lors de la sauvegarde.", "error");
    } finally {
      setSaving(false);
    }
  };

  const requestDelete = (item) => setConfirmDelete(item);

  const confirmDeleteCard = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deleteCategoryShowcase(confirmDelete.id);
      setConfirmDelete(null);
      showToast("Carte supprimée.");
      fetchItems();
    } catch {
      showToast("Erreur lors de la suppression.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggle = async (item) => {
    try {
      const fd = new FormData();
      fd.append("title", item.title);
      fd.append("subtitle", item.subtitle || "");
      fd.append("link", item.link);
      fd.append("is_active", item.is_active ? "0" : "1");
      await updateCategoryShowcase(item.id, fd);
      fetchItems();
    } catch {
      showToast("Erreur.", "error");
    }
  };

  const handleDragStart = (idx) => setDragIdx(idx);
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = async (idx) => {
    if (dragIdx === null || dragIdx === idx) return;
    const newItems = [...items];
    const [moved] = newItems.splice(dragIdx, 1);
    newItems.splice(idx, 0, moved);
    setItems(newItems);
    setDragIdx(null);
    try {
      await reorderCategoryShowcase(newItems.map((i) => i.id));
    } catch {
      showToast("Erreur lors du réordonnancement.", "error");
      fetchItems();
    }
  };

  const flatCategories = [];
  const flatten = (list, prefix = "") => {
    list.forEach((c) => {
      flatCategories.push({ slug: c.slug, label: prefix + c.name });
      if (c.children?.length) flatten(c.children, prefix + "— ");
    });
  };
  flatten(categories);

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
          onConfirm={confirmDeleteCard}
          onCancel={() => setConfirmDelete(null)}
          deleting={deleting}
        />
      )}

      <PageHeader
        title="Catégories en vedette"
        subtitle="Les cartes affichées juste sous le carrousel de la page d'accueil"
        action={
          <Btn onClick={openCreate}>
            <Plus size={15} /> Nouvelle carte
          </Btn>
        }
      />

      {loading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-[15px] mb-4">Aucune carte configurée.</p>
          <Btn onClick={openCreate}>
            <Plus size={15} /> Créer la première carte
          </Btn>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(idx)}
              className="bg-white border border-gray-100 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 cursor-move"
            >
              <GripVertical
                size={16}
                className="text-gray-300 flex-shrink-0 hidden sm:block"
              />
              {item.image ? (
                <img
                  src={`${STORAGE_URL}/${item.image}`}
                  alt=""
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gray-100 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-[140px] sm:min-w-0">
                <p className="text-[14px] font-bold text-gray-900 truncate">
                  {item.title}
                </p>
                <p className="text-[12px] text-gray-400 truncate">
                  {item.subtitle}
                </p>
                <p className="text-[11px] text-gray-400 truncate hidden sm:block">
                  {item.link}
                </p>
              </div>
              <Badge type={item.is_active ? "success" : "warning"}>
                {item.is_active ? "Actif" : "Inactif"}
              </Badge>
              <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end order-last sm:order-none">
                <ActionBtn
                  type="info"
                  onClick={() => handleToggle(item)}
                  title={item.is_active ? "Désactiver" : "Activer"}
                >
                  {item.is_active ? (
                    <ToggleRight size={14} />
                  ) : (
                    <ToggleLeft size={14} />
                  )}
                </ActionBtn>
                <ActionBtn
                  type="warning"
                  onClick={() => openEdit(item)}
                  title="Modifier"
                >
                  <Edit size={13} />
                </ActionBtn>
                <ActionBtn
                  type="danger"
                  onClick={() => requestDelete(item)}
                  title="Supprimer"
                >
                  <Trash2 size={13} />
                </ActionBtn>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <Modal
          title={editing ? "Modifier la carte" : "Nouvelle carte"}
          onClose={() => setModalOpen(false)}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                Titre *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="Ex: Cheveux"
                className="w-full h-11 px-4 border border-gray-200 rounded-xl text-[13.5px] outline-none focus:border-[#1a5242]"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                Sous-titre
              </label>
              <input
                type="text"
                value={form.subtitle}
                onChange={(e) =>
                  setForm((f) => ({ ...f, subtitle: e.target.value }))
                }
                placeholder="Ex: Shampoings, Masques & Soins capillaires"
                className="w-full h-11 px-4 border border-gray-200 rounded-xl text-[13.5px] outline-none focus:border-[#1a5242]"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                Catégorie *
              </label>
              <select
                value={form.link}
                onChange={(e) =>
                  setForm((f) => ({ ...f, link: e.target.value }))
                }
                className="w-full h-11 px-4 border border-gray-200 rounded-xl text-[13.5px] outline-none focus:border-[#1a5242] bg-white"
              >
                <option value="">Sélectionner une catégorie...</option>
                {flatCategories.map((c) => (
                  <option key={c.slug} value={`/products?category=${c.slug}`}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                Image {editing ? "" : "*"}
              </label>
              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  setImageDragOver(true);
                }}
                onDragLeave={() => setImageDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setImageDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file && file.type.startsWith("image/")) {
                    setImageFile(file);
                  }
                }}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl cursor-pointer transition-colors ${
                  imageDragOver
                    ? "border-2 border-[#1a5242] bg-[#1a5242]/5"
                    : "border-2 border-dashed border-gray-200 hover:border-[#1a5242]"
                }`}
                style={{ minHeight: imageFile ? 140 : 96 }}
              >
                {imageFile ? (
                  <div className="relative w-full h-full flex flex-col items-center justify-center py-3">
                    <img
                      src={URL.createObjectURL(imageFile)}
                      alt=""
                      className="max-h-24 rounded-lg object-contain mb-2"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-gray-500 truncate max-w-[200px]">
                        {imageFile.name}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setImageFile(null);
                        }}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload size={18} className="text-gray-400" />
                    <span className="text-[12.5px] text-gray-400">
                      Glissez une image ici ou cliquez pour choisir
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setImageFile(e.target.files[0])}
                />
              </label>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) =>
                  setForm((f) => ({ ...f, is_active: e.target.checked }))
                }
                className="w-4 h-4 accent-[#1a5242]"
              />
              <span className="text-[13.5px] font-semibold text-gray-700">
                Carte active
              </span>
            </label>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setModalOpen(false)}
                className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-600 text-[13.5px] font-semibold hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-[#1a5242] text-white rounded-xl text-[13.5px] font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {saving ? "Sauvegarde..." : editing ? "Modifier" : "Créer"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
