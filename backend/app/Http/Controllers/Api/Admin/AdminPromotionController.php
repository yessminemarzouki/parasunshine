<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\PromoSection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class AdminPromotionController extends Controller
{
    /**
     * RECHERCHE INTELLIGENTE
     * Cherche simultanément par nom, référence, catégorie, marque
     */
    public function search(Request $request)
    {
        $q = trim($request->get('q', ''));
        $mode = $request->get('mode', 'apply'); // 'apply' ou 'remove'
        $categoryId = $request->get('category_id');
        $brandId = $request->get('brand_id');
        $selectAll = $request->boolean('select_all');

        // Volontairement AUCUN filtre sur le stock ou is_unavailable — un
        // produit disponible ou non doit pouvoir recevoir une promotion.
        $query = Product::select([
            'id', 'name', 'reference', 'price', 'promo_price',
            'discount_percentage', 'is_promo', 'image', 'stock',
            'is_unavailable', 'category_id', 'brand_id',
        ])
            ->with(['category:id,name', 'brand:id,name']);

        if ($q !== '') {
            $query->where(function ($sub) use ($q) {
                $sub->where('name', 'like', "%{$q}%")
                    ->orWhere('reference', 'like', "%{$q}%")
                    ->orWhereHas('category', fn ($c) => $c->where('name', 'like', "%{$q}%"))
                    ->orWhereHas('brand', fn ($b) => $b->where('name', 'like', "%{$q}%"));
            });
        }

        if ($categoryId) {
            $query->where('category_id', $categoryId);
        }
        if ($brandId) {
            $query->where('brand_id', $brandId);
        }

        if ($mode === 'remove') {
            $query->where('is_promo', true);
        } else {
            $query->where('is_promo', false);
        }

        $query->orderBy('name');

        // "Sélectionner tout" → renvoie tous les produits correspondant au
        // filtre, sans se limiter à 100 (plafond de sécurité à 5000).
        $products = $selectAll
            ? $query->limit(5000)->get()
            : $query->limit(100)->get();

        return response()->json($products);
    }

    /**
     * APPLIQUER UNE PROMOTION EN MASSE
     */
    public function apply(Request $request)
    {
        $validated = $request->validate([
            'product_ids'          => 'required|array|min:1',
            'product_ids.*'        => 'integer|exists:products,id',
            'discount_percentage'  => 'required|numeric|min:1|max:99',
            'starts_at'            => 'nullable|date',
            'ends_at'              => 'nullable|date|after_or_equal:starts_at',
            'add_to_top_promo'     => 'boolean',
        ]);

        $products = Product::whereIn('id', $validated['product_ids'])->get();

        foreach ($products as $product) {
            $promoPrice = round(
                $product->price - ($product->price * $validated['discount_percentage'] / 100),
                3
            );

            $product->update([
                'is_promo'            => true,
                'discount_percentage' => $validated['discount_percentage'],
                'promo_price'         => $promoPrice,
                'promo_starts_at'     => $validated['starts_at'] ?? null,
                'promo_ends_at'       => $validated['ends_at'] ?? null,
                // Une application manuelle via l'assistant détache le
                // produit de toute campagne à laquelle il appartenait —
                // c'est désormais une promo individuelle, indépendante.
                'promo_campaign_id'   => null,
            ]);

            Cache::forget('product_' . $product->slug);
        }

        if ($request->boolean('add_to_top_promo')) {
            $section = PromoSection::first();
            if ($section) {
                $existingIds = $section->product_ids ?? [];
                $newIds = array_values(array_unique(array_merge($existingIds, $validated['product_ids'])));
                $section->update(['product_ids' => $newIds]);
            }
        }

        Cache::forget('home_data');
        Cache::forget('products_promotions');

        return response()->json([
            'message' => count($products) . ' produit(s) mis en promotion avec succès.',
            'count'   => count($products),
        ]);
    }

    /**
      * RETIRER UNE PROMOTION EN MASSE
      */
    public function remove(Request $request)
    {
        $validated = $request->validate([
            'product_ids'   => 'required|array|min:1',
            'product_ids.*' => 'integer|exists:products,id',
        ]);

        $products = Product::whereIn('id', $validated['product_ids'])->get();

        foreach ($products as $product) {
            $product->update([
                'is_promo'            => false,
                'promo_price'         => null,
                'discount_percentage' => null,
                'promo_starts_at'     => null,
                'promo_ends_at'       => null,
                'promo_campaign_id'   => null,
            ]);
            Cache::forget('product_' . $product->slug);
        }

        // Nettoyage : retire ces produits de la section Top Promo s'ils y étaient
        $section = PromoSection::first();
        if ($section && !empty($section->product_ids)) {
            $remaining = array_values(array_diff($section->product_ids, $validated['product_ids']));
            $section->update(['product_ids' => $remaining]);
        }

        Cache::forget('home_data');
        Cache::forget('products_promotions');

        return response()->json([
            'message' => count($products) . ' promotion(s) retirée(s) avec succès.',
        ]);
    }
}
