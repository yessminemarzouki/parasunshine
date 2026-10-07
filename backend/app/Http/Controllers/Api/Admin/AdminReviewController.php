<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\Product;
use Illuminate\Http\Request;

class AdminReviewController extends Controller
{
    public function index(Request $request)
    {
        $query = Review::withTrashed()->with('product:id,name,image')->latest();

        if ($request->filled('include_deleted') && !$request->boolean('include_deleted')) {
            $query->whereNull('deleted_at');
        }

        if ($request->has('status')) {
            if ($request->status === 'pending') {
                $query->where('is_approved', false)->where('is_rejected', false);
            } elseif ($request->status === 'approved') {
                $query->where('is_approved', true);
            } elseif ($request->status === 'rejected') {
                $query->where('is_rejected', true);
            }
        }

        if ($request->rating) {
            $query->where('rating', (int) $request->rating);
        }

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('customer_name', 'like', '%' . $request->search . '%')
                    ->orWhereHas('product', fn ($p) => $p->where('name', 'like', '%' . $request->search . '%'));
            });
        }

        return response()->json($query->paginate($request->per_page ?? 20));
    }

    public function approve(Review $review)
    {
        $review->update([
            'is_approved' => true,
            'is_rejected' => false,
        ]);

        $this->updateProductRating($review->product_id);

        return response()->json(['message' => 'Avis approuvé avec succès.']);
    }

    public function reject(Review $review)
    {
        $review->update([
            'is_approved' => false,
            'is_rejected' => true,
        ]);

        $this->updateProductRating($review->product_id);

        return response()->json(['message' => 'Avis refusé.']);
    }

    /**
     * Suppression admin — retire l'avis du lien public (soft delete) sans
     * jamais l'effacer vraiment, uniquement pour les avis déjà approuvés.
     * L'auteur n'est pas notifié et ne voit plus jamais cet avis nulle
     * part côté public — mais il reste visible ici, marqué "supprimé par
     * l'administrateur".
     */
    public function destroy(Review $review)
    {
        if (!$review->is_approved) {
            return response()->json([
                'message' => 'Seuls les avis approuvés peuvent être supprimés.',
            ], 403);
        }
        if ($review->trashed()) {
            return response()->json(['message' => 'Cet avis est déjà supprimé.'], 422);
        }

        $productId = $review->product_id;
        $review->update(['deleted_by' => 'admin']);
        $review->delete(); // soft delete

        $this->updateProductRating($productId);

        return response()->json(['message' => 'Avis supprimé.']);
    }
    public function bulkApprove(Request $request)
    {
        $request->validate([
            'ids'   => 'required|array|min:1',
            'ids.*' => 'integer|exists:reviews,id',
        ]);

        $reviews = Review::whereIn('id', $request->ids)->get();
        $productIds = $reviews->pluck('product_id')->unique();

        Review::whereIn('id', $request->ids)->update([
            'is_approved' => true,
            'is_rejected' => false,
        ]);

        foreach ($productIds as $productId) {
            $this->updateProductRating($productId);
        }

        return response()->json([
            'message' => count($request->ids) . ' avis approuvé(s) avec succès.',
        ]);
    }

    public function bulkReject(Request $request)
    {
        $request->validate([
            'ids'   => 'required|array|min:1',
            'ids.*' => 'integer|exists:reviews,id',
        ]);

        $reviews = Review::whereIn('id', $request->ids)->get();
        $productIds = $reviews->pluck('product_id')->unique();

        Review::whereIn('id', $request->ids)->update([
            'is_approved' => false,
            'is_rejected' => true,
        ]);

        foreach ($productIds as $productId) {
            $this->updateProductRating($productId);
        }

        return response()->json([
            'message' => count($request->ids) . ' avis refusé(s) avec succès.',
        ]);
    }

    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids'   => 'required|array|min:1',
            'ids.*' => 'integer|exists:reviews,id',
        ]);

        $reviews = Review::whereIn('id', $request->ids)
            ->where('is_approved', true)
            ->get();
        $productIds = $reviews->pluck('product_id')->unique();

        Review::whereIn('id', $reviews->pluck('id'))->update(['deleted_by' => 'admin']);
        Review::whereIn('id', $reviews->pluck('id'))->delete(); // soft delete

        foreach ($productIds as $productId) {
            $this->updateProductRating($productId);
        }

        return response()->json([
            'message' => $reviews->count() . ' avis supprimé(s) avec succès (les avis non approuvés ont été ignorés).',
        ]);
    }

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
