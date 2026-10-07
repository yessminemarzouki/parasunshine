<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReviewController extends Controller
{
    /**
     * LISTE DES AVIS D'UN PRODUIT
     */
    public function index($productId)
    {
        $reviews = Review::where('product_id', $productId)
            ->where('is_approved', true)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['reviews' => $reviews]);
    }

    /**
     * CRÉER UN AVIS (Authentifié obligatoire)
     */
    public function store(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'required|string|min:10|max:1000',
        ]);

        $user = Auth::user();

        // Vérifier si l'utilisateur a déjà laissé un avis pour ce produit
        $existingReview = Review::where('product_id', $request->product_id)
            ->where('customer_email', $user->email)
            ->first();

        if ($existingReview) {
            return response()->json([
                'message' => 'Vous avez déjà laissé un avis pour ce produit',
            ], 409);
        }

        $review = Review::create([
    'product_id'     => $request->product_id,
    'customer_name'  => $user->name,
    'customer_email' => $user->email,
    'rating'         => $request->rating,
    'comment'        => $request->comment,
    'is_verified'    => false,
    'is_approved'    => false, // ← en attente de modération
    'is_rejected'    => false,
]);

        // Mettre à jour la note moyenne du produit
        $this->updateProductRating($request->product_id);

        return response()->json([
            'message' => 'Votre avis a été publié avec succès',
            'review' => $review,
        ], 201);
    }

    /**
     * La modification d'un avis n'est plus autorisée côté client — seule la
     * suppression l'est. Endpoint conservé désactivé pour compatibilité,
     * au cas où d'anciens clients frontend l'appelleraient encore.
     */
    public function update(Request $request, $id)
    {
        return response()->json([
            'message' => 'La modification d\'un avis n\'est plus disponible. Vous pouvez le supprimer.',
        ], 403);
    }

    /**
     * SUPPRIMER SON PROPRE AVIS — autorisé si en attente ou approuvé,
     * jamais si refusé (soft delete : reste visible côté admin, marqué
     * comme supprimé par son propriétaire).
     */
    public function destroy($id)
    {
        $user = Auth::user();

        $review = Review::where('id', $id)
            ->where('customer_email', $user->email)
            ->firstOrFail();

        if ($review->is_rejected) {
            return response()->json([
                'message' => 'Un avis refusé ne peut pas être supprimé.',
            ], 403);
        }

        $productId = $review->product_id;
        $review->update(['deleted_by' => 'owner']);
        $review->delete(); // soft delete

        $this->updateProductRating($productId);

        return response()->json([
            'message' => 'Votre avis a été supprimé',
        ]);
    }

    /**
     * VÉRIFIER SI L'UTILISATEUR A DÉJÀ LAISSÉ UN AVIS
     */
    public function checkUserReview($productId)
    {
        $user = Auth::user();

        $review = Review::where('product_id', $productId)
            ->where('customer_email', $user->email)
            ->first();

        return response()->json([
            'has_review' => !!$review,
            'review' => $review,
        ]);
    }

    /**
     * METTRE À JOUR LA NOTE MOYENNE DU PRODUIT
     */
    private function updateProductRating($productId)
    {
        $product = Product::find($productId);
        if (!$product) {
            return;
        }

        $reviews = Review::where('product_id', $productId)
            ->where('is_approved', true)
            ->get();

        $product->reviews_count = $reviews->count();
        $product->rating = $reviews->count() > 0
            ? round($reviews->avg('rating'), 1)
            : 0;

        $product->save();
    }
}
