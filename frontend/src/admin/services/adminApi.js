import axios from "axios";
import * as XLSX from "xlsx"; // ← ajoute ici
const API_BASE_URL =
  (import.meta.env.VITE_API_URL !== undefined
    ? import.meta.env.VITE_API_URL
    : "http://localhost") + "/api";

const adminApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Intercepteur token
adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Intercepteur réponse — redirige vers login si 401/403
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes("/login");
    if (
      (error.response?.status === 401 || error.response?.status === 403) &&
      !isLoginRequest
    ) {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
      window.location.href = "/admin/login";
    }
    return Promise.reject(error);
  },
);

// ========================================
// AUTH
// ========================================
export const adminLogin = async (email, password) => {
  const response = await adminApi.post("/login", { email, password });
  if (response.data.token) {
    localStorage.setItem("admin_token", response.data.token);
    localStorage.setItem("admin_user", JSON.stringify(response.data.user));
    localStorage.setItem("admin_token_at", Date.now().toString());
  }
  return response.data;
};

const ADMIN_SESSION_MAX_AGE = 4 * 60 * 60 * 1000; // 4h

export const isAdminSessionExpired = () => {
  const at = localStorage.getItem("admin_token_at");
  if (!at) return true;
  return Date.now() - parseInt(at, 10) > ADMIN_SESSION_MAX_AGE;
};

export const adminLogout = async () => {
  await adminApi.post("/logout");
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_user");
};

export const getAdminUser = () => {
  const user = localStorage.getItem("admin_user");
  return user ? JSON.parse(user) : null;
};

export const isAdminAuthenticated = () => {
  const token = localStorage.getItem("admin_token");
  const user = getAdminUser();
  if (!token || !user || user.role !== "admin") return false;
  if (isAdminSessionExpired()) {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    localStorage.removeItem("admin_token_at");
    return false;
  }
  return true;
};

// ========================================
// STATS
// ========================================
export const getAdminStats = async (params = {}) => {
  const response = await adminApi.get("/admin/stats", { params });
  return response.data;
};

export const getAdminBadges = async () => {
  const response = await adminApi.get("/admin/stats/badges");
  return response.data;
};

// ========================================
// COMMANDES
// ========================================

export const getAdminOrders = async (params = {}) => {
  const response = await adminApi.get("/admin/orders", { params });
  return response.data;
};

export const updateOrderStatus = async (id, status) => {
  const response = await adminApi.put(`/admin/orders/${id}/status`, { status });
  return response.data;
};

export const deleteOrder = async (id) => {
  const response = await adminApi.delete(`/admin/orders/${id}`);
  return response.data;
};

// ========================================
// PRODUITS
// ========================================
export const getAdminProducts = async (params = {}) => {
  const response = await adminApi.get("/admin/products", { params });
  return response.data;
};

export const getAdminProduct = async (id) => {
  const response = await adminApi.get(`/admin/products/${id}`);
  return response.data;
};

export const createProduct = async (formData) => {
  const response = await adminApi.post("/admin/products", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const updateProduct = async (id, formData) => {
  const response = await adminApi.post(`/admin/products/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await adminApi.delete(`/admin/products/${id}`);
  return response.data;
};

// ========================================
// UTILISATEURS
// ========================================
export const getAdminUsers = async (params = {}) => {
  const response = await adminApi.get("/admin/users", { params });
  return response.data;
};

export const getAdminUser2 = async (id) => {
  const response = await adminApi.get(`/admin/users/${id}`);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await adminApi.delete(`/admin/users/${id}`);
  return response.data;
};
export const getProductStats = async (id) => {
  const response = await adminApi.get(`/admin/products/${id}/stats`);
  return response.data;
};

// ========================================
// AVIS
// ========================================
export const getAdminReviews = async (params = {}) => {
  const response = await adminApi.get("/admin/reviews", { params });
  return response.data;
};

export const approveReview = async (id) => {
  const response = await adminApi.put(`/admin/reviews/${id}/approve`);
  return response.data;
};

export const rejectReview = async (id) => {
  const response = await adminApi.put(`/admin/reviews/${id}/reject`);
  return response.data;
};

export const deleteReview = async (id) => {
  const response = await adminApi.delete(`/admin/reviews/${id}`);
  return response.data;
};

// ========================================
// CONTACTS
// ========================================
export const getAdminContacts = async (params = {}) => {
  const response = await adminApi.get("/admin/contacts", { params });
  return response.data;
};

export const markContactRead = async (id) => {
  const response = await adminApi.put(`/admin/contacts/${id}/read`);
  return response.data;
};

export const deleteContact = async (id) => {
  const response = await adminApi.delete(`/admin/contacts/${id}`);
  return response.data;
};

// ========================================
// NEWSLETTER
// ========================================
export const getAdminNewsletter = async (params = {}) => {
  const response = await adminApi.get("/admin/newsletter", { params });
  return response.data;
};

export const deleteSubscriber = async (id) => {
  const response = await adminApi.delete(`/admin/newsletter/${id}`);
  return response.data;
};

// ========================================
// CATÉGORIES & MARQUES
// ========================================
const refCache = new Map();
const REF_CACHE_TTL = 2 * 60 * 1000; // 2 min

const cachedGet = async (key, url) => {
  const cached = refCache.get(key);
  if (cached && Date.now() - cached.at < REF_CACHE_TTL) {
    return cached.data;
  }
  const response = await adminApi.get(url);
  refCache.set(key, { data: response.data, at: Date.now() });
  return response.data;
};

export const getAdminCategories = () =>
  cachedGet("categories", "/admin/categories");
export const getAdminBrands = () => cachedGet("brands", "/admin/brands");

// Invalide le cache après toute mutation de catégories/marques
export const invalidateRefCache = () => refCache.clear();

export default adminApi;
// ========================================
// PROMO BANNER
// ========================================
export const getPromoBanner = async () => {
  const response = await adminApi.get("/admin/promo-banner");
  return response.data;
};

export const updatePromoBanner = async (data) => {
  const response = await adminApi.put("/admin/promo-banner", data);
  return response.data;
};
// ========================================
// BLOG
// ========================================
export const getAdminBlogPosts = async (params = {}) => {
  const response = await adminApi.get("/admin/blog", { params });
  return response.data;
};

export const createBlogPost = async (formData) => {
  const response = await adminApi.post("/admin/blog", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const updateBlogPost = async (id, formData) => {
  const response = await adminApi.post(`/admin/blog/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const deleteBlogPost = async (id) => {
  const response = await adminApi.delete(`/admin/blog/${id}`);
  return response.data;
};

export const toggleBlogPostVisible = async (id) => {
  const response = await adminApi.put(`/admin/blog/${id}/toggle-visible`);
  return response.data;
};

export const toggleBlogSection = async (id) => {
  const response = await adminApi.put(`/admin/blog/toggle-section`);
  return response.data;
};
// ========================================
// PROMO SECTION
// ========================================
export const getPromoSection = async () => {
  const response = await adminApi.get("/admin/promo-section");
  return response.data;
};

export const updatePromoSection = async (data) => {
  const response = await adminApi.put("/admin/promo-section", data);
  return response.data;
};

// ========================================
// HYGIENE SECTION
// ========================================
export const getHygieneSection = async () => {
  const response = await adminApi.get("/admin/hygiene-section");
  return response.data;
};

export const updateHygieneSection = async (formData) => {
  const response = await adminApi.post("/admin/hygiene-section", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};
export const importProductsCsv = async (file) => {
  const fd = new FormData();
  fd.append("file", file);
  const response = await adminApi.post("/admin/products/import", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};
export const getAdminOrderDetail = async (id) => {
  const response = await adminApi.get(`/admin/orders/${id}`);
  return response.data;
};
export const searchPromoProducts = async (q, excludeIds = []) => {
  const response = await adminApi.get("/admin/promo-section/products", {
    params: { q, exclude_ids: excludeIds.join(",") },
  });
  return response.data;
};

export const addProductToPromoSection = async (productId) => {
  const response = await adminApi.post(
    `/admin/promo-section/products/${productId}`,
  );
  return response.data;
};

export const removeProductFromPromoSection = async (productId) => {
  const response = await adminApi.delete(
    `/admin/promo-section/products/${productId}`,
  );
  return response.data;
};
export const addAllPromotedToPromoSection = async () => {
  const response = await adminApi.post("/admin/promo-section/add-all-promoted");
  return response.data;
};
export const searchPromotionProducts = async (params = {}) => {
  const response = await adminApi.get("/admin/promotions/search", { params });
  return response.data;
};
export const applyBulkPromotion = async (data) => {
  const response = await adminApi.post("/admin/promotions/apply", data);
  return response.data;
};

export const removeBulkPromotion = async (data) => {
  const response = await adminApi.post("/admin/promotions/remove", data);
  return response.data;
};
// ========================================
// PARAMÈTRES DE LIVRAISON
// ========================================
export const getShippingSettingsAdmin = async () => {
  const response = await adminApi.get("/admin/shipping-settings");
  return response.data;
};

export const updateShippingSettings = async (data) => {
  const response = await adminApi.put("/admin/shipping-settings", data);
  return response.data;
};
export const bulkDeleteProducts = async (ids) => {
  const response = await adminApi.post("/admin/products/bulk-destroy", { ids });
  return response.data;
};

export const bulkToggleProducts = async (ids, field, value) => {
  const response = await adminApi.post("/admin/products/bulk-toggle", {
    ids,
    field,
    value,
  });
  return response.data;
};
export const bulkApproveReviews = async (ids) => {
  const response = await adminApi.post("/admin/reviews/bulk-approve", { ids });
  return response.data;
};

export const bulkRejectReviews = async (ids) => {
  const response = await adminApi.post("/admin/reviews/bulk-reject", { ids });
  return response.data;
};

export const bulkDeleteReviews = async (ids) => {
  const response = await adminApi.post("/admin/reviews/bulk-destroy", { ids });
  return response.data;
};
export const bulkMarkContactsRead = async (ids) => {
  const response = await adminApi.post("/admin/contacts/bulk-read", { ids });
  return response.data;
};

export const bulkDeleteContacts = async (ids) => {
  const response = await adminApi.post("/admin/contacts/bulk-destroy", { ids });
  return response.data;
};
export const bulkDeleteSubscribers = async (ids) => {
  const response = await adminApi.post("/admin/newsletter/bulk-destroy", {
    ids,
  });
  return response.data;
};
export const bulkDeleteBlogPosts = async (ids) => {
  const response = await adminApi.post("/admin/blog/bulk-destroy", { ids });
  return response.data;
};

export const bulkToggleBlogVisible = async (ids, value) => {
  const response = await adminApi.post("/admin/blog/bulk-toggle-visible", {
    ids,
    value,
  });
  return response.data;
};
export const getStockRequests = async (params = {}) => {
  const response = await adminApi.get("/admin/stock-requests", { params });
  return response.data;
};

export const markStockRequestNotified = async (id) => {
  const response = await adminApi.put(`/admin/stock-requests/${id}/notified`);
  return response.data;
};

export const sendStockAvailabilityEmail = async (id) => {
  const response = await adminApi.post(
    `/admin/stock-requests/${id}/send-email`,
  );
  return response.data;
};
export const getCategoryShowcase = async () => {
  const response = await adminApi.get("/admin/category-showcase");
  return response.data;
};

export const createCategoryShowcase = async (data) => {
  const response = await adminApi.post("/admin/category-showcase", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const updateCategoryShowcase = async (id, data) => {
  const response = await adminApi.post(`/admin/category-showcase/${id}`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const deleteCategoryShowcase = async (id) => {
  const response = await adminApi.delete(`/admin/category-showcase/${id}`);
  return response.data;
};

export const reorderCategoryShowcase = async (order) => {
  const response = await adminApi.post("/admin/category-showcase/reorder", {
    order,
  });
  return response.data;
};
export const getFeaturedSection = async () => {
  const response = await adminApi.get("/admin/featured-section");
  return response.data;
};

export const updateFeaturedSection = async (data) => {
  const response = await adminApi.put("/admin/featured-section", data);
  return response.data;
};

export const searchFeaturedProducts = async (q) => {
  const response = await adminApi.get(
    "/admin/featured-section/products/search",
    {
      params: { q },
    },
  );
  return response.data;
};
export const reorderCategories = async (order) => {
  const response = await adminApi.post("/admin/categories/reorder", { order });
  return response.data;
};
export const addFeaturedProduct = async (productId) => {
  const response = await adminApi.post(
    `/admin/featured-section/products/${productId}`,
  );
  return response.data;
};

export const removeFeaturedProduct = async (productId) => {
  const response = await adminApi.delete(
    `/admin/featured-section/products/${productId}`,
  );
  return response.data;
};

export const deleteStockRequest = async (id) => {
  const response = await adminApi.delete(`/admin/stock-requests/${id}`);
  return response.data;
};
export const downloadProductTemplate = () => {
  const headers = [
    "name",
    "reference",
    "price",
    "promo_price",
    "stock",
    "category",
    "brand",
    "description",
    "short_description",
    "is_featured",
    "is_new",
    "is_promo",
    "is_bestseller",
  ];

  const example = [
    "Crème hydratante",
    "REF-001",
    29.9,
    "",
    50,
    "Visage",
    "Avène",
    "Description complète",
    "Description courte",
    0,
    1,
    0,
    0,
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, example]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Produits");
  XLSX.writeFile(wb, "modele_produits.xlsx");
};
export const syncCategoryBrands = async (categoryId, brandIds) => {
  const response = await adminApi.put(
    `/admin/categories/${categoryId}/brands`,
    {
      brand_ids: brandIds,
    },
  );
  return response.data;
};
// ========================================
// CODES PROMO
// ========================================
export const getPromoCodes = async (params = {}) => {
  const response = await adminApi.get("/admin/promo-codes", { params });
  return response.data;
};

export const createPromoCode = async (data) => {
  const response = await adminApi.post("/admin/promo-codes", data);
  return response.data;
};

export const updatePromoCode = async (id, data) => {
  const response = await adminApi.put(`/admin/promo-codes/${id}`, data);
  return response.data;
};

export const togglePromoCodeActive = async (id) => {
  const response = await adminApi.patch(`/admin/promo-codes/${id}/toggle`);
  return response.data;
};

export const deletePromoCode = async (id) => {
  const response = await adminApi.delete(`/admin/promo-codes/${id}`);
  return response.data;
};
// ========================================
// VIDÉOS PAGE D'ACCUEIL
// ========================================
export const getHomepageVideoPositions = async () => {
  const response = await adminApi.get("/admin/homepage-video-positions");
  return response.data;
};

export const getHomepageVideos = async () => {
  const response = await adminApi.get("/admin/homepage-videos");
  return response.data;
};

export const saveHomepageVideo = async (formData) => {
  const response = await adminApi.post("/admin/homepage-videos", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const toggleHomepageVideoActive = async (id) => {
  const response = await adminApi.patch(`/admin/homepage-videos/${id}/toggle`);
  return response.data;
};

export const deleteHomepageVideo = async (id) => {
  const response = await adminApi.delete(`/admin/homepage-videos/${id}`);
  return response.data;
};
// ========================================
// CAMPAGNES DE PROMOTION
// ========================================
export const getPromoCampaigns = async () => {
  const response = await adminApi.get("/admin/promo-campaigns");
  return response.data;
};

export const createPromoCampaign = async (data) => {
  const response = await adminApi.post("/admin/promo-campaigns", data);
  return response.data;
};

export const updatePromoCampaign = async (id, data) => {
  const response = await adminApi.put(`/admin/promo-campaigns/${id}`, data);
  return response.data;
};

export const togglePromoCampaignActive = async (id) => {
  const response = await adminApi.patch(`/admin/promo-campaigns/${id}/toggle`);
  return response.data;
};

export const deletePromoCampaign = async (id) => {
  const response = await adminApi.delete(`/admin/promo-campaigns/${id}`);
  return response.data;
};

export const getPromoCampaignProducts = async (id) => {
  const response = await adminApi.get(`/admin/promo-campaigns/${id}/products`);
  return response.data;
};

export const searchPromoCampaignAvailable = async (id, params = {}) => {
  const response = await adminApi.get(`/admin/promo-campaigns/${id}/search`, {
    params,
  });
  return response.data;
};

export const addPromoCampaignProducts = async (id, productIds) => {
  const response = await adminApi.post(
    `/admin/promo-campaigns/${id}/products`,
    {
      product_ids: productIds,
    },
  );
  return response.data;
};

export const removePromoCampaignProducts = async (id, productIds) => {
  const response = await adminApi.post(
    `/admin/promo-campaigns/${id}/products/remove`,
    { product_ids: productIds },
  );
  return response.data;
};
export const importMainImagesZip = async (file) => {
  const fd = new FormData();
  fd.append("zip", file);
  const response = await adminApi.post(
    "/admin/products/import-main-images-zip",
    fd,
    {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 10 * 60 * 1000,
    },
  );
  return response.data;
};

export const importOptionalImagesZip = async (file) => {
  const fd = new FormData();
  fd.append("zip", file);
  const response = await adminApi.post(
    "/admin/products/import-optional-images-zip",
    fd,
    {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 10 * 60 * 1000,
    },
  );
  return response.data;
};
export const importBrandsExcel = async (file) => {
  const fd = new FormData();
  fd.append("file", file);
  const response = await adminApi.post("/admin/brands/import", fd, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 10 * 60 * 1000,
  });
  return response.data;
};

export const importBrandLogosZip = async (file) => {
  const fd = new FormData();
  fd.append("zip", file);
  const response = await adminApi.post("/admin/brands/import-logos-zip", fd, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 10 * 60 * 1000,
  });
  return response.data;
};
