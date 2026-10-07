<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\QuizSolution;
use App\Models\QuizQuestion;
use App\Models\QuizOption;
use App\Models\QuizResult;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class QuizController extends Controller
{
    /**
     * Étape 1 : liste des solutions disponibles (le choix initial du client)
     */
    public function solutions()
    {
        $solutions = Cache::remember('quiz_solutions', 300, function () {
            return QuizSolution::where('is_active', true)
                ->orderBy('order')
                ->get();
        });

        return response()->json($solutions);
    }

    /**
     * Étape 2 : questions du parcours choisi
     */
    public function questions($solutionSlug)
    {
        $data = Cache::remember('quiz_questions_' . $solutionSlug, 300, function () use ($solutionSlug) {
            $solution = QuizSolution::where('slug', $solutionSlug)
                ->where('is_active', true)
                ->firstOrFail();

            $questions = $solution->questions()
                ->where('is_active', true)
                ->with('options')
                ->get();

            return [
                'solution' => $solution,
                'questions' => $questions,
            ];
        });

        return response()->json($data);
    }

    /**
     * Étape 3 : soumission des réponses → matching pondéré + explication
     */
    /**
     * Normalise un texte pour le matching : minuscules, sans accents, sans tirets/underscores
     */
    private function normalizeText(?string $text): string
    {
        if (!$text) {
            return '';
        }

        $text = mb_strtolower($text, 'UTF-8');

        // Retire les accents (é→e, à→a, ç→c, etc.)
        $unwanted = [
            'à' => 'a', 'â' => 'a', 'ä' => 'a',
            'é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e',
            'î' => 'i', 'ï' => 'i',
            'ô' => 'o', 'ö' => 'o',
            'ù' => 'u', 'û' => 'u', 'ü' => 'u',
            'ç' => 'c', 'ñ' => 'n',
        ];
        $text = strtr($text, $unwanted);

        // Uniformise tirets/underscores en espaces
        $text = str_replace(['-', '_'], ' ', $text);

        // Retire les espaces multiples
        $text = preg_replace('/\s+/', ' ', $text);

        return trim($text);
    }
    public function submit(Request $request)
    {
        $validated = $request->validate([
            'solution_id' => 'required|exists:quiz_solutions,id',
            'answers' => 'required|array', // [{ question_id, option_id }]
            'answers.*.question_id' => 'required|exists:quiz_questions,id',
            'answers.*.option_id' => 'required|exists:quiz_options,id',
        ]);

        $solution = QuizSolution::findOrFail($validated['solution_id']);

        // Charge les options sélectionnées avec leurs tags/poids et le label de la question
        $optionIds = collect($validated['answers'])->pluck('option_id');
        $selectedOptions = QuizOption::whereIn('id', $optionIds)
            ->with('question:id,question')
            ->get();

        // ── Produits candidats : catégorie de la solution (+ sous-catégories) ──
        $categoryIds = [];
        if ($solution->category_id) {
            $categoryIds[] = $solution->category_id;
            $descendants = Category::where('parent_id', $solution->category_id)->pluck('id');
            $categoryIds = array_merge($categoryIds, $descendants->toArray());
        }

        $productsQuery = Product::where('stock', '>', 0)
            ->where('is_unavailable', false);

        if (!empty($categoryIds)) {
            $productsQuery->whereIn('category_id', $categoryIds);
        }

        $candidates = $productsQuery->get([
             'id', 'name', 'slug', 'image', 'price', 'promo_price',
             'description', 'short_description', 'benefits', 'usage_tips',
             'rating', 'reviews_count', 'category_id',
         ]);

        // ── Scoring pondéré par comparaison textuelle ──
        $scored = $candidates->map(function ($product) use ($selectedOptions) {
            $score = 0;
            $matchedLabels = [];

            $searchableText = $this->normalizeText(implode(' ', [
                 $product->name,
                 $product->description,
                 $product->short_description,
                 $product->benefits,
                 $product->usage_tips,
             ]));

            foreach ($selectedOptions as $option) {
                $optionTags = collect($option->tags ?? [])
                    ->map(fn ($t) => $this->normalizeText($t))
                    ->filter();

                $hasMatch = $optionTags->contains(
                    fn ($tag) => str_contains($searchableText, $tag)
                );

                if ($hasMatch) {
                    $score += $option->weight;
                    $matchedLabels[] = $option->label;
                }
            }

            return [
                'product' => $product,
                'score' => $score,
                'matched_labels' => array_unique($matchedLabels),
            ];
        })
        ->filter(fn ($item) => $item['score'] > 0)
        ->sortByDesc('score')
        ->sortByDesc(fn ($item) => $item['product']->rating)
        ->values();

        $top = $scored->take(3);

        // ── Génération de l'explication dynamique ──
        $chosenLabels = $selectedOptions->pluck('label')->implode(', ');
        $explanation = $top->isEmpty()
            ? "Nous n'avons pas trouvé de produit correspondant précisément à vos critères ({$chosenLabels}). Voici notre sélection {$solution->name} la mieux notée."
            : "D'après vos réponses ({$chosenLabels}), nous vous recommandons ces produits qui correspondent le mieux à votre profil " . mb_strtolower($solution->name) . ".";

        // Si aucun match, on propose quand même les mieux notés de la catégorie
        if ($top->isEmpty()) {
            $top = $candidates->sortByDesc('rating')->take(3)->map(fn ($p) => [
                'product' => $p,
                'score' => 0,
                'matched_labels' => [],
            ])->values();
        }

        $recommendedProducts = $top->map(function ($item) {
            $p = $item['product'];
            return [
                'id' => $p->id,
                'name' => $p->name,
                'slug' => $p->slug,
                'image' => $p->image,
                'price' => $p->price,
                'promo_price' => $p->promo_price,
                'rating' => $p->rating,
                'match_reasons' => $item['matched_labels'],
            ];
        })->values();

        // ── Sauvegarde du résultat ──
        $result = QuizResult::create([
            'user_id' => $request->user('sanctum')?->id,
            'solution_id' => $solution->id,
            'answers' => $validated['answers'],
            'recommended_products' => $recommendedProducts,
            'explanation' => $explanation,
        ]);

        return response()->json([
            'result_id' => $result->id,
            'solution' => $solution,
            'explanation' => $explanation,
            'products' => $recommendedProducts,
        ]);
    }
}
