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
     * Arrondit un prix à la centaine inférieure (plancher)
     * Ex: 8.460 -> 8.400 / 9.840 -> 9.800 / 7.950 -> 7.900
     */
    private function roundToPsychologicalPrice($price)
    {
        if ($price <= 0) {
            return 0;
        }
        return floor($price * 10) / 10;
    }

    // ── CALCULER L'APERÇU AVANT APPLICATION ──
    public function previewPrices(Request $request)
    {
        $validated = $request->validate([
            'product_ids' => 'required|array|min:1',
            'product_ids.*' => 'integer',
            'internal_discount' => 'required|numeric|min:1|max:99', // La vraie remise
            'displayed_discount' => 'required|numeric|min:1|max:99', // La remise affichée
        ]);

        $products = Product::whereIn('id', $validated['product_ids'])
         ->where('is_promo', false) // Produits sans promo configurée
         ->get();
        $results = [];

        foreach ($products as $product) {
            $basePrice = (float) $product->price;
            if ($basePrice <= 0) {
                continue;
            } // Ignore les produits sans prix valide

            // Sécurité : si un ancien reference_price traîne, on le nettoie
            if ($product->reference_price) {
                $product->update(['reference_price' => null]);
            }

            // 1. On calcule le prix que le client va vraiment payer (remise interne)
            $finalPromoPriceRaw = $basePrice * (1 - ($validated['internal_discount'] / 100));
            $finalPromoPrice = $this->roundToPsychologicalPrice($finalPromoPriceRaw);

            // 2. On calcule le prix barré pour que ça corresponde à la remise affichée
            $referencePriceRaw = $finalPromoPrice / (1 - ($validated['displayed_discount'] / 100));
            $referencePrice = $this->roundToPsychologicalPrice($referencePriceRaw);

            $results[] = [
                'id' => $product->id,
                'name' => $product->name,
                'base_price' => $basePrice,
                'reference_price' => $referencePrice,
                'final_promo_price' => $finalPromoPrice,
                'displayed_discount' => $validated['displayed_discount'],
                'internal_discount' => $validated['internal_discount'],
                'amount_added' => round($referencePrice - $basePrice, 3),
            ];
        }

        return response()->json($results);
    }

    // ── APPLIQUER LE GONFLEMENT ET LA PROMO ──
    public function applyWithInflation(Request $request)
    {
        $validated = $request->validate([
            'product_ids' => 'required|array|min:1',
            'product_ids.*' => 'integer|exists:products,id',
            'internal_discount' => 'required|numeric|min:1|max:99',
            'displayed_discount' => 'required|numeric|min:1|max:99',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date|after_or_equal:starts_at',
            'add_to_top_promo' => 'boolean',
        ]);

        $products = Product::whereIn('id', $validated['product_ids'])->get();

        $now = now();

        foreach ($products as $product) {
            $basePrice = (float) $product->price;

            $finalPromoPriceRaw = $basePrice * (1 - ($validated['internal_discount'] / 100));
            $finalPromoPrice = $this->roundToPsychologicalPrice($finalPromoPriceRaw);

            $referencePriceRaw = $finalPromoPrice / (1 - ($validated['displayed_discount'] / 100));
            $referencePrice = $this->roundToPsychologicalPrice($referencePriceRaw);

            // Forcer l'interprétation de la date comme heure de Tunis
            $startsAt = !empty($validated['starts_at'])
                ? \Carbon\Carbon::parse($validated['starts_at'], 'Africa/Tunis')
                : null;
            $endsAt = !empty($validated['ends_at'])
                ? \Carbon\Carbon::parse($validated['ends_at'], 'Africa/Tunis')
                : null;

            // 🎯 On écrit is_promo = true dans TOUS les cas (passé, maintenant, futur)
            // C'est ce qui permet à l'admin de voir "Promo programmée" si la date est future.
            // C'est `is_promo_active` (calculé) qui détermine si la promo est affichée côté client.
            $product->update([
                'reference_price'     => $referencePrice,
                'is_promo'            => true, // ✅ TOUJOURS true, peu importe la date
                'discount_percentage' => $validated['displayed_discount'],
                'promo_price'         => $finalPromoPrice,
                'promo_starts_at'     => $startsAt,
                'promo_ends_at'       => $endsAt,
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
        Cache::increment('products_list_version');

        return response()->json([
            'message' => count($products) . ' produit(s) mis en promotion avec prix gonflé.',
            'count' => count($products),
        ]);
    }
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

        // 🎯 On utilise `is_promo` en base (configuré) et pas `is_promo_active` (calculé)
        if ($mode === 'remove') {
            $query->where('is_promo', true);
        } else {
            // 'apply' ou 'inflation' → produits SANS promo configurée
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

            // Forcer l'interprétation de la date comme heure de Tunis
            $startsAt = !empty($validated['starts_at'])
                ? \Carbon\Carbon::parse($validated['starts_at'], 'Africa/Tunis')
                : null;
            $endsAt = !empty($validated['ends_at'])
                ? \Carbon\Carbon::parse($validated['ends_at'], 'Africa/Tunis')
                : null;

            $product->update([
                'is_promo'            => true,
                'discount_percentage' => $validated['discount_percentage'],
                'promo_price'         => $promoPrice,
                'promo_starts_at'     => $startsAt,
                'promo_ends_at'       => $endsAt,
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
                'reference_price'     => null, // On remet le prix normal
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
