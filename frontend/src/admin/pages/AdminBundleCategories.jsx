import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, GripVertical, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import {
  getAdminBundleCategories,
  createBundleCategory,
  updateBundleCategory,
  deleteBundleCategory,
  reorderBundleCategories,
} from "../services/adminBundleApi";
import {
  Btn,
  Input,
  Label,
  PageHeader,
  Spinner,
  Toast,
  Badge,
} from "../components/AdminShared";

export default function AdminBundleCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "error") => setToast({ message, type });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await getAdminBundleCategories();
      setCategories(data);
    } catch {
      showToast("Erreur lors du chargement des catégories.");
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditCat(null);
    setName("");
    setShowForm(true);
  };

  const openEdit = (cat) => {
    setEditCat(cat);
    setName(cat.name);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editCat) {
        await updateBundleCategory(editCat.id, { name });
        showToast("Catégorie modifiée avec succès.", "success");
      } else {
        await createBundleCategory({ name });
        showToast("Catégorie créée avec succès.", "success");
      }
      setShowForm(false);
      fetchCategories();
    } catch (err) {
      showToast(
        err.response?.data?.message || "Erreur lors de l'enregistrement.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Supprimer cette catégorie de coffret ?")) return;
    try {
      await deleteBundleCategory(id);
      showToast("Catégorie supprimée.", "success");
      fetchCategories();
    } catch (err) {
      showToast(
        err.response?.data?.message || "Erreur lors de la suppression.",
      );
    }
  };

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData("text/plain", index);
  };

  const handleDrop = async (e, targetIndex) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (sourceIndex === targetIndex) return;

    const reordered = [...categories];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    setCategories(reordered);

    try {
      await reorderBundleCategories(reordered.map((c) => c.id));
    } catch {
      showToast("Erreur lors de la réorganisation.");
      fetchCategories();
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
      <Link
        to="/admin/bundles"
        className="inline-flex items-center gap-2 text-[13px] font-semibold text-gray-500 hover:text-[#1a4731] transition-colors mb-4"
      >
        <ArrowLeft size={14} /> Retour aux coffrets
      </Link>

      <PageHeader
        title="Catégories de coffrets"
        subtitle={`${categories.length} catégorie(s)`}
        action={
          <Btn onClick={openAdd}>
            <Plus size={14} /> Nouvelle catégorie
          </Btn>
        }
      />

      {showForm && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)" }}
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[15px] font-bold text-gray-900 mb-4">
              {editCat ? "Modifier la catégorie" : "Nouvelle catégorie"}
            </p>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label>Nom de la catégorie</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Coffrets cadeaux"
                  className="w-full"
                  required
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <Btn ghost type="button" onClick={() => setShowForm(false)}>
                  Annuler
                </Btn>
                <Btn type="submit" disabled={saving}>
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </Btn>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 border-2 border-dashed border-gray-200 rounded-2xl">
          <p className="text-gray-400 text-[14px]">
            Aucune catégorie de coffret pour le moment
          </p>
          <button
            onClick={openAdd}
            className="text-[13.5px] font-semibold text-[#1a4731] hover:opacity-70"
          >
            Créer la première catégorie →
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {categories.map((cat, i) => (
            <div
              key={cat.id}
              draggable
              onDragStart={(e) => handleDragStart(e, i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, i)}
              className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors cursor-grab"
            >
              <GripVertical size={15} className="text-gray-300 flex-shrink-0" />
              <span className="flex-1 text-[13.5px] font-semibold text-gray-800">
                {cat.name}
              </span>
              <Badge type="gray">
                {cat.bundles_count ?? 0} coffret
                {cat.bundles_count > 1 ? "s" : ""}
              </Badge>
              <div className="flex gap-1.5">
                <button
                  onClick={() => openEdit(cat)}
                  className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 flex items-center justify-center transition-colors"
                >
                  <Edit2 size={13} />
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="w-7 h-7 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 flex items-center justify-center transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
