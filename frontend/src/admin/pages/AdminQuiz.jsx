import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Edit,
  ToggleLeft,
  ToggleRight,
  X,
  ArrowLeft,
  Upload,
  GitBranch,
  Wand2,
} from "lucide-react";
import {
  getAdminQuizSolutions,
  createQuizSolution,
  updateQuizSolution,
  deleteQuizSolution,
  toggleQuizSolution,
  getAdminQuizQuestions,
  createQuizQuestion,
  updateQuizQuestion,
  deleteQuizQuestion,
  toggleQuizQuestion,
  getSuggestedTags,
} from "../services/adminQuizApi";
import { getAdminCategories } from "../services/adminApi";
import { STORAGE_URL } from "../../config/api";
import {
  PageHeader,
  Btn,
  Modal,
  Spinner,
  Badge,
  ActionBtn,
} from "../components/AdminShared";

const emptySolutionForm = {
  name: "",
  description: "",
  category_id: "",
  order: 0,
  is_active: true,
  advice_video_title: "",
};

const emptyQuestionForm = {
  question: "",
  subtitle: "",
  order: 0,
  is_skippable: true,
  show_if_option_id: "",
  options: [
    { label: "", tags: [""], weight: 1 },
    { label: "", tags: [""], weight: 1 },
  ],
};
// ── Modal de confirmation custom ──
const ConfirmModal = ({ title, message, onConfirm, onCancel, deleting }) => (
  <div
    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
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
        {message || (
          <>
            Voulez-vous vraiment supprimer <strong>"{title}"</strong> ?
          </>
        )}
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
export default function AdminQuiz() {
  // ── Navigation à 2 niveaux ──
  const [view, setView] = useState("solutions"); // "solutions" | "questions"
  const [activeSolution, setActiveSolution] = useState(null);

  // ── Solutions ──
  const [solutions, setSolutions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingSolutions, setLoadingSolutions] = useState(true);
  const [solutionModalOpen, setSolutionModalOpen] = useState(false);
  const [editingSolution, setEditingSolution] = useState(null);
  const [solutionForm, setSolutionForm] = useState(emptySolutionForm);
  const [solutionImageFile, setSolutionImageFile] = useState(null);
  const [adviceVideoFile, setAdviceVideoFile] = useState(null);
  const [adviceVideoPreview, setAdviceVideoPreview] = useState(null);
  const [adviceVideoPosterFile, setAdviceVideoPosterFile] = useState(null);
  const [removeAdviceVideo, setRemoveAdviceVideo] = useState(false);
  const [savingSolution, setSavingSolution] = useState(false);

  // ── Questions ──
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionForm, setQuestionForm] = useState(emptyQuestionForm);
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // ← ajoute
  const [deleting, setDeleting] = useState(false); // ← ajoute
  const [error, setError] = useState("");
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    fetchSolutions();
    getAdminCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  // ══════════════ SOLUTIONS ══════════════

  const fetchSolutions = async () => {
    setLoadingSolutions(true);
    try {
      const data = await getAdminQuizSolutions();
      setSolutions(data);
    } catch {
      setError("Erreur lors du chargement des parcours.");
    } finally {
      setLoadingSolutions(false);
    }
  };

  const openCreateSolution = () => {
    setEditingSolution(null);
    setSolutionForm(emptySolutionForm);
    setSolutionImageFile(null);
    setAdviceVideoFile(null);
    setAdviceVideoPreview(null);
    setAdviceVideoPosterFile(null);
    setRemoveAdviceVideo(false);
    setSolutionModalOpen(true);
  };

  const openEditSolution = (s) => {
    setEditingSolution(s);
    setSolutionForm({
      name: s.name,
      description: s.description || "",
      category_id: s.category_id || "",
      order: s.order,
      is_active: s.is_active,
      advice_video_title: s.advice_video_title || "",
    });
    setSolutionImageFile(null);
    setAdviceVideoFile(null);
    setAdviceVideoPreview(
      s.advice_video ? `${STORAGE_URL}/${s.advice_video}` : null,
    );
    setAdviceVideoPosterFile(null);
    setRemoveAdviceVideo(false);
    setSolutionModalOpen(true);
  };

  const handleSaveSolution = async () => {
    setError("");
    if (!solutionForm.name.trim()) {
      setError("Le nom du parcours est obligatoire.");
      return;
    }
    setSavingSolution(true);
    try {
      const fd = new FormData();
      Object.entries(solutionForm).forEach(([k, v]) => {
        if (typeof v === "boolean") fd.append(k, v ? "1" : "0");
        else if (v !== "" && v !== null) fd.append(k, v);
      });
      if (solutionImageFile) fd.append("image", solutionImageFile);
      if (adviceVideoFile) fd.append("advice_video", adviceVideoFile);
      if (adviceVideoPosterFile)
        fd.append("advice_video_poster", adviceVideoPosterFile);
      if (removeAdviceVideo) fd.append("remove_advice_video", "1");

      if (editingSolution) {
        await updateQuizSolution(editingSolution.id, fd);
      } else {
        await createQuizSolution(fd);
      }
      setSolutionModalOpen(false);
      fetchSolutions();
    } catch {
      setError("Erreur lors de la sauvegarde du parcours.");
    } finally {
      setSavingSolution(false);
    }
  };

  const requestDeleteSolution = (solution) =>
    setConfirmDelete({ type: "solution", item: solution });

  const confirmDeleteSolution = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deleteQuizSolution(confirmDelete.item.id);
      setConfirmDelete(null);
      fetchSolutions();
    } catch {
      setError("Erreur lors de la suppression.");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleSolution = async (id) => {
    try {
      await toggleQuizSolution(id);
      fetchSolutions();
    } catch {
      setError("Erreur lors du changement de statut.");
    }
  };

  const openSolutionQuestions = (solution) => {
    setActiveSolution(solution);
    setView("questions");
    fetchQuestions(solution.id);
    fetchSuggestedTags(solution.id);
  };

  const fetchSuggestedTags = async (solutionId) => {
    setLoadingSuggestions(true);
    try {
      const data = await getSuggestedTags(solutionId);
      setSuggestedTags(data.suggestions || []);
    } catch {
      setSuggestedTags([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // ══════════════ QUESTIONS ══════════════

  const fetchQuestions = async (solutionId) => {
    setLoadingQuestions(true);
    try {
      const data = await getAdminQuizQuestions(solutionId);
      setQuestions(data);
    } catch {
      setError("Erreur lors du chargement des questions.");
    } finally {
      setLoadingQuestions(false);
    }
  };

  const openCreateQuestion = () => {
    setEditingQuestion(null);
    setQuestionForm(emptyQuestionForm);
    setQuestionModalOpen(true);
  };

  const openEditQuestion = (q) => {
    setEditingQuestion(q);
    setQuestionForm({
      question: q.question,
      subtitle: q.subtitle || "",
      order: q.order,
      is_skippable: q.is_skippable,
      show_if_option_id: q.show_if_option_id || "",
      options: q.options.map((o) => ({
        label: o.label,
        tags: o.tags,
        weight: o.weight,
      })),
    });
    setQuestionModalOpen(true);
  };

  const handleSaveQuestion = async () => {
    setError("");
    if (!questionForm.question.trim()) {
      setError("La question est obligatoire.");
      return;
    }
    for (const opt of questionForm.options) {
      if (!opt.label.trim()) {
        setError("Toutes les options doivent avoir un libellé.");
        return;
      }
      if (opt.tags.filter((t) => t.trim()).length === 0) {
        setError("Chaque option doit avoir au moins un tag.");
        return;
      }
    }

    setSavingQuestion(true);
    try {
      const payload = {
        solution_id: activeSolution.id,
        ...questionForm,
        show_if_option_id: questionForm.show_if_option_id || null,
        options: questionForm.options.map((o) => ({
          ...o,
          tags: o.tags.filter((t) => t.trim()),
          weight: o.weight || 1,
        })),
      };

      if (editingQuestion) {
        await updateQuizQuestion(editingQuestion.id, payload);
      } else {
        await createQuizQuestion(payload);
      }
      setQuestionModalOpen(false);
      fetchQuestions(activeSolution.id);
    } catch {
      setError("Erreur lors de la sauvegarde de la question.");
    } finally {
      setSavingQuestion(false);
    }
  };

  const requestDeleteQuestion = (question) =>
    setConfirmDelete({ type: "question", item: question });

  const confirmDeleteQuestion = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deleteQuizQuestion(confirmDelete.item.id);
      setConfirmDelete(null);
      fetchQuestions(activeSolution.id);
    } catch {
      setError("Erreur lors de la suppression.");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleQuestion = async (id) => {
    try {
      await toggleQuizQuestion(id);
      fetchQuestions(activeSolution.id);
    } catch {
      setError("Erreur lors du changement de statut.");
    }
  };

  // ── Gestion options du formulaire question ──
  const addOption = () => {
    setQuestionForm((f) => ({
      ...f,
      options: [...f.options, { label: "", tags: [""], weight: 1 }],
    }));
  };

  const removeOption = (i) => {
    setQuestionForm((f) => ({
      ...f,
      options: f.options.filter((_, idx) => idx !== i),
    }));
  };

  const updateOption = (i, field, value) => {
    setQuestionForm((f) => ({
      ...f,
      options: f.options.map((o, idx) =>
        idx === i ? { ...o, [field]: value } : o,
      ),
    }));
  };

  const addTag = (optIdx) => {
    setQuestionForm((f) => ({
      ...f,
      options: f.options.map((o, idx) =>
        idx === optIdx ? { ...o, tags: [...o.tags, ""] } : o,
      ),
    }));
  };
  const addSuggestedTag = (optIdx, word) => {
    setQuestionForm((f) => ({
      ...f,
      options: f.options.map((o, idx) => {
        if (idx !== optIdx) return o;
        if (o.tags.includes(word)) return o; // déjà présent
        // Remplace le premier tag vide s'il y en a un, sinon ajoute
        const emptyIdx = o.tags.findIndex((t) => !t.trim());
        const newTags =
          emptyIdx !== -1
            ? o.tags.map((t, ti) => (ti === emptyIdx ? word : t))
            : [...o.tags, word];
        return { ...o, tags: newTags };
      }),
    }));
  };

  const updateTag = (optIdx, tagIdx, value) => {
    setQuestionForm((f) => ({
      ...f,
      options: f.options.map((o, idx) =>
        idx === optIdx
          ? { ...o, tags: o.tags.map((t, ti) => (ti === tagIdx ? value : t)) }
          : o,
      ),
    }));
  };

  const removeTag = (optIdx, tagIdx) => {
    setQuestionForm((f) => ({
      ...f,
      options: f.options.map((o, idx) =>
        idx === optIdx
          ? { ...o, tags: o.tags.filter((_, ti) => ti !== tagIdx) }
          : o,
      ),
    }));
  };
  const FRENCH_STOPWORDS = new Set([
    "le",
    "la",
    "les",
    "un",
    "une",
    "des",
    "de",
    "du",
    "et",
    "ou",
    "à",
    "au",
    "aux",
    "en",
    "pour",
    "avec",
    "sans",
    "sur",
    "sous",
    "dans",
    "par",
    "ce",
    "cet",
    "cette",
    "ces",
    "mon",
    "ma",
    "mes",
    "ton",
    "ta",
    "tes",
    "son",
    "sa",
    "ses",
    "notre",
    "votre",
    "leur",
    "je",
    "tu",
    "il",
    "elle",
    "nous",
    "vous",
    "ils",
    "elles",
    "est",
    "sont",
    "être",
    "avoir",
    "qui",
    "que",
    "quoi",
    "où",
    "quel",
    "quelle",
    "quels",
    "quelles",
    "plus",
    "moins",
    "très",
    "peu",
    "bien",
    "mal",
  ]);

  const normalizeForTag = (text) =>
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""); // retire les accents

  const generateTagsFromLabel = (optIdx) => {
    const label = questionForm.options[optIdx].label;
    if (!label.trim()) return;

    const words = normalizeForTag(label)
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !FRENCH_STOPWORDS.has(w));

    const uniqueWords = [...new Set(words)];

    if (uniqueWords.length === 0) return;

    setQuestionForm((f) => ({
      ...f,
      options: f.options.map((o, idx) =>
        idx === optIdx ? { ...o, tags: uniqueWords } : o,
      ),
    }));
  };

  // Options disponibles pour le branchement (toutes les options des autres questions du même parcours)
  const branchableOptions = questions
    .filter((q) => !editingQuestion || q.id !== editingQuestion.id)
    .flatMap((q) =>
      q.options.map((o) => ({
        id: o.id,
        label: `"${q.question}" → ${o.label}`,
      })),
    );

  // ══════════════ RENDU ══════════════

  if (view === "questions" && activeSolution) {
    return (
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {confirmDelete?.type === "question" && (
          <ConfirmModal
            title={confirmDelete.item.question}
            onConfirm={confirmDeleteQuestion}
            onCancel={() => setConfirmDelete(null)}
            deleting={deleting}
          />
        )}

        <button
          onClick={() => setView("solutions")}
          className="flex items-center gap-2 text-[13px] font-semibold text-gray-500 hover:text-[#1a5242] mb-4 transition-colors"
        >
          <ArrowLeft size={15} /> Retour aux parcours
        </button>

        <PageHeader
          title={`Questions — ${activeSolution.name}`}
          subtitle={`${questions.length} question${questions.length > 1 ? "s" : ""}`}
          action={
            <Btn onClick={openCreateQuestion}>
              <Plus size={15} /> Nouvelle question
            </Btn>
          }
        />

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-[13.5px]">
            {error}
          </div>
        )}

        {loadingQuestions ? (
          <Spinner />
        ) : questions.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-[15px] mb-4">
              Aucune question dans ce parcours.
            </p>
            <Btn onClick={openCreateQuestion}>
              <Plus size={15} /> Créer la première question
            </Btn>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q, idx) => (
              <div
                key={q.id}
                className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="w-7 h-7 rounded-lg bg-[#1a5242]/10 text-[#1a5242] text-[12px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[14px] font-semibold text-gray-900">
                          {q.question}
                        </p>
                        {q.show_if_option_id && (
                          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-full flex-shrink-0">
                            <GitBranch size={9} /> Conditionnelle
                          </span>
                        )}
                        {!q.is_skippable && (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-full flex-shrink-0">
                            Obligatoire
                          </span>
                        )}
                      </div>
                      {q.subtitle && (
                        <p className="text-[12px] text-gray-400 mb-2">
                          {q.subtitle}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {q.options.map((opt) => (
                          <div
                            key={opt.id}
                            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[12px] text-gray-600"
                          >
                            <span className="font-semibold">{opt.label}</span>
                            <span className="text-gray-400 ml-1">
                              — {opt.tags.join(", ")} (poids: {opt.weight})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                    <Badge type={q.is_active ? "success" : "warning"}>
                      {q.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <ActionBtn
                      type="info"
                      onClick={() => handleToggleQuestion(q.id)}
                      title={q.is_active ? "Désactiver" : "Activer"}
                    >
                      {q.is_active ? (
                        <ToggleRight size={14} />
                      ) : (
                        <ToggleLeft size={14} />
                      )}
                    </ActionBtn>
                    <ActionBtn
                      type="warning"
                      onClick={() => openEditQuestion(q)}
                      title="Modifier"
                    >
                      <Edit size={13} />
                    </ActionBtn>
                    <ActionBtn
                      type="danger"
                      onClick={() => requestDeleteQuestion(q)}
                      title="Supprimer"
                    >
                      <Trash2 size={13} />
                    </ActionBtn>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Question */}
        {questionModalOpen && (
          <Modal
            title={
              editingQuestion ? "Modifier la question" : "Nouvelle question"
            }
            onClose={() => setQuestionModalOpen(false)}
            maxWidth="max-w-2xl"
          >
            <div className="space-y-5">
              {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-[13px]">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                  Question *
                </label>
                <input
                  type="text"
                  value={questionForm.question}
                  onChange={(e) =>
                    setQuestionForm((f) => ({ ...f, question: e.target.value }))
                  }
                  placeholder="Ex: Quel est votre type de peau ?"
                  className="w-full h-11 px-4 border border-gray-200 rounded-xl text-[13.5px] outline-none focus:border-[#1a5242]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                  Sous-titre (optionnel)
                </label>
                <input
                  type="text"
                  value={questionForm.subtitle}
                  onChange={(e) =>
                    setQuestionForm((f) => ({ ...f, subtitle: e.target.value }))
                  }
                  placeholder="Ex: Cela nous aide à affiner nos recommandations"
                  className="w-full h-11 px-4 border border-gray-200 rounded-xl text-[13.5px] outline-none focus:border-[#1a5242]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                  Question conditionnelle (branchement)
                </label>
                <select
                  value={questionForm.show_if_option_id}
                  onChange={(e) =>
                    setQuestionForm((f) => ({
                      ...f,
                      show_if_option_id: e.target.value,
                    }))
                  }
                  className="w-full h-11 px-4 border border-gray-200 rounded-xl text-[13.5px] outline-none focus:border-[#1a5242] bg-white"
                >
                  <option value="">Toujours afficher (pas de condition)</option>
                  {branchableOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-400 mt-1">
                  Cette question ne s'affichera que si le client a choisi
                  l'option sélectionnée ci-dessus dans une question précédente.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                    Ordre d'affichage
                  </label>
                  <input
                    type="number"
                    value={questionForm.order}
                    onChange={(e) =>
                      setQuestionForm((f) => ({
                        ...f,
                        order: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full h-11 px-4 border border-gray-200 rounded-xl text-[13.5px] outline-none focus:border-[#1a5242]"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={questionForm.is_skippable}
                      onChange={(e) =>
                        setQuestionForm((f) => ({
                          ...f,
                          is_skippable: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 accent-[#1a5242]"
                    />
                    <span className="text-[13.5px] font-semibold text-gray-700">
                      Le client peut passer cette question
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[13px] font-semibold text-gray-700">
                    Options de réponse *
                  </label>
                  <button
                    onClick={addOption}
                    className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#1a5242] hover:opacity-70 transition-opacity"
                  >
                    <Plus size={14} /> Ajouter une option
                  </button>
                </div>

                <div className="space-y-4">
                  {questionForm.options.map((opt, i) => (
                    <div
                      key={i}
                      className="p-4 bg-gray-50 border border-gray-200 rounded-xl"
                    >
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#1a5242] text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-2">
                          {i + 1}
                        </span>
                        <div className="flex-1 space-y-3">
                          <div className="flex flex-col sm:flex-row gap-3">
                            <input
                              type="text"
                              value={opt.label}
                              onChange={(e) =>
                                updateOption(i, "label", e.target.value)
                              }
                              placeholder="Ex: Peau sèche"
                              className="flex-1 h-10 px-3 border border-gray-200 rounded-lg text-[13px] bg-white outline-none focus:border-[#1a5242]"
                            />
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span className="text-[11px] text-gray-400">
                                Poids
                              </span>
                              <input
                                type="number"
                                min={1}
                                max={10}
                                value={opt.weight}
                                onChange={(e) =>
                                  updateOption(
                                    i,
                                    "weight",
                                    parseInt(e.target.value) || 1,
                                  )
                                }
                                className="w-14 h-10 px-2 border border-gray-200 rounded-lg text-[13px] bg-white outline-none focus:border-[#1a5242] text-center"
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-[11.5px] font-semibold text-gray-500">
                                Tags de matching (mots-clés pour trouver les
                                produits)
                              </p>
                              <button
                                type="button"
                                onClick={() => generateTagsFromLabel(i)}
                                disabled={!opt.label.trim()}
                                className="flex items-center gap-1 text-[11px] font-semibold text-[#1a5242] hover:opacity-70 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <Wand2 size={11} /> Générer depuis le libellé
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {opt.tags.map((tag, ti) => (
                                <div
                                  key={ti}
                                  className="flex items-center gap-1"
                                >
                                  <input
                                    type="text"
                                    value={tag}
                                    onChange={(e) =>
                                      updateTag(i, ti, e.target.value)
                                    }
                                    placeholder="Ex: hydratant"
                                    className="h-8 px-2.5 border border-gray-200 rounded-lg text-[12px] bg-white outline-none focus:border-[#1a5242]"
                                    style={{ width: 110 }}
                                  />
                                  {opt.tags.length > 1 && (
                                    <button
                                      onClick={() => removeTag(i, ti)}
                                      className="text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                      <X size={13} />
                                    </button>
                                  )}
                                </div>
                              ))}
                              <button
                                onClick={() => addTag(i)}
                                className="h-8 px-2.5 border border-dashed border-gray-300 rounded-lg text-[12px] text-gray-400 hover:border-[#1a5242] hover:text-[#1a5242] transition-all"
                              >
                                + tag
                              </button>
                            </div>

                            {suggestedTags.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-[10.5px] font-semibold text-gray-400 mb-1.5">
                                  Mots-clés fréquents dans vos produits (cliquez
                                  pour ajouter) :
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {suggestedTags.slice(0, 15).map((word) => (
                                    <button
                                      key={word}
                                      type="button"
                                      onClick={() => addSuggestedTag(i, word)}
                                      className="h-6 px-2 bg-white border border-gray-200 rounded-md text-[11px] text-gray-500 hover:border-[#1a5242] hover:text-[#1a5242] transition-colors"
                                    >
                                      + {word}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {questionForm.options.length > 2 && (
                          <button
                            onClick={() => removeOption(i)}
                            className="text-gray-300 hover:text-red-500 transition-colors mt-2"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setQuestionModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-600 text-[13.5px] font-semibold hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveQuestion}
                  disabled={savingQuestion}
                  className="px-6 py-2.5 bg-[#1a5242] text-white rounded-xl text-[13.5px] font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {savingQuestion
                    ? "Sauvegarde..."
                    : editingQuestion
                      ? "Modifier"
                      : "Créer"}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  // ── Vue Solutions (parcours) ──
  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {confirmDelete?.type === "solution" && (
        <ConfirmModal
          title={confirmDelete.item.name}
          message="Cette action supprimera aussi toutes ses questions."
          onConfirm={confirmDeleteSolution}
          onCancel={() => setConfirmDelete(null)}
          deleting={deleting}
        />
      )}

      <PageHeader
        title="Quiz de recommandation"
        subtitle={`${solutions.length} parcours configuré${solutions.length > 1 ? "s" : ""}`}
        action={
          <Btn onClick={openCreateSolution}>
            <Plus size={15} /> Nouveau parcours
          </Btn>
        }
      />

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-[13.5px]">
          {error}
        </div>
      )}

      {loadingSolutions ? (
        <Spinner />
      ) : solutions.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-[15px] mb-4">Aucun parcours créé.</p>
          <p className="text-[13px] mb-4 max-w-md mx-auto">
            Un parcours représente un besoin client (ex: "Écran solaire",
            "Shampooing", "Soins bébé"). Chaque parcours a ses propres questions
            progressives.
          </p>
          <Btn onClick={openCreateSolution}>
            <Plus size={15} /> Créer le premier parcours
          </Btn>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {solutions.map((s) => (
            <div
              key={s.id}
              className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  {s.image ? (
                    <img
                      src={`${STORAGE_URL}/${s.image}`}
                      alt=""
                      className="w-11 h-11 rounded-xl object-cover border border-gray-100 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-[#1a5242]/10 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold text-gray-900 truncate">
                      {s.name}
                    </p>
                    <p className="text-[11.5px] text-gray-400">
                      {s.category?.name || "Toutes catégories"}
                    </p>
                  </div>
                </div>
                <Badge type={s.is_active ? "success" : "warning"}>
                  {s.is_active ? "Actif" : "Inactif"}
                </Badge>
              </div>

              {s.description && (
                <p className="text-[12.5px] text-gray-500 mb-3 line-clamp-2">
                  {s.description}
                </p>
              )}

              <p className="text-[12px] text-gray-400 mb-4">
                {s.questions_count} question
                {s.questions_count > 1 ? "s" : ""}
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => openSolutionQuestions(s)}
                  className="flex-1 px-3 py-2 bg-[#edf7f3] text-[#1a5242] rounded-lg text-[12.5px] font-semibold hover:opacity-80 transition-opacity"
                >
                  Gérer les questions →
                </button>
                <ActionBtn
                  type="info"
                  onClick={() => handleToggleSolution(s.id)}
                  title={s.is_active ? "Désactiver" : "Activer"}
                >
                  {s.is_active ? (
                    <ToggleRight size={14} />
                  ) : (
                    <ToggleLeft size={14} />
                  )}
                </ActionBtn>
                <ActionBtn
                  type="warning"
                  onClick={() => openEditSolution(s)}
                  title="Modifier"
                >
                  <Edit size={13} />
                </ActionBtn>
                <ActionBtn
                  type="danger"
                  onClick={() => requestDeleteSolution(s)}
                  title="Supprimer"
                >
                  <Trash2 size={13} />
                </ActionBtn>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Solution */}
      {solutionModalOpen && (
        <Modal
          title={editingSolution ? "Modifier le parcours" : "Nouveau parcours"}
          onClose={() => setSolutionModalOpen(false)}
        >
          <div className="space-y-4">
            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-[13px]">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                Nom du parcours *
              </label>
              <input
                type="text"
                value={solutionForm.name}
                onChange={(e) =>
                  setSolutionForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Ex: Écran solaire"
                className="w-full h-11 px-4 border border-gray-200 rounded-xl text-[13.5px] outline-none focus:border-[#1a5242]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                Description courte
              </label>
              <input
                type="text"
                value={solutionForm.description}
                onChange={(e) =>
                  setSolutionForm((f) => ({
                    ...f,
                    description: e.target.value,
                  }))
                }
                placeholder="Ex: Trouvez la protection solaire idéale pour votre peau"
                className="w-full h-11 px-4 border border-gray-200 rounded-xl text-[13.5px] outline-none focus:border-[#1a5242]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                Catégorie de produits associée
              </label>
              <select
                value={solutionForm.category_id}
                onChange={(e) =>
                  setSolutionForm((f) => ({
                    ...f,
                    category_id: e.target.value,
                  }))
                }
                className="w-full h-11 px-4 border border-gray-200 rounded-xl text-[13.5px] outline-none focus:border-[#1a5242] bg-white"
              >
                <option value="">Toutes catégories (aucun filtre)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-400 mt-1">
                Seuls les produits de cette catégorie seront proposés en
                recommandation pour ce parcours.
              </p>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                Image
              </label>
              <div className="flex items-center gap-3">
                <label className="flex-1 flex items-center justify-center gap-2 h-11 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#1a5242] transition-colors text-[12.5px] text-gray-400">
                  <Upload size={15} />
                  {solutionImageFile
                    ? solutionImageFile.name
                    : "Choisir une image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setSolutionImageFile(e.target.files[0])}
                  />
                </label>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <p className="text-[13px] font-semibold text-gray-700 mb-1">
                Vidéo de conseils (optionnelle)
              </p>
              <p className="text-[11px] text-gray-400 mb-3">
                Affichée sur la page de résultat, entre l'explication et les
                produits recommandés — utile pour donner des conseils concrets
                liés à ce besoin.
              </p>

              <input
                type="text"
                value={solutionForm.advice_video_title || ""}
                onChange={(e) =>
                  setSolutionForm((f) => ({
                    ...f,
                    advice_video_title: e.target.value,
                  }))
                }
                placeholder="Titre affiché au-dessus (optionnel)"
                className="w-full h-10 px-3 mb-2.5 border border-gray-200 rounded-lg text-[13px] outline-none focus:border-[#1a5242]"
              />

              <div
                onClick={() =>
                  document.getElementById("advice-video-input").click()
                }
                className="border-2 border-dashed border-gray-200 rounded-xl p-3 text-center cursor-pointer hover:border-[#1a4731] transition-all"
              >
                {adviceVideoPreview && !removeAdviceVideo ? (
                  <video
                    src={adviceVideoPreview}
                    className="w-full max-h-40 rounded-lg mx-auto"
                    controls
                    muted
                  />
                ) : (
                  <div className="py-4">
                    <Upload
                      size={18}
                      className="mx-auto text-gray-300 mb-1.5"
                    />
                    <p className="text-[11.5px] text-gray-400">
                      Glisser ou cliquer pour choisir une vidéo
                    </p>
                  </div>
                )}
                <input
                  id="advice-video-input"
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setAdviceVideoFile(file);
                    setAdviceVideoPreview(URL.createObjectURL(file));
                    setRemoveAdviceVideo(false);
                  }}
                />
              </div>

              {(adviceVideoPreview || editingSolution?.advice_video) && (
                <button
                  type="button"
                  onClick={() => {
                    setAdviceVideoFile(null);
                    setAdviceVideoPreview(null);
                    setRemoveAdviceVideo(true);
                  }}
                  className="mt-2 text-[11.5px] font-semibold text-red-500 hover:opacity-70"
                >
                  Retirer la vidéo
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                  Ordre d'affichage
                </label>
                <input
                  type="number"
                  value={solutionForm.order}
                  onChange={(e) =>
                    setSolutionForm((f) => ({
                      ...f,
                      order: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-full h-11 px-4 border border-gray-200 rounded-xl text-[13.5px] outline-none focus:border-[#1a5242]"
                />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={solutionForm.is_active}
                    onChange={(e) =>
                      setSolutionForm((f) => ({
                        ...f,
                        is_active: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 accent-[#1a5242]"
                  />
                  <span className="text-[13.5px] font-semibold text-gray-700">
                    Parcours actif
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSolutionModalOpen(false)}
                className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-600 text-[13.5px] font-semibold hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveSolution}
                disabled={savingSolution}
                className="px-6 py-2.5 bg-[#1a5242] text-white rounded-xl text-[13.5px] font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {savingSolution
                  ? "Sauvegarde..."
                  : editingSolution
                    ? "Modifier"
                    : "Créer"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
