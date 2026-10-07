import adminApi from "./adminApi";

// ══════════════ COFFRETS ══════════════
export const getAdminBundles = async (params = {}) => {
  const response = await adminApi.get("/admin/bundles", { params });
  return response.data;
};

export const getAdminBundle = async (id) => {
  const response = await adminApi.get(`/admin/bundles/${id}`);
  return response.data;
};

export const searchBundleProducts = async (q) => {
  const response = await adminApi.get("/admin/bundles/products/search", {
    params: { q },
  });
  return response.data;
};

export const createBundle = async (formData) => {
  const response = await adminApi.post("/admin/bundles", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const updateBundle = async (id, formData) => {
  const response = await adminApi.post(`/admin/bundles/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const deleteBundle = async (id) => {
  const response = await adminApi.delete(`/admin/bundles/${id}`);
  return response.data;
};

// ══════════════ CATÉGORIES DE COFFRETS ══════════════
export const getAdminBundleCategories = async () => {
  const response = await adminApi.get("/admin/bundle-categories");
  return response.data;
};

export const createBundleCategory = async (data) => {
  const response = await adminApi.post("/admin/bundle-categories", data);
  return response.data;
};

export const updateBundleCategory = async (id, data) => {
  const response = await adminApi.put(`/admin/bundle-categories/${id}`, data);
  return response.data;
};

export const deleteBundleCategory = async (id) => {
  const response = await adminApi.delete(`/admin/bundle-categories/${id}`);
  return response.data;
};

export const reorderBundleCategories = async (order) => {
  const response = await adminApi.post("/admin/bundle-categories/reorder", {
    order,
  });
  return response.data;
};
