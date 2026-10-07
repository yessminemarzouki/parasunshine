<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BundleReview;
use App\Models\Bundle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BundleReviewController extends Controller
{
    public function index($bundleId)
    {
        $reviews = BundleReview::where('bundle_id', $bundleId)
            ->where('is_approved', true)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['reviews' => $reviews]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'bundle_id' => 'required|exists:bundles,id',
            'rating'    => 'required|integer|min:1|max:5',
            'comment'   => 'required|string|min:10|max:1000',
        ]);

        $user = Auth::user();

        $existing = BundleReview::where('bundle_id', $request->bundle_id)
            ->where('customer_email', $user->email)
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'Vous avez déjà laissé un avis pour ce coffret',
            ], 409);
        }

        $review = BundleReview::create([
            'bundle_id'      => $request->bundle_id,
            'customer_name'  => $user->name,
            'customer_email' => $user->email,
            'rating'         => $request->rating,
            'comment'        => $request->comment,
            'is_verified'    => false,
            'is_approved'    => false,
            'is_rejected'    => false,
        ]);

        $this->updateBundleRating($request->bundle_id);

        return response()->json([
            'message' => 'Votre avis a été publié avec succès',
            'review'  => $review,
        ], 201);
    }

    private function updateBundleRating($bundleId)
    {
        $bundle = Bundle::find($bundleId);
        if (!$bundle) {
            return;
        }

        $reviews = BundleReview::where('bundle_id', $bundleId)
            ->where('is_approved', true)
            ->get();

        $bundle->reviews_count = $reviews->count();
        $bundle->rating = $reviews->count() > 0 ? round($reviews->avg('rating'), 1) : 0;
        $bundle->save();
    }
}
