<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bundle;
use App\Models\BundleCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class BundleController extends Controller
{
    private $listColumns = [
        'id', 'name', 'slug', 'image', 'price', 'promo_price',
        'discount_percentage', 'stock', 'is_unavailable',
        'brand_id', 'bundle_category_id', 'rating', 'reviews_count',
    ];

    /**
     * Liste tous les coffrets, y compris les indisponibles (affiché mais non achetable).
     */
    public function index(Request $request)
    {
        $query = Bundle::select($this->listColumns)
            ->with(['brand:id,name', 'category:id,name', 'items.product:id,stock,is_unavailable'])
            ->latest();

        if ($request->bundle_category) {
            $query->whereHas('category', fn ($q) => $q->where('slug', $request->bundle_category));
        }

        if ($request->brand) {
            $query->whereHas('brand', fn ($q) => $q->where('slug', $request->brand));
        }

        if ($request->min_price && is_numeric($request->min_price)) {
            $query->where('price', '>=', (float) $request->min_price);
        }
        if ($request->max_price && is_numeric($request->max_price)) {
            $query->where('price', '<=', (float) $request->max_price);
        }

        $bundles = $query->paginate($request->per_page ?? 20);

        // Ajoute la disponibilité calculée à chaque coffret pour le filtre "Disponibilité"
        $bundles->getCollection()->transform(function ($bundle) {
            $bundle->is_available = $bundle->is_available;
            return $bundle;
        });

        if ($request->availability === 'available') {
            $bundles->setCollection(
                $bundles->getCollection()->filter(fn ($b) => $b->is_available)->values()
            );
        } elseif ($request->availability === 'unavailable') {
            $bundles->setCollection(
                $bundles->getCollection()->filter(fn ($b) => !$b->is_available)->values()
            );
        }

        return response()->json($bundles);
    }

    public function show($slug)
    {
        $bundle = Bundle::with([
            'brand:id,name,logo',
            'category:id,name',
            'items.product:id,name,slug,image,price,stock,is_unavailable',
        ])->where('slug', $slug)->firstOrFail();

        $bundle->is_available = $bundle->is_available;

        // Montant gagné = somme des prix des articles offerts (produits ou manuels)
        $bundle->gift_value = $bundle->items
            ->where('is_free', true)
            ->sum(fn ($item) => ($item->product->price ?? $item->custom_price ?? 0) * $item->quantity);

        return response()->json($bundle);
    }

    public function categories()
    {
        return Cache::remember('bundle_categories_public', 300, function () {
            return BundleCategory::withCount('bundles')->orderBy('sort')->get();
        });
    }

    public function notifyMe(Request $request, $id)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:100',
            'last_name'  => 'required|string|max:100',
            'phone'      => 'required|string|max:20|regex:/^[0-9\s\-\+\(\)]+$/',
            'quantity'   => 'nullable|integer|min:1|max:100',
        ], [
            'phone.regex' => 'Format de téléphone invalide',
        ]);

        \Illuminate\Support\Facades\DB::table('product_notifications')->insert([
            'bundle_id'  => $id,
            'user_id'    => $request->user('sanctum')?->id,
            'first_name' => $validated['first_name'],
            'last_name'  => $validated['last_name'],
            'phone'      => $validated['phone'],
            'quantity'   => $validated['quantity'] ?? 1,
            'notified'   => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Vous serez averti(e) dès que ce coffret sera disponible.']);
    }
}
