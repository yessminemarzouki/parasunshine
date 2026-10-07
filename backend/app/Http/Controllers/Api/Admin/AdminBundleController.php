<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Bundle;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class AdminBundleController extends Controller
{
    public function searchProducts(Request $request)
    {
        $q = trim($request->get('q', ''));

        $query = Product::select('id', 'name', 'slug', 'image', 'price', 'promo_price', 'stock', 'reference')
            ->where('stock', '>', 0)
            ->where('is_unavailable', false);

        if ($q !== '') {
            $query->where(function ($query) use ($q) {
                $query->where('name', 'like', "%{$q}%")
                    ->orWhere('reference', 'like', "%{$q}%");
            });
        }

        return response()->json($query->orderBy('name')->limit(30)->get());
    }
    public function bundlesForMenu()
    {
        $bundles = \App\Models\Bundle::select('id', 'name', 'slug', 'image', 'stock', 'is_unavailable')
            ->orderBy('name')
            ->get()
            ->map(function ($bundle) {
                $bundle->is_available = $bundle->is_available;
                return $bundle;
            });

        return response()->json($bundles);
    }
    public function index(Request $request)
    {
        $query = Bundle::with(['brand:id,name', 'category:id,name', 'items.product:id,name,image,price,stock,is_unavailable'])
            ->withCount('items')
            ->latest();

        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->bundle_category_id) {
            $query->where('bundle_category_id', $request->bundle_category_id);
        }

        if ($request->brand_id) {
            $query->where('brand_id', $request->brand_id);
        }

        if ($request->availability) {
            $all = $query->get()->map(function ($bundle) {
                $bundle->is_available = $bundle->is_available;
                $bundle->has_free_items = $bundle->has_free_items;
                return $bundle;
            });

            $filtered = $request->availability === 'available'
                ? $all->filter(fn ($b) => $b->is_available)
                : $all->filter(fn ($b) => !$b->is_available);

            $perPage = $request->per_page ?? 15;
            $page = $request->get('page', 1);
            $items = $filtered->values()->forPage($page, $perPage);

            return response()->json([
                'data'         => $items->values(),
                'current_page' => (int) $page,
                'last_page'    => max(1, (int) ceil($filtered->count() / $perPage)),
                'total'        => $filtered->count(),
                'per_page'     => $perPage,
            ]);
        }

        $bundles = $query->paginate($request->per_page ?? 15);

        $bundles->getCollection()->transform(function ($bundle) {
            $bundle->is_available = $bundle->is_available;
            $bundle->has_free_items = $bundle->has_free_items;
            return $bundle;
        });

        return response()->json($bundles);
    }

    public function show(Bundle $bundle)
    {
        $bundle->load(['brand', 'category', 'items.product']);
        $bundle->is_available = $bundle->is_available;

        return response()->json($bundle);
    }

    public function store(Request $request)
    {
        $data = $this->validateBundle($request);

        $itemError = $this->validateItems($data['items']);
        if ($itemError) {
            return response()->json(['message' => $itemError], 422);
        }

        DB::beginTransaction();
        try {
            $bundleData = $this->extractBundleFields($data);

            if ($data['price_mode'] === 'auto') {
                $bundleData['price'] = $this->computeAutoPrice($data['items']);
            }

            if ($request->hasFile('image')) {
                $bundleData['image'] = $request->file('image')->store('bundles', 'public');
            }
            $bundleData['images'] = $this->handleGalleryImages($request);
            $bundleData['slug'] = Str::slug($data['name']) . '-' . Str::random(4);

            $bundle = Bundle::create($bundleData);

            foreach ($data['items'] as $i => $item) {
                $customImage = null;
                if (empty($item['product_id']) && $request->hasFile("item_image_{$i}")) {
                    $customImage = $request->file("item_image_{$i}")->store('bundles/items', 'public');
                }

                $bundle->items()->create([
                    'product_id'    => $item['product_id'] ?? null,
                    'custom_name'   => $item['custom_name'] ?? null,
                    'custom_price'  => $item['custom_price'] ?? null,
                    'custom_image'  => $customImage,
                    'quantity'      => $item['quantity'],
                    'is_free'       => $item['is_free'] ?? false,
                    'sort'          => $i,
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Coffret créé avec succès.',
                'bundle'  => $bundle->load('items.product'),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Erreur lors de la création du coffret.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, Bundle $bundle)
    {
        $data = $this->validateBundle($request);

        $itemError = $this->validateItems($data['items']);
        if ($itemError) {
            return response()->json(['message' => $itemError], 422);
        }

        DB::beginTransaction();
        try {
            $bundleData = $this->extractBundleFields($data);

            if ($data['price_mode'] === 'auto') {
                $bundleData['price'] = $this->computeAutoPrice($data['items']);
            }

            if ($request->hasFile('image')) {
                if ($bundle->image) {
                    Storage::disk('public')->delete($bundle->image);
                }
                $bundleData['image'] = $request->file('image')->store('bundles', 'public');
            }
            $bundleData['images'] = $this->handleGalleryImages($request, $bundle);

            $bundle->update($bundleData);

            // Supprime les anciennes images manuelles avant de recréer les items
            foreach ($bundle->items as $oldItem) {
                if ($oldItem->custom_image) {
                    Storage::disk('public')->delete($oldItem->custom_image);
                }
            }
            $bundle->items()->delete();

            foreach ($data['items'] as $i => $item) {
                $customImage = null;
                if (empty($item['product_id'])) {
                    if ($request->hasFile("item_image_{$i}")) {
                        $customImage = $request->file("item_image_{$i}")->store('bundles/items', 'public');
                    } elseif (!empty($item['existing_custom_image'])) {
                        $customImage = $item['existing_custom_image'];
                    }
                }

                $bundle->items()->create([
                    'product_id'    => $item['product_id'] ?? null,
                    'custom_name'   => $item['custom_name'] ?? null,
                    'custom_price'  => $item['custom_price'] ?? null,
                    'custom_image'  => $customImage,
                    'quantity'      => $item['quantity'],
                    'is_free'       => $item['is_free'] ?? false,
                    'sort'          => $i,
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Coffret mis à jour.',
                'bundle'  => $bundle->fresh()->load('items.product'),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Erreur lors de la mise à jour du coffret.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(Bundle $bundle)
    {
        if ($bundle->image) {
            Storage::disk('public')->delete($bundle->image);
        }
        if (!empty($bundle->images)) {
            foreach ($bundle->images as $img) {
                Storage::disk('public')->delete($img);
            }
        }

        $bundle->delete();

        return response()->json(['message' => 'Coffret supprimé.']);
    }

    // ── Helpers privés ──────────────────────────────

    private function validateBundle(Request $request): array
    {
        return $request->validate([
            'name'                 => 'required|string|max:255',
            'brand_id'             => 'nullable|exists:brands,id',
            'bundle_category_id'   => 'nullable|exists:bundle_categories,id',
            'description'          => 'nullable|string',
            'price_mode'           => 'required|in:manual,auto',
            'price'                => 'required_if:price_mode,manual|nullable|numeric|min:0',
            'promo_price'          => 'nullable|numeric|min:0',
            'discount_percentage'  => 'nullable|integer|min:0|max:100',
            'promo_starts_at'      => 'nullable|date',
            'promo_ends_at'        => 'nullable|date',
            'stock'                => 'required|integer|min:0',
            'is_unavailable'       => 'boolean',
            'items'                => 'required|array|min:1',
            'items.*.product_id'   => 'nullable|exists:products,id',
            'items.*.custom_name'  => 'nullable|string|max:255',
                      'items.*.custom_price'           => 'nullable|numeric|min:0',
            'items.*.existing_custom_image'  => 'nullable|string',
            'items.*.quantity'               => 'required|integer|min:1',
            'items.*.is_free'      => 'boolean',
        ]);
    }

    private function extractBundleFields(array $data): array
    {
        return [
            'name'                => $data['name'],
            'brand_id'            => $data['brand_id'] ?? null,
            'bundle_category_id'  => $data['bundle_category_id'] ?? null,
            'description'         => $data['description'] ?? null,
            'price_mode'          => $data['price_mode'],
            'price'               => $data['price'] ?? 0,
            'promo_price'         => $data['promo_price'] ?? null,
            'discount_percentage' => $data['discount_percentage'] ?? null,
            'promo_starts_at'     => $data['promo_starts_at'] ?? null,
            'promo_ends_at'       => $data['promo_ends_at'] ?? null,
            'stock'               => $data['stock'],
            'is_unavailable'      => $data['is_unavailable'] ?? false,
        ];
    }



    private function validateItems(array $items): ?string
    {
        foreach ($items as $item) {
            $hasProduct = !empty($item['product_id']);
            $hasCustom = !empty($item['custom_name']);

            if (!$hasProduct && !$hasCustom) {
                return 'Chaque article du coffret doit être un produit du catalogue ou un article manuel avec un nom.';
            }

            if (!$hasProduct && $hasCustom && !isset($item['custom_price'])) {
                return "Le prix est obligatoire pour l'article manuel \"{$item['custom_name']}\".";
            }
        }
        return null;
    }

    private function computeAutoPrice(array $items): float
    {
        $total = 0;

        foreach ($items as $item) {
            if ($item['is_free'] ?? false) {
                continue;
            }

            if (!empty($item['product_id'])) {
                $product = Product::find($item['product_id']);
                if ($product) {
                    $total += $product->price * $item['quantity'];
                }
            } elseif (isset($item['custom_price'])) {
                $total += $item['custom_price'] * $item['quantity'];
            }
        }

        return round($total, 3);
    }

    private function handleGalleryImages(Request $request, ?Bundle $bundle = null): array
    {
        $oldImages = $bundle?->images ?? [];
        $newImages = [];

        for ($i = 0; $i < 3; $i++) {
            if ($request->hasFile("gallery_image_{$i}")) {
                if (!empty($oldImages[$i])) {
                    Storage::disk('public')->delete($oldImages[$i]);
                }
                $newImages[$i] = $request->file("gallery_image_{$i}")->store('bundles', 'public');
            } elseif ($request->filled("existing_image_{$i}")) {
                $newImages[$i] = $request->input("existing_image_{$i}");
            } elseif (!empty($oldImages[$i])) {
                Storage::disk('public')->delete($oldImages[$i]);
            }
        }

        return array_values($newImages);
    }
}
