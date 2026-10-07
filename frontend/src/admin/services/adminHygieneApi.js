import adminApi from "./adminApi";

export const getAdminHygieneSections = async () => {
  const response = await adminApi.get("/admin/hygiene-section");
  return response.data;
};

export const getAdminHygieneSectionById = async (id) => {
  const response = await adminApi.get(`/admin/hygiene-section/${id}`);
  return response.data;
};

export const createHygieneSection = async (formData) => {
  const response = await adminApi.post("/admin/hygiene-section", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const updateHygieneSectionById = async (id, formData) => {
  const response = await adminApi.post(
    `/admin/hygiene-section/${id}`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return response.data;
};

export const deleteHygieneSection = async (id) => {
  const response = await adminApi.delete(`/admin/hygiene-section/${id}`);
  return response.data;
};

export const reorderHygieneSections = async (order) => {
  const response = await adminApi.post("/admin/hygiene-section/reorder", {
    order,
  });
  return response.data;
};
