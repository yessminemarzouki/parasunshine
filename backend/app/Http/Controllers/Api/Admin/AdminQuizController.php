<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\QuizSolution;
use App\Models\QuizQuestion;
use App\Models\QuizOption;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;

class AdminQuizController extends Controller
{
    // ══════════════ SOLUTIONS (parcours) ══════════════

    public function solutions()
    {
        $solutions = QuizSolution::withCount('questions')
            ->with('category:id,name')
            ->orderBy('order')
            ->get();

        return response()->json($solutions);
    }
    /**
     * Analyse les vrais produits de la catégorie du parcours et suggère
     * les mots-clés les plus fréquents pour aider à créer des tags pertinents.
     */
    public function suggestTags(QuizSolution $solution)
    {
        $query = Product::query();
        if ($solution->category_id) {
            $categoryIds = [$solution->category_id];
            $descendants = \App\Models\Category::where('parent_id', $solution->category_id)->pluck('id');
            $categoryIds = array_merge($categoryIds, $descendants->toArray());
            $query->whereIn('category_id', $categoryIds);
        }

        $products = $query->get(['name', 'description', 'short_description', 'benefits', 'usage_tips']);

        $stopwords = [
            'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'ou', 'a', 'au',
            'aux', 'en', 'pour', 'avec', 'sans', 'sur', 'sous', 'dans', 'par', 'ce',
            'cet', 'cette', 'ces', 'votre', 'vos', 'notre', 'nos', 'est', 'sont',
            'etre', 'avoir', 'qui', 'que', 'quoi', 'ou', 'plus', 'moins', 'tres',
            'peu', 'bien', 'tout', 'tous', 'toute', 'toutes', 'vous', 'nous',
            'son', 'sa', 'ses', 'leur', 'leurs', 'il', 'elle', 'ils', 'elles',
            'produit', 'produits', 'ml', 'ce', 'cette',
        ];

        $wordCounts = [];

        foreach ($products as $product) {
            $text = implode(' ', [
                $product->name,
                $product->description,
                $product->short_description,
                $product->benefits,
                $product->usage_tips,
            ]);

            $text = mb_strtolower($text, 'UTF-8');
            $text = strtr($text, [
                'à' => 'a', 'â' => 'a', 'ä' => 'a',
                'é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e',
                'î' => 'i', 'ï' => 'i',
                'ô' => 'o', 'ö' => 'o',
                'ù' => 'u', 'û' => 'u', 'ü' => 'u',
                'ç' => 'c',
            ]);
            $text = preg_replace('/[^a-z0-9\s]/', ' ', $text);
            $words = preg_split('/\s+/', trim($text));

            foreach ($words as $word) {
                if (mb_strlen($word) <= 2 || in_array($word, $stopwords)) {
                    continue;
                }
                $wordCounts[$word] = ($wordCounts[$word] ?? 0) + 1;
            }
        }

        arsort($wordCounts);

        $suggestions = array_slice(array_keys($wordCounts), 0, 40);

        return response()->json([
            'suggestions' => $suggestions,
            'products_analyzed' => $products->count(),
        ]);
    }

    public function storeSolution(Request $request)
    {
        $data = $request->validate([
            'name'                 => 'required|string|max:255',
            'description'          => 'nullable|string|max:500',
            'icon'                 => 'nullable|string|max:100',
            'category_id'          => 'nullable|exists:categories,id',
            'order'                => 'integer',
            'is_active'            => 'boolean',
            'image'                => 'nullable|image|max:4096',
            'advice_video_title'   => 'nullable|string|max:150',
            'advice_video'         => 'nullable|file|mimetypes:video/mp4,video/quicktime,video/webm|max:102400',
            'advice_video_poster'  => 'nullable|image|max:5120',
        ]);

        $data['slug'] = Str::slug($data['name']) . '-' . Str::random(4);

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('quiz', 'public');
        }
        if ($request->hasFile('advice_video')) {
            $data['advice_video'] = $request->file('advice_video')->store('quiz/videos', 'public');
        }
        if ($request->hasFile('advice_video_poster')) {
            $data['advice_video_poster'] = $request->file('advice_video_poster')->store('quiz/videos/posters', 'public');
        }

        $solution = QuizSolution::create($data);
        Cache::forget('quiz_solutions');

        return response()->json([
            'message'  => 'Parcours créé avec succès.',
            'solution' => $solution,
        ], 201);
    }

    public function updateSolution(Request $request, QuizSolution $solution)
    {
        $data = $request->validate([
            'name'                 => 'required|string|max:255',
            'description'          => 'nullable|string|max:500',
            'icon'                 => 'nullable|string|max:100',
            'category_id'          => 'nullable|exists:categories,id',
            'order'                => 'integer',
            'is_active'            => 'boolean',
            'image'                => 'nullable|image|max:4096',
            'advice_video_title'   => 'nullable|string|max:150',
            'advice_video'         => 'nullable|file|mimetypes:video/mp4,video/quicktime,video/webm|max:102400',
            'advice_video_poster'  => 'nullable|image|max:5120',
            'remove_advice_video'  => 'nullable|boolean',
        ]);

        if ($request->hasFile('image')) {
            if ($solution->image) {
                Storage::disk('public')->delete($solution->image);
            }
            $data['image'] = $request->file('image')->store('quiz', 'public');
        }

        if ($request->hasFile('advice_video')) {
            if ($solution->advice_video) {
                Storage::disk('public')->delete($solution->advice_video);
            }
            $data['advice_video'] = $request->file('advice_video')->store('quiz/videos', 'public');
        } elseif ($request->boolean('remove_advice_video')) {
            if ($solution->advice_video) {
                Storage::disk('public')->delete($solution->advice_video);
            }
            if ($solution->advice_video_poster) {
                Storage::disk('public')->delete($solution->advice_video_poster);
            }
            $data['advice_video'] = null;
            $data['advice_video_poster'] = null;
            $data['advice_video_title'] = null;
        }

        if ($request->hasFile('advice_video_poster')) {
            if ($solution->advice_video_poster) {
                Storage::disk('public')->delete($solution->advice_video_poster);
            }
            $data['advice_video_poster'] = $request->file('advice_video_poster')->store('quiz/videos/posters', 'public');
        }

        $solution->update($data);
        Cache::forget('quiz_solutions');

        return response()->json([
            'message'  => 'Parcours mis à jour.',
            'solution' => $solution,
        ]);
    }

    public function destroySolution(QuizSolution $solution)
    {
        if ($solution->image) {
            Storage::disk('public')->delete($solution->image);
        }
        if ($solution->advice_video) {
            Storage::disk('public')->delete($solution->advice_video);
        }
        if ($solution->advice_video_poster) {
            Storage::disk('public')->delete($solution->advice_video_poster);
        }
        $solution->delete();
        Cache::forget('quiz_solutions');

        return response()->json(['message' => 'Parcours supprimé.']);
    }

    public function toggleSolutionActive(QuizSolution $solution)
    {
        $solution->update(['is_active' => !$solution->is_active]);
        Cache::forget('quiz_solutions');

        return response()->json([
            'message'   => 'Statut mis à jour.',
            'is_active' => $solution->is_active,
        ]);
    }

    // ══════════════ QUESTIONS (par solution) ══════════════

    public function questions(QuizSolution $solution)
    {
        $questions = $solution->questions()
            ->with('options')
            ->orderBy('order')
            ->get();

        return response()->json($questions);
    }

    public function storeQuestion(Request $request)
    {
        $request->validate([
            'solution_id'        => 'required|exists:quiz_solutions,id',
            'question'           => 'required|string|max:500',
            'subtitle'           => 'nullable|string|max:255',
            'order'              => 'integer',
            'is_skippable'       => 'boolean',
            'show_if_option_id'  => 'nullable|exists:quiz_options,id',
            'options'            => 'required|array|min:2',
            'options.*.label'    => 'required|string|max:200',
            'options.*.tags'     => 'required|array|min:1',
            'options.*.weight'   => 'nullable|integer|min:1|max:10',
        ]);

        $question = QuizQuestion::create([
            'solution_id'       => $request->solution_id,
            'question'          => $request->question,
            'subtitle'          => $request->subtitle,
            'order'             => $request->order ?? 0,
            'is_active'         => $request->is_active ?? true,
            'is_skippable'      => $request->is_skippable ?? true,
            'show_if_option_id' => $request->show_if_option_id,
        ]);

        foreach ($request->options as $i => $opt) {
            QuizOption::create([
                'question_id' => $question->id,
                'label'       => $opt['label'],
                'tags'        => $opt['tags'],
                'weight'      => $opt['weight'] ?? 1,
                'order'       => $i,
            ]);
        }

        Cache::forget('quiz_questions_' . $question->solution->slug);

        return response()->json([
            'message'  => 'Question créée avec succès.',
            'question' => $question->load('options'),
        ], 201);
    }

    public function updateQuestion(Request $request, QuizQuestion $question)
    {
        $request->validate([
            'question'           => 'required|string|max:500',
            'subtitle'           => 'nullable|string|max:255',
            'order'              => 'integer',
            'is_skippable'       => 'boolean',
            'show_if_option_id'  => 'nullable|exists:quiz_options,id',
            'options'            => 'required|array|min:2',
            'options.*.label'    => 'required|string|max:200',
            'options.*.tags'     => 'required|array|min:1',
            'options.*.weight'   => 'nullable|integer|min:1|max:10',
        ]);

        $question->update([
            'question'          => $request->question,
            'subtitle'          => $request->subtitle,
            'order'             => $request->order ?? $question->order,
            'is_active'         => $request->is_active ?? $question->is_active,
            'is_skippable'      => $request->is_skippable ?? $question->is_skippable,
            'show_if_option_id' => $request->show_if_option_id,
        ]);

        // Supprime et recrée les options (comme dans l'ancien système)
        $question->options()->delete();
        foreach ($request->options as $i => $opt) {
            QuizOption::create([
                'question_id' => $question->id,
                'label'       => $opt['label'],
                'tags'        => $opt['tags'],
                'weight'      => $opt['weight'] ?? 1,
                'order'       => $i,
            ]);
        }

        Cache::forget('quiz_questions_' . $question->solution->slug);

        return response()->json([
            'message'  => 'Question mise à jour.',
            'question' => $question->load('options'),
        ]);
    }

    public function destroyQuestion(QuizQuestion $question)
    {
        $slug = $question->solution->slug;
        $question->delete();
        Cache::forget('quiz_questions_' . $slug);

        return response()->json(['message' => 'Question supprimée.']);
    }

    public function toggleQuestionActive(QuizQuestion $question)
    {
        $question->update(['is_active' => !$question->is_active]);
        Cache::forget('quiz_questions_' . $question->solution->slug);

        return response()->json([
            'message'   => 'Statut mis à jour.',
            'is_active' => $question->is_active,
        ]);
    }
}
