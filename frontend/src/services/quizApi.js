import api from "./api";

export const getQuizSolutions = async () => {
  const response = await api.get("/quiz/solutions");
  return response.data;
};

export const getQuizQuestions = async (solutionSlug) => {
  const response = await api.get(`/quiz/solutions/${solutionSlug}/questions`);
  return response.data;
};

export const submitQuiz = async (solutionId, answers) => {
  const response = await api.post("/quiz/submit", {
    solution_id: solutionId,
    answers,
  });
  return response.data;
};
