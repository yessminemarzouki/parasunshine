import React, { useState, useEffect } from "react";
import ImageDropzone from "../components/ImageDropzone";
import { STORAGE_URL } from "../../config/api";
import * as XLSX from "xlsx";
import { invalidateRefCache } from "../services/adminApi";
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Tag,
  Layers,
  Package,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  GripVertical,
  Eye,
  EyeOff,
  Menu as MenuIcon,
  Droplets,
  Sun,
  Baby,
  Leaf,
  Heart,
  Pill,
  Sparkles,
  Star,
  ShoppingBag,
  Image as ImageIcon,
  Megaphone,
  Settings2,
  Check,
  Download,
  Upload,
} from "lucide-react";
import {
  getAdminCategories,
  getAdminBrands,
  reorderCategories,
  syncCategoryBrands,
  importBrandsExcel,
  importBrandLogosZip,
  exportBrandsExcel,
  exportBrandLogosZip,
} from "../services/adminApi";
import adminApi from "../services/adminApi";
import {
  ActionBtn,
  Btn,
  Input,
  TableWrap,
  Table,
  TR,
  TD,
  Spinner,
  PageHeader,
  Toast,
} from "../components/AdminShared";

const ICON_OPTIONS = {
  Droplets,
  Sun,
  Baby,
  Leaf,
  Heart,
  Pill,
  Sparkles,
  Star,
  ShoppingBag,
  Tag,
  Package,
  Layers,
};

const ConfirmModal = ({ name, type, onConfirm, onCancel, deleting }) => (
  <div
    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
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
        Voulez-vous vraiment supprimer{" "}
        {type === "brand" ? "la marque" : "la catégorie"}{" "}
        <strong className="text-gray-800">"{name}"</strong> ?
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

const IconPicker = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const Current = ICON_OPTIONS[value] || Layers;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-9 h-9 rounded-lg border border-gray-200 bg-white flex items-center justify-center hover:border-[#1a4731] transition-colors flex-shrink-0"
        title="Choisir une icône"
      >
        <Current size={16} className="text-[#1a4731]" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-10 left-0 z-50 bg-white border border-gray-100 rounded-xl shadow-lg p-2 grid grid-cols-4 gap-1 w-40">
            {Object.entries(ICON_OPTIONS).map(([name, Icon]) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  onChange(name);
                  setOpen(false);
                }}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  value === name
                    ? "bg-[#1a4731] text-white"
                    : "hover:bg-gray-100 text-gray-500"
                }`}
                title={name}
              >
                <Icon size={14} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ── Aperçu du mega menu — contenu réutilisable (modal ou inline) ──
function MegaMenuContent({ category }) {
  const isImageStyle =
    category.slug === "soin" || category.children?.some((c) => c.image);
  const brands = category.brands || [];
  const hasPromo = category.bundle && category.promo_title;

  if (!category.children?.length) {
    return (
      <p className="text-[13px] text-gray-400 italic py-6 text-center">
        Aucune sous-catégorie pour l'instant.
      </p>
    );
  }

  return isImageStyle ? (
    <div
      className="grid gap-5"
      style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}
    >
      {category.children.map((child) => (
        <div key={child.id} className="bg-[#fafafa] p-3 rounded-xl">
          <p className="text-[10.5px] tracking-wide font-extrabold uppercase text-gray-900 mb-2 pb-1.5 border-b border-gray-200">
            {child.name}
          </p>
          {child.image ? (
            <img
              src={`${STORAGE_URL}/${child.image}`}
              alt={child.name}
              className="w-full h-16 object-cover rounded-lg mb-2"
            />
          ) : (
            <div className="w-full h-16 bg-gray-200 rounded-lg mb-2 flex items-center justify-center text-[9.5px] text-gray-400 text-center px-2">
              Aucune image
            </div>
          )}
          <ul className="space-y-1">
            {(child.children || []).map((sub) => (
              <li key={sub.id} className="text-[12px] text-gray-500">
                {sub.name}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  ) : (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px_240px] gap-6">
      <div className="space-y-3.5">
        {category.children.map((child) => (
          <div key={child.id}>
            <p className="text-[10.5px] tracking-wide font-extrabold uppercase text-gray-900 mb-1.5 pb-1 border-b border-gray-100">
              {child.name}
            </p>
            <ul className="space-y-1 mt-1">
              {(child.children || []).map((sub) => (
                <li key={sub.id} className="text-[12px] text-gray-500">
                  {sub.name}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div>
        <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide mb-2 pb-1 border-b border-gray-100">
          Marques
        </p>
        {brands.length === 0 ? (
          <p className="text-[11px] text-gray-400 italic">Aucune</p>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            {brands.map((b) => (
              <img
                key={b.id}
                src={
                  b.logo?.startsWith("http")
                    ? b.logo
                    : `${STORAGE_URL}/${b.logo}`
                }
                alt={b.name}
                className="w-full h-12 object-contain bg-white border border-gray-100 rounded-md p-1"
              />
            ))}
          </div>
        )}
      </div>
      <div className="border-l border-gray-100 pl-5">
        {hasPromo ? (
          <>
            {category.bundle?.image && (
              <img
                src={`${STORAGE_URL}/${category.bundle.image}`}
                alt=""
                className="w-full h-24 object-cover rounded-lg mb-2"
              />
            )}
            <p className="text-[12.5px] font-bold text-gray-900">
              {category.promo_title}
            </p>
            <p className="text-[11px] text-gray-500 mt-1">
              {category.promo_text}
            </p>
            <p
              className="text-[11px] font-bold mt-1.5"
              style={{ color: "#2d5f4f" }}
            >
              {category.promo_cta || "Découvrir"} →
            </p>
          </>
        ) : (
          <p className="text-[11px] text-gray-400 italic">
            Aucun pack configuré
          </p>
        )}
      </div>
    </div>
  );
}

export default function AdminCategories() {
  const [tab, setTab] = useState("categories");
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editLogo, setEditLogo] = useState(null);
  const [editLogoPreview, setEditLogoPreview] = useState(null);
  const [editLogoRemoved, setEditLogoRemoved] = useState(false);
  const [addLogo, setAddLogo] = useState(null);
  const [addLogoPreview, setAddLogoPreview] = useState(null);
  const [addingBrand, setAddingBrand] = useState(false);
  const [addBrandName, setAddBrandName] = useState("");
  const [addSubBrandInput, setAddSubBrandInput] = useState("");
  const [addSubBrandsList, setAddSubBrandsList] = useState([]); // nouvelles sous-marques à créer
  const [editSubBrandInput, setEditSubBrandInput] = useState("");
  const [editExistingSubBrands, setEditExistingSubBrands] = useState([]); // sous-marques déjà en base
  const [editNewSubBrands, setEditNewSubBrands] = useState([]); // nouvelles à créer lors de cette édition
  const [deletedSubBrandIds, setDeletedSubBrandIds] = useState([]); // ids à supprimer lors de l'enregistrement
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [configPanel, setConfigPanel] = useState(null);
  const [allBrands, setAllBrands] = useState([]);
  const [dragInfo, setDragInfo] = useState(null);
  const [busyKey, setBusyKey] = useState(null); // identifiant de l'action en cours (ex: "delete-5", "toggle-3-show_in_menu")
  const [importingBrands, setImportingBrands] = useState(false);
  const [importingLogos, setImportingLogos] = useState(false);
  const [exportingBrands, setExportingBrands] = useState(false);
  const [exportingLogos, setExportingLogos] = useState(false);
  const [brandImportResult, setBrandImportResult] = useState(null);
  const [logoImportResult, setLogoImportResult] = useState(null);

  const handleImportBrandsExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportingBrands(true);
    try {
      const result = await importBrandsExcel(file);
      setBrandImportResult(result);
      invalidateRefCache();
      await fetchData();
      showToast(result.message);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Erreur lors de l'import.",
        "error",
      );
    } finally {
      setImportingBrands(false);
      e.target.value = "";
    }
  };

  const handleImportLogosZip = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportingLogos(true);
    try {
      const result = await importBrandLogosZip(file);
      setLogoImportResult(result);
      invalidateRefCache();
      await fetchData();
      showToast(result.message);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Erreur lors de l'import des logos.",
        "error",
      );
    } finally {
      setImportingLogos(false);
      e.target.value = "";
    }
  };
  const handleExportBrandsExcel = async () => {
    setExportingBrands(true);
    try {
      const res = await exportBrandsExcel();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `marques_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast("Export Excel des marques téléchargé.");
    } catch {
      showToast("Erreur lors de l'export.", "error");
    } finally {
      setExportingBrands(false);
    }
  };

  const handleExportBrandLogosZip = async () => {
    setExportingLogos(true);
    try {
      const res = await exportBrandLogosZip();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `logos_marques_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast("Export ZIP des logos téléchargé.");
    } catch {
      showToast("Erreur lors de l'export des logos.", "error");
    } finally {
      setExportingLogos(false);
    }
  };

  const handleDownloadBrandsTemplate = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ["name", "parent_brand"],
      ["Avène", ""],
      ["Sebiaclear", "SVR"],
    ]);
    ws["!cols"] = [{ wch: 25 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, ws, "Marques");
    const instructions = XLSX.utils.aoa_to_sheet([
      ["Colonne", "Obligatoire", "Description"],
      ["name", "OUI", "Nom de la marque"],
      [
        "parent_brand",
        "NON",
        "Nom de la marque parente — UNIQUEMENT si 'name' est une sous-marque",
      ],
      [
        "",
        "",
        "Pour le logo : importez ensuite un ZIP via 'Importer logos (ZIP)'.",
      ],
      [
        "",
        "",
        "Le fichier logo doit être nommé exactement comme le nom de la marque (ex: Avène.webp).",
      ],
    ]);
    instructions["!cols"] = [{ wch: 20 }, { wch: 14 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, instructions, "Instructions");
    XLSX.writeFile(wb, "modele_marques.xlsx");
  };

  // Navigation catégories : liste ↔ détail
  const [selectedTopId, setSelectedTopId] = useState(null);
  const [expandedSub, setExpandedSub] = useState(new Set());

  // Formulaires d'ajout
  const [addingTop, setAddingTop] = useState(false);
  const [addTopName, setAddTopName] = useState("");
  const [addTopIcon, setAddTopIcon] = useState("Layers");
  const [addingSubFor, setAddingSubFor] = useState(null); // parentId
  const [addSubName, setAddSubName] = useState("");

  const showToast = (message, type = "success") => setToast({ message, type });

  useEffect(() => {
    fetchData();
  }, [tab]);

  useEffect(() => {
    getAdminBrands()
      .then(setAllBrands)
      .catch(() => {});
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data =
        tab === "categories"
          ? await getAdminCategories()
          : await getAdminBrands();
      setItems(data);
      if (tab === "categories") setCategories(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const selectedTop = categories.find((c) => c.id === selectedTopId) || null;

  // ── Ajout catégorie (top-level ou sous-catégorie) ──
  const handleAddTop = async () => {
    if (!addTopName.trim()) return;
    setBusyKey("top-add");
    try {
      await adminApi.post("/admin/categories", {
        name: addTopName,
        parent_id: null,
        icon: addTopIcon,
        show_in_menu: true,
        show_in_megamenu: true,
      });
      setAddingTop(false);
      setAddTopName("");
      setAddTopIcon("Layers");
      invalidateRefCache();
      await fetchData();
      showToast("Grande catégorie créée avec succès.");
    } catch {
      showToast("Erreur lors de la création.", "error");
    } finally {
      setBusyKey(null);
    }
  };

  const handleAddSub = async (parentId) => {
    if (!addSubName.trim()) return;
    setBusyKey(`sub-add-${parentId}`);
    try {
      await adminApi.post("/admin/categories", {
        name: addSubName,
        parent_id: parentId,
        show_in_menu: true,
        show_in_megamenu: true,
      });
      setAddingSubFor(null);
      setAddSubName("");
      invalidateRefCache();
      await fetchData();
      showToast("Sous-catégorie ajoutée avec succès.");
    } catch {
      showToast("Erreur lors de l'ajout.", "error");
    } finally {
      setBusyKey(null);
    }
  };

  const handleEditName = async (id) => {
    if (!editName.trim()) return;
    setBusyKey(`name-${id}`);
    try {
      await adminApi.put(`/admin/categories/${id}`, { name: editName });
      setEditId(null);
      invalidateRefCache();
      await fetchData();
      showToast("Nom mis à jour.");
    } catch {
      showToast("Erreur lors de la modification.", "error");
    } finally {
      setBusyKey(null);
    }
  };

  const handleToggleField = async (cat, field) => {
    setBusyKey(`toggle-${cat.id}-${field}`);
    try {
      await adminApi.put(`/admin/categories/${cat.id}`, {
        name: cat.name,
        [field]: !cat[field],
      });
      invalidateRefCache();
      await fetchData();
      showToast(
        `${field === "show_in_menu" ? "Visibilité menu" : "Visibilité mega menu"} mise à jour.`,
      );
    } catch {
      showToast("Erreur lors de la mise à jour.", "error");
    } finally {
      setBusyKey(null);
    }
  };

  const handleIconChange = async (cat, icon) => {
    setBusyKey(`icon-${cat.id}`);
    try {
      await adminApi.put(`/admin/categories/${cat.id}`, {
        name: cat.name,
        icon,
      });
      invalidateRefCache();
      await fetchData();
      showToast("Icône mise à jour.");
    } catch {
      showToast("Erreur lors de la mise à jour de l'icône.", "error");
    } finally {
      setBusyKey(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    const { id, name, isBrand } = confirmDelete;
    setBusyKey(`delete-${id}`);
    try {
      isBrand
        ? await adminApi.delete(`/admin/brands/${id}`)
        : await adminApi.delete(`/admin/categories/${id}`);
      if (id === selectedTopId) setSelectedTopId(null);
      setConfirmDelete(null);
      invalidateRefCache();
      await fetchData();
      showToast(`"${name}" supprimé${isBrand ? "e" : ""} avec succès.`);
    } catch {
      showToast("Erreur lors de la suppression.", "error");
    } finally {
      setBusyKey(null);
    }
  };

  const toggleExpandSub = (id) => {
    setExpandedSub((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Drag & drop réordonnancement des sous-catégories d'une grande catégorie ──
  const handleDropSub = async (siblings, dragIdx, targetIdx) => {
    const arr = [...siblings];
    const [moved] = arr.splice(dragIdx, 1);
    arr.splice(targetIdx, 0, moved);
    setDragInfo(null);
    setBusyKey("reorder");
    try {
      await reorderCategories(arr.map((c) => c.id));
      await fetchData();
      showToast("Ordre mis à jour.");
    } catch {
      showToast("Erreur lors du réordonnancement.", "error");
    } finally {
      setBusyKey(null);
    }
  };

  // ── Marques ──
  const handleAddBrand = async () => {
    if (!addBrandName.trim()) return;
    setBusyKey("brand-add");
    try {
      const fd = new FormData();
      fd.append("name", addBrandName);
      if (addLogo) fd.append("logo", addLogo);
      const res = await adminApi.post("/admin/brands", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const parentId = res.data.id;

      // Crée chaque sous-marque listée, rattachée à la marque qui vient d'être créée
      for (const name of addSubBrandsList) {
        const subFd = new FormData();
        subFd.append("name", name);
        subFd.append("parent_id", parentId);
        await adminApi.post("/admin/brands", subFd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      const subCount = addSubBrandsList.length;
      setAddingBrand(false);
      setAddBrandName("");
      setAddLogo(null);
      setAddLogoPreview(null);
      setAddSubBrandsList([]);
      setAddSubBrandInput("");
      invalidateRefCache();
      await fetchData();
      showToast(
        subCount > 0
          ? `Marque ajoutée avec ${subCount} sous-marque(s) enregistrée(s).`
          : "Marque ajoutée avec succès.",
      );
    } catch (err) {
      showToast(
        err.response?.data?.message || "Erreur lors de l'ajout.",
        "error",
      );
    } finally {
      setBusyKey(null);
    }
  };

  const handleEditBrand = async (id) => {
    if (!editName.trim()) return;
    setBusyKey(`brand-edit-${id}`);
    try {
      const fd = new FormData();
      fd.append("name", editName);
      if (editLogo) fd.append("logo", editLogo);
      if (editLogoRemoved && !editLogo) fd.append("remove_logo", "1");
      fd.append("_method", "PUT");
      await adminApi.post(`/admin/brands/${id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Supprime les sous-marques retirées
      for (const subId of deletedSubBrandIds) {
        await adminApi.delete(`/admin/brands/${subId}`);
      }

      // Crée les nouvelles sous-marques ajoutées pendant cette édition
      for (const name of editNewSubBrands) {
        const subFd = new FormData();
        subFd.append("name", name);
        subFd.append("parent_id", id);
        await adminApi.post("/admin/brands", subFd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      const addedCount = editNewSubBrands.length;
      const removedCount = deletedSubBrandIds.length;
      setEditId(null);
      setEditLogo(null);
      setEditLogoPreview(null);
      setEditLogoRemoved(false);
      setEditExistingSubBrands([]);
      setEditNewSubBrands([]);
      setDeletedSubBrandIds([]);
      setEditSubBrandInput("");
      invalidateRefCache();
      await fetchData();
      const parts = [];
      if (addedCount > 0) parts.push(`${addedCount} sous-marque(s) ajoutée(s)`);
      if (removedCount > 0) parts.push(`${removedCount} supprimée(s)`);
      showToast(
        parts.length > 0
          ? `Modifié avec succès — ${parts.join(", ")}.`
          : "Modifié avec succès.",
      );
    } catch (err) {
      showToast(
        err.response?.data?.message || "Erreur lors de la modification.",
        "error",
      );
    } finally {
      setBusyKey(null);
    }
  };

  if (tab === "brands") {
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
            name={confirmDelete.name}
            type="brand"
            onConfirm={handleDeleteConfirm}
            onCancel={() => setConfirmDelete(null)}
            deleting={busyKey === `delete-${confirmDelete.id}`}
          />
        )}
        <PageHeader
          title="Catégories & Marques"
          subtitle="Gérez la taxonomie de votre catalogue et sa présence dans la navigation"
          action={
            <div className="flex flex-wrap gap-2">
              <Btn ghost onClick={handleDownloadBrandsTemplate}>
                <Download size={14} /> Modèle CSV
              </Btn>
              <Btn
                ghost
                onClick={handleExportBrandsExcel}
                disabled={exportingBrands}
              >
                {exportingBrands ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
                    Export...
                  </>
                ) : (
                  <>
                    <Download size={14} /> Exporter Excel
                  </>
                )}
              </Btn>
              <label className="inline-flex items-center gap-2 px-4 py-2 h-9 rounded-lg text-[13.5px] font-semibold bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                <Upload size={14} />
                {importingBrands ? "Import..." : "Importer marques (CSV)"}
                <input
                  type="file"
                  accept=".xlsx,.csv"
                  className="hidden"
                  onChange={handleImportBrandsExcel}
                  disabled={importingBrands}
                />
              </label>
              <Btn
                ghost
                onClick={handleExportBrandLogosZip}
                disabled={exportingLogos}
              >
                {exportingLogos ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
                    Export...
                  </>
                ) : (
                  <>
                    <Download size={14} /> Exporter logos (ZIP)
                  </>
                )}
              </Btn>
              <label
                className="inline-flex items-center gap-2 px-4 py-2 h-9 rounded-lg text-[13.5px] font-semibold bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                title="ZIP contenant les logos, nommés exactement comme le nom de la marque (ex: Avène.webp)"
              >
                <Upload size={14} />
                {importingLogos ? "Import..." : "Importer logos (ZIP)"}
                <input
                  type="file"
                  accept=".zip"
                  className="hidden"
                  onChange={handleImportLogosZip}
                  disabled={importingLogos}
                />
              </label>
              <Btn onClick={() => setAddingBrand(true)}>
                <Plus size={14} /> Ajouter une marque
              </Btn>
            </div>
          }
        />
        {brandImportResult && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[13px] font-bold text-blue-700">
                {brandImportResult.imported} marque(s) importée(s) —{" "}
                {brandImportResult.errors.length} avertissement(s)
              </p>
              <button
                onClick={() => setBrandImportResult(null)}
                className="text-blue-500 hover:text-blue-700"
              >
                <X size={14} />
              </button>
            </div>
            {brandImportResult.errors.length > 0 && (
              <ul className="space-y-1">
                {brandImportResult.errors.map((err, i) => (
                  <li key={i} className="text-[12px] text-blue-600">
                    • {err}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {logoImportResult && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[13px] font-bold text-purple-700">
                {logoImportResult.matched} logo(s) assigné(s) —{" "}
                {logoImportResult.skipped_count} marque(s) sans correspondance
              </p>
              <button
                onClick={() => setLogoImportResult(null)}
                className="text-purple-500 hover:text-purple-700"
              >
                <X size={14} />
              </button>
            </div>
            {logoImportResult.skipped_names?.length > 0 && (
              <p className="text-[12px] text-purple-600">
                Sans logo trouvé : {logoImportResult.skipped_names.join(", ")}
                {logoImportResult.skipped_count >
                  logoImportResult.skipped_names.length && "…"}
              </p>
            )}
          </div>
        )}
        <TabsBar tab={tab} setTab={setTab} />
        {addingBrand && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 mb-4 shadow-sm">
            <p className="text-[13px] font-bold text-gray-700 mb-4">
              Nouvelle marque
            </p>
            <div className="flex flex-col gap-3">
              <Input
                value={addBrandName}
                onChange={(e) => setAddBrandName(e.target.value)}
                placeholder="Nom de la marque..."
                className="w-full"
              />
              <ImageDropzone
                height="h-36"
                preview={addLogoPreview}
                onFileSelect={(file) => {
                  setAddLogo(file);
                  setAddLogoPreview(URL.createObjectURL(file));
                }}
                onClear={() => {
                  setAddLogo(null);
                  setAddLogoPreview(null);
                }}
              />

              <div className="border-t border-gray-100 pt-3 mt-1">
                <label className="block text-[12px] font-semibold text-gray-500 mb-2">
                  Sous-marques (optionnel)
                </label>
                <div className="flex gap-2 mb-2.5">
                  <Input
                    value={addSubBrandInput}
                    onChange={(e) => setAddSubBrandInput(e.target.value)}
                    placeholder="Nom de la sous marque"
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const val = addSubBrandInput.trim();
                        if (val && !addSubBrandsList.includes(val)) {
                          setAddSubBrandsList((prev) => [...prev, val]);
                          setAddSubBrandInput("");
                        }
                      }
                    }}
                  />
                  <Btn
                    type="button"
                    onClick={() => {
                      const val = addSubBrandInput.trim();
                      if (val && !addSubBrandsList.includes(val)) {
                        setAddSubBrandsList((prev) => [...prev, val]);
                        setAddSubBrandInput("");
                      }
                    }}
                  >
                    <Plus size={14} />
                  </Btn>
                </div>
                {addSubBrandsList.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {addSubBrandsList.map((name) => (
                      <span
                        key={name}
                        className="flex items-center gap-1.5 px-3 py-1 bg-[#edf7f3] text-[#1a4731] rounded-lg text-[12.5px] font-semibold"
                      >
                        {name}
                        <button
                          type="button"
                          onClick={() =>
                            setAddSubBrandsList((prev) =>
                              prev.filter((n) => n !== name),
                            )
                          }
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-[11px] text-gray-400 mt-2">
                  Chaque sous-marque affichera automatiquement le logo de "
                  {addBrandName || "cette marque"}".
                </p>
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <Btn
                  onClick={handleAddBrand}
                  disabled={busyKey === "brand-add"}
                >
                  {busyKey === "brand-add" ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  Enregistrer
                </Btn>
                <Btn
                  ghost
                  disabled={busyKey === "brand-add"}
                  onClick={() => {
                    setAddingBrand(false);
                    setAddBrandName("");
                    setAddLogo(null);
                    setAddLogoPreview(null);
                    setAddSubBrandsList([]);
                    setAddSubBrandInput("");
                  }}
                >
                  <X size={14} /> Annuler
                </Btn>
              </div>
            </div>
          </div>
        )}

        <TableWrap>
          {loading ? (
            <Spinner />
          ) : (
            <Table
              headers={["Logo", "Nom", "Slug", "Produits", "Actions"]}
              empty={items.length === 0 ? "Aucune marque" : null}
            >
              {items
                .filter((b) => !b.parent_id)
                .map((item) => (
                  <React.Fragment key={item.id}>
                    <TR>
                      <TD>
                        {editId === item.id ? (
                          <div style={{ width: 140 }}>
                            <ImageDropzone
                              height="h-24"
                              preview={
                                editLogoRemoved
                                  ? null
                                  : editLogoPreview ||
                                    (item.logo
                                      ? `${STORAGE_URL}/${item.logo}`
                                      : null)
                              }
                              onFileSelect={(file) => {
                                setEditLogo(file);
                                setEditLogoPreview(URL.createObjectURL(file));
                                setEditLogoRemoved(false);
                              }}
                              onClear={() => {
                                setEditLogo(null);
                                setEditLogoPreview(null);
                                setEditLogoRemoved(true);
                              }}
                              existingImage={editLogoRemoved ? null : item.logo}
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                            {item.logo ? (
                              <img
                                src={`${STORAGE_URL}/${item.logo}`}
                                alt={item.name}
                                className="w-full h-full object-contain p-0.5"
                              />
                            ) : (
                              <Package size={15} className="text-gray-300" />
                            )}
                          </div>
                        )}
                      </TD>
                      <TD>
                        {editId === item.id ? (
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-48"
                          />
                        ) : (
                          <div>
                            <span className="font-semibold text-[13.5px]">
                              {item.name}
                            </span>
                            {items.some((b) => b.parent_id === item.id) && (
                              <p className="text-[11px] text-gray-400 mt-0.5">
                                {
                                  items.filter((b) => b.parent_id === item.id)
                                    .length
                                }{" "}
                                sous-marque(s)
                              </p>
                            )}
                          </div>
                        )}
                      </TD>
                      <TD className="text-[12.5px] text-gray-400">
                        {item.slug}
                      </TD>
                      <TD>
                        <span className="text-[12px] font-semibold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md border border-gray-200">
                          {item.products_count ?? 0}
                        </span>
                      </TD>
                      <TD>
                        <div className="flex gap-1.5">
                          {editId === item.id ? (
                            <>
                              <ActionBtn
                                type="success"
                                onClick={() => handleEditBrand(item.id)}
                                title="Enregistrer"
                                disabled={busyKey === `brand-edit-${item.id}`}
                              >
                                {busyKey === `brand-edit-${item.id}` ? (
                                  <span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                                ) : (
                                  <Save size={13} />
                                )}
                              </ActionBtn>
                              <ActionBtn
                                type="ghost"
                                onClick={() => {
                                  setEditId(null);
                                  setEditLogo(null);
                                  setEditLogoPreview(null);
                                  setEditLogoRemoved(false);
                                  setEditExistingSubBrands([]);
                                  setEditNewSubBrands([]);
                                  setDeletedSubBrandIds([]);
                                  setEditSubBrandInput("");
                                }}
                                title="Annuler"
                              >
                                <X size={13} />
                              </ActionBtn>
                            </>
                          ) : (
                            <>
                              <ActionBtn
                                type="info"
                                onClick={() => {
                                  setEditId(item.id);
                                  setEditName(item.name);
                                  setEditLogo(null);
                                  setEditLogoPreview(null);
                                  setEditLogoRemoved(false);
                                  setEditExistingSubBrands(
                                    items.filter(
                                      (b) => b.parent_id === item.id,
                                    ),
                                  );
                                  setEditNewSubBrands([]);
                                  setDeletedSubBrandIds([]);
                                  setEditSubBrandInput("");
                                }}
                                title="Modifier"
                              >
                                <Edit2 size={13} />
                              </ActionBtn>
                              <ActionBtn
                                type="danger"
                                onClick={() =>
                                  setConfirmDelete({
                                    id: item.id,
                                    name: item.name,
                                    isBrand: true,
                                  })
                                }
                                title="Supprimer"
                                disabled={busyKey === `delete-${item.id}`}
                              >
                                {busyKey === `delete-${item.id}` ? (
                                  <span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                                ) : (
                                  <Trash2 size={13} />
                                )}
                              </ActionBtn>
                            </>
                          )}
                        </div>
                      </TD>
                    </TR>
                    {editId === item.id && (
                      <tr>
                        <td colSpan={5} className="px-3 pb-4">
                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                            <p className="text-[12px] font-semibold text-gray-600 mb-2.5">
                              Sous-marques de "{item.name}"
                            </p>

                            {editExistingSubBrands.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-3">
                                {editExistingSubBrands.map((sub) => (
                                  <span
                                    key={sub.id}
                                    className="flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 text-[12.5px] font-medium text-gray-700 rounded-lg"
                                  >
                                    {sub.name}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditExistingSubBrands((prev) =>
                                          prev.filter((s) => s.id !== sub.id),
                                        );
                                        setDeletedSubBrandIds((prev) => [
                                          ...prev,
                                          sub.id,
                                        ]);
                                      }}
                                      className="text-gray-400 hover:text-red-500"
                                    >
                                      <X size={12} />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}

                            {editNewSubBrands.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-3">
                                {editNewSubBrands.map((name) => (
                                  <span
                                    key={name}
                                    className="flex items-center gap-1.5 px-3 py-1 bg-[#edf7f3] border border-[#1a4731]/20 text-[12.5px] font-medium text-[#1a4731] rounded-lg"
                                  >
                                    {name}
                                    <span className="text-[10px] uppercase font-bold opacity-60">
                                      nouveau
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setEditNewSubBrands((prev) =>
                                          prev.filter((n) => n !== name),
                                        )
                                      }
                                      className="text-[#1a4731]/60 hover:text-red-500"
                                    >
                                      <X size={12} />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="flex gap-2">
                              <Input
                                value={editSubBrandInput}
                                onChange={(e) =>
                                  setEditSubBrandInput(e.target.value)
                                }
                                placeholder="Ajouter une sous-marque..."
                                className="flex-1 h-8 text-[12.5px]"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    const val = editSubBrandInput.trim();
                                    if (
                                      val &&
                                      !editNewSubBrands.includes(val)
                                    ) {
                                      setEditNewSubBrands((prev) => [
                                        ...prev,
                                        val,
                                      ]);
                                      setEditSubBrandInput("");
                                    }
                                  }
                                }}
                              />
                              <Btn
                                type="button"
                                onClick={() => {
                                  const val = editSubBrandInput.trim();
                                  if (val && !editNewSubBrands.includes(val)) {
                                    setEditNewSubBrands((prev) => [
                                      ...prev,
                                      val,
                                    ]);
                                    setEditSubBrandInput("");
                                  }
                                }}
                              >
                                <Plus size={13} />
                              </Btn>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
            </Table>
          )}
        </TableWrap>
      </div>
    );
  }

  // ── VUE LISTE : grandes catégories seulement ──
  if (!selectedTop) {
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
            name={confirmDelete.name}
            type={confirmDelete.isBrand ? "brand" : "category"}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setConfirmDelete(null)}
            deleting={busyKey === `delete-${confirmDelete.id}`}
          />
        )}

        <PageHeader
          title="Catégories & Marques"
          subtitle="Cliquez sur une catégorie pour gérer ses sous-catégories, marques et pack promo"
          action={
            <Btn onClick={() => setAddingTop(true)}>
              <Plus size={14} /> Nouvelle grande catégorie
            </Btn>
          }
        />

        <TabsBar tab={tab} setTab={setTab} />

        {addingTop && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 mb-5 shadow-sm">
            <p className="text-[13px] font-bold text-gray-700 mb-4">
              Nouvelle grande catégorie
            </p>
            <div className="flex flex-col gap-3">
              <Input
                value={addTopName}
                onChange={(e) => setAddTopName(e.target.value)}
                placeholder="Nom de la catégorie..."
                className="w-full"
              />
              <div>
                <label className="block text-[12px] font-semibold text-gray-500 mb-1.5">
                  Icône (menu principal)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(ICON_OPTIONS).map(([name, Icon]) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setAddTopIcon(name)}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center border-2 transition-colors ${
                        addTopIcon === name
                          ? "border-[#1a4731] bg-[#1a4731]/10 text-[#1a4731]"
                          : "border-gray-200 text-gray-400 hover:border-gray-300"
                      }`}
                    >
                      <Icon size={16} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <Btn onClick={handleAddTop} disabled={busyKey === "top-add"}>
                  {busyKey === "top-add" ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  Créer
                </Btn>
                <Btn
                  ghost
                  disabled={busyKey === "top-add"}
                  onClick={() => {
                    setAddingTop(false);
                    setAddTopName("");
                  }}
                >
                  <X size={14} /> Annuler
                </Btn>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <Spinner />
        ) : categories.filter((c) => !c.parent_id).length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-[13px]">
            Aucune catégorie
          </div>
        ) : (
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            }}
          >
            {categories
              .filter((c) => !c.parent_id)
              .map((cat) => {
                const Icon = ICON_OPTIONS[cat.icon] || Layers;
                return (
                  <div
                    key={cat.id}
                    className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => setSelectedTopId(cat.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-11 h-11 rounded-xl bg-[#edf7f3] flex items-center justify-center">
                        <Icon size={20} className="text-[#1a4731]" />
                      </div>
                      <div
                        className="flex gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleToggleField(cat, "show_in_menu")}
                          disabled={busyKey === `toggle-${cat.id}-show_in_menu`}
                          title={
                            cat.show_in_menu
                              ? "Visible dans le menu"
                              : "Masqué du menu"
                          }
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 ${cat.show_in_menu ? "bg-[#edf7f3] text-[#1a4731]" : "bg-gray-100 text-gray-300"}`}
                        >
                          {busyKey === `toggle-${cat.id}-show_in_menu` ? (
                            <span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                          ) : (
                            <MenuIcon size={12} />
                          )}
                        </button>
                        <button
                          onClick={() =>
                            handleToggleField(cat, "show_in_megamenu")
                          }
                          disabled={
                            busyKey === `toggle-${cat.id}-show_in_megamenu`
                          }
                          title={
                            cat.show_in_megamenu
                              ? "Visible dans le mega menu"
                              : "Masqué du mega menu"
                          }
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 ${cat.show_in_megamenu ? "bg-[#edf7f3] text-[#1a4731]" : "bg-gray-100 text-gray-300"}`}
                        >
                          {busyKey === `toggle-${cat.id}-show_in_megamenu` ? (
                            <span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                          ) : cat.show_in_megamenu ? (
                            <Eye size={12} />
                          ) : (
                            <EyeOff size={12} />
                          )}
                        </button>
                      </div>
                    </div>
                    <p className="text-[15px] font-bold text-gray-900 mb-1">
                      {cat.name}
                    </p>
                    <p className="text-[12px] text-gray-400 mb-3">
                      {cat.children?.length || 0} sous-catégorie(s) ·{" "}
                      {cat.products_count ?? 0} produits
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[12.5px] font-semibold text-[#1a4731] group-hover:underline">
                        Gérer →
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDelete({ id: cat.id, name: cat.name });
                        }}
                        disabled={busyKey === `delete-${cat.id}`}
                        className="w-7 h-7 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        {busyKey === `delete-${cat.id}` ? (
                          <span className="w-3 h-3 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" />
                        ) : (
                          <Trash2 size={12} />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    );
  }

  // ── VUE DÉTAIL : une grande catégorie ──
  const TopIcon = ICON_OPTIONS[selectedTop.icon] || Layers;
  const isImageStyle =
    selectedTop.slug === "soin" || selectedTop.children?.some((c) => c.image);

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
          name={confirmDelete.name}
          type="category"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmDelete(null)}
          deleting={busyKey === `delete-${confirmDelete.id}`}
        />
      )}
      {configPanel && (
        <CategoryConfigPanel
          category={configPanel}
          allBrands={allBrands}
          onClose={() => setConfigPanel(null)}
          onSaved={() => {
            setConfigPanel(null);
            fetchData();
          }}
          showToast={showToast}
        />
      )}

      <button
        onClick={() => setSelectedTopId(null)}
        className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-500 hover:text-[#1a4731] transition-colors mb-4"
      >
        <ArrowLeft size={15} /> Toutes les catégories
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex-shrink-0">
            <IconPicker
              value={selectedTop.icon}
              onChange={(icon) => handleIconChange(selectedTop, icon)}
            />
            {busyKey === `icon-${selectedTop.id}` && (
              <span className="absolute inset-0 rounded-lg bg-white/70 flex items-center justify-center">
                <span className="w-3.5 h-3.5 border-2 border-[#1a4731]/30 border-t-[#1a4731] rounded-full animate-spin" />
              </span>
            )}
          </div>
          {editId === selectedTop.id ? (
            <div className="flex items-center gap-2">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-56"
              />
              <ActionBtn
                type="success"
                onClick={() => handleEditName(selectedTop.id)}
                title="Enregistrer"
                disabled={busyKey === `name-${selectedTop.id}`}
              >
                {busyKey === `name-${selectedTop.id}` ? (
                  <span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                ) : (
                  <Save size={13} />
                )}
              </ActionBtn>
              <ActionBtn
                type="ghost"
                onClick={() => setEditId(null)}
                title="Annuler"
              >
                <X size={13} />
              </ActionBtn>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-[20px] font-bold text-gray-900">
                {selectedTop.name}
              </h1>
              <button
                onClick={() => {
                  setEditId(selectedTop.id);
                  setEditName(selectedTop.name);
                }}
                className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <Edit2 size={13} />
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleToggleField(selectedTop, "show_in_menu")}
            disabled={busyKey === `toggle-${selectedTop.id}-show_in_menu`}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold transition-colors disabled:opacity-50 ${selectedTop.show_in_menu ? "bg-[#edf7f3] text-[#1a4731]" : "bg-gray-100 text-gray-400"}`}
          >
            {busyKey === `toggle-${selectedTop.id}-show_in_menu` ? (
              <span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
            ) : (
              <MenuIcon size={13} />
            )}{" "}
            Menu
          </button>
          <button
            onClick={() => handleToggleField(selectedTop, "show_in_megamenu")}
            disabled={busyKey === `toggle-${selectedTop.id}-show_in_megamenu`}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold transition-colors disabled:opacity-50 ${selectedTop.show_in_megamenu ? "bg-[#edf7f3] text-[#1a4731]" : "bg-gray-100 text-gray-400"}`}
          >
            {busyKey === `toggle-${selectedTop.id}-show_in_megamenu` ? (
              <span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
            ) : selectedTop.show_in_megamenu ? (
              <Eye size={13} />
            ) : (
              <EyeOff size={13} />
            )}{" "}
            Mega menu
          </button>
          {!isImageStyle && (
            <Btn ghost onClick={() => setConfigPanel(selectedTop)}>
              <Megaphone size={14} /> Marques & Pack
            </Btn>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Colonne gauche : sous-catégories */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm relative">
          {busyKey === "reorder" && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 text-[11px] text-gray-400 z-10">
              <span className="w-3 h-3 border-2 border-gray-300 border-t-[#1a4731] rounded-full animate-spin" />
              Réorganisation...
            </div>
          )}
          <div className="flex items-center justify-between mb-4">
            <p className="text-[13px] font-bold text-gray-700">
              Sous-catégories ({selectedTop.children?.length || 0})
            </p>
            <button
              onClick={() => setAddingSubFor(selectedTop.id)}
              className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#1a4731] hover:opacity-70"
            >
              <Plus size={14} /> Ajouter
            </button>
          </div>

          {addingSubFor === selectedTop.id && (
            <div className="flex gap-2 mb-4">
              <Input
                value={addSubName}
                onChange={(e) => setAddSubName(e.target.value)}
                placeholder="Nom de la sous-catégorie..."
                className="flex-1"
              />
              <Btn
                onClick={() => handleAddSub(selectedTop.id)}
                disabled={busyKey === `sub-add-${selectedTop.id}`}
              >
                {busyKey === `sub-add-${selectedTop.id}` ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save size={14} />
                )}
              </Btn>
              <Btn
                ghost
                disabled={busyKey === `sub-add-${selectedTop.id}`}
                onClick={() => {
                  setAddingSubFor(null);
                  setAddSubName("");
                }}
              >
                <X size={14} />
              </Btn>
            </div>
          )}

          {(selectedTop.children || []).length === 0 ? (
            <p className="text-[13px] text-gray-400 italic py-6 text-center">
              Aucune sous-catégorie.
            </p>
          ) : (
            <div className="space-y-1.5">
              {selectedTop.children.map((child, idx) => (
                <div key={child.id}>
                  <div
                    draggable
                    onDragStart={() =>
                      setDragInfo({ parentId: selectedTop.id, index: idx })
                    }
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (dragInfo?.parentId === selectedTop.id) {
                        handleDropSub(
                          selectedTop.children,
                          dragInfo.index,
                          idx,
                        );
                      }
                    }}
                    className="flex items-center gap-2 py-2 px-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <GripVertical
                      size={13}
                      className="text-gray-300 cursor-move flex-shrink-0"
                    />
                    {child.children?.length > 0 ? (
                      <button
                        onClick={() => toggleExpandSub(child.id)}
                        className="w-4 h-4 flex items-center justify-center text-gray-400 flex-shrink-0"
                      >
                        {expandedSub.has(child.id) ? (
                          <ChevronDown size={13} />
                        ) : (
                          <ChevronRight size={13} />
                        )}
                      </button>
                    ) : (
                      <span className="w-4 flex-shrink-0" />
                    )}
                    {selectedTop.slug === "soin" &&
                      (child.image ? (
                        <img
                          src={`${STORAGE_URL}/${child.image}`}
                          alt=""
                          className="w-8 h-8 rounded-md object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <ImageIcon size={12} className="text-gray-300" />
                        </div>
                      ))}
                    {editId === child.id ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 h-8"
                      />
                    ) : (
                      <span className="text-[13px] font-semibold flex-1 min-w-0 truncate">
                        {child.name}
                      </span>
                    )}
                    <div className="flex gap-1 flex-shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      {editId === child.id ? (
                        <>
                          <ActionBtn
                            type="success"
                            onClick={() => handleEditName(child.id)}
                            title="Enregistrer"
                            disabled={busyKey === `name-${child.id}`}
                          >
                            {busyKey === `name-${child.id}` ? (
                              <span className="w-2.5 h-2.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                            ) : (
                              <Save size={12} />
                            )}
                          </ActionBtn>
                          <ActionBtn
                            type="ghost"
                            onClick={() => setEditId(null)}
                            title="Annuler"
                          >
                            <X size={12} />
                          </ActionBtn>
                        </>
                      ) : (
                        <>
                          {selectedTop.slug === "soin" && (
                            <ActionBtn
                              type="ghost"
                              onClick={() => setConfigPanel(child)}
                              title="Modifier l'image"
                            >
                              <ImageIcon size={12} />
                            </ActionBtn>
                          )}
                          <ActionBtn
                            type="info"
                            onClick={() => {
                              setEditId(child.id);
                              setEditName(child.name);
                            }}
                            title="Renommer"
                          >
                            <Edit2 size={12} />
                          </ActionBtn>
                          <ActionBtn
                            type="danger"
                            onClick={() =>
                              setConfirmDelete({
                                id: child.id,
                                name: child.name,
                              })
                            }
                            title="Supprimer"
                            disabled={busyKey === `delete-${child.id}`}
                          >
                            {busyKey === `delete-${child.id}` ? (
                              <span className="w-2.5 h-2.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                            ) : (
                              <Trash2 size={12} />
                            )}
                          </ActionBtn>
                        </>
                      )}
                    </div>
                  </div>

                  {expandedSub.has(child.id) && (
                    <div className="pl-9 space-y-1 mb-2">
                      {(child.children || []).map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg hover:bg-gray-50 group/sub"
                        >
                          {editId === sub.id ? (
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="flex-1 h-7 text-[12px]"
                            />
                          ) : (
                            <span className="text-[12.5px] text-gray-600 flex-1 min-w-0 truncate">
                              {sub.name}
                            </span>
                          )}
                          <div className="flex gap-1 flex-shrink-0 opacity-100 md:opacity-0 md:group-hover/sub:opacity-100 transition-opacity">
                            {editId === sub.id ? (
                              <>
                                <ActionBtn
                                  type="success"
                                  onClick={() => handleEditName(sub.id)}
                                  title="Enregistrer"
                                  disabled={busyKey === `name-${sub.id}`}
                                >
                                  {busyKey === `name-${sub.id}` ? (
                                    <span className="w-2.5 h-2.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                                  ) : (
                                    <Save size={11} />
                                  )}
                                </ActionBtn>
                                <ActionBtn
                                  type="ghost"
                                  onClick={() => setEditId(null)}
                                  title="Annuler"
                                >
                                  <X size={11} />
                                </ActionBtn>
                              </>
                            ) : (
                              <>
                                <ActionBtn
                                  type="info"
                                  onClick={() => {
                                    setEditId(sub.id);
                                    setEditName(sub.name);
                                  }}
                                  title="Renommer"
                                >
                                  <Edit2 size={11} />
                                </ActionBtn>
                                <ActionBtn
                                  type="danger"
                                  onClick={() =>
                                    setConfirmDelete({
                                      id: sub.id,
                                      name: sub.name,
                                    })
                                  }
                                  title="Supprimer"
                                  disabled={busyKey === `delete-${sub.id}`}
                                >
                                  {busyKey === `delete-${sub.id}` ? (
                                    <span className="w-2.5 h-2.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                                  ) : (
                                    <Trash2 size={11} />
                                  )}
                                </ActionBtn>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                      {addingSubFor === child.id ? (
                        <div className="flex gap-2 pt-1">
                          <Input
                            value={addSubName}
                            onChange={(e) => setAddSubName(e.target.value)}
                            placeholder="Nom..."
                            className="flex-1 h-8 text-[12px]"
                          />
                          <Btn
                            onClick={() => handleAddSub(child.id)}
                            disabled={busyKey === `sub-add-${child.id}`}
                          >
                            {busyKey === `sub-add-${child.id}` ? (
                              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <Save size={12} />
                            )}
                          </Btn>
                          <Btn
                            ghost
                            disabled={busyKey === `sub-add-${child.id}`}
                            onClick={() => {
                              setAddingSubFor(null);
                              setAddSubName("");
                            }}
                          >
                            <X size={12} />
                          </Btn>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAddingSubFor(child.id)}
                          className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[#1a4731] hover:opacity-70 pt-1"
                        >
                          <Plus size={12} /> Ajouter ici
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Colonne droite : aperçu du mega menu */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[13px] font-bold text-gray-700">
              Aperçu du mega menu
            </p>
            <span
              className="text-[10.5px] font-semibold px-2 py-0.5 rounded-md"
              style={{
                background: isImageStyle ? "#fef3c7" : "#edf7f3",
                color: isImageStyle ? "#92400e" : "#1a4731",
              }}
            >
              {isImageStyle ? "Style images" : "Style marques & pack"}
            </span>
          </div>
          {isImageStyle && (
            <p className="text-[11.5px] text-gray-400 mb-4 -mt-2">
              Cette catégorie affiche une image par sous-catégorie. Modifiez
              chaque image via l'icône 🖼️ ci-contre.
            </p>
          )}
          <MegaMenuContent category={selectedTop} />
        </div>
      </div>
    </div>
  );
}

function TabsBar({ tab, setTab }) {
  return (
    <div className="flex gap-0.5 bg-gray-100 p-1 rounded-xl mb-5 overflow-x-auto">
      {[
        { key: "categories", label: "Catégories", icon: Layers },
        { key: "brands", label: "Marques", icon: Tag },
      ].map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => setTab(key)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all ${
            tab === key
              ? "bg-white text-[#1a4731] shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Icon size={15} /> {label}
        </button>
      ))}
    </div>
  );
}

function CategoryConfigPanel({
  category,
  allBrands,
  onClose,
  onSaved,
  showToast,
}) {
  const isTopLevel = !category.parent_id;
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(
    category.image ? `${STORAGE_URL}/${category.image}` : null,
  );
  const [promoTitle, setPromoTitle] = useState(category.promo_title || "");
  const [promoText, setPromoText] = useState(category.promo_text || "");
  const [promoCta, setPromoCta] = useState(category.promo_cta || "");
  const [bundleId, setBundleId] = useState(category.bundle_id || "");
  const [availableBundles, setAvailableBundles] = useState([]);
  const [loadingBundles, setLoadingBundles] = useState(true);
  const [bundleSearch, setBundleSearch] = useState("");
  const [bundlesError, setBundlesError] = useState(false);

  const filteredBundles = availableBundles.filter((b) =>
    b.name.toLowerCase().includes(bundleSearch.trim().toLowerCase()),
  );
  const [selectedBrandIds, setSelectedBrandIds] = useState(
    (category.brands || []).map((b) => b.id),
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isTopLevel) return;
    adminApi
      .get("/admin/bundles-for-menu")
      .then((res) => setAvailableBundles(res.data))
      .catch(() => {
        setAvailableBundles([]);
        setBundlesError(true);
      })
      .finally(() => setLoadingBundles(false));
  }, [isTopLevel]);

  const selectedBundle = availableBundles.find(
    (b) => String(b.id) === String(bundleId),
  );

  const toggleBrand = (id) => {
    setSelectedBrandIds((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id],
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", category.name);
      fd.append("_method", "PUT");
      if (image) fd.append("image", image);
      if (isTopLevel) {
        fd.append("promo_title", promoTitle);
        fd.append("promo_text", promoText);
        fd.append("promo_cta", promoCta);
        if (bundleId) fd.append("bundle_id", bundleId);
      }
      await adminApi.post(`/admin/categories/${category.id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (isTopLevel) await syncCategoryBrands(category.id, selectedBrandIds);
      invalidateRefCache();
      showToast("Configuration enregistrée avec succès.");
      onSaved();
    } catch {
      showToast("Erreur lors de l'enregistrement.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] sm:max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-[15px] font-bold text-gray-900">
              Configurer "{category.name}"
            </p>
            <p className="text-[12px] text-gray-400 mt-0.5">
              {isTopLevel
                ? "Marques populaires et coffret promu dans le mega menu"
                : "Image affichée dans le mega menu"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {!isTopLevel && (
            <div>
              <p className="flex items-center gap-2 text-[13px] font-bold text-gray-700 mb-2.5">
                <ImageIcon size={14} /> Image illustrative
              </p>
              <ImageDropzone
                height="h-32"
                preview={imagePreview}
                onFileSelect={(file) => {
                  setImage(file);
                  setImagePreview(URL.createObjectURL(file));
                }}
                onClear={() => {
                  setImage(null);
                  setImagePreview(null);
                }}
                existingImage={category.image}
              />
            </div>
          )}

          {isTopLevel && (
            <>
              <div>
                <p className="flex items-center gap-2 text-[13px] font-bold text-gray-700 mb-2.5">
                  <Tag size={14} /> Marques populaires
                </p>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
                  {allBrands.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => toggleBrand(b.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[12.5px] font-medium transition-colors ${
                        selectedBrandIds.includes(b.id)
                          ? "border-[#1a4731] bg-[#edf7f3] text-[#1a4731]"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {b.logo && (
                        <img
                          src={`${STORAGE_URL}/${b.logo}`}
                          alt=""
                          className="w-4 h-4 object-contain"
                        />
                      )}
                      {b.name}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5">
                  {selectedBrandIds.length} marque(s) sélectionnée(s)
                </p>
              </div>

              <div>
                <p className="flex items-center gap-2 text-[13px] font-bold text-gray-700 mb-2.5">
                  <Megaphone size={14} /> Coffret mis en avant
                </p>
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[11.5px] font-semibold text-gray-500 mb-1">
                      Coffret à afficher
                    </label>
                    {loadingBundles ? (
                      <p className="text-[12.5px] text-gray-400 py-2">
                        Chargement des coffrets...
                      </p>
                    ) : (
                      <div className="relative">
                        <Input
                          value={bundleSearch}
                          onChange={(e) => setBundleSearch(e.target.value)}
                          placeholder="Rechercher un coffret par nom..."
                          className="w-full mb-2"
                        />
                        {bundleId && (
                          <button
                            type="button"
                            onClick={() => {
                              setBundleId("");
                              setBundleSearch("");
                            }}
                            className="text-[11.5px] font-semibold text-red-500 hover:opacity-70 mb-2 block"
                          >
                            Retirer la sélection
                          </button>
                        )}
                        <div className="border border-gray-200 rounded-xl max-h-52 overflow-y-auto">
                          {filteredBundles.length === 0 ? (
                            <p className="text-[12.5px] text-gray-400 text-center py-6">
                              {bundlesError
                                ? "Impossible de charger les coffrets."
                                : "Aucun coffret trouvé"}
                            </p>
                          ) : (
                            filteredBundles.map((b) => (
                              <button
                                key={b.id}
                                type="button"
                                onClick={() => setBundleId(String(b.id))}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 border-b border-gray-100 last:border-0 text-left transition-colors ${
                                  String(bundleId) === String(b.id)
                                    ? "bg-[#edf7f3]"
                                    : "hover:bg-gray-50"
                                }`}
                              >
                                <div className="w-9 h-9 rounded-lg border border-gray-200 bg-white flex-shrink-0 overflow-hidden">
                                  {b.image ? (
                                    <img
                                      src={`${STORAGE_URL}/${b.image}`}
                                      alt=""
                                      className="w-full h-full object-contain p-0.5"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                      <ImageIcon size={13} />
                                    </div>
                                  )}
                                </div>
                                <span className="flex-1 min-w-0 text-[12.5px] font-semibold text-gray-800 truncate">
                                  {b.name}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                                    b.is_available
                                      ? "bg-emerald-50 text-emerald-600"
                                      : "bg-red-50 text-red-500"
                                  }`}
                                >
                                  {b.is_available ? "Disponible" : "Indispo."}
                                </span>
                                {String(bundleId) === String(b.id) && (
                                  <span className="w-4 h-4 rounded-full bg-[#1a4731] flex items-center justify-center flex-shrink-0">
                                    <Check size={10} className="text-white" />
                                  </span>
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedBundle && (
                    <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="w-14 h-14 rounded-lg border border-gray-200 bg-white flex-shrink-0 overflow-hidden">
                        {selectedBundle.image ? (
                          <img
                            src={`${STORAGE_URL}/${selectedBundle.image}`}
                            alt=""
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <ImageIcon size={16} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-semibold text-gray-800 truncate">
                          {selectedBundle.name}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          Image utilisée automatiquement dans la carte du mega
                          menu
                        </p>
                      </div>
                    </div>
                  )}

                  <Input
                    value={promoTitle}
                    onChange={(e) => setPromoTitle(e.target.value)}
                    placeholder="Titre (ex: Coffret Hydratation Intense)"
                    className="w-full"
                  />
                  <textarea
                    value={promoText}
                    onChange={(e) => setPromoText(e.target.value)}
                    placeholder="Texte descriptif court..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-700 outline-none focus:border-[#1a4731] resize-none"
                  />
                  <Input
                    value={promoCta}
                    onChange={(e) => setPromoCta(e.target.value)}
                    placeholder="Texte du bouton (ex: Découvrir le coffret)"
                    className="w-full"
                  />
                  <p className="text-[11px] text-gray-400">
                    Le lien redirige automatiquement vers la fiche du coffret
                    sélectionné — aucune saisie manuelle nécessaire.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2.5 justify-end px-4 sm:px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-600 text-[13.5px] font-semibold hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-[#1a4731] text-white rounded-xl text-[13.5px] font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}
