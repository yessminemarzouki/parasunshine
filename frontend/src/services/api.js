import axios from "axios";
import { API_URL } from "../config/api";
import { cachedFetch } from "../utils/cache";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
    }
    return Promise.reject(error);
  },
);

// ── AUTH ──
export const login = async (credentials) => {
  const response = await api.post("/login", credentials);
  return response.data;
};

export const register = async (userData) => {
  const response = await api.post("/register", userData);
  return response.data;
};

export const logout = async () => {
  const response = await api.post("/logout");
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get("/me");
  return response.data;
};

export const updateProfile = async (data) => {
  const response = await api.put("/user/profile", data);
  return response.data;
};

export const updatePassword = async (data) => {
  const response = await api.put("/user/password", data);
  return response.data;
};
export const exchangeGoogleCode = async (code) => {
  const response = await api.post("/auth/google/exchange", { code });
  return response.data;
};
export const sendPasswordResetLink = async (email) => {
  const response = await api.post("/password/email", { email });
  return response.data;
};

export const resetPassword = async (data) => {
  const response = await api.post("/password/reset", data);
  return response.data;
};

export const getGoogleAuthUrl = async () => {
  const response = await api.get("/auth/google");
  return response.data;
};

// ── PRODUITS ──
export const fetchProducts = async (params = {}) => {
  const response = await api.get("/products", { params });
  return response.data;
};

export const fetchProduct = async (slug) => {
  return cachedFetch(`${API_URL}/products/${slug}`);
};

export const fetchFeaturedProducts = async () => {
  const response = await api.get("/products/featured");
  return response.data;
};

export const fetchPromoProducts = async () => {
  const response = await api.get("/products/promotions");
  return response.data;
};

export const fetchBestsellerProducts = async () => {
  const response = await api.get("/products/bestsellers");
  return response.data;
};

// ── CATÉGORIES ──
export const fetchCategories = async () => {
  const response = await api.get("/categories");
  return response.data;
};

// ── COMMANDES ──
export const createOrder = async (orderData) => {
  const response = await api.post("/orders", orderData);
  return response.data;
};

export const getOrders = async () => {
  const response = await api.get("/orders");
  return response.data;
};

export const getOrder = async (id) => {
  const response = await api.get(`/orders/${id}`);
  return response.data;
};

// ── WISHLIST ──
export const getWishlist = async () => {
  const response = await api.get("/wishlist");
  return response.data;
};

export const addToWishlistApi = async (productId) => {
  const response = await api.post("/wishlist", { product_id: productId });
  return response.data;
};

export const removeFromWishlistApi = async (productId) => {
  const response = await api.delete(`/wishlist/${productId}`);
  return response.data;
};

// Alias pour compatibilité
export const addToWishlist = addToWishlistApi;
export const removeFromWishlist = removeFromWishlistApi;

// ── NEWSLETTER ──
export const subscribeNewsletter = async (email) => {
  const response = await api.post("/newsletter/subscribe", { email });
  return response.data;
};

// ── CONTACT ──
export const sendContact = async (data) => {
  const response = await api.post("/contact", data);
  return response.data;
};

// ── AVIS ──
export const getProductReviews = async (productId) => {
  return cachedFetch(`${API_URL}/products/${productId}/reviews`);
};

export const submitReview = async (productId, data) => {
  const response = await api.post(`/reviews`, {
    product_id: productId,
    ...data,
  });
  return response.data;
};

// ── ADRESSES ──
export const getAddresses = async () => {
  const response = await api.get("/addresses");
  return response.data;
};

export const createAddress = async (data) => {
  const response = await api.post("/addresses", data);
  return response.data;
};

export const updateAddress = async (id, data) => {
  const response = await api.put(`/addresses/${id}`, data);
  return response.data;
};

export const deleteAddress = async (id) => {
  const response = await api.delete(`/addresses/${id}`);
  return response.data;
};

export const setDefaultAddress = async (id) => {
  const response = await api.put(`/addresses/${id}/default`);
  return response.data;
};

// ── PANIER ABANDONNÉ ──
export const saveAbandonedCart = async (data) => {
  const response = await api.post("/abandoned-cart", data);
  return response.data;
};

// ── PARAMÈTRES DE LIVRAISON ──
export const getShippingSettings = async () => {
  const response = await api.get("/shipping-settings");
  return response.data;
};
export const getCategoryShowcase = async () => {
  const response = await api.get("/category-showcase");
  return response.data;
};
export const getFeaturedSection = async () => {
  const response = await api.get("/featured-section");
  return response.data;
};

// ── DEMANDES DE STOCK ──
export const getMyStockRequests = async () => {
  const response = await api.get("/my-stock-requests");
  return response.data;
};

// ── COFFRETS ──
export const getBundles = async (params = {}) => {
  const response = await api.get("/bundles", { params });
  return response.data;
};

export const getBundle = async (slug) => {
  const response = await api.get(`/bundles/${slug}`);
  return response.data;
};

export const getBundleCategories = async () => {
  const response = await api.get("/bundle-categories");
  return response.data;
};

export const getBundleReviews = async (bundleId) => {
  const response = await api.get(`/bundles/${bundleId}/reviews`);
  return response.data;
};

export const submitBundleReview = async (bundleId, data) => {
  const response = await api.post(`/bundle-reviews`, {
    bundle_id: bundleId,
    ...data,
  });
  return response.data;
};

export const addBundleToWishlistApi = async (bundleId) => {
  const response = await api.post("/wishlist/bundle", { bundle_id: bundleId });
  return response.data;
};

export const removeBundleFromWishlistApi = async (bundleId) => {
  const response = await api.delete(`/wishlist/bundle/${bundleId}`);
  return response.data;
};
// ── CODES PROMO ──
export const validatePromoCode = async (code, cartItems) => {
  const items = cartItems.map((item) => ({
    product_id: item.isBundle ? null : item.id,
    bundle_id: item.isBundle ? item.bundleId : null,
    quantity: item.quantity,
  }));
  const response = await api.post("/promo-codes/validate", { code, items });
  return response.data;
};
// ── VIDÉOS PAGE D'ACCUEIL ──
export const getHomepageVideos = async () => {
  return cachedFetch(`${API_URL}/homepage-videos`);
};
export const getHeroSlides = async () => {
  return cachedFetch(`${API_URL}/hero-slides`);
};
// ── AVIS — gestion de son propre avis ──
export const checkUserReview = async (productId) => {
  const response = await api.get(`/reviews/check/${productId}`);
  return response.data;
};

export const deleteReview = async (id) => {
  const response = await api.delete(`/reviews/${id}`);
  return response.data;
};

export const updateReview = async (id, data) => {
  const response = await api.put(`/reviews/${id}`, data);
  return response.data;
};

export default api;
