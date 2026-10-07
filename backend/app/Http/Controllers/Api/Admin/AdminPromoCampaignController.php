<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\PromoCampaign;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class AdminPromoCampaignController extends Controller
{
    private function computePromoPrice(float $price, int $discount): float
    {
        return round($price - ($price * $discount / 100), 3);
    }

    private function clearCaches(): void
    {
        Cache::forget('home_data');
        Cache::forget('products_promotions');
    }

    // ── Liste des campagnes ──
    public function index()
    {
        $campaigns = PromoCampaign::withCount('products')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($campaigns);
    }

    // ── Créer une campagne ──
    public function store(Request $request)
    {
        $data = $request->validate([
            'name'                 => 'required|string|max:150',
            'discount_percentage'  => 'required|integer|min:1|max:99',
            'starts_at'            => 'nullable|date',
            'ends_at'              => 'nullable|date|after_or_equal:starts_at',
        ]);
        $data['is_active'] = true;

        $campaign = PromoCampaign::create($data);

        return response()->json([
            'message'  => 'Campagne créée avec succès.',
            'campaign' => $campaign,
        ], 201);
    }

    // ── Modifier une campagne (nom, %, dates) ──
    public function update(Request $request, PromoCampaign $promoCampaign)
    {
        $data = $request->validate([
            'name'                 => 'required|string|max:150',
            'discount_percentage'  => 'required|integer|min:1|max:99',
            'starts_at'            => 'nullable|date',
            'ends_at'              => 'nullable|date|after_or_equal:starts_at',
        ]);

        $promoCampaign->update($data);

        // Si la campagne est active, répercute immédiatement le nouveau
        // pourcentage/dates sur tous les produits déjà rattachés.
        if ($promoCampaign->is_active) {
            foreach ($promoCampaign->products as $product) {
                $product->update([
                    'discount_percentage' => $promoCampaign->discount_percentage,
                    'promo_price'         => $this->computePromoPrice((float) $product->price, $promoCampaign->discount_percentage),
                    'promo_starts_at'     => $promoCampaign->starts_at,
                    'promo_ends_at'       => $promoCampaign->ends_at,
                ]);
                Cache::forget('product_' . $product->slug);
            }
            $this->clearCaches();
        }

        return response()->json([
            'message'  => 'Campagne mise à jour.',
            'campaign' => $promoCampaign->fresh(),
        ]);
    }

    // ── Activer / désactiver toute la campagne d'un coup ──
    public function toggleActive(PromoCampaign $promoCampaign)
    {
        $newState = !$promoCampaign->is_active;
        $promoCampaign->update(['is_active' => $newState]);

        foreach ($promoCampaign->products as $product) {
            if ($newState) {
                // Réactivation : recalcule le prix promo depuis le prix actuel
                $product->update([
                    'is_promo'            => true,
                    'discount_percentage' => $promoCampaign->discount_percentage,
                    'promo_price'         => $this->computePromoPrice((float) $product->price, $promoCampaign->discount_percentage),
                    'promo_starts_at'     => $promoCampaign->starts_at,
                    'promo_ends_at'       => $promoCampaign->ends_at,
                ]);
            } else {
                // Désactivation : retire la promo mais garde le produit
                // rattaché à la campagne pour pouvoir la réactiver plus tard.
                $product->update([
                    'is_promo'            => false,
                    'promo_price'         => null,
                    'discount_percentage' => null,
                    'promo_starts_at'     => null,
                    'promo_ends_at'       => null,
                ]);
            }
            Cache::forget('product_' . $product->slug);
        }

        $this->clearCaches();

        return response()->json([
            'message'  => $newState ? 'Campagne activée.' : 'Campagne désactivée.',
            'campaign' => $promoCampaign->fresh(),
        ]);
    }

    // ── Supprimer une campagne (retire aussi la promo de ses produits) ──
    public function destroy(PromoCampaign $promoCampaign)
    {
        foreach ($promoCampaign->products as $product) {
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

        $promoCampaign->delete();
        $this->clearCaches();

        return response()->json(['message' => 'Campagne supprimée.']);
    }

    // ── Produits déjà dans la campagne ──
    public function products(PromoCampaign $promoCampaign)
    {
        $products = $promoCampaign->products()
            ->select(['id', 'name', 'reference', 'price', 'promo_price', 'image', 'stock', 'is_unavailable', 'category_id', 'brand_id'])
            ->with(['category:id,name', 'brand:id,name'])
            ->orderBy('name')
            ->get();

        return response()->json($products);
    }

    // ── Recherche de produits à ajouter (tous, disponibles ou non, hors campagne) ──
    public function searchAvailable(Request $request, PromoCampaign $promoCampaign)
    {
        $q = trim($request->get('q', ''));
        $categoryId = $request->get('category_id');
        $brandId = $request->get('brand_id');
        $selectAll = $request->boolean('select_all');

        $query = Product::select([
            'id', 'name', 'reference', 'price', 'promo_price', 'image',
            'stock', 'is_unavailable', 'category_id', 'brand_id', 'promo_campaign_id',
        ])
            ->with(['category:id,name', 'brand:id,name'])
            // Uniquement les produits qui ne sont dans AUCUNE promotion
            // active en ce moment (ni cette campagne, ni une autre, ni une
            // promo posée manuellement via l'Assistant Promotions).
            ->where('is_promo', false);

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

        $query->orderBy('name');

        $products = $selectAll
            ? $query->limit(5000)->get()
            : $query->limit(100)->get();

        return response()->json($products);
    }

    // ── Ajouter des produits à la campagne (en masse) ──
    public function addProducts(Request $request, PromoCampaign $promoCampaign)
    {
        $validated = $request->validate([
            'product_ids'   => 'required|array|min:1',
            'product_ids.*' => 'integer|exists:products,id',
        ]);

        $products = Product::whereIn('id', $validated['product_ids'])->get();

        foreach ($products as $product) {
            $updateData = ['promo_campaign_id' => $promoCampaign->id];

            if ($promoCampaign->is_active) {
                $updateData['is_promo'] = true;
                $updateData['discount_percentage'] = $promoCampaign->discount_percentage;
                $updateData['promo_price'] = $this->computePromoPrice((float) $product->price, $promoCampaign->discount_percentage);
                $updateData['promo_starts_at'] = $promoCampaign->starts_at;
                $updateData['promo_ends_at'] = $promoCampaign->ends_at;
            }

            $product->update($updateData);
            Cache::forget('product_' . $product->slug);
        }

        $this->clearCaches();

        return response()->json([
            'message' => count($products) . ' produit(s) ajouté(s) à la campagne.',
        ]);
    }

    // ── Retirer des produits de la campagne (en masse) ──
    public function removeProducts(Request $request, PromoCampaign $promoCampaign)
    {
        $validated = $request->validate([
            'product_ids'   => 'required|array|min:1',
            'product_ids.*' => 'integer|exists:products,id',
        ]);

        $products = Product::whereIn('id', $validated['product_ids'])
            ->where('promo_campaign_id', $promoCampaign->id)
            ->get();

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

        $this->clearCaches();

        return response()->json([
            'message' => count($products) . ' produit(s) retiré(s) de la campagne.',
        ]);
    }
}
