import { useState, useEffect } from "react";
import { useDebounce } from "../hooks/useDebounce";
import { useSearchParams } from "react-router-dom";
import ProductPreviewModal from "../components/ProductPreviewModal";
import { STORAGE_URL } from "../../config/api";
import ImageDropzone from "../components/ImageDropzone";
import RichTextEditor from "../components/RichTextEditor";
import * as XLSX from "xlsx";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Package,
  ChevronDown,
  ChevronUp,
  Download,
  Upload,
  Eye,
  Copy,
  Check,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
} from "lucide-react";
import {
  getAdminProducts,
  deleteProduct,
  getAdminCategories,
  getAdminBrands,
  createProduct,
  updateProduct,
  importProductsCsv,
  importMainImagesZip,
  importOptionalImagesZip,
  getPromoSection,
  bulkDeleteProducts,
  bulkToggleProducts,
  removePromoCampaignProducts,
} from "../services/adminApi";
import {
  Badge,
  ActionBtn,
  Btn,
  Input,
  Select,
  TableWrap,
  Table,
  TR,
  TD,
  Pagination,
  Spinner,
  PageHeader,
  Label,
  Toast,
} from "../components/AdminShared";

// ── Couleurs prédéfinies ──
const PRESET_COLORS = [
  { name: "Blanc", hex: "#FFFFFF" },
  { name: "Noir", hex: "#000000" },
  { name: "Rouge", hex: "#FF0000" },
  { name: "Bleu", hex: "#0000FF" },
  { name: "Vert", hex: "#008000" },
  { name: "Jaune", hex: "#FFFF00" },
  { name: "Rose", hex: "#FFC0CB" },
  { name: "Rose bébé", hex: "#FFB6C1" },
  { name: "Beige", hex: "#F5F5DC" },
  { name: "Crème", hex: "#FFFDD0" },
  { name: "Marron", hex: "#8B4513" },
  { name: "Gris", hex: "#808080" },
  { name: "Orange", hex: "#FFA500" },
  { name: "Violet", hex: "#800080" },
  { name: "Turquoise", hex: "#40E0D0" },
  { name: "Corail", hex: "#FF7F50" },
  { name: "Lavande", hex: "#E6E6FA" },
  { name: "Bordeaux", hex: "#800020" },
  { name: "Caramel", hex: "#C68642" },
  { name: "Ivoire", hex: "#FFFFF0" },
];

const SIZES = ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];

// Convertit l'ancien format (tableau de chaînes) vers le nouveau format
// (objets {label, stock}) pour les produits créés avant cette fonctionnalité.
const normalizeSizes = (sizes) => {
  if (!Array.isArray(sizes)) return [];
  return sizes.map((s) =>
    typeof s === "string" ? { label: s, stock: 999 } : s,
  );
};

const EMPTY_FORM = {
  name: "",
  slug: "",
  reference: "",
  description: "",
  short_description: "",
  benefits: "",
  usage_tips: "",
  price: "",
  promo_price: "",
  discount_percentage: "",
  stock: "999",
  is_unavailable: false,
  category_id: "",
  category2_id: "",
  display_category1: true,
  display_category2: false,
  brand_id: "",
  is_featured: false,
  is_new: false,
  is_promo: false,
  is_bestseller: false,
  promo_starts_at: "",
  promo_ends_at: "",
  has_sizes: false,
  sizes: [],
  has_colors: false,
  colors: [],
  has_age: false,
  ages: [],
  size_type: "",
  _cmInput: "",
  _ageType: "single",
  _ageUnit: "mois",
  _ageValue: "",
  _ageFrom: "",
  _ageTo: "",
};

const Section = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden mb-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="text-[13px] font-bold text-gray-700">{title}</span>
        {open ? (
          <ChevronUp size={15} className="text-gray-400" />
        ) : (
          <ChevronDown size={15} className="text-gray-400" />
        )}
      </button>
      {open && <div className="p-4 bg-white space-y-4">{children}</div>}
    </div>
  );
};

const Toggle = ({ checked, onChange, label }) => (
  <label className="flex items-center gap-3 cursor-pointer group">
    <div className="relative">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <div
        className={`w-10 h-5 rounded-full transition-colors ${checked ? "bg-[#1a4731]" : "bg-gray-200"}`}
      />
      <div
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-5" : ""}`}
      />
    </div>
    <span className="text-[13px] font-medium text-gray-700 group-hover:text-gray-900">
      {label}
    </span>
  </label>
);

export default function AdminProducts() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [stockFilter, setStock] = useState(searchParams.get("stock") || "");
  const [categoryFilter, setCat] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [badgeFilter, setBadgeFilter] = useState("");
  const [noImageFilter, setNoImageFilter] = useState(false);
  const [withImageFilter, setWithImageFilter] = useState(false);
  const [noBrandFilter, setNoBrandFilter] = useState(false);
  const [noCategoryFilter, setNoCategoryFilter] = useState(false);
  const [missingContentFilter, setMissingContentFilter] = useState("");

  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditP] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [topBrandId, setTopBrandId] = useState("");
  const [previewImg, setPreviewImg] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [toast, setToast] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [imageImportResult, setImageImportResult] = useState(null);

  const [importingMain, setImportingMain] = useState(false);
  const [importingOptional, setImportingOptional] = useState(false);

  const handleImageImportError = (err) => {
    if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
      showToast(
        "L'import prend plus de temps que prévu — vérifiez dans quelques minutes si les images ont bien été assignées.",
        "error",
      );
    } else {
      showToast(
        err.response?.data?.message || "Erreur lors de l'import des images.",
        "error",
      );
    }
  };

  const handleImportMainImages = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportingMain(true);
    try {
      const result = await importMainImagesZip(file);
      setImageImportResult(result);
      fetchProducts();
      showToast(result.message, "success");
    } catch (err) {
      handleImageImportError(err);
    } finally {
      setImportingMain(false);
      e.target.value = "";
    }
  };

  const handleImportOptionalImages = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportingOptional(true);
    try {
      const result = await importOptionalImagesZip(file);
      setImageImportResult(result);
      fetchProducts();
      showToast(result.message, "success");
    } catch (err) {
      handleImageImportError(err);
    } finally {
      setImportingOptional(false);
      e.target.value = "";
    }
  };
  const [previewProduct, setPreviewProduct] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([null, null, null]);
  const [galleryPreviews, setGalleryPreviews] = useState([null, null, null]);
  const [galleryExisting, setGalleryExisting] = useState([null, null, null]);
  const [topPromoIds, setTopPromoIds] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [bulkActing, setBulkActing] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [copiedRef, setCopiedRef] = useState(null);
  const [removingFromCampaign, setRemovingFromCampaign] = useState(false);
  const [badgePicker, setBadgePicker] = useState(null); // { field, label } | null

  const showToast = (message, type = "error") => setToast({ message, type });

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) =>
      prev.size === sortedProducts.length
        ? new Set()
        : new Set(sortedProducts.map((p) => p.id)),
    );
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const handleCopyRef = (ref, id) => {
    navigator.clipboard?.writeText(ref);
    setCopiedRef(id);
    setTimeout(() => setCopiedRef(null), 1500);
  };

  const handleBulkDelete = async () => {
    setBulkActing(true);
    try {
      const result = await bulkDeleteProducts([...selectedIds]);
      showToast(result.message, "success");
      setSelectedIds(new Set());
      fetchProducts();
    } catch (err) {
      showToast(
        err.response?.data?.message || "Erreur lors de la suppression.",
        "error",
      );
    } finally {
      setBulkActing(false);
      setConfirmBulkDelete(false);
    }
  };

  const handleBulkToggle = async (field, value) => {
    setBulkActing(true);
    try {
      const result = await bulkToggleProducts([...selectedIds], field, value);
      showToast(result.message, "success");
      setSelectedIds(new Set());
      fetchProducts();
    } catch (err) {
      showToast(
        err.response?.data?.message || "Erreur lors de la mise à jour.",
        "error",
      );
    } finally {
      setBulkActing(false);
    }
  };

  useEffect(() => {
    getPromoSection()
      .then((data) => setTopPromoIds(data.section?.product_ids || []))
      .catch(() => {});
  }, []);

  // ── Import XLSX/CSV ──
  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    try {
      const result = await importProductsCsv(file);
      setImportResult(result);
      fetchProducts();
      showToast(result.message, "success");
    } catch (err) {
      showToast("Erreur lors de l'importation.", "error");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "reference",
      "name",
      "price",
      "promo_price",
      "promo_percentage",
      "promo_starts_at",
      "promo_ends_at",
      "stock",
      "category",
      "brand",
      "parent_brand",
      "short_description",
      "description",
      "benefits",
      "usage_tips",
      "is_featured",
      "is_new",
      "is_promo",
      "is_bestseller",
      "is_unavailable",
      "image",
      "image_2",
      "image_3",
      "image_4",
      "sizes",
      "colors",
      "ages",
      "ages_colors",
      "color_img_1",
      "color_img_2",
      "color_img_3",
      "color_img_4",
      "color_img_5",
      "color_img_6",
      "color_img_7",
      "color_img_8",
      "color_img_9",
      "color_img_10",
    ];

    const example = [
      "REF-001",
      "Crème hydratante visage SPF50",
      "29,900",
      "",
      "",
      "",
      "",
      "",
      "Visage,Soin",
      "Avène",
      "",
      "Hydratation intense pour peaux sensibles",
      "Description complète du produit...",
      "Hydrate 24h, protège des UV, apaise les rougeurs",
      "Appliquer matin et soir sur peau propre",
      "0",
      "1",
      "0",
      "0",
      "0",
      "https://exemple.com/produit.jpg",
      "",
      "",
      "",
      "S:10,M:5,L:0,XL:20",
      "Rouge:10,Bleu:0,Blanc:5",
      "",
      "",
      "https://exemple.com/rouge.jpg",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, example]);
    ws["!cols"] = headers.map(() => ({ wch: 22 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Produits");

    const instructions = [
      ["Colonne", "Obligatoire", "Description"],
      ["reference", "OUI", "Référence unique du produit (ex: REF-001)"],
      ["name", "OUI", "Nom du produit"],
      ["price", "OUI", "Prix normal en DT — virgule acceptée (ex: 29,900)"],
      [
        "promo_price",
        "NON",
        "Prix promo en DT — virgule acceptée (ex: 19,500) — VIDE si calculé depuis promo_percentage",
      ],
      [
        "promo_percentage",
        "NON",
        "Remise en % (ex: 20) — VIDE si calculé depuis promo_price — Les deux vides = pas de promo",
      ],
      [
        "promo_starts_at",
        "NON",
        "Date début promo (AAAA-MM-JJ HH:MM) — VIDE = promo sans date de début",
      ],
      [
        "promo_ends_at",
        "NON",
        "Date fin promo (AAAA-MM-JJ HH:MM) — VIDE = promo sans date de fin",
      ],
      ["stock", "NON", "Quantité en stock — VIDE = 999 par défaut"],
      [
        "category",
        "OUI",
        "Une ou deux catégories, séparées par une virgule — ex: Visage,Soin",
      ],
      [
        "",
        "",
        "  • La 1ère est la catégorie principale ET celle affichée sur la fiche produit",
      ],
      [
        "",
        "",
        "  • La 2ème est optionnelle, utile pour le filtrage — non affichée par défaut",
      ],
      [
        "",
        "",
        "  • Chaque nom doit correspondre exactement à une catégorie existante",
      ],
      [
        "brand",
        "NON",
        "Nom exact d'une marque OU sous-marque existante — vide si aucune",
      ],
      [
        "parent_brand",
        "NON",
        "Nom de la marque parente, UNIQUEMENT si 'brand' est une sous-marque",
      ],
      ["", "", "  • Ex: brand=Sebiaclear, parent_brand=SVR"],
      [
        "",
        "",
        "  • Utile seulement en cas d'ambiguïté (deux marques ont une sous-marque du même nom)",
      ],
      [
        "",
        "",
        "  • Si vide, la sous-marque est trouvée directement par son nom dans 'brand'",
      ],
      ["short_description", "NON", "Description courte"],
      ["description", "NON", "Description complète"],
      ["benefits", "NON", "Bienfaits du produit"],
      ["usage_tips", "NON", "Conseils d'utilisation"],
      ["is_featured", "NON", "1 = produit vedette, 0 ou vide = non"],
      ["is_new", "NON", "1 = nouveauté, 0 ou vide = non"],
      ["is_promo", "NON", "1 = en promotion, 0 ou vide = non"],
      ["is_bestseller", "NON", "1 = bestseller, 0 ou vide = non"],
      [
        "is_unavailable",
        "NON",
        "1 = produit indisponible, 0 ou vide = disponible",
      ],
      [
        "image",
        "NON — IGNORÉE",
        "Colonne ignorée à l'import. Les images sont ajoutées séparément via 'Importer images (ZIP)'.",
      ],
      [
        "image_2 / image_3 / image_4",
        "NON — IGNORÉES",
        "Colonnes ignorées à l'import, même si remplies. Aucune erreur générée si mal remplies.",
      ],
      [
        "sizes",
        "NON",
        "Format 'Label:Stock' séparés par virgules — ex: S:10,M:5,L:0,XL:20",
      ],
      ["", "", "  • Le stock est propre à chaque taille (pas le stock global)"],
      ["", "", "  • Vide = pas de tailles pour ce produit"],
      [
        "colors",
        "NON",
        "Format 'Nom:Stock' séparés par virgules — ex: Rouge:10,Bleu:0,Blanc:5",
      ],
      [
        "",
        "",
        "  • Le stock est ignoré si le produit a aussi des âges (voir ages_colors)",
      ],
      [
        "ages",
        "NON",
        "Utilisé SEULEMENT si le produit N'A PAS de couleurs — format 'Label:Stock'",
      ],
      ["", "", "  • Ex: 3 mois:10,6 mois:5,3-6 mois:8"],
      [
        "",
        "",
        "  • Le label peut être un âge précis ou une plage (texte libre)",
      ],
      [
        "ages_colors",
        "NON",
        "Utilisé SEULEMENT si le produit a des ÂGES ET des COULEURS ensemble",
      ],
      [
        "",
        "",
        "  • Format: AgeLabel=Couleur:Stock|Couleur:Stock;AgeLabel2=...",
      ],
      ["", "", "  • Ex: 3 mois=Rouge:5|Blanc:0;6 mois=Beige:10|Rose:4"],
      [
        "",
        "",
        "  • Chaque âge peut avoir des couleurs différentes, totalement indépendant",
      ],
      [
        "",
        "",
        "  • Remplit automatiquement 'colors' avec les mêmes noms de couleurs",
      ],
      [
        "color_img_1",
        "NON",
        "Image de la 1ère couleur listée dans 'colors' — URL ou image dans cellule",
      ],
      [
        "color_img_2",
        "NON",
        "Image de la 2ème couleur — même principe — vide si aucune image",
      ],
      [
        "color_img_3 ... color_img_10",
        "NON",
        "Images des couleurs suivantes — même principe",
      ],
      [],
      [
        "📸 COMMENT AJOUTER LES IMAGES (image, image_2, image_3, image_4, color_img_X)",
        "",
        "",
      ],
      ["", "", ""],
      ["Méthode 1 — Image directement dans la cellule (recommandée)", "", ""],
      [
        "  1. Cliquez sur la cellule (ex: colonne 'image' ou 'color_img_1')",
        "",
        "",
      ],
      ["  2. Menu Excel : Insertion → Images → Image dans la cellule", "", ""],
      ["  3. Choisissez votre photo depuis votre ordinateur", "", ""],
      [
        "  → L'image est intégrée dans le fichier, aucun lien nécessaire",
        "",
        "",
      ],
      ["", "", ""],
      ["Méthode 2 — Coller un lien URL dans la cellule", "", ""],
      ["  1. Trouvez l'image sur internet", "", ""],
      ["  2. Clic droit sur l'image → 'Copier l'adresse de l'image'", "", ""],
      [
        "  3. Collez ce lien dans la cellule (ex: https://site.com/produit.jpg)",
        "",
        "",
      ],
      [
        "  → Le lien doit afficher UNIQUEMENT l'image dans un navigateur",
        "",
        "",
      ],
      ["", "", ""],
      [
        "✅ Les deux méthodes peuvent être mélangées dans le même fichier.",
        "",
        "",
      ],
      [],
      ["🎨 COULEURS DISPONIBLES (orthographe exacte requise)", "", ""],
      ["Blanc, Noir, Rouge, Bleu, Vert, Jaune, Rose, Rose bébé", "", ""],
      ["Beige, Crème, Marron, Gris, Orange, Violet, Turquoise", "", ""],
      ["Corail, Lavande, Bordeaux, Caramel, Ivoire", "", ""],
      [
        "→ Respectez l'orthographe exacte (ex: 'Rose bébé' avec accent)",
        "",
        "",
      ],
      [],
      ["💡 EXEMPLE COULEURS", "", ""],
      ["colors = Rouge,Bleu,Blanc", "", ""],
      ["color_img_1 = image du Rouge (URL ou image dans la cellule)", "", ""],
      ["color_img_2 = image du Bleu  (URL ou image dans la cellule)", "", ""],
      ["color_img_3 = (vide) → Blanc sans image associée", "", ""],
      [
        "→ L'ordre des images doit correspondre à l'ordre des couleurs dans 'colors'",
        "",
        "",
      ],
      [],
      ["⚠️ IMPORTANT", "", ""],
      ["- Ne modifiez pas les noms des colonnes (1ère ligne).", "", ""],
      ["- Si stock est vide → 999 unités par défaut.", "", ""],
      [
        "- Les couleurs inconnues reçoivent le code #808080 (gris) par défaut.",
        "",
        "",
      ],
      [
        "- promo_price et promo_percentage : mettez l'un OU l'autre, l'autre sera calculé automatiquement.",
        "",
        "",
      ],
      [
        "- Les dates promo peuvent être vides : la promo sera active sans limite de date.",
        "",
        "",
      ],
    ];

    const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
    wsInstructions["!cols"] = [{ wch: 45 }, { wch: 14 }, { wch: 65 }];
    XLSX.utils.book_append_sheet(wb, wsInstructions, "Instructions");

    XLSX.writeFile(wb, "modele_produits.xlsx");
  };
  useEffect(() => {
    const urlStock = searchParams.get("stock");
    if (urlStock !== null) {
      setStock(urlStock);
      setPage(1);
    }
  }, [searchParams]);
  useEffect(() => {
    fetchProducts();
  }, [
    debouncedSearch,
    stockFilter,
    categoryFilter,
    brandFilter,
    badgeFilter,
    noImageFilter,
    withImageFilter,
    noBrandFilter,
    noCategoryFilter,
    missingContentFilter,
    page,
  ]);

  useEffect(() => {
    Promise.all([getAdminCategories(), getAdminBrands()]).then(
      ([cats, brds]) => {
        setCategories(cats);
        setBrands(brds);
      },
    );
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await getAdminProducts({
        search: debouncedSearch,
        stock: stockFilter,
        category_id: categoryFilter,
        brand_id: brandFilter,
        badge: badgeFilter,
        no_image: noImageFilter ? 1 : "",
        with_image: withImageFilter ? 1 : "",
        no_brand: noBrandFilter ? 1 : "",
        no_category: noCategoryFilter ? 1 : "",
        [missingContentFilter]: missingContentFilter ? 1 : undefined,
        page,
        per_page: 20,
      });
      setProducts(data.data || []);
      setMeta(data.meta || data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const f = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const openAdd = () => {
    setEditP(null);
    setForm(EMPTY_FORM);
    setTopBrandId("");
    setPreviewImg(null);
    setSelectedFile(null);
    setShowForm(true);
    setGalleryFiles([null, null, null]);
    setGalleryPreviews([null, null, null]);
    setGalleryExisting([null, null, null]);
  };
  const openEdit = (p) => {
    setEditP(p); // porte aussi p.promo_campaign, utilisé pour griser les champs
    setForm({
      name: p.name || "",
      slug: p.slug || "",
      reference: p.reference || "",
      description: p.description || "",
      short_description: p.short_description || "",
      benefits: p.benefits || "",
      usage_tips: p.usage_tips || "",
      price: p.price || "",
      promo_price: p.promo_price || "",
      discount_percentage: p.discount_percentage || "",
      stock: p.stock ?? "999",
      is_unavailable: !!p.is_unavailable,
      category_id: p.category_id || "",
      category2_id: p.category2_id || "",
      display_category1: p.display_category1 ?? true,
      display_category2: p.display_category2 ?? false,
      brand_id: p.brand_id || "",
      is_featured: !!p.is_featured,
      is_new: !!p.is_new,
      is_promo: !!p.is_promo,
      is_bestseller: !!p.is_bestseller,
      promo_starts_at: p.promo_starts_at
        ? p.promo_starts_at.substring(0, 16)
        : "",
      promo_ends_at: p.promo_ends_at ? p.promo_ends_at.substring(0, 16) : "",
      has_sizes: !!p.has_sizes,
      sizes: normalizeSizes(p.sizes),
      size_type:
        p.sizes?.length > 0
          ? ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"].includes(
              typeof p.sizes[0] === "string" ? p.sizes[0] : p.sizes[0].label,
            )
            ? "alpha"
            : (typeof p.sizes[0] === "string"
                  ? p.sizes[0]
                  : p.sizes[0].label
                ).startsWith("Taille")
              ? "numeric"
              : "cm"
          : "",
      _cmInput: "",
      has_colors: !!p.has_colors,
      colors: (p.colors || []).map((c) => ({ ...c, stock: c.stock ?? 999 })),
      has_age: !!p.has_age,
      ages: p.ages || [],
      _ageType: "single",
      _ageUnit: "mois",
      _ageValue: "",
      _ageFrom: "",
      _ageTo: "",
    });

    // Résout la marque/sous-marque actuelle du produit
    const currentBrand = brands.find((b) => b.id === p.brand_id);
    setTopBrandId(
      currentBrand?.parent_id
        ? String(currentBrand.parent_id)
        : p.brand_id
          ? String(p.brand_id)
          : "",
    );

    setPreviewImg(p.image ? `${STORAGE_URL}/${p.image}` : null);
    const existing = p.images || [];
    setGalleryExisting([
      existing[0] || null,
      existing[1] || null,
      existing[2] || null,
    ]);
    setGalleryPreviews([
      existing[0] ? `${STORAGE_URL}/${existing[0]}` : null,
      existing[1] ? `${STORAGE_URL}/${existing[1]}` : null,
      existing[2] ? `${STORAGE_URL}/${existing[2]}` : null,
    ]);
    setGalleryFiles([null, null, null]);
    setSelectedFile(null);
    setShowForm(true);
  };

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setPreviewImg(URL.createObjectURL(file));
  };
  const handleGalleryFileSelect = (idx, file) => {
    const newFiles = [...galleryFiles];
    newFiles[idx] = file;
    setGalleryFiles(newFiles);

    const newPreviews = [...galleryPreviews];
    newPreviews[idx] = URL.createObjectURL(file);
    setGalleryPreviews(newPreviews);
  };

  const handleGalleryClear = (idx) => {
    const newFiles = [...galleryFiles];
    newFiles[idx] = null;
    setGalleryFiles(newFiles);

    const newPreviews = [...galleryPreviews];
    newPreviews[idx] = null;
    setGalleryPreviews(newPreviews);

    const newExisting = [...galleryExisting];
    newExisting[idx] = null;
    setGalleryExisting(newExisting);
  };
  const handleClearImage = () => {
    setPreviewImg(null);
    setSelectedFile(null);
  };

  const toggleSize = (label) => {
    const sizes = form.sizes || [];
    const exists = sizes.find((s) => s.label === label);
    f(
      "sizes",
      exists
        ? sizes.filter((s) => s.label !== label)
        : [...sizes, { label, stock: 999 }],
    );
  };

  const updateSizeStock = (label, stock) => {
    f(
      "sizes",
      (form.sizes || []).map((s) =>
        s.label === label
          ? { ...s, stock: Math.max(0, parseInt(stock, 10) || 0) }
          : s,
      ),
    );
  };

  const addCustomSize = (label) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    const sizes = form.sizes || [];
    if (sizes.find((s) => s.label === trimmed)) return;
    f("sizes", [...sizes, { label: trimmed, stock: 999 }]);
  };

  const toggleColor = (color) => {
    const colors = form.colors || [];
    const exists = colors.find((c) => c.hex === color.hex);
    f(
      "colors",
      exists
        ? colors.filter((c) => c.hex !== color.hex)
        : [...colors, { ...color, image: null, stock: 999 }],
    );
  };

  const updateColorName = (idx, name) => {
    const colors = [...(form.colors || [])];
    colors[idx] = { ...colors[idx], name };
    f("colors", colors);
  };

  const updateColorImage = (idx, file) => {
    const colors = [...(form.colors || [])];
    colors[idx] = { ...colors[idx], image: file };
    f("colors", colors);
  };

  const updateColorStock = (idx, stock) => {
    const colors = [...(form.colors || [])];
    colors[idx] = {
      ...colors[idx],
      stock: Math.max(0, parseInt(stock, 10) || 0),
    };
    f("colors", colors);
  };

  const buildAgeLabel = () => {
    const unit = form._ageUnit;
    if (form._ageType === "range") {
      const from = form._ageFrom?.trim();
      const to = form._ageTo?.trim();
      if (!from || !to) return null;
      return `${from}-${to} ${unit}`;
    }
    const val = form._ageValue?.trim();
    if (!val) return null;
    return `${val} ${unit}`;
  };

  const addAge = () => {
    const label = buildAgeLabel();
    if (!label) return;
    const ages = form.ages || [];
    if (ages.find((a) => a.label === label)) {
      f("_ageValue", "");
      f("_ageFrom", "");
      f("_ageTo", "");
      return;
    }
    const base = {
      label,
      type: form._ageType,
      unit: form._ageUnit,
      ...(form._ageType === "range"
        ? { from: form._ageFrom.trim(), to: form._ageTo.trim() }
        : { value: form._ageValue.trim() }),
    };
    const newAge = form.has_colors
      ? { ...base, colors: [] } // aucune couleur activée par défaut — flexible
      : { ...base, stock: 999 };
    f("ages", [...ages, newAge]);
    f("_ageValue", "");
    f("_ageFrom", "");
    f("_ageTo", "");
  };

  const removeAge = (idx) => {
    f(
      "ages",
      (form.ages || []).filter((_, i) => i !== idx),
    );
  };

  const updateAgeStock = (idx, stock) => {
    const ages = [...(form.ages || [])];
    ages[idx] = { ...ages[idx], stock: Math.max(0, parseInt(stock, 10) || 0) };
    f("ages", ages);
  };

  // Active/désactive une couleur précise pour un âge précis — indépendant
  // des autres âges, chaque âge garde sa propre liste de couleurs.
  const toggleAgeColor = (ageIdx, colorName) => {
    const ages = [...(form.ages || [])];
    const age = { ...ages[ageIdx] };
    const colors = [...(age.colors || [])];
    const cIdx = colors.findIndex((c) => c.name === colorName);
    if (cIdx >= 0) {
      colors.splice(cIdx, 1);
    } else {
      colors.push({ name: colorName, stock: 999 });
    }
    age.colors = colors;
    ages[ageIdx] = age;
    f("ages", ages);
  };

  const updateAgeColorStock = (ageIdx, colorName, stock) => {
    const ages = [...(form.ages || [])];
    const age = { ...ages[ageIdx] };
    const colors = [...(age.colors || [])];
    const cIdx = colors.findIndex((c) => c.name === colorName);
    if (cIdx >= 0) {
      colors[cIdx] = {
        ...colors[cIdx],
        stock: Math.max(0, parseInt(stock, 10) || 0),
      };
      age.colors = colors;
      ages[ageIdx] = age;
      f("ages", ages);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!form.reference || !form.reference.trim()) {
      showToast("La référence du produit est obligatoire.", "error");
      return;
    }

    if (
      form.category2_id &&
      String(form.category2_id) === String(form.category_id)
    ) {
      showToast(
        "La catégorie secondaire doit être différente de la catégorie principale.",
        "error",
      );
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        // Ignorer les champs internes qui ne vont pas en base
        if (
          k === "_cmInput" ||
          k === "size_type" ||
          k === "_ageType" ||
          k === "_ageUnit" ||
          k === "_ageValue" ||
          k === "_ageFrom" ||
          k === "_ageTo"
        )
          return;

        if (k === "sizes") {
          fd.append("sizes", JSON.stringify(v));
        } else if (k === "ages") {
          fd.append("ages", JSON.stringify(v));
        } else if (k === "colors") {
          fd.append(
            "colors",
            JSON.stringify(v.map(({ image, ...rest }) => rest)),
          );
          v.forEach((color, idx) => {
            if (color.image instanceof File)
              fd.append(`color_image_${idx}`, color.image);
          });
        } else if (typeof v === "boolean") {
          fd.append(k, v ? "1" : "0");
        } else if (v !== "" && v !== null && v !== undefined) {
          fd.append(k, v);
        }
      });
      // Images supplémentaires (galerie)
      for (let i = 0; i < 3; i++) {
        if (galleryFiles[i]) {
          fd.append(`gallery_image_${i}`, galleryFiles[i]);
        } else if (galleryExisting[i]) {
          fd.append(`existing_image_${i}`, galleryExisting[i]);
        }
      }

      if (selectedFile) fd.append("image", selectedFile);

      editProduct
        ? await updateProduct(editProduct.id, fd)
        : await createProduct(fd);
      setShowForm(false);
      fetchProducts();
      showToast(
        editProduct
          ? "Produit modifié avec succès."
          : "Produit créé avec succès.",
        "success",
      );
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors?.reference)
        showToast("Cette référence est déjà utilisée.", "error");
      else if (errors?.slug) showToast("Ce slug est déjà utilisé.", "error");
      else
        showToast(
          err.response?.data?.message || "Erreur lors de l'enregistrement.",
          "error",
        );
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveFromCampaign = async () => {
    if (!editProduct?.promo_campaign) return;
    setRemovingFromCampaign(true);
    try {
      await removePromoCampaignProducts(editProduct.promo_campaign.id, [
        editProduct.id,
      ]);
      showToast("Produit retiré de la campagne.", "success");
      // Le produit n'appartient plus à aucune campagne dans le formulaire
      // ouvert : on nettoie localement pour dégriser les champs promo.
      setEditP((prev) => (prev ? { ...prev, promo_campaign: null } : prev));
    } catch (err) {
      showToast(
        err.response?.data?.message || "Erreur lors du retrait.",
        "error",
      );
    } finally {
      setRemovingFromCampaign(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Supprimer ce produit ?")) return;
    await deleteProduct(id);
    fetchProducts();
    showToast("Produit supprimé.", "success");
  };

  const sortedProducts = (() => {
    if (!sortField) return products;
    const arr = [...products];
    arr.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (sortField === "price" || sortField === "stock") {
        valA = parseFloat(valA) || 0;
        valB = parseFloat(valB) || 0;
      }
      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  })();

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Résultat import */}
      {importResult && importResult.errors?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[13px] font-bold text-amber-700">
              {importResult.imported} importé(s) — {importResult.errors.length}{" "}
              erreur(s)
            </p>
            <button
              onClick={() => setImportResult(null)}
              className="text-amber-500 hover:text-amber-700"
            >
              <X size={14} />
            </button>
          </div>
          <ul className="space-y-1">
            {importResult.errors.map((err, i) => (
              <li key={i} className="text-[12.5px] text-amber-600">
                • {err}
              </li>
            ))}
          </ul>
        </div>
      )}

      {imageImportResult && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[13px] font-bold text-blue-700">
              {imageImportResult.message}
            </p>
            <button
              onClick={() => setImageImportResult(null)}
              className="text-blue-500 hover:text-blue-700"
            >
              <X size={14} />
            </button>
          </div>
          {imageImportResult.unmatched_files?.length > 0 && (
            <p className="text-[12px] text-blue-600">
              Images du ZIP sans produit correspondant (à vérifier) :{" "}
              {imageImportResult.unmatched_files.join(", ")}
              {imageImportResult.unmatched_count >
                imageImportResult.unmatched_files.length && "…"}
            </p>
          )}
        </div>
      )}

      <PageHeader
        title="Produits"
        subtitle={`${meta.total ?? 0} produits dans le catalogue`}
      />

      {/* Barre d'outils — import / export / sélection en masse */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mr-1">
            Catalogue
          </span>
          <Btn ghost onClick={handleDownloadTemplate}>
            <Download size={14} /> Modèle CSV
          </Btn>
          <label className="inline-flex items-center gap-2 px-4 py-2 h-9 rounded-lg text-[13.5px] font-semibold bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
            <Upload size={14} />
            {importing ? "Importation..." : "Importer CSV"}
            <input
              type="file"
              accept=".xlsx,.csv"
              className="hidden"
              onChange={handleImport}
              disabled={importing}
            />
          </label>
          <Btn onClick={openAdd}>
            <Plus size={14} /> Nouveau produit
          </Btn>

          <div className="w-px h-6 bg-gray-200 mx-1" />

          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mr-1">
            Images
          </span>
          <label
            className="inline-flex items-center gap-2 px-4 py-2 h-9 rounded-lg text-[13.5px] font-semibold bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
            title="ZIP contenant un dossier 'Dossier1' avec les images principales, nommées nom-ref.webp"
          >
            <Upload size={14} />
            {importingMain ? "Import en cours..." : "Principales (ZIP)"}
            <input
              type="file"
              accept=".zip"
              className="hidden"
              onChange={handleImportMainImages}
              disabled={importingMain}
            />
          </label>
          <label
            className="inline-flex items-center gap-2 px-4 py-2 h-9 rounded-lg text-[13.5px] font-semibold bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
            title="ZIP contenant un dossier 'Dossier1' avec les images optionnelles, nommées nom-ref.webp"
          >
            <Upload size={14} />
            {importingOptional ? "Import en cours..." : "Optionnelles (ZIP)"}
            <input
              type="file"
              accept=".zip"
              className="hidden"
              onChange={handleImportOptionalImages}
              disabled={importingOptional}
            />
          </label>

          <div className="w-px h-6 bg-gray-200 mx-1" />

          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mr-1">
            Badges en masse
          </span>
          <Btn
            ghost
            onClick={() =>
              setBadgePicker({ field: "is_featured", label: "Vedette" })
            }
          >
            Choisir les vedettes
          </Btn>
          <Btn
            ghost
            onClick={() =>
              setBadgePicker({ field: "is_new", label: "Nouveau" })
            }
          >
            Choisir les nouveautés
          </Btn>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-5">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[200px] max-w-[280px]">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Nom, référence..."
              className="pl-9 w-full h-9"
            />
          </div>

          <Select
            value={categoryFilter}
            onChange={(e) => {
              setCat(e.target.value);
              setPage(1);
            }}
            className="h-9 w-[180px] flex-shrink-0"
          >
            <option value="">Toutes les catégories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>

          <BrandCombobox
            brands={brands}
            value={brandFilter}
            onChange={(v) => {
              setBrandFilter(v);
              setPage(1);
            }}
          />

          <Select
            value={stockFilter}
            onChange={(e) => {
              setStock(e.target.value);
              setPage(1);
            }}
            className="h-9 w-[160px] flex-shrink-0"
          >
            <option value="">Tous les stocks</option>
            <option value="low">Stock faible (≤5)</option>
            <option value="out">Rupture de stock</option>
          </Select>

          <Select
            value={badgeFilter}
            onChange={(e) => {
              setBadgeFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 w-[150px] flex-shrink-0"
          >
            <option value="">Tous les badges</option>
            <option value="featured">Vedette</option>
            <option value="new">Nouveau</option>
            <option value="promo">Promo</option>
            <option value="bestseller">Bestseller</option>
          </Select>

          <Select
            value={missingContentFilter}
            onChange={(e) => {
              setMissingContentFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 w-[190px] flex-shrink-0"
          >
            <option value="">Contenu — tous</option>
            <option value="missing_description">Sans description</option>
            <option value="missing_short_description">Sans desc. courte</option>
            <option value="missing_benefits">Sans bienfaits</option>
            <option value="missing_usage_tips">Sans conseils</option>
            <option value="missing_all_content">Sans aucun des 4</option>
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mr-1">
            Repérer les fiches incomplètes
          </span>
          {[
            {
              checked: withImageFilter,
              set: setWithImageFilter,
              label: "Avec image",
            },
            {
              checked: noImageFilter,
              set: setNoImageFilter,
              label: "Sans image",
            },
            {
              checked: noBrandFilter,
              set: setNoBrandFilter,
              label: "Sans marque",
            },
            {
              checked: noCategoryFilter,
              set: setNoCategoryFilter,
              label: "Sans catégorie",
            },
          ].map(({ checked, set, label }) => (
            <label
              key={label}
              className="flex items-center gap-2 px-3 h-8 rounded-lg border border-gray-200 bg-gray-50 cursor-pointer flex-shrink-0 hover:bg-gray-100 transition-colors"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => {
                  set(e.target.checked);
                  setPage(1);
                }}
                className="w-3.5 h-3.5 accent-[#1a4731]"
              />
              <span className="text-[12.5px] text-gray-600 font-medium whitespace-nowrap">
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Barre d'actions groupées */}
      {selectedIds.size > 0 && (
        <div className="sticky top-2 z-30 mb-4 flex flex-col sm:flex-row sm:items-center gap-3 bg-[#0f2a1e] text-white rounded-2xl px-4 sm:px-5 py-3 shadow-lg">
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <span className="text-[13px] font-semibold whitespace-nowrap">
              {selectedIds.size} produit(s) sélectionné(s)
            </span>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="sm:hidden text-white/60 hover:text-white transition-colors p-1"
            >
              <X size={16} />
            </button>
          </div>
          <div className="hidden sm:block h-5 w-px bg-white/20" />
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleBulkToggle("is_featured", true)}
              disabled={bulkActing}
              className="text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              + Vedette
            </button>
            <button
              onClick={() => handleBulkToggle("is_new", true)}
              disabled={bulkActing}
              className="text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              + Nouveau
            </button>
            <button
              onClick={() => handleBulkToggle("is_promo", true)}
              disabled={bulkActing}
              className="text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              + Promo
            </button>
            <button
              onClick={() => handleBulkToggle("is_unavailable", true)}
              disabled={bulkActing}
              className="text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              Marquer indisponible
            </button>
            <button
              onClick={() => setConfirmBulkDelete(true)}
              disabled={bulkActing}
              className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-red-500/90 hover:bg-red-500 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              <Trash2 size={13} /> Supprimer
            </button>
            <div className="hidden sm:block h-5 w-px bg-white/20 mx-1" />
            <button
              onClick={() => setSelectedIds(new Set())}
              className="hidden sm:flex items-center justify-center w-7 h-7 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
              title="Désélectionner tout"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Confirmation suppression groupée */}
      {confirmBulkDelete && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)" }}
        >
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <h3 className="text-[15px] font-bold text-gray-900 text-center mb-2">
              Supprimer {selectedIds.size} produit(s) ?
            </h3>
            <p className="text-[13px] text-gray-400 text-center mb-6">
              Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmBulkDelete(false)}
                disabled={bulkActing}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-[13.5px] font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkActing}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-[13.5px] font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {bulkActing ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <TableWrap className="shadow-sm">
        {loading ? (
          <Spinner />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={
                        sortedProducts.length > 0 &&
                        selectedIds.size === sortedProducts.length
                      }
                      onChange={toggleSelectAll}
                      className="w-4 h-4 accent-[#1a4731] cursor-pointer"
                    />
                  </th>
                  {[
                    { label: "Produit", field: null },
                    { label: "Réf.", field: null },
                    { label: "Catégorie", field: null },
                    { label: "Marque", field: null },
                    { label: "Prix", field: "price" },
                    { label: "Stock", field: "stock" },
                    { label: "Badges", field: null },
                    { label: "Modifié le", field: "updated_at" },
                    { label: "Actions", field: null },
                  ].map(({ label, field }) => (
                    <th
                      key={label}
                      onClick={() => field && handleSort(field)}
                      className={`text-left px-3 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wide ${field ? "cursor-pointer select-none hover:text-gray-600" : ""}`}
                    >
                      <span className="flex items-center gap-1">
                        {label}
                        {field &&
                          (sortField === field ? (
                            sortDir === "asc" ? (
                              <ArrowUp size={12} />
                            ) : (
                              <ArrowDown size={12} />
                            )
                          ) : (
                            <ChevronsUpDown
                              size={12}
                              className="text-gray-300"
                            />
                          ))}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedProducts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="text-center py-10 text-gray-400 text-[13px]"
                    >
                      Aucun produit
                    </td>
                  </tr>
                ) : (
                  sortedProducts.map((p) => {
                    const isOut = p.stock === 0 || p.is_unavailable;
                    const isLow = !isOut && p.stock <= 5;
                    return (
                      <tr
                        key={p.id}
                        className={`border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors ${
                          isOut ? "bg-red-50/40" : isLow ? "bg-amber-50/40" : ""
                        }`}
                      >
                        <td className="px-3 py-2.5">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(p.id)}
                            onChange={() => toggleSelect(p.id)}
                            className="w-4 h-4 accent-[#1a4731] cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-3">
                            {p.image ? (
                              <img
                                src={`${STORAGE_URL}/p.image}`}
                                alt=""
                                className="w-10 h-10 rounded-xl object-cover border border-gray-100 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                                <Package size={16} className="text-gray-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-[13px] max-w-[180px] truncate">
                                {p.name}
                              </p>
                              {p.slug && (
                                <p className="text-[11px] text-gray-400 truncate max-w-[180px]">
                                  {p.slug}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <button
                            onClick={() => handleCopyRef(p.reference, p.id)}
                            className="flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-[#1a4731] transition-colors"
                            title="Copier la référence"
                          >
                            {p.reference || "—"}
                            {p.reference &&
                              (copiedRef === p.id ? (
                                <Check size={11} className="text-emerald-500" />
                              ) : (
                                <Copy size={11} className="text-gray-300" />
                              ))}
                          </button>
                        </td>
                        <td className="px-3 py-2.5 text-[13px]">
                          {p.category?.name || "—"}
                          {p.category2?.name && `, ${p.category2.name}`}
                        </td>
                        <td className="px-3 py-2.5 text-[13px]">
                          {p.brand?.parent ? (
                            <span>
                              <span className="text-gray-400">
                                {p.brand.parent.name}
                              </span>
                              <span className="text-gray-300 mx-1">/</span>
                              <span className="font-medium">
                                {p.brand.name}
                              </span>
                            </span>
                          ) : (
                            p.brand?.name || "—"
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <p className="font-bold text-[#1a4731] text-[13px]">
                            {parseFloat(p.price).toFixed(3).replace(".", ",")}{" "}
                            DT
                          </p>
                          {p.promo_price && (
                            <p className="text-[11.5px] text-red-500">
                              {parseFloat(p.promo_price)
                                .toFixed(3)
                                .replace(".", ",")}{" "}
                              DT
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          {p.is_unavailable ? (
                            <Badge type="danger">Indisponible</Badge>
                          ) : (
                            <Badge
                              type={
                                p.stock === 0
                                  ? "danger"
                                  : p.stock <= 5
                                    ? "warning"
                                    : "success"
                              }
                            >
                              {p.stock === 0 ? "Rupture" : `${p.stock}`}
                            </Badge>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            {p.is_featured && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#fffbeb] text-[#92660a] border border-[#fde68a] rounded">
                                Vedette
                              </span>
                            )}
                            {p.is_new && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0] rounded">
                                Nouveau
                              </span>
                            )}
                            {p.is_promo && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#fefce8] text-[#854d0e] border border-[#fef08a] rounded">
                                Promo
                              </span>
                            )}
                            {topPromoIds.includes(p.id) && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-purple-50 text-purple-600 border border-purple-200 rounded">
                                Top Promo
                              </span>
                            )}
                            {p.is_bestseller && (
                              <span
                                className="text-[10px] font-bold px-1.5 py-0.5 bg-[#f5f5dc] text-[#713f12] border border-[#d6c896] rounded"
                                title="Bestseller (calculé automatiquement sur les ventes réelles)"
                              >
                                Best
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-[12px] text-gray-400">
                          {new Date(p.updated_at).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex gap-1.5">
                            <ActionBtn
                              type="info"
                              onClick={() => setPreviewProduct(p)}
                              title="Voir le produit"
                            >
                              <Eye size={13} />
                            </ActionBtn>
                            <ActionBtn
                              type="info"
                              onClick={() => openEdit(p)}
                              title="Modifier"
                            >
                              <Edit2 size={13} />
                            </ActionBtn>
                            <ActionBtn
                              type="danger"
                              onClick={() => handleDelete(p.id)}
                              title="Supprimer"
                            >
                              <Trash2 size={13} />
                            </ActionBtn>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
        <Pagination meta={meta} page={page} setPage={setPage} />
      </TableWrap>

      {/* FORMULAIRE */}
      {showForm && (
        <div
          className="fixed inset-0 z-[999] flex items-start justify-center p-0 sm:p-4 overflow-y-auto"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)" }}
        >
          <div className="bg-white rounded-none sm:rounded-2xl w-full max-w-4xl min-h-screen sm:min-h-0 sm:my-4 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100 rounded-t-2xl">
              <div>
                <h2 className="text-[16px] font-bold text-gray-900">
                  {editProduct ? "Modifier le produit" : "Nouveau produit"}
                </h2>
                <p className="text-[12px] text-gray-400 mt-0.5">
                  {editProduct
                    ? `Modification de "${editProduct.name}"`
                    : "Remplissez les informations du produit"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* GAUCHE 2/3 */}
                <div className="lg:col-span-2">
                  {/* Informations générales */}
                  <Section title="Informations générales">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="col-span-1 sm:col-span-2">
                        <Label>Nom du produit *</Label>
                        <Input
                          value={form.name}
                          onChange={(e) => f("name", e.target.value)}
                          placeholder="Ex: Crème hydratante visage SPF50"
                          className="w-full"
                          required
                        />
                      </div>
                      <div>
                        <Label>Slug (URL)</Label>
                        <Input
                          value={form.slug}
                          onChange={(e) => f("slug", e.target.value)}
                          placeholder="creme-hydratante-spf50"
                          className="w-full"
                        />
                        <p className="text-[11px] text-gray-400 mt-1">
                          Laissez vide pour générer automatiquement
                        </p>
                      </div>
                      <div>
                        <Label>Référence produit *</Label>
                        <Input
                          value={form.reference}
                          onChange={(e) => f("reference", e.target.value)}
                          placeholder="REF-2024-001"
                          className="w-full"
                          required
                        />
                      </div>
                      <div>
                        <Label>Catégorie *</Label>
                        <Select
                          value={form.category_id}
                          onChange={(e) => {
                            const val = e.target.value;
                            f("category_id", val);
                            if (
                              form.category2_id &&
                              String(form.category2_id) === String(val)
                            ) {
                              f("category2_id", "");
                            }
                          }}
                          className="w-full"
                          required
                        >
                          <option value="">Sélectionner...</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </Select>
                        <label className="flex items-center gap-2 mt-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.display_category1}
                            onChange={(e) =>
                              f("display_category1", e.target.checked)
                            }
                            className="w-4 h-4 accent-[#1a4731]"
                          />
                          <span className="text-[12px] text-gray-600">
                            Afficher sous l'image principale de la fiche produit
                          </span>
                        </label>
                      </div>
                      <div>
                        <Label>Catégorie secondaire (optionnel)</Label>
                        <Select
                          value={form.category2_id}
                          onChange={(e) => f("category2_id", e.target.value)}
                          className="w-full"
                        >
                          <option value="">Aucune</option>
                          {categories
                            .filter(
                              (c) => String(c.id) !== String(form.category_id),
                            )
                            .map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                        </Select>
                        <p className="text-[11px] text-gray-400 mt-1">
                          Ce produit apparaîtra aussi dans cette 2ᵉ catégorie
                          (et ses sous-catégories) sur le site public.
                        </p>
                        {form.category2_id && (
                          <label className="flex items-center gap-2 mt-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={form.display_category2}
                              onChange={(e) =>
                                f("display_category2", e.target.checked)
                              }
                              className="w-4 h-4 accent-[#1a4731]"
                            />
                            <span className="text-[12px] text-gray-600">
                              Afficher sous l'image principale de la fiche
                              produit
                            </span>
                          </label>
                        )}
                      </div>
                      <div>
                        <Label>Marque</Label>
                        <Select
                          value={topBrandId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTopBrandId(val);
                            f("brand_id", val);
                          }}
                          className="w-full"
                        >
                          <option value="">Aucune marque</option>
                          {brands
                            .filter((b) => !b.parent_id)
                            .map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.name}
                              </option>
                            ))}
                        </Select>
                      </div>
                      {brands.some(
                        (b) => String(b.parent_id) === String(topBrandId),
                      ) && (
                        <div>
                          <Label>Sous-marque (optionnel)</Label>
                          <Select
                            value={
                              String(form.brand_id) !== String(topBrandId)
                                ? form.brand_id
                                : ""
                            }
                            onChange={(e) =>
                              f("brand_id", e.target.value || topBrandId)
                            }
                            className="w-full"
                          >
                            <option value="">
                              Aucune — marque principale uniquement
                            </option>
                            {brands
                              .filter(
                                (b) =>
                                  String(b.parent_id) === String(topBrandId),
                              )
                              .map((b) => (
                                <option key={b.id} value={b.id}>
                                  {b.name}
                                </option>
                              ))}
                          </Select>
                        </div>
                      )}
                    </div>
                  </Section>

                  {/* Tarification & Stock */}
                  <Section title="Tarification & Stock">
                    {editProduct?.promo_campaign && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl mb-1">
                        <div>
                          <p className="text-[12.5px] font-bold text-amber-800">
                            Ce produit appartient à la campagne "
                            {editProduct.promo_campaign.name}"
                          </p>
                          <p className="text-[11.5px] text-amber-600 mt-0.5">
                            -{editProduct.promo_campaign.discount_percentage}% ·{" "}
                            {editProduct.promo_campaign.starts_at
                              ? new Date(
                                  editProduct.promo_campaign.starts_at.replace(
                                    " ",
                                    "T",
                                  ),
                                ).toLocaleDateString("fr-FR", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "sans date de début"}{" "}
                            →{" "}
                            {editProduct.promo_campaign.ends_at
                              ? new Date(
                                  editProduct.promo_campaign.ends_at.replace(
                                    " ",
                                    "T",
                                  ),
                                ).toLocaleDateString("fr-FR", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "sans date de fin"}
                          </p>
                          {!editProduct.promo_campaign.is_active && (
                            <p className="text-[11px] text-gray-500 mt-1">
                              Campagne actuellement désactivée — ce produit
                              n'affiche pas de promotion pour le moment.
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveFromCampaign}
                          disabled={removingFromCampaign}
                          className="flex-shrink-0 flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-amber-300 text-amber-700 text-[12px] font-semibold hover:bg-amber-100 transition-colors disabled:opacity-50"
                        >
                          {removingFromCampaign ? (
                            <span className="w-3.5 h-3.5 border-2 border-amber-300 border-t-amber-700 rounded-full animate-spin" />
                          ) : (
                            <X size={13} />
                          )}
                          Retirer de cette campagne
                        </button>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <Label>Prix (DT) *</Label>
                        <Input
                          type="number"
                          value={form.price}
                          onChange={(e) => {
                            f("price", e.target.value);
                            const price = parseFloat(e.target.value) || 0;
                            const promo = parseFloat(form.promo_price) || 0;
                            if (price > 0 && promo > 0)
                              f(
                                "discount_percentage",
                                Math.round(((price - promo) / price) * 100),
                              );
                          }}
                          placeholder="0.000"
                          className="w-full"
                          required
                        />
                      </div>
                      <div>
                        <Label>Prix promo (DT)</Label>
                        <Input
                          type="number"
                          disabled={!!editProduct?.promo_campaign}
                          className={
                            editProduct?.promo_campaign
                              ? "w-full bg-gray-50 text-gray-400 cursor-not-allowed"
                              : "w-full"
                          }
                          value={form.promo_price}
                          onChange={(e) => {
                            const promo = parseFloat(e.target.value) || 0;
                            const price = parseFloat(form.price) || 0;
                            f("promo_price", e.target.value);
                            if (price > 0 && promo > 0) {
                              f(
                                "discount_percentage",
                                Math.round(((price - promo) / price) * 100),
                              );
                              f("is_promo", true);
                            } else {
                              f("discount_percentage", "");
                              f("is_promo", false);
                            }
                          }}
                          placeholder="0.000"
                        />
                      </div>
                      <div>
                        <Label>Remise (%)</Label>
                        <Input
                          type="number"
                          disabled={!!editProduct?.promo_campaign}
                          value={form.discount_percentage}
                          onChange={(e) => {
                            const discount = parseFloat(e.target.value) || 0;
                            const price = parseFloat(form.price) || 0;
                            f("discount_percentage", e.target.value);
                            if (price > 0 && discount > 0) {
                              f(
                                "promo_price",
                                (price - (price * discount) / 100).toFixed(3),
                              );
                              f("is_promo", true);
                            } else {
                              f("promo_price", "");
                              f("is_promo", false);
                            }
                          }}
                          placeholder="0"
                          className={
                            editProduct?.promo_campaign
                              ? "w-full bg-gray-50 text-gray-400 cursor-not-allowed"
                              : "w-full"
                          }
                        />
                      </div>

                      {/* Stock + Indisponible */}
                      <div>
                        <Label>Stock *</Label>
                        <Input
                          type="number"
                          value={form.stock}
                          onChange={(e) => f("stock", e.target.value)}
                          placeholder="999"
                          className="w-full"
                          required
                        />
                        <label className="flex items-center gap-2 mt-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.is_unavailable}
                            onChange={(e) =>
                              f("is_unavailable", e.target.checked)
                            }
                            className="w-4 h-4 accent-red-500"
                          />
                          <span className="text-[12px] text-red-500 font-medium">
                            Produit indisponible (rupture)
                          </span>
                        </label>
                      </div>

                      {/* Début promo */}
                      <div>
                        <Label>Début de la promotion</Label>
                        <input
                          type="datetime-local"
                          disabled={!!editProduct?.promo_campaign}
                          value={form.promo_starts_at}
                          onChange={(e) => f("promo_starts_at", e.target.value)}
                          min={new Date().toISOString().slice(0, 16)}
                          className={`w-full h-9 px-3 border border-gray-200 rounded-lg text-[13px] outline-none focus:border-[#1a4731] transition-all ${
                            editProduct?.promo_campaign
                              ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                              : "text-gray-800 bg-white"
                          }`}
                        />
                      </div>

                      {/* Fin promo */}
                      <div>
                        <Label>Fin de la promotion</Label>
                        <input
                          type="datetime-local"
                          disabled={!!editProduct?.promo_campaign}
                          value={form.promo_ends_at}
                          onChange={(e) => f("promo_ends_at", e.target.value)}
                          min={new Date().toISOString().slice(0, 16)}
                          className={`w-full h-9 px-3 border border-gray-200 rounded-lg text-[13px] outline-none focus:border-[#1a4731] transition-all ${
                            editProduct?.promo_campaign
                              ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                              : "text-gray-800 bg-white"
                          }`}
                        />
                        {form.promo_ends_at && (
                          <p className="text-[11px] text-amber-600 mt-1">
                            Expire le{" "}
                            {new Date(form.promo_ends_at).toLocaleDateString(
                              "fr-FR",
                              {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </Section>

                  {/* Descriptions */}
                  <Section title="Descriptions">
                    <div>
                      <Label>Description courte</Label>
                      <RichTextEditor
                        key={`short_desc_${editProduct?.id || "new"}`}
                        value={form.short_description || ""}
                        onChange={(val) => f("short_description", val)}
                        placeholder="Résumé affiché en quelques lignes..."
                      />
                    </div>
                    <div>
                      <Label>Description complète</Label>
                      <RichTextEditor
                        key={`desc_${editProduct?.id || "new"}`}
                        value={form.description || ""}
                        onChange={(val) => f("description", val)}
                        placeholder="Description détaillée du produit..."
                      />
                    </div>
                  </Section>

                  {/* Bienfaits */}
                  <Section title="Bienfaits & Conseils d'utilisation">
                    <div>
                      <Label>Bienfaits du produit</Label>
                      <RichTextEditor
                        key={`benefits_${editProduct?.id || "new"}`}
                        value={form.benefits || ""}
                        onChange={(val) => f("benefits", val)}
                        placeholder="• Hydrate intensément pendant 24h..."
                      />
                    </div>
                    <div>
                      <Label>Conseils d'utilisation</Label>
                      <RichTextEditor
                        key={`usage_${editProduct?.id || "new"}`}
                        value={form.usage_tips || ""}
                        onChange={(val) => f("usage_tips", val)}
                        placeholder="Appliquer matin et soir..."
                      />
                    </div>
                  </Section>

                  {/* Tailles & Couleurs */}
                  <Section title="Tailles, Couleurs & Âges" defaultOpen={false}>
                    {/* Tailles */}
                    <div className="border border-gray-200 rounded-xl p-4">
                      <label className="flex items-center gap-3 cursor-pointer mb-3">
                        <input
                          type="checkbox"
                          checked={form.has_sizes}
                          onChange={(e) => {
                            f("has_sizes", e.target.checked);
                            f("sizes", []);
                            f("size_type", "");
                          }}
                          className="w-4 h-4 accent-[#1a4731]"
                        />
                        <span className="text-[13px] font-semibold text-gray-700">
                          Produit avec tailles ?
                        </span>
                      </label>

                      {form.has_sizes && (
                        <div>
                          {/* Type de taille */}
                          <p className="text-[12px] text-gray-400 mb-2">
                            Type de taille :
                          </p>
                          <div className="flex gap-2 mb-4">
                            {[
                              { value: "alpha", label: "S / M / L / XL..." },
                              {
                                value: "numeric",
                                label: "Taille 1 / 2 / 3...",
                              },
                              { value: "cm", label: "En cm (personnalisé)" },
                            ].map((type) => (
                              <button
                                key={type.value}
                                type="button"
                                onClick={() => {
                                  f("size_type", type.value);
                                  f("sizes", []);
                                }}
                                className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold border-2 transition-all ${
                                  form.size_type === type.value
                                    ? "bg-[#1a4731] text-white border-[#1a4731]"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-[#1a4731]"
                                }`}
                              >
                                {type.label}
                              </button>
                            ))}
                          </div>

                          {/* Tailles alpha : S M L XL... */}
                          {form.size_type === "alpha" && (
                            <div className="flex flex-wrap gap-2">
                              {[
                                "S",
                                "M",
                                "L",
                                "XL",
                                "2XL",
                                "3XL",
                                "4XL",
                                "5XL",
                              ].map((size) => (
                                <button
                                  key={size}
                                  type="button"
                                  onClick={() => toggleSize(size)}
                                  className={`px-3 py-1.5 rounded-lg text-[13px] font-bold border-2 transition-all ${
                                    (form.sizes || []).some(
                                      (s) => s.label === size,
                                    )
                                      ? "bg-[#1a4731] text-white border-[#1a4731]"
                                      : "bg-white text-gray-600 border-gray-200 hover:border-[#1a4731]"
                                  }`}
                                >
                                  {size}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Tailles numériques : Taille 1, 2, 3... */}
                          {form.size_type === "numeric" && (
                            <div className="flex flex-wrap gap-2">
                              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                                <button
                                  key={n}
                                  type="button"
                                  onClick={() => toggleSize(`Taille ${n}`)}
                                  className={`px-3 py-1.5 rounded-lg text-[13px] font-bold border-2 transition-all ${
                                    (form.sizes || []).some(
                                      (s) => s.label === `Taille ${n}`,
                                    )
                                      ? "bg-[#1a4731] text-white border-[#1a4731]"
                                      : "bg-white text-gray-600 border-gray-200 hover:border-[#1a4731]"
                                  }`}
                                >
                                  Taille {n}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Tailles en cm : champ libre */}
                          {form.size_type === "cm" && (
                            <div>
                              <div className="flex gap-2 mb-3">
                                <Input
                                  value={form._cmInput || ""}
                                  onChange={(e) =>
                                    f("_cmInput", e.target.value)
                                  }
                                  placeholder="Ex: 55cm"
                                  className="flex-1"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      addCustomSize(form._cmInput || "");
                                      f("_cmInput", "");
                                    }
                                  }}
                                />
                                <Btn
                                  type="button"
                                  onClick={() => {
                                    addCustomSize(form._cmInput || "");
                                    f("_cmInput", "");
                                  }}
                                >
                                  <Plus size={14} /> Ajouter
                                </Btn>
                              </div>
                              <p className="text-[11px] text-gray-400">
                                Appuyez sur Entrée ou cliquez Ajouter
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {(form.sizes || []).length > 0 && (
                        <div className="mt-4 space-y-2">
                          <p className="text-[12px] font-semibold text-gray-500">
                            Stock par taille :
                          </p>
                          {form.sizes.map((s) => (
                            <div
                              key={s.label}
                              className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg border border-gray-200"
                            >
                              <span className="text-[13px] font-bold text-gray-700 w-20">
                                {s.label}
                              </span>
                              <input
                                type="number"
                                min={0}
                                value={s.stock}
                                onChange={(e) =>
                                  updateSizeStock(s.label, e.target.value)
                                }
                                className="w-24 h-8 px-2 border border-gray-200 rounded-lg text-[13px] outline-none focus:border-[#1a4731]"
                              />
                              <span className="text-[11px] text-gray-400">
                                unités en stock
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  f(
                                    "sizes",
                                    form.sizes.filter(
                                      (x) => x.label !== s.label,
                                    ),
                                  )
                                }
                                className="ml-auto w-6 h-6 rounded-lg text-red-400 hover:bg-red-50 flex items-center justify-center"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Couleurs */}
                    <div className="border border-gray-200 rounded-xl p-4 mt-3">
                      <label className="flex items-center gap-3 cursor-pointer mb-3">
                        <input
                          type="checkbox"
                          checked={form.has_colors}
                          onChange={(e) => f("has_colors", e.target.checked)}
                          className="w-4 h-4 accent-[#1a4731]"
                        />
                        <span className="text-[13px] font-semibold text-gray-700">
                          Produit avec couleurs ?
                        </span>
                      </label>

                      {form.has_colors && (
                        <div>
                          <p className="text-[12px] text-gray-400 mb-3">
                            Choisir les couleurs disponibles :
                          </p>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {PRESET_COLORS.map((color) => {
                              const selected = (form.colors || []).find(
                                (c) => c.hex === color.hex,
                              );
                              return (
                                <button
                                  key={color.hex}
                                  type="button"
                                  title={color.name}
                                  onClick={() => toggleColor(color)}
                                  className={`w-8 h-8 rounded-full border-2 transition-all ${selected ? "border-[#1a4731] scale-110 shadow-md" : "border-gray-300 hover:scale-105"}`}
                                  style={{ backgroundColor: color.hex }}
                                />
                              );
                            })}
                          </div>

                          {(form.colors || []).length > 0 && (
                            <div className="space-y-3">
                              <p className="text-[12px] font-semibold text-gray-500 mb-2">
                                Images par couleur :
                              </p>
                              {(form.colors || []).map((color, idx) => (
                                <div
                                  key={color.hex}
                                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200"
                                >
                                  <div
                                    className="w-8 h-8 rounded-full border border-gray-300 flex-shrink-0"
                                    style={{ backgroundColor: color.hex }}
                                  />
                                  <div className="flex-1">
                                    <Input
                                      value={color.name}
                                      onChange={(e) =>
                                        updateColorName(idx, e.target.value)
                                      }
                                      placeholder="Nom de la couleur"
                                      className="w-full mb-2"
                                    />
                                    {!form.has_age && (
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[11.5px] text-gray-500 flex-shrink-0">
                                          Stock :
                                        </span>
                                        <input
                                          type="number"
                                          min={0}
                                          value={color.stock ?? 999}
                                          onChange={(e) =>
                                            updateColorStock(
                                              idx,
                                              e.target.value,
                                            )
                                          }
                                          className="w-24 h-8 px-2 border border-gray-200 rounded-lg text-[13px] outline-none focus:border-[#1a4731]"
                                        />
                                      </div>
                                    )}
                                    <div
                                      className="border-2 border-dashed border-gray-200 rounded-xl p-3 text-center cursor-pointer hover:border-[#1a4731] transition-all"
                                      onDragOver={(e) => e.preventDefault()}
                                      onDrop={(e) => {
                                        e.preventDefault();
                                        const file = e.dataTransfer.files[0];
                                        if (
                                          file &&
                                          file.type.startsWith("image/")
                                        )
                                          updateColorImage(idx, file);
                                      }}
                                      onClick={() =>
                                        document
                                          .getElementById(`color-input-${idx}`)
                                          .click()
                                      }
                                    >
                                      {color.image instanceof File ? (
                                        <img
                                          src={URL.createObjectURL(color.image)}
                                          alt={color.name}
                                          className="w-16 h-16 rounded-lg object-cover mx-auto"
                                        />
                                      ) : color.image ? (
                                        <div className="flex items-center gap-2 justify-center">
                                          <img
                                            src={`${STORAGE_URL}/${color.image}`}
                                            alt={color.name}
                                            className="w-12 h-12 rounded-lg object-cover"
                                          />
                                          <span className="text-[12px] text-gray-500">
                                            Image existante
                                          </span>
                                        </div>
                                      ) : (
                                        <div className="py-2">
                                          <Upload
                                            size={20}
                                            className="mx-auto text-gray-300 mb-1"
                                          />
                                          <p className="text-[11px] text-gray-400">
                                            Glisser ou cliquer
                                          </p>
                                        </div>
                                      )}
                                      <input
                                        id={`color-input-${idx}`}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                          const file = e.target.files[0];
                                          if (file) updateColorImage(idx, file);
                                        }}
                                      />
                                    </div>
                                  </div>
                                  {color.image instanceof File && (
                                    <img
                                      src={URL.createObjectURL(color.image)}
                                      alt={color.name}
                                      className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Âge */}
                    <div className="border border-gray-200 rounded-xl p-4 mt-3">
                      <label className="flex items-center gap-3 cursor-pointer mb-3">
                        <input
                          type="checkbox"
                          checked={form.has_age}
                          onChange={(e) => f("has_age", e.target.checked)}
                          className="w-4 h-4 accent-[#1a4731]"
                        />
                        <span className="text-[13px] font-semibold text-gray-700">
                          Produit avec âges ?
                        </span>
                      </label>

                      {form.has_age && (
                        <div>
                          {/* Type d'âge : valeur unique ou plage */}
                          <div className="flex gap-2 mb-3">
                            {[
                              {
                                value: "single",
                                label: "Âge précis (ex: 3 mois)",
                              },
                              {
                                value: "range",
                                label: "Plage (ex: 3 à 6 mois)",
                              },
                            ].map((t) => (
                              <button
                                key={t.value}
                                type="button"
                                onClick={() => f("_ageType", t.value)}
                                className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold border-2 transition-all ${
                                  form._ageType === t.value
                                    ? "bg-[#1a4731] text-white border-[#1a4731]"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-[#1a4731]"
                                }`}
                              >
                                {t.label}
                              </button>
                            ))}
                          </div>

                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-[12px] text-gray-500">
                              Unité :
                            </span>
                            {["mois", "ans"].map((u) => (
                              <button
                                key={u}
                                type="button"
                                onClick={() => f("_ageUnit", u)}
                                className={`px-3 py-1 rounded-lg text-[12px] font-semibold border-2 transition-all ${
                                  form._ageUnit === u
                                    ? "bg-[#1a4731] text-white border-[#1a4731]"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-[#1a4731]"
                                }`}
                              >
                                {u}
                              </button>
                            ))}
                          </div>

                          {form._ageType === "single" ? (
                            <div className="flex gap-2 mb-3">
                              <Input
                                type="number"
                                min={0}
                                value={form._ageValue || ""}
                                onChange={(e) => f("_ageValue", e.target.value)}
                                placeholder="Ex: 3"
                                className="flex-1"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    addAge();
                                  }
                                }}
                              />
                              <Btn type="button" onClick={addAge}>
                                <Plus size={14} /> Ajouter
                              </Btn>
                            </div>
                          ) : (
                            <div className="flex gap-2 mb-3 items-center">
                              <Input
                                type="number"
                                min={0}
                                value={form._ageFrom || ""}
                                onChange={(e) => f("_ageFrom", e.target.value)}
                                placeholder="De (ex: 3)"
                                className="flex-1"
                              />
                              <span className="text-gray-400">à</span>
                              <Input
                                type="number"
                                min={0}
                                value={form._ageTo || ""}
                                onChange={(e) => f("_ageTo", e.target.value)}
                                placeholder="À (ex: 6)"
                                className="flex-1"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    addAge();
                                  }
                                }}
                              />
                              <Btn type="button" onClick={addAge}>
                                <Plus size={14} /> Ajouter
                              </Btn>
                            </div>
                          )}

                          {(form.ages || []).length > 0 && (
                            <div className="space-y-2.5">
                              {form.ages.map((a, idx) => (
                                <div
                                  key={a.label}
                                  className="p-3 bg-gray-50 rounded-xl border border-gray-200"
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="text-[13px] font-bold text-gray-700 flex-1">
                                      {a.label}
                                    </span>
                                    {!form.has_colors && (
                                      <>
                                        <input
                                          type="number"
                                          min={0}
                                          value={a.stock ?? 999}
                                          onChange={(e) =>
                                            updateAgeStock(idx, e.target.value)
                                          }
                                          className="w-24 h-8 px-2 border border-gray-200 rounded-lg text-[13px] outline-none focus:border-[#1a4731]"
                                        />
                                        <span className="text-[11px] text-gray-400">
                                          en stock
                                        </span>
                                      </>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => removeAge(idx)}
                                      className="w-6 h-6 rounded-lg text-red-400 hover:bg-red-50 flex items-center justify-center"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>

                                  {form.has_colors &&
                                    (form.colors || []).length > 0 && (
                                      <div className="mt-2.5 pl-3 border-l-2 border-gray-200">
                                        <p className="text-[11px] font-semibold text-gray-500 mb-1.5">
                                          Couleurs disponibles pour "{a.label}"
                                          :
                                        </p>
                                        <div className="flex flex-wrap gap-1.5 mb-2">
                                          {form.colors.map((c) => {
                                            const isActive = (
                                              a.colors || []
                                            ).some((x) => x.name === c.name);
                                            return (
                                              <button
                                                key={c.name}
                                                type="button"
                                                onClick={() =>
                                                  toggleAgeColor(idx, c.name)
                                                }
                                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] font-semibold border-2 transition-all ${
                                                  isActive
                                                    ? "border-[#1a4731] bg-[#edf7f3] text-[#1a4731]"
                                                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                                                }`}
                                              >
                                                <span
                                                  className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0"
                                                  style={{
                                                    backgroundColor: c.hex,
                                                  }}
                                                />
                                                {c.name}
                                              </button>
                                            );
                                          })}
                                        </div>

                                        {(a.colors || []).length > 0 && (
                                          <div className="space-y-1.5">
                                            {a.colors.map((ac) => (
                                              <div
                                                key={ac.name}
                                                className="flex items-center gap-2"
                                              >
                                                <span className="text-[12px] text-gray-600 w-24 truncate">
                                                  {ac.name}
                                                </span>
                                                <input
                                                  type="number"
                                                  min={0}
                                                  value={ac.stock ?? 0}
                                                  onChange={(e) =>
                                                    updateAgeColorStock(
                                                      idx,
                                                      ac.name,
                                                      e.target.value,
                                                    )
                                                  }
                                                  className="w-20 h-7 px-2 border border-gray-200 rounded-lg text-[12px] outline-none focus:border-[#1a4731]"
                                                />
                                                <span className="text-[10.5px] text-gray-400">
                                                  unités
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )}

                                  {form.has_colors &&
                                    (form.colors || []).length === 0 && (
                                      <p className="text-[11px] text-amber-600 mt-2">
                                        Ajoutez d'abord des couleurs ci-dessus
                                        pour pouvoir les associer à cet âge.
                                      </p>
                                    )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </Section>
                </div>

                {/* DROITE 1/3 */}
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                      <span className="text-[13px] font-bold text-gray-700">
                        Image principale
                      </span>
                    </div>
                    <div className="p-4">
                      <ImageDropzone
                        preview={previewImg}
                        onFileSelect={handleFileSelect}
                        onClear={handleClearImage}
                        existingImage={editProduct?.image}
                      />
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                      <span className="text-[13px] font-bold text-gray-700">
                        Images supplémentaires (optionnel)
                      </span>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Jusqu'à 3 images affichées sous l'image principale
                      </p>
                    </div>
                    <div className="p-4 space-y-3">
                      {[0, 1, 2].map((idx) => (
                        <ImageDropzone
                          key={idx}
                          height="h-28"
                          preview={galleryPreviews[idx]}
                          onFileSelect={(file) =>
                            handleGalleryFileSelect(idx, file)
                          }
                          onClear={() => handleGalleryClear(idx)}
                          existingImage={galleryExisting[idx]}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                      <span className="text-[13px] font-bold text-gray-700">
                        Visibilité & Badges
                      </span>
                    </div>
                    <div className="p-4 space-y-3">
                      <Toggle
                        checked={form.is_featured}
                        onChange={(e) => f("is_featured", e.target.checked)}
                        label="Produit vedette"
                      />
                      <Toggle
                        checked={form.is_new}
                        onChange={(e) => f("is_new", e.target.checked)}
                        label="Nouveauté"
                      />
                      <Toggle
                        checked={form.is_promo}
                        onChange={(e) => f("is_promo", e.target.checked)}
                        label="En promotion"
                      />
                      <div>
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-5 rounded-full ${form.is_bestseller ? "bg-[#1a4731]" : "bg-gray-200"}`}
                          >
                            <div
                              className={`w-4 h-4 bg-white rounded-full shadow mt-0.5 transition-transform ${form.is_bestseller ? "translate-x-5" : "translate-x-0.5"}`}
                            />
                          </div>
                          <span className="text-[13px] font-medium text-gray-700">
                            Bestseller
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1.5 ml-[52px]">
                          Calculé automatiquement selon les ventes réelles — non
                          modifiable manuellement.
                        </p>
                      </div>
                    </div>
                  </div>

                  {(form.is_featured ||
                    form.is_new ||
                    form.is_promo ||
                    form.is_bestseller) && (
                    <div className="border border-gray-200 rounded-xl p-4">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Badges actifs
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {form.is_featured && (
                          <span className="text-[11px] font-bold px-2 py-1 bg-purple-50 text-purple-600 border border-purple-200 rounded-lg">
                            ⭐ Vedette
                          </span>
                        )}
                        {form.is_new && (
                          <span className="text-[11px] font-bold px-2 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg">
                            🆕 Nouveau
                          </span>
                        )}
                        {form.is_promo && (
                          <span className="text-[11px] font-bold px-2 py-1 bg-red-50 text-red-600 border border-red-200 rounded-lg">
                            🏷️ Promo
                          </span>
                        )}
                        {form.is_bestseller && (
                          <span className="text-[11px] font-bold px-2 py-1 bg-amber-50 text-amber-600 border border-amber-200 rounded-lg">
                            🔥 Bestseller
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-6 pt-5 border-t border-gray-100">
                <p className="text-[12px] text-gray-400">
                  * Champs obligatoires
                </p>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <Btn ghost type="button" onClick={() => setShowForm(false)}>
                    <X size={14} /> Annuler
                  </Btn>
                  <Btn type="submit" disabled={saving}>
                    {saving ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save size={14} />{" "}
                        {editProduct
                          ? "Enregistrer les modifications"
                          : "Créer le produit"}
                      </>
                    )}
                  </Btn>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {badgePicker && (
        <BulkBadgePicker
          field={badgePicker.field}
          label={badgePicker.label}
          onClose={() => setBadgePicker(null)}
          onApplied={fetchProducts}
          showToast={showToast}
        />
      )}
      {/* Modal aperçu produit */}
      {previewProduct && (
        <ProductPreviewModal
          product={previewProduct}
          onClose={() => setPreviewProduct(null)}
        />
      )}
    </div>
  );
}
function BulkBadgePicker({ field, label, onClose, onApplied, showToast }) {
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search, 350);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(new Map()); // id -> name
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    setLoading(true);
    getAdminProducts({ search: debounced, per_page: 50, page: 1 })
      .then((data) => setResults(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [debounced]);

  const toggle = (p) => {
    setSelected((prev) => {
      const next = new Map(prev);
      next.has(p.id) ? next.delete(p.id) : next.set(p.id, p.name);
      return next;
    });
  };

  const handleApply = async () => {
    if (selected.size === 0) return;
    setApplying(true);
    try {
      await bulkToggleProducts([...selected.keys()], field, true);
      showToast(`${selected.size} produit(s) marqué(s) "${label}".`, "success");
      onApplied();
      onClose();
    } catch {
      showToast("Erreur lors de l'application.", "error");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)" }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <p className="text-[15px] font-bold text-gray-900">
            Choisir les produits — badge "{label}"
          </p>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 border-b border-gray-100">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou référence..."
            className="w-full"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2">
          {loading ? (
            <Spinner />
          ) : results.length === 0 ? (
            <p className="text-[13px] text-gray-400 text-center py-8">
              Aucun produit trouvé.
            </p>
          ) : (
            <div className="space-y-1">
              {results.map((p) => (
                <label
                  key={p.id}
                  className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggle(p)}
                    className="w-4 h-4 accent-[#1a4731] flex-shrink-0"
                  />
                  {p.image ? (
                    <img
                      src={`${STORAGE_URL}/${p.image}`}
                      alt=""
                      className="w-8 h-8 rounded-md object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-md bg-gray-100 flex-shrink-0" />
                  )}
                  <span className="text-[13px] flex-1 min-w-0 truncate">
                    {p.name}
                  </span>
                  <span className="text-[11px] text-gray-400 flex-shrink-0">
                    {p.reference}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
          <span className="text-[12.5px] text-gray-500">
            {selected.size} produit(s) sélectionné(s)
          </span>
          <div className="flex gap-2">
            <Btn ghost onClick={onClose} disabled={applying}>
              Annuler
            </Btn>
            <Btn
              onClick={handleApply}
              disabled={applying || selected.size === 0}
            >
              {applying ? "Application..." : "Appliquer"}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
function BrandCombobox({ brands, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useState(() => ({ current: null }))[0];

  const selectedBrand = brands.find((b) => String(b.id) === String(value));
  const displayLabel = (b) =>
    b.parent_id
      ? `${brands.find((p) => p.id === b.parent_id)?.name || ""} / ${b.name}`
      : b.name;

  const filtered = brands.filter((b) =>
    displayLabel(b).toLowerCase().includes(query.trim().toLowerCase()),
  );

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [wrapRef]);

  return (
    <div
      ref={(el) => (wrapRef.current = el)}
      className="relative h-9 w-[220px] flex-shrink-0"
    >
      <div
        className="h-9 px-3 border border-gray-200 rounded-lg bg-white flex items-center gap-2 cursor-text"
        onClick={() => setOpen(true)}
      >
        <Search size={13} className="text-gray-400 flex-shrink-0" />
        <input
          value={
            open ? query : selectedBrand ? displayLabel(selectedBrand) : ""
          }
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setQuery("");
            setOpen(true);
          }}
          placeholder="Toutes les marques"
          className="flex-1 min-w-0 text-[13px] outline-none bg-transparent"
        />
        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
              setQuery("");
            }}
            className="text-gray-300 hover:text-gray-600 flex-shrink-0"
          >
            <X size={13} />
          </button>
        )}
      </div>
      {open && (
        <div className="absolute z-50 top-10 left-0 w-full max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
          <button
            type="button"
            onClick={() => {
              onChange("");
              setQuery("");
              setOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-[12.5px] text-gray-500 hover:bg-gray-50"
          >
            Toutes les marques
          </button>
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-[12.5px] text-gray-400">
              Aucune marque trouvée
            </p>
          ) : (
            filtered.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => {
                  onChange(String(b.id));
                  setQuery("");
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-[12.5px] hover:bg-gray-50 ${
                  String(value) === String(b.id)
                    ? "bg-[#edf7f3] text-[#1a4731] font-semibold"
                    : "text-gray-700"
                }`}
              >
                {displayLabel(b)}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
