import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getQuizSolutions,
  getQuizQuestions,
  submitQuiz,
} from "../services/quizApi";
import { STORAGE_URL } from "../config/api";
import {
  ChevronRight,
  ChevronLeft,
  Sparkles,
  RotateCcw,
  ShoppingCart,
  SkipForward,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import InlineVideoPlayer from "../components/InlineVideoPlayer";

const GRADIENT = "linear-gradient(135deg, #2d7a5f 0%, #3f9973 100%)";

export default function Quiz() {
  const { addToCart } = useCart();

  // ── Étape 1 : choix de solution ──
  const [step, setStep] = useState("solutions"); // "solutions" | "quiz" | "results"
  const [solutions, setSolutions] = useState([]);
  const [loadingSolutions, setLoadingSolutions] = useState(true);
  const [activeSolution, setActiveSolution] = useState(null);
  const [loadingSolutionId, setLoadingSolutionId] = useState(null);

  // ── Étape 2 : questions ──
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState([]); // [{ question_id, option_id }]
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // ── Étape 3 : résultats ──
  const [results, setResults] = useState(null);

  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSolutions();
  }, []);

  const fetchSolutions = async () => {
    try {
      setLoadingSolutions(true);
      const data = await getQuizSolutions();
      setSolutions(data);
    } catch {
      setError("Impossible de charger les parcours.");
    } finally {
      setLoadingSolutions(false);
    }
  };

  const handleChooseSolution = async (solution) => {
    setError(null);
    setLoadingQuestions(true);
    setLoadingSolutionId(solution.id);
    setActiveSolution(solution);
    try {
      const data = await getQuizQuestions(solution.slug);
      setQuestions(data.questions || []);
      setCurrentIdx(0);
      setAnswers([]);
      setSelectedOption(null);
      setStep("quiz");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Impossible de charger ce parcours.");
    } finally {
      setLoadingQuestions(false);
      setLoadingSolutionId(null);
    }
  };

  // ── Branchement : une question ne compte que si sa condition est remplie ──
  const isQuestionVisible = (question, answersList) => {
    if (!question.show_if_option_id) return true;
    return answersList.some((a) => a.option_id === question.show_if_option_id);
  };

  const findNextVisibleIndex = (fromIdx, answersList) => {
    for (let i = fromIdx; i < questions.length; i++) {
      if (isQuestionVisible(questions[i], answersList)) return i;
    }
    return questions.length; // fin du quiz
  };

  const findPrevVisibleIndex = (fromIdx, answersList) => {
    for (let i = fromIdx; i >= 0; i--) {
      if (isQuestionVisible(questions[i], answersList)) return i;
    }
    return 0;
  };

  // ── Bug fix : restaure la réponse déjà donnée quand on arrive sur une question ──
  const restoreSelectionFor = (idx, answersList) => {
    const q = questions[idx];
    if (!q) return null;
    const prevAnswer = answersList.find((a) => a.question_id === q.id);
    if (!prevAnswer) return null;
    return q.options.find((o) => o.id === prevAnswer.option_id) || null;
  };

  const handleSubmitQuiz = async (finalAnswers) => {
    setSubmitting(true);
    try {
      const data = await submitQuiz(activeSolution.id, finalAnswers);
      setResults(data);
      setStep("results");
    } catch {
      setError("Erreur lors de l'analyse de vos réponses.");
    } finally {
      setSubmitting(false);
    }
  };

  const proceedTo = async (nextAnswers) => {
    const nextIdx = findNextVisibleIndex(currentIdx + 1, nextAnswers);
    setAnswers(nextAnswers);

    if (nextIdx >= questions.length) {
      setSelectedOption(null);
      await handleSubmitQuiz(nextAnswers);
    } else {
      setCurrentIdx(nextIdx);
      setSelectedOption(restoreSelectionFor(nextIdx, nextAnswers));
    }
  };

  const handleNext = () => {
    if (!selectedOption) return;
    const question = questions[currentIdx];
    const nextAnswers = [
      ...answers.filter((a) => a.question_id !== question.id),
      { question_id: question.id, option_id: selectedOption.id },
    ];
    proceedTo(nextAnswers);
  };

  const handleSkip = () => {
    proceedTo(answers);
  };

  const handleBack = () => {
    if (currentIdx === 0) {
      setStep("solutions");
      return;
    }
    const prevIdx = findPrevVisibleIndex(currentIdx - 1, answers);
    setCurrentIdx(prevIdx);
    setSelectedOption(restoreSelectionFor(prevIdx, answers));
  };

  const handleRestart = () => {
    setStep("solutions");
    setActiveSolution(null);
    setQuestions([]);
    setCurrentIdx(0);
    setAnswers([]);
    setSelectedOption(null);
    setResults(null);
    window.scrollTo(0, 0);
  };

  const progress = questions.length
    ? Math.round((currentIdx / questions.length) * 100)
    : 0;

  // ══════════════ ÉTAPE 1 — CHOIX DE SOLUTION ══════════════
  if (step === "solutions") {
    if (loadingSolutions)
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <div
            className="w-12 h-12 rounded-full animate-spin"
            style={{ border: "4px solid #f3f4f6", borderTopColor: "#1a5242" }}
          />
          <p className="text-gray-400">Chargement...</p>
        </div>
      );

    if (error)
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <p className="text-red-500">{error}</p>
          <button
            onClick={fetchSolutions}
            className="px-6 py-2.5 text-white rounded-xl font-semibold hover:opacity-90"
            style={{ background: GRADIENT }}
          >
            Réessayer
          </button>
        </div>
      );

    if (solutions.length === 0)
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-5 text-center">
          <Sparkles size={48} style={{ color: "#3f9973" }} />
          <p className="text-gray-500 text-[15px]">
            Aucun parcours disponible pour le moment.
          </p>
          <Link
            to="/"
            className="px-6 py-2.5 text-white rounded-xl font-semibold hover:opacity-90"
            style={{ background: GRADIENT }}
          >
            Retour à l'accueil
          </Link>
        </div>
      );

    return (
      <div
        className="min-h-screen bg-gray-50 py-8 md:py-12"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <div style={{ maxWidth: 980, margin: "0 auto", padding: "0 20px" }}>
          <div className="text-center mb-8 md:mb-10">
            <div
              className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: GRADIENT }}
            >
              <Sparkles size={26} className="text-white" />
            </div>
            <h1 className="text-[1.4rem] md:text-[1.8rem] font-bold text-gray-900 mb-2">
              Que recherchez-vous aujourd'hui ?
            </h1>
            <p className="text-gray-500 text-[13.5px] md:text-[15px] px-4">
              Choisissez une catégorie pour recevoir des recommandations
              vraiment adaptées à vos besoins.
            </p>
          </div>

          <div
            className="grid gap-4 md:gap-5"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            }}
          >
            {solutions.map((s) => {
              const isThisLoading = loadingSolutionId === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => handleChooseSolution(s)}
                  disabled={loadingQuestions}
                  className="relative bg-white rounded-2xl border-2 border-gray-100 overflow-hidden text-left hover:border-[#1a5242] hover:shadow-lg transition-all group disabled:opacity-50"
                >
                  {isThisLoading && (
                    <div
                      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2"
                      style={{ background: "rgba(255,255,255,0.9)" }}
                    >
                      <div
                        className="w-8 h-8 rounded-full animate-spin"
                        style={{
                          border: "3px solid #e5e7eb",
                          borderTopColor: "#1a5242",
                        }}
                      />
                      <p className="text-[12px] font-semibold text-[#1a5242]">
                        Chargement...
                      </p>
                    </div>
                  )}
                  <div className="h-32 md:h-36 bg-gray-50 flex items-center justify-center overflow-hidden">
                    {s.image ? (
                      <img
                        src={`${STORAGE_URL}/${s.image}`}
                        alt={s.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <Sparkles size={32} style={{ color: "#3f9973" }} />
                    )}
                  </div>
                  <div className="p-3.5 md:p-4">
                    <p className="text-[14px] md:text-[15px] font-bold text-gray-900 mb-1 group-hover:text-[#1a5242] transition-colors">
                      {s.name}
                    </p>
                    {s.description && (
                      <p className="text-[12px] md:text-[12.5px] text-gray-400 line-clamp-2">
                        {s.description}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ══════════════ ÉTAPE 3 — RÉSULTATS ══════════════
  if (step === "results" && results) {
    return (
      <div
        className="min-h-screen bg-gray-50 py-8 md:py-12"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px" }}>
          <div className="text-center mb-8 md:mb-10">
            <div
              className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: GRADIENT }}
            >
              <Sparkles size={26} className="text-white" />
            </div>
            <h1 className="text-[1.4rem] md:text-[1.8rem] font-bold text-gray-900 mb-3">
              Vos produits recommandés
            </h1>
            <p className="text-gray-600 text-[13.5px] md:text-[15px] max-w-xl mx-auto leading-relaxed px-2">
              {results.explanation}
            </p>
          </div>

          {results.solution?.advice_video && (
            <div className="mb-8 md:mb-10">
              {results.solution.advice_video_title && (
                <h2
                  className="text-center text-[1.15rem] md:text-[1.3rem] font-bold text-gray-900 mb-4"
                  style={{ fontFamily: "Segoe UI, sans-serif" }}
                >
                  {results.solution.advice_video_title}
                </h2>
              )}
              <InlineVideoPlayer
                src={`${STORAGE_URL}/${results.solution.advice_video}`}
                poster={
                  results.solution.advice_video_poster
                    ? `${STORAGE_URL}/${results.solution.advice_video_poster}`
                    : undefined
                }
                eager
              />
            </div>
          )}

          {results.products?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10">
              {results.products.map((product) => {
                const price = parseFloat(product.price) || 0;
                const promoPrice = parseFloat(product.promo_price) || 0;
                const hasPromo = promoPrice > 0 && promoPrice < price;
                const display = hasPromo ? promoPrice : price;

                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all group"
                  >
                    <Link to={`/products/${product.slug}`}>
                      <div className="h-44 md:h-52 bg-gray-50 flex items-center justify-center overflow-hidden">
                        <img
                          src={`${STORAGE_URL}/${product.image}`}
                          alt={product.name}
                          className="h-full w-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    </Link>

                    <div className="p-4">
                      <Link
                        to={`/products/${product.slug}`}
                        className="block text-[13.5px] font-semibold text-gray-800 hover:text-[#1a5242] transition-colors mb-2 line-clamp-2"
                      >
                        {product.name}
                      </Link>

                      {product.match_reasons?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {product.match_reasons.map((reason) => (
                            <span
                              key={reason}
                              className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full"
                              style={{
                                background: "#FFF3B0",
                                color: "#355847",
                              }}
                            >
                              {reason}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2 mb-4 flex-wrap">
                        <span
                          className="text-[15px] font-bold"
                          style={{ color: "#3f9973" }}
                        >
                          {display.toFixed(3).replace(".", ",")} DT
                        </span>
                        {hasPromo && (
                          <span className="text-[12px] text-gray-400 line-through">
                            {price.toFixed(3).replace(".", ",")} DT
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Link
                          to={`/products/${product.slug}`}
                          className="flex-1 py-2 rounded-xl border border-[#1a5242] text-[#1a5242] text-[12.5px] font-semibold text-center hover:bg-[#1a5242] hover:text-white transition-all"
                        >
                          Voir le produit
                        </Link>
                        <button
                          onClick={() => addToCart(product)}
                          className="flex-1 py-2 rounded-xl text-white text-[12.5px] font-semibold flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
                          style={{ background: GRADIENT }}
                        >
                          <ShoppingCart size={14} />
                          Ajouter
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-gray-400 mb-8 md:mb-10">
              Aucun produit trouvé pour ce profil.
            </p>
          )}

          <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4 px-4">
            <button
              onClick={handleRestart}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-[14px] hover:bg-gray-50 transition-colors"
            >
              <RotateCcw size={16} />
              Recommencer
            </button>
            <Link
              to="/products"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-[14px] hover:opacity-90 transition-opacity"
              style={{ background: GRADIENT }}
            >
              Voir tous les produits
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════ ÉTAPE 2 — QUESTIONS ══════════════
  if (loadingQuestions || submitting)
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div
          className="w-12 h-12 rounded-full animate-spin"
          style={{ border: "4px solid #f3f4f6", borderTopColor: "#1a5242" }}
        />
        <p className="text-gray-400">
          {submitting ? "Analyse de vos réponses..." : "Chargement..."}
        </p>
      </div>
    );

  if (questions.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-5 text-center">
        <p className="text-gray-500">Aucune question pour ce parcours.</p>
        <button
          onClick={handleRestart}
          className="px-6 py-2.5 text-white rounded-xl font-semibold hover:opacity-90"
          style={{ background: GRADIENT }}
        >
          Choisir un autre parcours
        </button>
      </div>
    );
  }

  const question = questions[currentIdx];

  return (
    <div
      className="min-h-screen bg-gray-50 py-8 md:py-12"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 20px" }}>
        <div className="text-center mb-6 md:mb-8">
          <span
            className="inline-block text-[11px] font-bold uppercase tracking-widest mb-3 px-3 py-1 rounded-full"
            style={{ background: "#FFF3B0", color: "#355847" }}
          >
            {activeSolution?.name}
          </span>
          <h1 className="text-[1.25rem] md:text-[1.5rem] font-bold text-gray-900 mb-1 px-2">
            {question.question}
          </h1>
          {question.subtitle && (
            <p className="text-gray-400 text-[13px] md:text-[13.5px] px-2">
              {question.subtitle}
            </p>
          )}
        </div>

        <div className="mb-6 md:mb-8">
          <div className="flex justify-between text-[12px] text-gray-400 font-medium mb-2">
            <span>
              Question {currentIdx + 1} sur {questions.length}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: GRADIENT }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-8 mb-6">
          <div className="grid gap-2.5 md:gap-3">
            {question.options.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedOption(option)}
                className={`w-full text-left px-4 md:px-5 py-3.5 md:py-4 rounded-xl border-2 transition-all font-medium text-[13.5px] md:text-[14px] ${
                  selectedOption?.id === option.id
                    ? "border-[#1a5242] bg-[#f0f7f4] text-[#1a5242]"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      selectedOption?.id === option.id
                        ? "border-[#1a5242] bg-[#1a5242]"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedOption?.id === option.id && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  {option.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <button
            onClick={handleBack}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-500 font-semibold text-[13.5px] hover:bg-gray-50 transition-all order-2 sm:order-1"
          >
            <ChevronLeft size={16} />
            Précédent
          </button>

          <div className="flex items-center gap-3 order-1 sm:order-2 justify-end">
            {question.is_skippable && (
              <button
                onClick={handleSkip}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-gray-400 font-semibold text-[13px] hover:text-gray-600 transition-all"
              >
                <SkipForward size={14} />
                Passer
              </button>
            )}

            <button
              onClick={handleNext}
              disabled={!selectedOption}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-white font-semibold text-[13.5px] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-1 sm:flex-none"
              style={{ background: GRADIENT }}
            >
              {currentIdx === questions.length - 1 ? (
                <>
                  <Sparkles size={16} />
                  Voir mes recommandations
                </>
              ) : (
                <>
                  Suivant
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
