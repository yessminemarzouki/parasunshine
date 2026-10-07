<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\PromoSection;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class AdminPromoSectionController extends Controller
{
    private function getOrCreate(): PromoSection
    {
        $section = PromoSection::first();
        if (!$section) {
            $section = PromoSection::create([
                'title'            => 'Top Promo',
                'background_color' => '#faf0e6',
                'title_color'      => '#1a1a1a',
                'is_visible'       => true,
                'order_mode'       => 'recent',
                'product_ids'      => [],
            ]);
        }
        return $section;
    }

    // ── PUBLIC ──
    public function public()
    {
        $section = $this->getOrCreate();

        if (!$section->is_visible) {
            return response()->json(['visible' => false, 'products' => []]);
        }

        $cols = ['id','name','slug','price','promo_price','discount_percentage',
         'image','stock','category_id','brand_id','is_promo','is_featured',
         'is_new','is_bestseller','loyalty_points','reference','short_description',
         'has_sizes',
         'has_colors',
];

        $ids = $section->product_ids ?? [];

        $query = Product::select($cols)
            ->with(['category:id,name,slug','brand:id,name,slug'])
            ->whereIn('id', $ids)
            ->where('is_promo', true)
            ->where('stock', '>', 0);

        $products = $this->applyOrderMode($query, $section->order_mode, $ids);

        return response()->json([
            'visible'          => true,
            'title'            => $section->title,
            'background_color' => $section->background_color,
            'title_color'      => $section->title_color,
            'products'         => $products,
        ]);
    }

    /**
     * Applique le mode de tri choisi (recent / bestseller / random)
     */
    private function applyOrderMode($query, $orderMode, $manualIds = null)
    {
        if ($orderMode === 'bestseller') {
            $products = $query->get();
            $soldMap = \App\Models\OrderItem::whereIn('product_id', $products->pluck('id'))
                ->select('product_id', \Illuminate\Support\Facades\DB::raw('SUM(quantity) as total_sold'))
                ->groupBy('product_id')
                ->pluck('total_sold', 'product_id');

            return $products->sortByDesc(fn ($p) => $soldMap[$p->id] ?? 0)->values();
        }

        if ($orderMode === 'random') {
            return $query->inRandomOrder()->get();
        }

        // 'recent' (défaut)
        if ($manualIds !== null && count($manualIds) > 0) {
            return $query->get()->sortBy(fn ($p) => array_search($p->id, $manualIds))->values();
        }

        return $query->orderBy('created_at', 'desc')->get();
    }

    // ── ADMIN ──
    public function show()
    {
        $section = $this->getOrCreate();

        $includedIds = $section->product_ids ?? [];

        $includedProducts = [];
        if (!empty($includedIds)) {
            $includedProducts = Product::select(['id','name','slug','price','promo_price','discount_percentage','image','stock','is_promo'])
                ->whereIn('id', $includedIds)
                ->get()
                ->sortBy(fn ($p) => array_search($p->id, $includedIds))
                ->values();
        }

        return response()->json([
            'section'           => $section,
            'included_products' => $includedProducts,
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'title'            => 'required|string|max:100',
            'background_color' => 'required|string|max:20',
            'title_color'      => 'required|string|max:20',
            'is_visible'       => 'boolean',
            'order_mode'       => 'required|in:recent,bestseller,random',
            'product_ids'      => 'nullable|array',
            'product_ids.*'    => 'integer|exists:products,id',
        ]);

        $section = $this->getOrCreate();
        $section->update($data);
        Cache::forget('home_data');
        Cache::forget('products_promotions');

        return response()->json([
            'message' => 'Section promo mise à jour.',
            'section' => $section,
        ]);
    }

    public function searchProducts(Request $request)
    {
        $q = $request->get('q', '');
        $excludeIds = $request->get('exclude_ids', []);
        if (is_string($excludeIds)) {
            $excludeIds = array_filter(explode(',', $excludeIds));
        }

        $products = Product::select(['id','name','slug','price','promo_price','discount_percentage','image','stock','is_promo'])
            ->where('stock', '>', 0)
            ->where('is_promo', true)
            ->when(!empty($excludeIds), fn ($query) => $query->whereNotIn('id', $excludeIds))
            ->where(function ($query) use ($q) {
                $query->where('name', 'LIKE', "%{$q}%")
                      ->orWhere('reference', 'LIKE', "%{$q}%");
            })
            ->limit(30)
            ->get();

        return response()->json($products);
    }
    /**
     * AJOUTER D'UN SEUL COUP TOUS LES PRODUITS ACTUELLEMENT EN PROMOTION
     */
    public function addAllPromoted()
    {
        $section = $this->getOrCreate();
        $promotedIds = Product::where('is_promo', true)->pluck('id')->toArray();
        $existing = $section->product_ids ?? [];
        $merged = array_values(array_unique(array_merge($existing, $promotedIds)));
        $section->update(['product_ids' => $merged]);

        Cache::forget('home_data');
        Cache::forget('products_promotions');

        $addedCount = count($merged) - count($existing);

        return response()->json([
            'message' => $addedCount > 0
                ? "{$addedCount} produit(s) ajouté(s) à la section Top Promo."
                : "Tous les produits en promotion sont déjà dans la section.",
        ]);
    }

    /**
     * AJOUTER UN PRODUIT À LA SECTION TOP PROMO
     */
    public function addProduct(Request $request, $productId)
    {
        $product = Product::findOrFail($productId);

        if (!$product->is_promo) {
            return response()->json([
                'message' => "Ce produit n'est pas en promotion.",
            ], 422);
        }

        $section = $this->getOrCreate();
        $ids = $section->product_ids ?? [];

        if (!in_array($product->id, $ids)) {
            $ids[] = $product->id;
            $section->update(['product_ids' => array_values($ids)]);
        }

        Cache::forget('home_data');
        Cache::forget('products_promotions');

        return response()->json(['message' => 'Produit ajouté à la section.']);
    }

    /**
     * RETIRER UN PRODUIT DE LA SECTION TOP PROMO
     * (le produit reste en promotion, il n'est juste plus affiché ici)
     */
    public function removeProduct(Request $request, $productId)
    {
        $section = $this->getOrCreate();
        $ids = $section->product_ids ?? [];

        $ids = array_values(array_diff($ids, [(int) $productId]));
        $section->update(['product_ids' => $ids]);

        Cache::forget('home_data');
        Cache::forget('products_promotions');

        return response()->json(['message' => 'Produit retiré de la section.']);
    }
}
