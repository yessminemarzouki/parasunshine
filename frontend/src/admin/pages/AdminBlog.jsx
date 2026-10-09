import { useState, useEffect, useRef } from "react";
import RichTextEditor from "../components/RichTextEditor";
import { STORAGE_URL } from "../../config/api";
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Eye,
  EyeOff,
  ToggleLeft,
  ToggleRight,
  Upload,
  Tag,
  Search,
  Sparkles,
  Check,
} from "lucide-react";
import { useDebounce } from "../hooks/useDebounce";
import {
  getAdminBlogPosts,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  toggleBlogPostVisible,
  toggleBlogSection,
  bulkDeleteBlogPosts,
  bulkToggleBlogVisible,
  getAdminCategories,
} from "../services/adminApi";
import {
  Btn,
  Input,
  Select,
  Spinner,
  PageHeader,
  Toast,
  Label,
  ActionBtn,
  TableWrap,
  Table,
  TR,
  TD,
} from "../components/AdminShared";

const emptyForm = {
  title: "",
  excerpt: "",
  content: "",
  category: "",
  category_slug: "",
  author: "Équipe ParaSunshine",
  read_time: "5 min",
  tags: "",
  is_featured: false,
  is_visible: true,
  section_visible: true,
};

const ConfirmModal = ({ title, onConfirm, onCancel }) => (
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
        Voulez-vous vraiment supprimer <strong>"{title}"</strong> ?
      </p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-[13.5px] font-semibold hover:bg-gray-50"
        >
          Non, annuler
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-[13.5px] font-semibold hover:bg-red-600"
        >
          Oui, supprimer
        </button>
      </div>
    </div>
  </div>
);

export default function AdminBlog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editPost, setEditPost] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [sectionVisible, setSectionVisible] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [visibleFilter, setVisibleFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkActing, setBulkActing] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [categories, setCategories] = useState([]);

  const showToast = (message, type = "success") => setToast({ message, type });
  useEffect(() => {
    getAdminCategories()
      .then((data) => setCategories(data || []))
      .catch(() => {});
  }, []);
  useEffect(() => {
    fetchPosts();
  }, [debouncedSearch, categoryFilter, visibleFilter]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const data = await getAdminBlogPosts({
        search: debouncedSearch,
        category_slug: categoryFilter,
        is_visible: visibleFilter,
      });
      setPosts(data);
      if (data.length > 0) setSectionVisible(data[0].section_visible);
    } catch {
      showToast("Erreur lors du chargement.", "error");
    } finally {
      setLoading(false);
    }
  };

  const isNew = (dateStr) =>
    Date.now() - new Date(dateStr).getTime() < 24 * 60 * 60 * 1000;

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) =>
      prev.size === posts.length ? new Set() : new Set(posts.map((p) => p.id)),
    );
  };

  const handleBulkToggleVisible = async (value) => {
    setBulkActing(true);
    try {
      const result = await bulkToggleBlogVisible([...selectedIds], value);
      showToast(result.message);
      setSelectedIds(new Set());
      fetchPosts();
    } catch {
      showToast("Erreur lors de la mise à jour.", "error");
    } finally {
      setBulkActing(false);
    }
  };

  const handleBulkDelete = async () => {
    setBulkActing(true);
    try {
      const result = await bulkDeleteBlogPosts([...selectedIds]);
      showToast(result.message);
      setSelectedIds(new Set());
      fetchPosts();
    } catch {
      showToast("Erreur lors de la suppression.", "error");
    } finally {
      setBulkActing(false);
      setConfirmBulkDelete(false);
    }
  };

  const f = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const handleCategoryChange = (name) => {
    const cat = categories.find((c) => c.name === name);
    if (cat) {
      f("category", cat.name);
      f("category_slug", cat.slug);
    }
  };

  const handleFile = (file) => {
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  };

  const openAdd = () => {
    setEditPost(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview(null);
    setShowForm(true);
  };

  const openEdit = (post) => {
    setEditPost(post);
    setForm({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category,
      category_slug: post.category_slug,
      author: post.author,
      read_time: post.read_time,
      tags: (post.tags || []).join(", "),
      is_featured: post.is_featured,
      is_visible: post.is_visible,
      section_visible: post.section_visible,
    });
    setImageFile(null);
    setImagePreview(post.image ? `${STORAGE_URL}/${post.image}` : null);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.excerpt.trim() || !form.content.trim()) {
      showToast("Titre, résumé et contenu sont obligatoires.", "error");
      return;
    }
    try {
      setSaving(true);
      const fd = new FormData();
      const htmlFields = ["content", "excerpt"];

      Object.entries(form).forEach(([k, v]) => {
        if (typeof v === "boolean") {
          fd.append(k, v ? "1" : "0");
        } else if (htmlFields.includes(k) && typeof v === "string") {
          const doc = new DOMParser().parseFromString(v, "text/html");
          fd.append(k, doc.body.innerHTML);
        } else {
          fd.append(k, v);
        }
      });
      if (imageFile) fd.append("image", imageFile);

      editPost
        ? await updateBlogPost(editPost.id, fd)
        : await createBlogPost(fd);

      setShowForm(false);
      fetchPosts();
      showToast(
        editPost ? "Article modifié avec succès." : "Article créé avec succès.",
      );
    } catch {
      showToast("Erreur lors de l'enregistrement.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteBlogPost(confirmDelete.id);
      setConfirmDelete(null);
      fetchPosts();
      showToast(`"${confirmDelete.title}" supprimé avec succès.`);
    } catch {
      showToast("Erreur lors de la suppression.", "error");
    }
  };

  const handleToggleVisible = async (post) => {
    try {
      await toggleBlogPostVisible(post.id);
      fetchPosts();
      showToast(post.is_visible ? "Article masqué." : "Article visible.");
    } catch {
      showToast("Erreur.", "error");
    }
  };

  const handleToggleSection = async () => {
    try {
      await toggleBlogSection();
      setSectionVisible((p) => !p);
      showToast(
        sectionVisible ? "Section blog masquée." : "Section blog visible.",
      );
    } catch {
      showToast("Erreur.", "error");
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
          title={confirmDelete.title}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      <PageHeader
        title="Blog & Actualités"
        subtitle="Gérez les articles du blog ParaSunshine"
        action={
          <div className="flex flex-wrap gap-2">
            {/* Toggle section */}
            <button
              onClick={handleToggleSection}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold border transition-all whitespace-nowrap ${
                sectionVisible
                  ? "bg-[#edf7f3] text-[#1a4731] border-[#1a4731]/20"
                  : "bg-gray-100 text-gray-500 border-gray-200"
              }`}
            >
              {sectionVisible ? (
                <ToggleRight size={16} />
              ) : (
                <ToggleLeft size={16} />
              )}
              Section {sectionVisible ? "visible" : "masquée"}
            </button>
            <Btn onClick={openAdd}>
              <Plus size={14} /> Nouvel article
            </Btn>
          </div>
        }
      />

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-2.5 mb-5">
        <div className="relative flex-1 min-w-0">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Titre ou catégorie..."
            className="pl-9 w-full"
          />
        </div>
        <Select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full sm:w-auto"
        >
          <option value="">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select
          value={visibleFilter}
          onChange={(e) => setVisibleFilter(e.target.value)}
          className="w-full sm:w-auto"
        >
          <option value="">Tous les articles</option>
          <option value="true">Visibles</option>
          <option value="false">Masqués</option>
        </Select>
      </div>

      {/* Barre d'actions groupées */}
      {selectedIds.size > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 bg-[#0f2a1e] text-white rounded-2xl px-4 sm:px-5 py-3 shadow-lg">
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <span className="text-[13px] font-semibold whitespace-nowrap">
              {selectedIds.size} article(s) sélectionné(s)
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
              onClick={() => handleBulkToggleVisible(true)}
              disabled={bulkActing}
              className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 transition-colors disabled:opacity-50"
            >
              <Eye size={13} /> Rendre visible
            </button>
            <button
              onClick={() => handleBulkToggleVisible(false)}
              disabled={bulkActing}
              className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              <EyeOff size={13} /> Masquer
            </button>
            <button
              onClick={() => setConfirmBulkDelete(true)}
              disabled={bulkActing}
              className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-red-500/90 hover:bg-red-500 transition-colors disabled:opacity-50"
            >
              <Trash2 size={13} /> Supprimer
            </button>
          </div>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="hidden sm:block ml-auto text-white/60 hover:text-white transition-colors p-1"
          >
            <X size={16} />
          </button>
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
              Supprimer {selectedIds.size} article(s) ?
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

      {/* Formulaire */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <p className="text-[14px] font-bold text-gray-800">
              {editPost ? "Modifier l'article" : "Nouvel article"}
            </p>
            <button
              onClick={() => setShowForm(false)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Titre */}
            <div className="col-span-1 sm:col-span-2">
              <Label>Titre *</Label>
              <Input
                value={form.title}
                onChange={(e) => f("title", e.target.value)}
                placeholder="Titre de l'article..."
                className="w-full mt-1"
              />
            </div>

            {/* Catégorie */}
            <div>
              <Label>Catégorie *</Label>
              <select
                value={form.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full h-9 px-3 border border-gray-200 rounded-lg text-[13px] text-gray-700 bg-white outline-none focus:border-[#1a4731] mt-1"
              >
                <option value="">Sélectionner...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Auteur */}
            <div>
              <Label>Auteur</Label>
              <Input
                value={form.author}
                onChange={(e) => f("author", e.target.value)}
                placeholder="Équipe ParaSunshine"
                className="w-full mt-1"
              />
            </div>

            {/* Temps de lecture */}
            <div>
              <Label>Temps de lecture</Label>
              <Input
                value={form.read_time}
                onChange={(e) => f("read_time", e.target.value)}
                placeholder="5 min"
                className="w-full mt-1"
              />
            </div>

            {/* Tags */}
            <div>
              <Label>Tags (séparés par des virgules)</Label>
              <Input
                value={form.tags}
                onChange={(e) => f("tags", e.target.value)}
                placeholder="peau, été, hydratation..."
                className="w-full mt-1"
              />
            </div>

            {/* Résumé */}
            <div className="col-span-1 sm:col-span-2">
              <Label>Résumé *</Label>
              <textarea
                value={form.excerpt}
                onChange={(e) => f("excerpt", e.target.value)}
                rows={3}
                placeholder="Résumé de l'article affiché dans la liste..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-700 bg-white outline-none focus:border-[#1a4731] resize-none mt-1"
              />
            </div>

            {/* Contenu */}
            <div className="col-span-1 sm:col-span-2">
              <Label>Contenu *</Label>
              <div className="mt-1">
                <RichTextEditor
                  key={`content_${editPost?.id || "new"}`}
                  value={form.content}
                  onChange={(val) => f("content", val)}
                  placeholder="Contenu de l'article..."
                />
              </div>
            </div>

            {/* Image drag & drop */}
            <div className="col-span-1 sm:col-span-2">
              <Label>Image de couverture</Label>
              <div
                className={`mt-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${
                  dragActive
                    ? "border-[#1a4731] bg-[#edf7f3]"
                    : "border-gray-200 bg-gray-50 hover:border-gray-300"
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
                {imagePreview ? (
                  <div className="relative w-full h-40 rounded-lg overflow-hidden">
                    <img
                      src={imagePreview}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload size={24} className="text-gray-300" />
                    <p className="text-[12.5px] text-gray-400 text-center px-4">
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

            {/* Toggles */}
            <div className="col-span-1 sm:col-span-2 flex flex-wrap items-center gap-4 sm:gap-6">
              {[
                { key: "is_featured", label: "Article vedette" },
                { key: "is_visible", label: "Visible sur le site" },
              ].map(({ key, label }) => (
                <label
                  key={key}
                  className="flex items-center gap-2.5 cursor-pointer"
                >
                  <div className="relative flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={form[key]}
                      onChange={(e) => f(key, e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`w-9 h-5 rounded-full transition-colors ${form[key] ? "bg-[#1a4731]" : "bg-gray-200"}`}
                    />
                    <div
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form[key] ? "translate-x-4" : ""}`}
                    />
                  </div>
                  <span className="text-[12.5px] text-gray-700 font-medium">
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 justify-end mt-5 pt-4 border-t border-gray-100">
            <Btn onClick={handleSave} disabled={saving}>
              {saving ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={14} /> Enregistrer
                </>
              )}
            </Btn>
            <Btn ghost onClick={() => setShowForm(false)}>
              <X size={14} /> Annuler
            </Btn>
          </div>
        </div>
      )}

      {/* Table */}
      <TableWrap>
        {loading ? (
          <Spinner />
        ) : (
          <Table
            headers={[
              <input
                key="checkall"
                type="checkbox"
                checked={posts.length > 0 && selectedIds.size === posts.length}
                onChange={toggleSelectAll}
                className="w-4 h-4 accent-[#1a4731] cursor-pointer"
              />,
              "Image",
              "Titre",
              "Catégorie",
              "Vedette",
              "Visible",
              "Date",
              "Actions",
            ]}
            empty={posts.length === 0 ? "Aucun article" : null}
          >
            {posts.map((post) => (
              <TR key={post.id}>
                <TD>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(post.id)}
                    onChange={() => toggleSelect(post.id)}
                    className="w-4 h-4 accent-[#1a4731] cursor-pointer"
                  />
                </TD>
                <TD>
                  <div className="w-14 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {post.image ? (
                      <img
                        src={`${STORAGE_URL}/${post.image}`}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200" />
                    )}
                  </div>
                </TD>
                <TD>
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-[13px] text-gray-800 max-w-xs truncate">
                      {post.title}
                    </p>
                    {isNew(post.created_at) && (
                      <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-full flex-shrink-0">
                        <Sparkles size={8} /> Nouveau
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {post.read_time} de lecture
                  </p>
                </TD>
                <TD>
                  <span className="text-[12px] font-semibold px-2 py-0.5 bg-[#edf7f3] text-[#1a4731] rounded-md whitespace-nowrap">
                    {post.category}
                  </span>
                </TD>
                <TD>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap ${
                      post.is_featured
                        ? "bg-yellow-50 text-yellow-600"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {post.is_featured ? "✓ Vedette" : "—"}
                  </span>
                </TD>
                <TD>
                  <button
                    onClick={() => handleToggleVisible(post)}
                    className={`flex items-center gap-1.5 text-[12px] font-semibold px-2 py-0.5 rounded-md transition-colors whitespace-nowrap ${
                      post.is_visible
                        ? "bg-green-50 text-green-600 hover:bg-green-100"
                        : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                    }`}
                  >
                    {post.is_visible ? <Eye size={12} /> : <EyeOff size={12} />}
                    {post.is_visible ? "Visible" : "Masqué"}
                  </button>
                </TD>
                <TD className="text-[12px] text-gray-400 whitespace-nowrap">
                  {new Date(post.created_at).toLocaleDateString("fr-FR")}
                </TD>
                <TD>
                  <div className="flex gap-1.5">
                    <ActionBtn
                      type="info"
                      onClick={() => openEdit(post)}
                      title="Modifier"
                    >
                      <Edit2 size={13} />
                    </ActionBtn>
                    <ActionBtn
                      type="danger"
                      onClick={() =>
                        setConfirmDelete({ id: post.id, title: post.title })
                      }
                      title="Supprimer"
                    >
                      <Trash2 size={13} />
                    </ActionBtn>
                  </div>
                </TD>
              </TR>
            ))}
          </Table>
        )}
      </TableWrap>
    </div>
  );
}
