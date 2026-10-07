<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\FeaturedSection;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class AdminFeaturedSectionController extends Controller
{
    private function getOrCreate(): FeaturedSection
    {
        $section = FeaturedSection::first();
        if (!$section) {
            $section = FeaturedSection::create(['is_visible' => true]);
        }
        return $section;
    }

    public function show()
    {
        $section = $this->getOrCreate();

        $included = Product::select(['id', 'name', 'slug', 'price', 'promo_price', 'image', 'stock', 'is_featured'])
            ->where('is_featured', true)
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json([
            'section'           => $section,
            'included_products' => $included,
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate(['is_visible' => 'required|boolean']);

        $section = $this->getOrCreate();
        $section->update($data);
        Cache::forget('featured_section_public');

        return response()->json(['message' => 'Section mise à jour.', 'section' => $section]);
    }

    /**
     * Recherche parmi les produits qui n'ont PAS encore le badge Vedette
     */
    public function searchProducts(Request $request)
    {
        $q = $request->get('q', '');

        $products = Product::select(['id', 'name', 'slug', 'price', 'promo_price', 'image', 'stock', 'is_featured'])
            ->where('is_featured', false)
            ->where(function ($query) use ($q) {
                $query->where('name', 'LIKE', "%{$q}%")
                    ->orWhere('reference', 'LIKE', "%{$q}%");
            })
            ->limit(30)
            ->get();

        return response()->json($products);
    }

    /**
     * Ajouter = activer le badge Vedette sur le produit
     */
    public function addProduct(Request $request, $productId)
    {
        $product = Product::findOrFail($productId);
        $product->update(['is_featured' => true]);

        Cache::forget('featured_section_public');
        Cache::forget('home_data');

        return response()->json(['message' => 'Produit ajouté à la section.']);
    }

    /**
     * Retirer = désactiver le badge Vedette sur le produit
     */
    public function removeProduct(Request $request, $productId)
    {
        $product = Product::findOrFail($productId);
        $product->update(['is_featured' => false]);

        Cache::forget('featured_section_public');
        Cache::forget('home_data');

        return response()->json(['message' => 'Produit retiré de la section.']);
    }
}
