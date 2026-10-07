import adminApi from "./adminApi";

// ══════════════ SOLUTIONS ══════════════
export const getAdminQuizSolutions = async () => {
  const response = await adminApi.get("/admin/quiz/solutions");
  return response.data;
};

export const createQuizSolution = async (data) => {
  const response = await adminApi.post("/admin/quiz/solutions", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const updateQuizSolution = async (id, data) => {
  const response = await adminApi.post(`/admin/quiz/solutions/${id}`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const deleteQuizSolution = async (id) => {
  const response = await adminApi.delete(`/admin/quiz/solutions/${id}`);
  return response.data;
};

export const toggleQuizSolution = async (id) => {
  const response = await adminApi.patch(`/admin/quiz/solutions/${id}/toggle`);
  return response.data;
};

// ══════════════ QUESTIONS ══════════════
export const getAdminQuizQuestions = async (solutionId) => {
  const response = await adminApi.get(
    `/admin/quiz/solutions/${solutionId}/questions`,
  );
  return response.data;
};

export const createQuizQuestion = async (data) => {
  const response = await adminApi.post("/admin/quiz/questions", data);
  return response.data;
};

export const updateQuizQuestion = async (id, data) => {
  const response = await adminApi.put(`/admin/quiz/questions/${id}`, data);
  return response.data;
};

export const deleteQuizQuestion = async (id) => {
  const response = await adminApi.delete(`/admin/quiz/questions/${id}`);
  return response.data;
};

export const toggleQuizQuestion = async (id) => {
  const response = await adminApi.patch(`/admin/quiz/questions/${id}/toggle`);
  return response.data;
};

export const getSuggestedTags = async (solutionId) => {
  const response = await adminApi.get(
    `/admin/quiz/solutions/${solutionId}/suggested-tags`,
  );
  return response.data;
};
