<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Wishlist;
use Illuminate\Http\Request;

class WishlistController extends Controller
{
    /**
     * LISTE DES FAVORIS DE L'UTILISATEUR
     */
    public function index(Request $request)
    {
        $wishlists = Wishlist::where('user_id', $request->user()->id)
            ->with(['product.brand', 'product.category', 'bundle.brand', 'bundle.items.product'])
            ->get();

        // Calcule la disponibilité en direct pour chaque coffret favori
        // (jamais stockée en base — dépend du stock du coffret ET de ses produits)
        $wishlists->each(function ($wishlist) {
            if ($wishlist->bundle) {
                $wishlist->bundle->is_available = $wishlist->bundle->is_available;
            }
        });

        return response()->json([
            'wishlists' => $wishlists,
        ]);
    }

    /**
     * AJOUTER UN PRODUIT AUX FAVORIS
     */
    public function store(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
        ]);

        // Vérifier si déjà en favoris
        $exists = Wishlist::where('user_id', $request->user()->id)
            ->where('product_id', $request->product_id)
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Ce produit est déjà dans vos favoris',
            ], 409);
        }

        $wishlist = Wishlist::create([
            'user_id' => $request->user()->id,
            'product_id' => $request->product_id,
        ]);

        return response()->json([
            'message' => 'Produit ajouté aux favoris',
            'wishlist' => $wishlist->load('product'),
        ], 201);
    }

    /**
     * RETIRER UN PRODUIT DES FAVORIS
     */
    public function destroy(Request $request, $productId)
    {
        $deleted = Wishlist::where('user_id', $request->user()->id)
            ->where('product_id', $productId)
            ->delete();

        if (!$deleted) {
            return response()->json([
                'message' => 'Produit non trouvé dans vos favoris',
            ], 404);
        }

        return response()->json([
            'message' => 'Produit retiré des favoris',
        ]);
    }

    /**
     * VÉRIFIER SI UN PRODUIT EST EN FAVORIS
     */
    public function check(Request $request, $productId)
    {
        $isFavorite = Wishlist::where('user_id', $request->user()->id)
            ->where('product_id', $productId)
            ->exists();

        return response()->json([
            'is_favorite' => $isFavorite,
        ]);
    }

    /**
     * AJOUTER UN COFFRET AUX FAVORIS
     */
    public function storeBundle(Request $request)
    {
        $request->validate([
            'bundle_id' => 'required|exists:bundles,id',
        ]);

        $exists = Wishlist::where('user_id', $request->user()->id)
            ->where('bundle_id', $request->bundle_id)
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Ce coffret est déjà dans vos favoris',
            ], 409);
        }

        $wishlist = Wishlist::create([
            'user_id'   => $request->user()->id,
            'bundle_id' => $request->bundle_id,
        ]);

        return response()->json([
            'message'  => 'Coffret ajouté aux favoris',
            'wishlist' => $wishlist->load('bundle'),
        ], 201);
    }

    /**
     * RETIRER UN COFFRET DES FAVORIS
     */
    public function destroyBundle(Request $request, $bundleId)
    {
        $deleted = Wishlist::where('user_id', $request->user()->id)
            ->where('bundle_id', $bundleId)
            ->delete();

        if (!$deleted) {
            return response()->json([
                'message' => 'Coffret non trouvé dans vos favoris',
            ], 404);
        }

        return response()->json([
            'message' => 'Coffret retiré des favoris',
        ]);
    }
}
