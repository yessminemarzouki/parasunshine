import { useState, useEffect, useRef } from "react";
import {
  Save,
  Plus,
  Trash2,
  Upload,
  X,
  GripVertical,
  Edit2,
  AlertTriangle,
} from "lucide-react";
import {
  getAdminHygieneSections,
  getAdminHygieneSectionById,
  createHygieneSection,
  updateHygieneSectionById,
  deleteHygieneSection,
  reorderHygieneSections,
} from "../services/adminHygieneApi";
import { getAdminCategories } from "../services/adminApi";
import { STORAGE_URL } from "../../config/api";
import {
  Btn,
  Input,
  Spinner,
  PageHeader,
  Toast,
  Label,
  Badge,
} from "../components/AdminShared";

const emptySection = {
  title: "",
  background_color: "#ffffff",
  title_color: "#111827",
  tab_active_color: "#1a5242",
  is_visible: true,
  tabs: [],
};

const MAX_TABS = 6;

export default function AdminHygieneSection() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [toast, setToast] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [section, setSection] = useState(emptySection);
  const [saving, setSaving] = useState(false);
  const [loadingEditId, setLoadingEditId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef();
  const [draggedTabIndex, setDraggedTabIndex] = useState(null);
  const [dragOverTabIndex, setDragOverTabIndex] = useState(null);

  const [draggedSectionId, setDraggedSectionId] = useState(null);
  const [dragOverSectionId, setDragOverSectionId] = useState(null);

  const showToast = (msg, type = "success") => setToast({ message: msg, type });

  useEffect(() => {
    fetchSections();
    fetchCategories();
  }, []);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const data = await getAdminHygieneSections();
      setSections(data);
    } catch {
      showToast("Erreur lors du chargement des sections.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await getAdminCategories();
      setCategories(data);
    } catch {}
  };

  const s = (key, val) => setSection((p) => ({ ...p, [key]: val }));

  // ── Ouvrir formulaire ──
  const openAdd = () => {
    setEditId(null);
    setSection(emptySection);
    setImageFile(null);
    setImagePreview(null);
    setExistingImage(null);
    setShowForm(true);
  };

  const openEdit = async (row) => {
    setLoadingEditId(row.id);
    try {
      const full = await getAdminHygieneSectionById(row.id);
      setEditId(full.id);
      setSection(full);
      setImageFile(null);
      setImagePreview(null);
      setExistingImage(full.image || null);
      setShowForm(true);
    } catch {
      showToast("Erreur lors du chargement de la section.", "error");
    } finally {
      setLoadingEditId(null);
    }
  };

  // ── Image ──
  const handleFile = (file) => {
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setExistingImage(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  };

  // ── Onglets ──
  const addTab = () => {
    if ((section.tabs || []).length >= MAX_TABS) {
      showToast(`Vous ne pouvez pas dépasser ${MAX_TABS} onglets.`, "error");
      return;
    }
    s("tabs", [...(section.tabs || []), { label: "Nouveau", slug: "" }]);
  };

  const handleTabDragStart = (i) => setDraggedTabIndex(i);
  const handleTabDragOver = (e, i) => {
    e.preventDefault();
    setDragOverTabIndex(i);
  };
  const handleTabDrop = (i) => {
    if (draggedTabIndex === null || draggedTabIndex === i) {
      setDraggedTabIndex(null);
      setDragOverTabIndex(null);
      return;
    }
    const tabs = [...section.tabs];
    const [moved] = tabs.splice(draggedTabIndex, 1);
    tabs.splice(i, 0, moved);
    s("tabs", tabs);
    setDraggedTabIndex(null);
    setDragOverTabIndex(null);
  };
  const handleTabDragEnd = () => {
    setDraggedTabIndex(null);
    setDragOverTabIndex(null);
  };

  const removeTab = (i) => {
    s(
      "tabs",
      section.tabs.filter((_, idx) => idx !== i),
    );
  };

  const updateTab = (i, field, val) => {
    setSection((p) => ({
      ...p,
      tabs: p.tabs.map((t, idx) => (idx === i ? { ...t, [field]: val } : t)),
    }));
  };

  // ── Réorganisation des sections (liste) ──
  const handleSectionDragStart = (id) => setDraggedSectionId(id);
  const handleSectionDragOver = (e, id) => {
    e.preventDefault();
    setDragOverSectionId(id);
  };
  const handleSectionDrop = async (targetId) => {
    if (draggedSectionId === null || draggedSectionId === targetId) {
      setDraggedSectionId(null);
      setDragOverSectionId(null);
      return;
    }
    const list = [...sections];
    const fromIdx = list.findIndex((x) => x.id === draggedSectionId);
    const toIdx = list.findIndex((x) => x.id === targetId);
    const [moved] = list.splice(fromIdx, 1);
    list.splice(toIdx, 0, moved);
    setSections(list);
    setDraggedSectionId(null);
    setDragOverSectionId(null);

    try {
      await reorderHygieneSections(list.map((x) => x.id));
    } catch {
      showToast("Erreur lors de la réorganisation.", "error");
      fetchSections();
    }
  };

  // ── Sauvegarde ──
  const handleSave = async () => {
    const tabs = section.tabs || [];

    if (!section.title?.trim()) {
      showToast("Le titre de la section est obligatoire.", "error");
      return;
    }
    if (tabs.length === 0) {
      showToast("Ajoutez au moins un onglet avant d'enregistrer.", "error");
      return;
    }
    const invalidTab = tabs.findIndex((t) => !t.slug || !t.label?.trim());
    if (invalidTab !== -1) {
      showToast(
        `L'onglet ${invalidTab + 1} doit avoir un label et une catégorie sélectionnée.`,
        "error",
      );
      return;
    }
    const slugs = tabs.map((t) => t.slug);
    if (new Set(slugs).size !== slugs.length) {
      showToast(
        "Deux onglets ne peuvent pas pointer vers la même catégorie.",
        "error",
      );
      return;
    }

    try {
      setSaving(true);
      const fd = new FormData();
      fd.append("title", section.title);
      fd.append("background_color", section.background_color);
      fd.append("title_color", section.title_color);
      fd.append("tab_active_color", section.tab_active_color);
      fd.append("is_visible", section.is_visible ? "1" : "0");
      fd.append("tabs", JSON.stringify(section.tabs));
      if (imageFile) fd.append("image", imageFile);

      if (editId) {
        await updateHygieneSectionById(editId, fd);
        showToast("Section mise à jour avec succès.");
      } else {
        await createHygieneSection(fd);
        showToast("Section créée avec succès.");
      }

      setShowForm(false);
      fetchSections();
    } catch {
      showToast("Erreur lors de l'enregistrement.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await deleteHygieneSection(deleteConfirm.id);
      showToast("Section supprimée.");
      setDeleteConfirm(null);
      fetchSections();
    } catch {
      showToast("Erreur lors de la suppression.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const flatCategories = categories.flatMap((l1) => [
    { id: l1.id, name: l1.name, slug: l1.slug, level: 0 },
    ...(l1.children || []).flatMap((l2) => [
      { id: l2.id, name: `${l1.name} › ${l2.name}`, slug: l2.slug, level: 1 },
      ...(l2.children || []).map((l3) => ({
        id: l3.id,
        name: `${l1.name} › ${l2.name} › ${l3.name}`,
        slug: l3.slug,
        level: 2,
      })),
    ]),
  ]);

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
        title="Bandeaux Catégories"
        subtitle="Gérez une ou plusieurs sections de catégories affichées sur la page d'accueil, empilées dans l'ordre choisi"
        action={
          <Btn onClick={openAdd}>
            <Plus size={14} /> Nouvelle section
          </Btn>
        }
      />

      {/* ── Liste des sections ── */}
      {sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 border-2 border-dashed border-gray-200 rounded-2xl">
          <p className="text-gray-400 text-[14px]">
            Aucune section pour le moment
          </p>
          <button
            onClick={openAdd}
            className="text-[13.5px] font-semibold text-[#1a4731] hover:opacity-70"
          >
            Créer la première section →
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {sections.map((row) => (
            <div
              key={row.id}
              draggable
              onDragStart={() => handleSectionDragStart(row.id)}
              onDragOver={(e) => handleSectionDragOver(e, row.id)}
              onDrop={() => handleSectionDrop(row.id)}
              className={`flex items-center gap-3 px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors cursor-grab ${
                dragOverSectionId === row.id && draggedSectionId !== row.id
                  ? "bg-[#edf7f3]"
                  : ""
              } ${draggedSectionId === row.id ? "opacity-40" : ""}`}
            >
              <GripVertical size={15} className="text-gray-300 flex-shrink-0" />

              <div
                className="w-10 h-10 rounded-lg border border-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center"
                style={{ background: row.background_color }}
              >
                {row.image && (
                  <img
                    src={`${STORAGE_URL}/${row.image}`}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800">{row.title}</p>
                <p className="text-[11.5px] text-gray-400">
                  {(row.tabs || []).length} onglet(s)
                </p>
              </div>

              {row.is_visible ? (
                <Badge type="green">Visible</Badge>
              ) : (
                <Badge type="gray">Masquée</Badge>
              )}

              <div className="flex gap-1.5">
                <button
                  onClick={() => openEdit(row)}
                  disabled={loadingEditId === row.id}
                  className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 flex items-center justify-center disabled:opacity-60"
                >
                  {loadingEditId === row.id ? (
                    <span className="w-3.5 h-3.5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                  ) : (
                    <Edit2 size={13} />
                  )}
                </button>
                <button
                  onClick={() => setDeleteConfirm(row)}
                  className="w-7 h-7 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 flex items-center justify-center"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Confirmation suppression ── */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)" }}
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={26} className="text-red-500" />
            </div>
            <p className="font-bold text-gray-900 mb-2">
              Supprimer "{deleteConfirm.title}" ?
            </p>
            <p className="text-[13px] text-gray-500 mb-6">
              Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <Btn
                ghost
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
              >
                Annuler
              </Btn>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-[13.5px] font-semibold hover:bg-red-600 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {deleting && (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Formulaire création/édition ── */}
      {showForm && (
        <div
          className="fixed inset-0 z-[999] flex items-start justify-center p-4 overflow-y-auto"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)" }}
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <p className="text-[16px] font-bold text-gray-900">
                {editId ? "Modifier la section" : "Nouvelle section"}
              </p>
              <div className="flex items-center gap-2">
                <Btn onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save size={14} /> Enregistrer
                    </>
                  )}
                </Btn>
                <button
                  onClick={() => setShowForm(false)}
                  className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ── Design ── */}
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-5">
                <p className="text-[13px] font-bold text-gray-700 mb-4">
                  Design & Visibilité
                </p>
                <div className="flex flex-col gap-4">
                  <div>
                    <Label>Titre de la section</Label>
                    <Input
                      value={section.title}
                      onChange={(e) => s("title", e.target.value)}
                      className="w-full mt-1"
                      placeholder="Hygiène"
                    />
                  </div>

                  <div className="flex flex-col gap-4">
                    <div>
                      <Label>Couleur de fond</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="relative w-10 h-10 rounded-lg border-2 border-gray-200 shadow-sm overflow-hidden flex-shrink-0">
                          <input
                            type="color"
                            value={section.background_color}
                            onChange={(e) =>
                              s("background_color", e.target.value)
                            }
                            className="absolute -top-1 -left-1 w-12 h-12 cursor-pointer"
                          />
                        </div>
                        <Input
                          value={section.background_color}
                          onChange={(e) =>
                            s("background_color", e.target.value)
                          }
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Couleur du titre</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="relative w-10 h-10 rounded-lg border-2 border-gray-200 shadow-sm overflow-hidden flex-shrink-0">
                          <input
                            type="color"
                            value={section.title_color}
                            onChange={(e) => s("title_color", e.target.value)}
                            className="absolute -top-1 -left-1 w-12 h-12 cursor-pointer"
                          />
                        </div>
                        <Input
                          value={section.title_color}
                          onChange={(e) => s("title_color", e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Couleur onglet actif</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="relative w-10 h-10 rounded-lg border-2 border-gray-200 shadow-sm overflow-hidden flex-shrink-0">
                          <input
                            type="color"
                            value={section.tab_active_color}
                            onChange={(e) =>
                              s("tab_active_color", e.target.value)
                            }
                            className="absolute -top-1 -left-1 w-12 h-12 cursor-pointer"
                          />
                        </div>
                        <Input
                          value={section.tab_active_color}
                          onChange={(e) =>
                            s("tab_active_color", e.target.value)
                          }
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Aperçu en temps réel</Label>
                    <div
                      className="rounded-xl p-5 mt-1.5 transition-all"
                      style={{
                        background: section.background_color,
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <p
                        className="font-bold text-[1.1rem] mb-3"
                        style={{ color: section.title_color }}
                      >
                        {section.title || "Titre de la section"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(section.tabs || []).length === 0 ? (
                          <p className="text-[12px] text-gray-400 italic">
                            Aucun onglet configuré
                          </p>
                        ) : (
                          section.tabs.map((tab, i) => (
                            <span
                              key={i}
                              className="px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold transition-all"
                              style={
                                i === 0
                                  ? {
                                      background: section.tab_active_color,
                                      color: "#ffffff",
                                    }
                                  : {
                                      background: "#ffffff",
                                      color: "#6b7280",
                                      border: "1px solid #e5e7eb",
                                    }
                              }
                            >
                              {tab.label || `Onglet ${i + 1}`}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Visibilité</Label>
                    <label className="flex items-center gap-3 cursor-pointer mt-1.5">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={section.is_visible}
                          onChange={(e) => s("is_visible", e.target.checked)}
                          className="sr-only"
                        />
                        <div
                          className={`w-10 h-5 rounded-full transition-colors ${section.is_visible ? "bg-[#1a4731]" : "bg-gray-200"}`}
                        />
                        <div
                          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${section.is_visible ? "translate-x-5" : ""}`}
                        />
                      </div>
                      <span className="text-[13px] text-gray-700 font-medium">
                        {section.is_visible ? "Visible sur le site" : "Masquée"}
                      </span>
                    </label>
                  </div>

                  <div>
                    <Label>Image de gauche</Label>
                    <div
                      className={`mt-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${
                        dragActive
                          ? "border-[#1a4731] bg-[#edf7f3]"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                      style={{ minHeight: 160 }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragActive(true);
                      }}
                      onDragLeave={() => setDragActive(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {imagePreview || existingImage ? (
                        <div className="relative w-full h-36 rounded-lg overflow-hidden">
                          <img
                            src={
                              imagePreview || `${STORAGE_URL}/${existingImage}`
                            }
                            alt="preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setImageFile(null);
                              setImagePreview(null);
                              setExistingImage(null);
                            }}
                            className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Upload size={24} className="text-gray-300" />
                          <p className="text-[12.5px] text-gray-400 text-center">
                            Glissez une image ici ou cliquez pour choisir
                          </p>
                        </>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFile(e.target.files[0])}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Onglets / Catégories ── */}
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[13px] font-bold text-gray-700">
                    Onglets & Catégories ({section.tabs?.length || 0}/{MAX_TABS}
                    )
                  </p>
                  <Btn
                    onClick={addTab}
                    disabled={(section.tabs || []).length >= MAX_TABS}
                  >
                    <Plus size={14} /> Ajouter
                  </Btn>
                </div>
                <p className="text-[11px] text-gray-400 mb-4">
                  Glissez-déposez un onglet pour réordonner l'affichage
                </p>

                <div className="flex flex-col gap-3">
                  {(section.tabs || []).map((tab, i) => (
                    <div
                      key={i}
                      draggable
                      onDragStart={() => handleTabDragStart(i)}
                      onDragOver={(e) => handleTabDragOver(e, i)}
                      onDrop={() => handleTabDrop(i)}
                      onDragEnd={handleTabDragEnd}
                      className={`flex flex-col gap-2 p-3 border rounded-xl bg-white transition-all ${
                        dragOverTabIndex === i && draggedTabIndex !== i
                          ? "border-[#1a4731] border-dashed bg-[#edf7f3]"
                          : "border-gray-200"
                      } ${draggedTabIndex === i ? "opacity-40" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 cursor-grab active:cursor-grabbing">
                          <GripVertical size={14} className="text-gray-400" />
                          <span className="text-[11.5px] font-bold text-gray-500">
                            Onglet {i + 1}
                          </span>
                        </div>
                        <button
                          onClick={() => removeTab(i)}
                          disabled={section.tabs.length === 1}
                          className="w-6 h-6 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 disabled:opacity-30"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <div>
                        <Label>Label affiché</Label>
                        <Input
                          value={tab.label}
                          onChange={(e) =>
                            updateTab(i, "label", e.target.value)
                          }
                          className={`w-full mt-1 ${!tab.label?.trim() ? "border-red-300" : ""}`}
                          placeholder="Ex: Douche & Bain"
                        />
                      </div>

                      <div>
                        <Label>Catégorie (slug)</Label>
                        <select
                          value={tab.slug}
                          onChange={(e) => {
                            const selectedSlug = e.target.value;
                            const selectedCat = flatCategories.find(
                              (cat) => cat.slug === selectedSlug,
                            );

                            setSection((p) => ({
                              ...p,
                              tabs: p.tabs.map((t, idx) =>
                                idx === i
                                  ? {
                                      ...t,
                                      slug: selectedSlug,
                                      label: selectedCat
                                        ? selectedCat.name.split(" › ").pop()
                                        : t.label,
                                    }
                                  : t,
                              ),
                            }));
                          }}
                          className={`w-full h-9 px-3 border rounded-lg text-[13px] text-gray-700 bg-white outline-none focus:border-[#1a4731] mt-1 ${!tab.slug ? "border-red-300" : "border-gray-200"}`}
                        >
                          <option value="">— Choisir une catégorie —</option>
                          {flatCategories.map((cat) => (
                            <option
                              key={`${cat.id}-${cat.level}`}
                              value={cat.slug}
                            >
                              {cat.level === 0
                                ? cat.name
                                : cat.level === 1
                                  ? `  › ${cat.name}`
                                  : `    › ${cat.name}`}
                            </option>
                          ))}
                        </select>
                      </div>

                      {tab.slug && (
                        <p className="text-[11px] text-[#1a4731] bg-[#edf7f3] px-2 py-1 rounded-lg">
                          /products?category={tab.slug}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
