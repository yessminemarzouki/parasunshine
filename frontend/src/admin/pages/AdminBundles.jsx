import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Search,
  Gift,
  AlertTriangle,
  Package,
  Tag,
  Image as ImageIcon,
  Settings,
} from "lucide-react";
import {
  getAdminBundles,
  getAdminBundle,
  searchBundleProducts,
  createBundle,
  updateBundle,
  deleteBundle,
  getAdminBundleCategories,
} from "../services/adminBundleApi";
import { getAdminBrands } from "../services/adminApi";
import { STORAGE_URL } from "../../config/api";
import {
  Btn,
  Input,
  Label,
  Select,
  PageHeader,
  Spinner,
  Toast,
  Badge,
} from "../components/AdminShared";

const emptyForm = {
  name: "",
  brand_id: "",
  bundle_category_id: "",
  description: "",
  price_mode: "manual",
  price: "",
  promo_price: "",
  discount_percentage: "",
  promo_starts_at: "",
  promo_ends_at: "",
  stock: 999,
  is_unavailable: false,
};

export default function AdminBundles() {
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterAvailability, setFilterAvailability] = useState("");
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [toast, setToast] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [items, setItems] = useState([]); // { product, quantity, is_free } ou { product: null, customName, customPrice, quantity, is_free }
  const [saving, setSaving] = useState(false);

  // Images
  const [mainImage, setMainImage] = useState(null);
  const [mainImagePreview, setMainImagePreview] = useState(null);
  const [galleryImages, setGalleryImages] = useState([null, null, null]);
  const [galleryPreviews, setGalleryPreviews] = useState([null, null, null]);
  const [existingImage, setExistingImage] = useState(null);
  const [existingGallery, setExistingGallery] = useState([null, null, null]);

  // Recherche produits
  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const searchDebounce = useRef(null);

  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [loadingEditId, setLoadingEditId] = useState(null);

  const showToast = (message, type = "error") => setToast({ message, type });

  const fetchBundles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminBundles({
        page,
        search,
        brand_id: filterBrand || undefined,
        bundle_category_id: filterCategory || undefined,
        availability: filterAvailability || undefined,
      });
      setBundles(data.data);
      setMeta(data);
    } catch {
      showToast("Erreur lors du chargement des coffrets.");
    } finally {
      setLoading(false);
    }
  }, [page, search, filterBrand, filterCategory, filterAvailability]);

  useEffect(() => {
    fetchBundles();
  }, [fetchBundles]);

  useEffect(() => {
    getAdminBundleCategories()
      .then(setCategories)
      .catch(() => {});
    getAdminBrands()
      .then(setBrands)
      .catch(() => {});
  }, []);

  // ── Recherche produits (debounce) ──
  useEffect(() => {
    clearTimeout(searchDebounce.current);
    if (productQuery.trim().length < 2) {
      setProductResults([]);
      return;
    }
    searchDebounce.current = setTimeout(async () => {
      setSearchingProducts(true);
      try {
        const results = await searchBundleProducts(productQuery.trim());
        setProductResults(results);
      } catch {
        setProductResults([]);
      } finally {
        setSearchingProducts(false);
      }
    }, 300);
  }, [productQuery]);

  // ── Ouvrir formulaire ──
  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setItems([]);
    setMainImage(null);
    setMainImagePreview(null);
    setGalleryImages([null, null, null]);
    setGalleryPreviews([null, null, null]);
    setExistingImage(null);
    setExistingGallery([null, null, null]);
    setProductQuery("");
    setProductResults([]);
    setShowForm(true);
  };

  const openEdit = async (bundle) => {
    setLoadingEditId(bundle.id);
    try {
      const full = await getAdminBundle(bundle.id);
      setEditId(full.id);
      setForm({
        name: full.name,
        brand_id: full.brand_id ?? "",
        bundle_category_id: full.bundle_category_id ?? "",
        description: full.description ?? "",
        price_mode: full.price_mode,
        price: full.price,
        promo_price: full.promo_price ?? "",
        discount_percentage: full.discount_percentage ?? "",
        promo_starts_at: full.promo_starts_at
          ? full.promo_starts_at.slice(0, 16)
          : "",
        promo_ends_at: full.promo_ends_at
          ? full.promo_ends_at.slice(0, 16)
          : "",
        stock: full.stock,
        is_unavailable: full.is_unavailable,
      });
      setItems(
        (full.items || []).map((it) => ({
          product: it.product || null,
          customName: it.custom_name || "",
          customPrice: it.custom_price || "",
          customImage: null,
          customImagePreview: null,
          existingCustomImage: it.custom_image || null,
          quantity: it.quantity,
          is_free: it.is_free,
        })),
      );
      setMainImage(null);
      setMainImagePreview(null);
      setExistingImage(full.image);
      const gallery = full.images || [];
      setExistingGallery([
        gallery[0] || null,
        gallery[1] || null,
        gallery[2] || null,
      ]);
      setGalleryImages([null, null, null]);
      setGalleryPreviews([null, null, null]);
      setProductQuery("");
      setProductResults([]);
      setShowForm(true);
    } catch {
      showToast("Erreur lors du chargement du coffret.");
    } finally {
      setLoadingEditId(null);
    }
  };

  // ── Gestion des produits sélectionnés ──
  const addProduct = (product) => {
    setItems((prev) => [...prev, { product, quantity: 1, is_free: false }]);
    setProductQuery("");
    setProductResults([]);
  };
  const addManualItem = () => {
    setItems((prev) => [
      ...prev,
      {
        product: null,
        customName: "",
        customPrice: "",
        customImage: null,
        customImagePreview: null,
        existingCustomImage: null,
        quantity: 1,
        is_free: false,
      },
    ]);
  };

  const updateManualImage = (index, file) => {
    if (!file || !file.type?.startsWith("image/")) return;
    setItems((prev) =>
      prev.map((it, i) =>
        i === index
          ? {
              ...it,
              customImage: file,
              customImagePreview: URL.createObjectURL(file),
              existingCustomImage: null,
            }
          : it,
      ),
    );
  };

  const removeManualImage = (index) => {
    setItems((prev) =>
      prev.map((it, i) =>
        i === index
          ? {
              ...it,
              customImage: null,
              customImagePreview: null,
              existingCustomImage: null,
            }
          : it,
      ),
    );
  };

  const updateManualField = (index, field, value) => {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)),
    );
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItemQuantity = (index, quantity) => {
    setItems((prev) =>
      prev.map((it, i) =>
        i === index ? { ...it, quantity: Math.max(1, quantity) } : it,
      ),
    );
  };

  const toggleItemFree = (index) => {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, is_free: !it.is_free } : it)),
    );
  };

  const hasFreeItems = items.some((it) => it.is_free);

  // ── Prix auto calculé (aperçu live) ──
  const itemUnitPrice = (it) =>
    it.product
      ? parseFloat(it.product.price || 0)
      : parseFloat(it.customPrice || 0);

  const autoPrice = items
    .filter((it) => !it.is_free)
    .reduce((sum, it) => sum + itemUnitPrice(it) * it.quantity, 0);

  const giftValue = items
    .filter((it) => it.is_free)
    .reduce((sum, it) => sum + itemUnitPrice(it) * it.quantity, 0);

  // ── Images ──
  const acceptImageFile = (file) => file && file.type?.startsWith("image/");

  const setMainImageFile = (file) => {
    if (!acceptImageFile(file)) return;
    setMainImage(file);
    setMainImagePreview(URL.createObjectURL(file));
    setExistingImage(null);
  };

  const handleMainImageChange = (e) => {
    setMainImageFile(e.target.files[0]);
    e.target.value = "";
  };

  const removeMainImage = () => {
    setMainImage(null);
    setMainImagePreview(null);
    setExistingImage(null);
  };

  const setGalleryImageFile = (index, file) => {
    if (!acceptImageFile(file)) return;
    setGalleryImages((prev) => {
      const next = [...prev];
      next[index] = file;
      return next;
    });
    setGalleryPreviews((prev) => {
      const next = [...prev];
      next[index] = URL.createObjectURL(file);
      return next;
    });
    setExistingGallery((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  };

  const handleGalleryImageChange = (index, e) => {
    setGalleryImageFile(index, e.target.files[0]);
    e.target.value = "";
  };

  const removeGalleryImage = (index) => {
    setGalleryImages((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
    setGalleryPreviews((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
    setExistingGallery((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  };

  // ── Drag & drop ──
  const [dragOverSlot, setDragOverSlot] = useState(null); // "main" | 0 | 1 | 2 | null

  const handleDragOver = (slot) => (e) => {
    e.preventDefault();
    setDragOverSlot(slot);
  };

  const handleDragLeave = () => setDragOverSlot(null);

  const handleDropMain = (e) => {
    e.preventDefault();
    setDragOverSlot(null);
    setMainImageFile(e.dataTransfer.files?.[0]);
  };

  const handleDropGallery = (index) => (e) => {
    e.preventDefault();
    setDragOverSlot(null);
    setGalleryImageFile(index, e.dataTransfer.files?.[0]);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ── Sauvegarde ──
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (items.length === 0) {
      showToast("Ajoutez au moins un produit au coffret.");
      return;
    }
    if (form.price_mode === "manual" && !form.price) {
      showToast("Indiquez un prix pour ce coffret.");
      return;
    }
    for (const it of items) {
      if (!it.product && !it.customName?.trim()) {
        showToast("Chaque article manuel doit avoir un nom.");
        return;
      }
      if (!it.product && it.customName?.trim() && !it.customPrice) {
        showToast(`Indiquez un prix pour "${it.customName}".`);
        return;
      }
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      if (form.brand_id) fd.append("brand_id", form.brand_id);
      if (form.bundle_category_id)
        fd.append("bundle_category_id", form.bundle_category_id);
      if (form.description) fd.append("description", form.description);
      fd.append("price_mode", form.price_mode);
      if (form.price_mode === "manual") fd.append("price", form.price);
      if (form.promo_price) fd.append("promo_price", form.promo_price);
      if (form.discount_percentage)
        fd.append("discount_percentage", form.discount_percentage);
      if (form.promo_starts_at)
        fd.append("promo_starts_at", form.promo_starts_at);
      if (form.promo_ends_at) fd.append("promo_ends_at", form.promo_ends_at);
      fd.append("stock", form.stock);
      fd.append("is_unavailable", form.is_unavailable ? 1 : 0);

      items.forEach((it, i) => {
        if (it.product) {
          fd.append(`items[${i}][product_id]`, it.product.id);
        } else {
          fd.append(`items[${i}][custom_name]`, it.customName);
          fd.append(`items[${i}][custom_price]`, it.customPrice);
          if (it.customImage) {
            fd.append(`item_image_${i}`, it.customImage);
          } else if (it.existingCustomImage) {
            fd.append(
              `items[${i}][existing_custom_image]`,
              it.existingCustomImage,
            );
          }
        }
        fd.append(`items[${i}][quantity]`, it.quantity);
        fd.append(`items[${i}][is_free]`, it.is_free ? 1 : 0);
      });

      if (mainImage) fd.append("image", mainImage);

      galleryImages.forEach((file, i) => {
        if (file) fd.append(`gallery_image_${i}`, file);
        else if (existingGallery[i])
          fd.append(`existing_image_${i}`, existingGallery[i]);
      });

      if (editId) {
        await updateBundle(editId, fd);
        showToast("Coffret mis à jour avec succès.", "success");
      } else {
        await createBundle(fd);
        showToast("Coffret créé avec succès.", "success");
      }

      setShowForm(false);
      fetchBundles();
    } catch (err) {
      showToast(
        err.response?.data?.message || "Erreur lors de l'enregistrement.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteBundle(id);
      showToast("Coffret supprimé.", "success");
      setDeleteConfirm(null);
      fetchBundles();
    } catch {
      showToast("Erreur lors de la suppression.");
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

      <PageHeader
        title="Coffrets"
        subtitle={meta ? `${meta.total} coffret(s)` : ""}
        action={
          <div className="flex gap-2">
            <Link to="/admin/bundle-categories">
              <Btn ghost>
                <Settings size={14} /> Catégories
              </Btn>
            </Link>
            <Btn onClick={openAdd}>
              <Plus size={14} /> Nouveau coffret
            </Btn>
          </div>
        }
      />
      {/* Recherche & Filtres */}
      <div className="mb-5 space-y-2.5">
        <div className="relative w-full sm:w-56">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Rechercher un coffret..."
            className="pl-9 w-full"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setPage(1);
            }}
            className="flex-1 min-w-[140px] sm:flex-none sm:w-[170px]"
          >
            <option value="">Toutes catégories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>

          <Select
            value={filterBrand}
            onChange={(e) => {
              setFilterBrand(e.target.value);
              setPage(1);
            }}
            className="flex-1 min-w-[140px] sm:flex-none sm:w-[170px]"
          >
            <option value="">Toutes marques</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>

          <Select
            value={filterAvailability}
            onChange={(e) => {
              setFilterAvailability(e.target.value);
              setPage(1);
            }}
            className="flex-1 min-w-[140px] sm:flex-none sm:w-[170px]"
          >
            <option value="">Toute disponibilité</option>
            <option value="available">Disponible</option>
            <option value="unavailable">Indisponible</option>
          </Select>

          {(search || filterBrand || filterCategory || filterAvailability) && (
            <button
              onClick={() => {
                setSearch("");
                setFilterBrand("");
                setFilterCategory("");
                setFilterAvailability("");
                setPage(1);
              }}
              className="text-[12.5px] font-semibold text-gray-400 hover:text-red-500 transition-colors whitespace-nowrap flex-shrink-0 px-1"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <Spinner />
      ) : bundles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 border-2 border-dashed border-gray-200 rounded-2xl">
          <Gift size={40} className="text-gray-300" />
          <p className="text-gray-400 text-[14px]">
            Aucun coffret pour le moment
          </p>
          <button
            onClick={openAdd}
            className="text-[13.5px] font-semibold text-[#1a4731] hover:opacity-70"
          >
            Créer le premier coffret →
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 font-semibold text-gray-500">
                  Coffret
                </th>
                <th className="text-left px-5 py-3 font-semibold text-gray-500">
                  Marque
                </th>
                <th className="text-left px-5 py-3 font-semibold text-gray-500">
                  Prix
                </th>
                <th className="text-left px-5 py-3 font-semibold text-gray-500">
                  Stock
                </th>
                <th className="text-left px-5 py-3 font-semibold text-gray-500">
                  Statut
                </th>
                <th className="text-right px-5 py-3 font-semibold text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {bundles.map((bundle) => (
                <tr
                  key={bundle.id}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {bundle.image ? (
                          <img
                            src={`${STORAGE_URL}/${bundle.image}`}
                            alt=""
                            className="w-full h-full object-contain p-0.5"
                          />
                        ) : (
                          <Gift size={16} className="text-gray-300" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {bundle.name}
                        </p>
                        <p className="text-[11.5px] text-gray-400">
                          {bundle.items_count} produit(s)
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {bundle.brand?.name || "—"}
                  </td>
                  <td className="px-5 py-3 font-semibold text-gray-800">
                    {parseFloat(bundle.price).toFixed(3)} DT
                  </td>
                  <td className="px-5 py-3 text-gray-600">{bundle.stock}</td>
                  <td className="px-5 py-3">
                    {bundle.is_available ? (
                      <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Disponible
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        Indisponible
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => openEdit(bundle)}
                        disabled={loadingEditId === bundle.id}
                        className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 flex items-center justify-center disabled:opacity-60"
                      >
                        {loadingEditId === bundle.id ? (
                          <span className="w-3.5 h-3.5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                        ) : (
                          <Edit2 size={13} />
                        )}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(bundle)}
                        className="w-7 h-7 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 flex items-center justify-center"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {meta && meta.last_page > 1 && (
            <div className="flex justify-center gap-2 py-4 border-t border-gray-100">
              {Array.from({ length: meta.last_page }, (_, i) => i + 1).map(
                (p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-[13px] font-semibold ${
                      p === page
                        ? "bg-[#1a4731] text-white"
                        : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}
            </div>
          )}
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
              Supprimer "{deleteConfirm.name}" ?
            </p>
            <p className="text-[13px] text-gray-500 mb-6">
              Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <Btn ghost onClick={() => setDeleteConfirm(null)}>
                Annuler
              </Btn>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-[13.5px] font-semibold hover:bg-red-600"
              >
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
            className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <p className="text-[16px] font-bold text-gray-900">
                {editId ? "Modifier le coffret" : "Nouveau coffret"}
              </p>
              <button
                onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* ── Infos générales ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label required>Nom du coffret</Label>
                  <Input
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    className="w-full"
                    required
                  />
                </div>
                <div>
                  <Label>Marque</Label>
                  <Select
                    name="brand_id"
                    value={form.brand_id}
                    onChange={handleFormChange}
                    className="w-full"
                  >
                    <option value="">Aucune</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Catégorie de coffret</Label>
                  <Select
                    name="bundle_category_id"
                    value={form.bundle_category_id}
                    onChange={handleFormChange}
                    className="w-full"
                  >
                    <option value="">Aucune</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Label>Description</Label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleFormChange}
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13.5px] text-gray-800 outline-none focus:border-[#1a4731] focus:ring-2 focus:ring-[#1a4731]/10 transition-all resize-none"
                  />
                </div>
              </div>

              {/* ── Images ── */}
              <div>
                <Label>Images du coffret</Label>
                <p className="text-[11.5px] text-gray-400 mt-0.5 mb-2">
                  Cliquez ou glissez-déposez une image dans chaque emplacement
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Image principale */}
                  <div className="relative aspect-square">
                    <label
                      onDragOver={handleDragOver("main")}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDropMain}
                      className={`w-full h-full rounded-xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center gap-1 overflow-hidden bg-gray-50 block transition-colors ${
                        dragOverSlot === "main"
                          ? "border-[#1a4731] bg-[#1a4731]/5"
                          : "border-gray-200 hover:border-[#1a4731]"
                      }`}
                    >
                      {mainImagePreview || existingImage ? (
                        <img
                          src={
                            mainImagePreview ||
                            `${STORAGE_URL}/${existingImage}`
                          }
                          alt=""
                          className="w-full h-full object-contain p-2"
                        />
                      ) : (
                        <>
                          <ImageIcon size={20} className="text-gray-300" />
                          <span className="text-[10.5px] text-gray-400 font-semibold text-center px-2">
                            Image principale
                          </span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleMainImageChange}
                        className="hidden"
                      />
                      <span className="absolute top-1 left-1 bg-[#1a4731] text-white text-[9px] font-bold px-1.5 py-0.5 rounded pointer-events-none">
                        Principale
                      </span>
                    </label>
                    {(mainImagePreview || existingImage) && (
                      <button
                        type="button"
                        onClick={removeMainImage}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
                      >
                        <X size={11} />
                      </button>
                    )}
                  </div>

                  {/* 3 images optionnelles */}
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="relative aspect-square">
                      <label
                        onDragOver={handleDragOver(i)}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDropGallery(i)}
                        className={`w-full h-full rounded-xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center gap-1 overflow-hidden bg-gray-50 block transition-colors ${
                          dragOverSlot === i
                            ? "border-[#1a4731] bg-[#1a4731]/5"
                            : "border-gray-200 hover:border-[#1a4731]"
                        }`}
                      >
                        {galleryPreviews[i] || existingGallery[i] ? (
                          <img
                            src={
                              galleryPreviews[i] ||
                              `${STORAGE_URL}/${existingGallery[i]}`
                            }
                            alt=""
                            className="w-full h-full object-contain p-2"
                          />
                        ) : (
                          <>
                            <Plus size={18} className="text-gray-300" />
                            <span className="text-[10.5px] text-gray-400">
                              Optionnelle
                            </span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleGalleryImageChange(i, e)}
                          className="hidden"
                        />
                      </label>
                      {(galleryPreviews[i] || existingGallery[i]) && (
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(i)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
                        >
                          <X size={11} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Produits du coffret ── */}
              <div>
                <div className="flex items-center justify-between">
                  <Label required>Produits inclus dans le coffret</Label>
                  <button
                    type="button"
                    onClick={addManualItem}
                    className="text-[12px] font-semibold text-[#1a4731] hover:opacity-70"
                  >
                    + Produit manuel
                  </button>
                </div>
                <div className="relative mt-1.5">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <Input
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                    placeholder="Rechercher un produit à ajouter..."
                    className="pl-9 w-full"
                  />
                  {productQuery.trim().length >= 2 && (
                    <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                      {searchingProducts ? (
                        <div className="p-4 text-center text-[13px] text-gray-400">
                          Recherche...
                        </div>
                      ) : productResults.length === 0 ? (
                        <div className="p-4 text-center text-[13px] text-gray-400">
                          Aucun produit disponible trouvé
                        </div>
                      ) : (
                        productResults.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => addProduct(p)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left"
                          >
                            <div className="w-9 h-9 rounded-lg border border-gray-100 bg-gray-50 flex-shrink-0 overflow-hidden">
                              {p.image && (
                                <img
                                  src={`${STORAGE_URL}/${p.image}`}
                                  alt=""
                                  className="w-full h-full object-contain p-0.5"
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12.5px] font-semibold text-gray-800 truncate">
                                {p.name}
                              </p>
                              <p className="text-[11px] text-gray-400">
                                {parseFloat(p.price).toFixed(3)} DT — Stock:{" "}
                                {p.stock}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {items.length > 0 && (
                  <div className="mt-3 border border-gray-100 rounded-xl overflow-hidden">
                    {items.map((item, i) =>
                      item.product ? (
                        <div
                          key={i}
                          className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 last:border-0"
                        >
                          <div className="w-9 h-9 rounded-lg border border-gray-100 bg-gray-50 flex-shrink-0 overflow-hidden">
                            {item.product.image && (
                              <img
                                src={`${STORAGE_URL}/${item.product.image}`}
                                alt=""
                                className="w-full h-full object-contain p-0.5"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12.5px] font-semibold text-gray-800 truncate">
                              {item.product.name}
                            </p>
                            <p className="text-[11px] text-gray-400">
                              {parseFloat(item.product.price).toFixed(3)} DT /
                              unité
                            </p>
                          </div>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) =>
                              updateItemQuantity(
                                i,
                                parseInt(e.target.value, 10) || 1,
                              )
                            }
                            className="w-14 h-8 text-center border border-gray-200 rounded-lg text-[12.5px]"
                          />
                          <label className="flex items-center gap-1.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={item.is_free}
                              onChange={() => toggleItemFree(i)}
                              className="w-3.5 h-3.5 accent-[#1a4731]"
                            />
                            <span className="text-[11.5px] font-semibold text-gray-600">
                              Offert
                            </span>
                          </label>
                          <button
                            type="button"
                            onClick={() => removeItem(i)}
                            className="w-7 h-7 rounded-lg bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ) : (
                        <div
                          key={i}
                          className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-50 last:border-0 bg-amber-50/40"
                        >
                          <span className="text-[10px] font-bold uppercase text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded flex-shrink-0">
                            Manuel
                          </span>
                          <div className="relative w-9 h-9 flex-shrink-0">
                            <label
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => {
                                e.preventDefault();
                                updateManualImage(i, e.dataTransfer.files?.[0]);
                              }}
                              className="w-9 h-9 rounded-lg border border-dashed border-gray-300 bg-white flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#1a4731] transition-colors"
                              title="Importer ou glisser une image"
                            >
                              {item.customImagePreview ? (
                                <img
                                  src={item.customImagePreview}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : item.existingCustomImage ? (
                                <img
                                  src={`${STORAGE_URL}/${item.existingCustomImage}`}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ImageIcon
                                  size={13}
                                  className="text-gray-300"
                                />
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  updateManualImage(i, e.target.files?.[0]);
                                  e.target.value = "";
                                }}
                              />
                            </label>
                            {(item.customImagePreview ||
                              item.existingCustomImage) && (
                              <button
                                type="button"
                                onClick={() => removeManualImage(i)}
                                className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white flex items-center justify-center"
                              >
                                <X size={8} />
                              </button>
                            )}
                          </div>
                          <Input
                            value={item.customName}
                            onChange={(e) =>
                              updateManualField(i, "customName", e.target.value)
                            }
                            placeholder="Nom de produit"
                            className="flex-1 min-w-0 h-8 text-[12.5px]"
                          />
                          <Input
                            type="number"
                            step="0.001"
                            value={item.customPrice}
                            onChange={(e) =>
                              updateManualField(
                                i,
                                "customPrice",
                                e.target.value,
                              )
                            }
                            placeholder="Prix"
                            className="w-24 h-8 text-[12.5px]"
                          />
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) =>
                              updateItemQuantity(
                                i,
                                parseInt(e.target.value, 10) || 1,
                              )
                            }
                            className="w-14 h-8 text-center border border-gray-200 rounded-lg text-[12.5px]"
                          />
                          <label className="flex items-center gap-1.5 cursor-pointer select-none flex-shrink-0">
                            <input
                              type="checkbox"
                              checked={item.is_free}
                              onChange={() => toggleItemFree(i)}
                              className="w-3.5 h-3.5 accent-[#1a4731]"
                            />
                            <span className="text-[11.5px] font-semibold text-gray-600">
                              Offert
                            </span>
                          </label>
                          <button
                            type="button"
                            onClick={() => removeItem(i)}
                            className="w-7 h-7 rounded-lg bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ),
                    )}
                  </div>
                )}

                {items.length > 0 && (
                  <div className="flex items-center gap-4 mt-2 text-[12px]">
                    <span className="text-gray-500">
                      Total produits payants:{" "}
                      <strong className="text-gray-800">
                        {autoPrice.toFixed(3)} DT
                      </strong>
                    </span>
                    {giftValue > 0 && (
                      <span className="text-emerald-600 font-semibold">
                        🎁 Valeur offerte: {giftValue.toFixed(3)} DT
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* ── Prix ── */}
              <div>
                <Label required>Mode de prix</Label>
                <div className="flex gap-3 mt-1.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="price_mode"
                      value="manual"
                      checked={form.price_mode === "manual"}
                      onChange={handleFormChange}
                      className="accent-[#1a4731]"
                    />
                    <span className="text-[13px] text-gray-700">
                      Prix manuel
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="price_mode"
                      value="auto"
                      checked={form.price_mode === "auto"}
                      onChange={handleFormChange}
                      className="accent-[#1a4731]"
                    />
                    <span className="text-[13px] text-gray-700">
                      Calcul automatique
                    </span>
                  </label>
                </div>

                {form.price_mode === "manual" ? (
                  <div className="mt-2 max-w-[200px]">
                    <Input
                      type="number"
                      step="0.001"
                      name="price"
                      value={form.price}
                      onChange={handleFormChange}
                      placeholder="0.000"
                      className="w-full"
                      required
                    />
                  </div>
                ) : (
                  <div className="mt-2 px-4 py-2.5 bg-gray-50 rounded-xl text-[13px] text-gray-600">
                    Prix calculé automatiquement :{" "}
                    <strong className="text-gray-900">
                      {autoPrice.toFixed(3)} DT
                    </strong>{" "}
                    (somme des produits non offerts)
                  </div>
                )}
              </div>

              {/* ── Promotion (toujours disponible, offert ou non) ── */}
              <div>
                <Label>Promotion (optionnelle)</Label>
                <div className="grid grid-cols-2 gap-3 mt-1.5">
                  <Input
                    type="number"
                    step="0.001"
                    name="promo_price"
                    value={form.promo_price}
                    onChange={handleFormChange}
                    placeholder="Prix promo"
                  />
                  <Input
                    type="number"
                    name="discount_percentage"
                    value={form.discount_percentage}
                    onChange={handleFormChange}
                    placeholder="% de remise"
                  />
                  <Input
                    type="datetime-local"
                    name="promo_starts_at"
                    value={form.promo_starts_at}
                    onChange={handleFormChange}
                  />
                  <Input
                    type="datetime-local"
                    name="promo_ends_at"
                    value={form.promo_ends_at}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              {/* ── Stock & disponibilité ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label required>Stock du coffret</Label>
                  <Input
                    type="number"
                    min={0}
                    name="stock"
                    value={form.stock}
                    onChange={handleFormChange}
                    className="w-full"
                    required
                  />
                </div>
                <div className="flex flex-col justify-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_unavailable"
                      checked={form.is_unavailable}
                      onChange={handleFormChange}
                      className="w-4 h-4 accent-[#1a4731]"
                    />
                    <span className="text-[13px] text-gray-700">
                      Marquer comme indisponible manuellement
                    </span>
                  </label>
                  <p className="text-[11px] text-gray-400 mt-1 ml-6">
                    Cochée automatiquement si le stock est à 0 — modifiable
                    librement
                  </p>
                </div>
              </div>

              {/* ── Actions ── */}
              <div className="flex gap-3 pt-2">
                <Btn ghost type="button" onClick={() => setShowForm(false)}>
                  Annuler
                </Btn>
                <Btn type="submit" disabled={saving}>
                  {saving
                    ? "Enregistrement..."
                    : editId
                      ? "Mettre à jour"
                      : "Créer le coffret"}
                </Btn>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
