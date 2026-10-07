<?php

namespace App\Http\Controllers\Api;

use App\Models\Product;
use App\Models\Category;
use App\Models\Brand;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    private $listColumns = [
    'id',
    'name',
    'slug',
    'price',
    'reference',
    'short_description',
    'promo_price',
    'discount_percentage',
    'image',
    'stock',
    'category_id',
    'category2_id',
    'brand_id',
    'loyalty_points',
    'is_featured',
    'is_new',
    'is_bestseller',
    'is_promo',
      'has_sizes',
    'has_colors',
    'has_age',
    'is_unavailable',
];

    /**
     * Retourne tous les IDs de catégories (la catégorie elle-même + tous ses descendants)
     * Utilise le cache pour éviter les requêtes répétées
     */
    private function getCategoryIdsWithDescendants(string $categorySlug): array
    {
        $cacheKey = 'category_ids_' . $categorySlug;

        return Cache::remember($cacheKey, 300, function () use ($categorySlug) {
            $category = Category::where('slug', $categorySlug)
                ->select('id', 'slug')
                ->first();

            if (!$category) {
                return [];
            }

            return $this->collectCategoryIds($category->id);
        });
    }

    public function notifyMe(Request $request, $id)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:100',
            'last_name'  => 'required|string|max:100',
            'phone'      => 'required|string|max:20|regex:/^[0-9\s\-\+\(\)]+$/',
            'size'       => 'nullable|string|max:50',
            'color'      => 'nullable|string|max:100',
            'age'        => 'nullable|string|max:50',
            'quantity'   => 'nullable|integer|min:1|max:100',
        ], [
            'phone.regex' => 'Format de téléphone invalide',
        ]);

        DB::table('product_notifications')->insert([
            'product_id' => $id,
            'user_id'    => $request->user('sanctum')?->id,
            'first_name' => $validated['first_name'],
            'last_name'  => $validated['last_name'],
            'phone'      => $validated['phone'],
            'size'       => $validated['size'] ?? null,
            'color'      => $validated['color'] ?? null,
            'age'        => $validated['age'] ?? null,
            'quantity'   => $validated['quantity'] ?? 1,
            'notified'   => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Vous serez averti(e) dès que ce produit sera disponible.']);
    }

    /**
     * MES DEMANDES DE STOCK (client connecté)
     */
    public function myStockRequests(Request $request)
    {
        $requests = DB::table('product_notifications')
            ->join('products', 'product_notifications.product_id', '=', 'products.id')
            ->where('product_notifications.user_id', $request->user()->id)
                   ->select(
                       'product_notifications.id',
                       'product_notifications.notified',
                       'product_notifications.size',
                       'product_notifications.color',
                       'product_notifications.age',
                       'product_notifications.quantity',
                       'product_notifications.created_at',
                       'products.id as product_id',
                       'products.name as product_name',
                       'products.slug as product_slug',
                       'products.image as product_image',
                       'products.stock as product_stock',
                       'products.is_unavailable as product_is_unavailable',
                   )
            ->orderByDesc('product_notifications.created_at')
            ->get();

        return response()->json(['requests' => $requests]);
    }

    /**
     * Collecte récursivement tous les IDs (parent + enfants + petits-enfants)
     */
    private function collectCategoryIds(int $categoryId): array
    {
        $ids = [$categoryId];

        $children = Category::where('parent_id', $categoryId)
            ->select('id')
            ->get();

        foreach ($children as $child) {
            $ids = array_merge($ids, $this->collectCategoryIds($child->id));
        }

        return $ids;
    }

    /**
     * Liste tous les produits avec filtre catégorie récursif
     */
    public function index(Request $request)
    {
        $version = Cache::get('products_list_version', 1);

        $cacheKey = 'products_list_' . $version . '_' . md5(json_encode([
            'category'  => $request->query('category'),
            'promo'     => $request->query('promo'),
            'sort'      => $request->query('sort'),
            'direction' => $request->query('direction'),
            'page'      => $request->query('page', 1),
        ]));

        $products = Cache::remember($cacheKey, 300, function () use ($request) {
            $query = Product::select($this->listColumns)
                          ->with([
                    'category:id,name,slug,parent_id',
                    'brand:id,name,slug,parent_id',
                    'brand.parent:id,name,slug',
                ]);

            if ($request->has('category')) {
                $categoryIds = $this->getCategoryIdsWithDescendants(
                    $request->get('category')
                );

                if (!empty($categoryIds)) {
                    $query->where(function ($q) use ($categoryIds) {
                        $q->whereIn('category_id', $categoryIds)
                            ->orWhereIn('category2_id', $categoryIds);
                    });
                }
            }

            if ($request->has('promo') && $request->get('promo') == 'true') {
                $query->where('is_promo', true);
            }

            $sortBy = $request->get('sort', 'created_at');
            $sortDirection = $request->get('direction', 'desc');

            $allowedSorts = ['created_at', 'price', 'name'];
            if (!in_array($sortBy, $allowedSorts)) {
                $sortBy = 'created_at';
            }

            $query->orderBy($sortBy, $sortDirection);

            return $query->paginate(12);
        });

        return response()->json($products);
    }

    /**
     * Filtre avancé avec catégorie récursive
     */
    public function filter(Request $request)
    {
        $query = Product::query();

        if ($request->has('category') && $request->category !== '') {
            $categoryIds = $this->getCategoryIdsWithDescendants($request->category);
            if (!empty($categoryIds)) {
                // Un produit apparaît s'il correspond via sa catégorie
                // principale OU sa deuxième catégorie (même principe de
                // sous-catégories récursives pour les deux).
                $query->where(function ($q) use ($categoryIds) {
                    $q->whereIn('category_id', $categoryIds)
                        ->orWhereIn('category2_id', $categoryIds);
                });
            }
        }

        if ($request->has('brand') && $request->brand !== '') {
            $query->whereHas('brand', function ($q) use ($request) {
                $q->where('slug', $request->brand);
            });
        }

        if ($request->has('min_price') && is_numeric($request->min_price)) {
            $query->where('price', '>=', (float) $request->min_price);
        }
        if ($request->has('max_price') && is_numeric($request->max_price)) {
            $query->where('price', '<=', (float) $request->max_price);
        }

        if ($request->boolean('promo')) {
            $query->where('is_promo', true);
        }

        if ($request->boolean('new')) {
            $query->where('is_new', true);
        }
        if ($request->boolean('bestseller')) {
            $query->where('is_bestseller', true);
        }

        if ($request->boolean('featured')) {
            $query->where('is_featured', true)->inRandomOrder();
        }

        if ($request->has('concern') && $request->concern !== '') {
            $concern = $request->concern;
            $query->where(function ($q) use ($concern) {
                $q->whereHas('category', fn ($c) => $c->where('slug', 'like', "%{$concern}%"))
                    ->orWhere('name', 'like', "%{$concern}%")
                    ->orWhere('description', 'like', "%{$concern}%");
            });
        }

        if ($request->has('search') && $request->search !== '') {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                    ->orWhere('reference', 'LIKE', "%{$search}%")
                    ->orWhereHas('brand', fn ($b) => $b->where('name', 'LIKE', "%{$search}%"))
                    ->orWhereHas('category', fn ($c) => $c->where('name', 'LIKE', "%{$search}%"));
            });
        }

        $sortBy = $request->get('sort', 'created_at');
        switch ($sortBy) {
            case 'price_asc':
                $query->orderBy('price', 'asc');
                break;
            case 'price_desc':
                $query->orderBy('price', 'desc');
                break;
            case 'name':
                $query->orderBy('name', 'asc');
                break;
            case 'popularity':
                $query->orderBy('is_bestseller', 'desc')
                    ->orderBy('created_at', 'desc');
                break;
            default:
                $query->orderBy('created_at', 'desc');
        }

        $query->select($this->listColumns)
        ->with([
            'category:id,name,slug,parent_id',
            'brand:id,name,slug,parent_id',
            'brand.parent:id,name,slug',
        ]);

        $perPage = min((int) $request->get('per_page', 20), 50);
        return $query->paginate($perPage);
    }

    /**
     * Catégories avec arborescence complète (3 niveaux)
     */
    public function categories()
    {
        return Cache::remember('all_categories_tree', 300, function () {
            return Category::select(
                'id',
                'name',
                'slug',
                'parent_id',
                'sort',
                'show_in_menu',
                'show_in_megamenu',
                'icon',
                'promo_title',
                'promo_text',
                'promo_cta',
                'bundle_id'
            )
                ->whereNull('parent_id')
                ->where('show_in_menu', true)
                    ->with([
               'bundle:id,name,slug,image',
               'brands' => function ($query) {
                   $query->select('brands.id', 'brands.name', 'brands.slug', 'brands.logo');
               },
               'children' => function ($query) {
                   $query->select('id', 'name', 'slug', 'parent_id', 'sort', 'image', 'show_in_megamenu')
                       ->where('show_in_megamenu', true)
                       ->orderBy('sort')
                       ->with([
                           'children' => function ($q) {
                               $q->select('id', 'name', 'slug', 'parent_id', 'sort')
                                   ->orderBy('sort');
                           }
                       ]);
               }
                ])
                ->orderBy('sort')
                ->get();
        });
    }

    /**
     * Recherche — tous statuts de stock confondus, comme des résultats normaux
     */
    public function search(Request $request)
    {
        $search = trim($request->get('q', ''));
        if (strlen($search) < 2) {
            return response()->json(['results' => [], 'suggestions' => []]);
        }

        $cols = $this->listColumns;
        $with = [
            'category:id,name,slug',
            'brand:id,name,slug,parent_id',
            'brand.parent:id,name,slug',
        ];

        $keywords = collect(explode(' ', strtolower($search)))
            ->filter(fn ($w) => strlen($w) >= 3)
            ->unique()
            ->values();

        $relevanceSQL = "
        CASE
            WHEN LOWER(name) LIKE ? THEN 10
            WHEN LOWER(name) LIKE ? THEN 8
            ELSE 0
        END
        + (is_bestseller * 2)
        + (is_featured * 1)
    ";
        $relevanceBindings = [
            strtolower($search) . '%',
            '%' . strtolower($search) . '%',
        ];

        $results = Product::select($cols)->with($with)
            ->where(function ($q) use ($search, $keywords) {
                $q->where('name', 'LIKE', "%{$search}%")
                    ->orWhere('reference', 'LIKE', "%{$search}%")
                    ->orWhereHas('brand', fn ($b) => $b->where('name', 'LIKE', "%{$search}%"))
                    ->orWhereHas('category', fn ($c) => $c->where('name', 'LIKE', "%{$search}%"));
                foreach ($keywords as $kw) {
                    $q->orWhere('name', 'LIKE', "%{$kw}%");
                }
            })
            ->orderByRaw($relevanceSQL . " DESC", $relevanceBindings)
            ->limit(10)
            ->get();

        $excludeIds = $results->pluck('id');

        $suggestions = collect([]);

        if ($results->isEmpty() && $keywords->isNotEmpty()) {
            $suggestions = Product::select($cols)->with($with)
                ->where(function ($q) use ($keywords) {
                    foreach ($keywords as $kw) {
                        $q->orWhere('name', 'LIKE', "%{$kw}%")
                            ->orWhereHas('brand', fn ($b) => $b->where('name', 'LIKE', "%{$kw}%"))
                            ->orWhereHas('category', fn ($c) => $c->where('name', 'LIKE', "%{$kw}%"));
                    }
                })
                ->orderByRaw($relevanceSQL . " DESC", $relevanceBindings)
                ->limit(3)
                ->get();

            $excludeIds = $excludeIds->merge($suggestions->pluck('id'));
        }

        // Supprimé : ne plus proposer de bestsellers aléatoires sans rapport avec la recherche

        $matchedBrands = Brand::select('id', 'name', 'slug', 'logo', 'parent_id')
            ->with('parent:id,name,slug,logo')
            ->where('name', 'LIKE', "%{$search}%")
            ->orderBy('name')
            ->limit(5)
            ->get()
            ->map(function ($b) {
                return [
                    'id'           => $b->id,
                    'name'         => $b->name,
                    'slug'         => $b->slug,
                    'logo'         => $b->logo ?: $b->parent?->logo,
                    'is_sub_brand' => (bool) $b->parent_id,
                    'parent_name'  => $b->parent?->name,
                ];
            });

        return response()->json([
            'results'     => $results,
            'suggestions' => $suggestions,
            'brands'      => $matchedBrands,
            'query'       => $search,
        ]);
    }

    /**
     * Toutes les marques
     */
    public function brands()
    {
        return Cache::remember('all_brands', 300, function () {
            return Brand::select('id', 'name', 'slug', 'logo', 'parent_id')
                ->orderBy('name')
                ->get();
        });
    }

    /**
     * Marques disponibles pour une catégorie (incluant sous-catégories)
     */
    public function brandsByCategory($categorySlug)
    {
        $cacheKey = 'brands_category_' . $categorySlug;

        return Cache::remember($cacheKey, 300, function () use ($categorySlug) {
            $categoryIds = $this->getCategoryIdsWithDescendants($categorySlug);

            if (empty($categoryIds)) {
                return collect([]);
            }

            $brandIds = Product::where(function ($q) use ($categoryIds) {
                $q->whereIn('category_id', $categoryIds)
                    ->orWhereIn('category2_id', $categoryIds);
            })
                ->whereNotNull('brand_id')
                ->distinct()
                ->pluck('brand_id');

            return Brand::select('id', 'name', 'slug', 'logo', 'parent_id')
                ->whereIn('id', $brandIds)
                ->orderBy('name')
                ->get();
        });
    }

    /**
     * Produits vedettes
     */
    public function featured()
    {
        $products = Cache::remember('products_featured', 300, function () {
            return Product::select($this->listColumns)
                            ->with([
                    'category:id,name,slug',
                    'brand:id,name,slug,parent_id',
                    'brand.parent:id,name,slug',
                ])
                ->where('is_featured', true)
                ->orderBy('created_at', 'desc')
                ->limit(8)
                ->get();
        });

        return response()->json($products);
    }

    /**
     * Meilleures ventes
     */
    public function bestsellers()
    {
        $products = Cache::remember('products_bestsellers', 300, function () {
            return Product::select($this->listColumns)
                        ->with([
                    'category:id,name,slug',
                    'brand:id,name,slug,parent_id',
                    'brand.parent:id,name,slug',
                ])
                ->where('is_bestseller', true)
                ->orderBy('created_at', 'desc')
                ->limit(8)
                ->get();
        });

        return response()->json($products);
    }

    /**
     * Nouveautés
     */
    public function newest()
    {
        $products = Cache::remember('products_newest', 300, function () {
            return Product::select($this->listColumns)
                             ->with([
                    'category:id,name,slug',
                    'brand:id,name,slug,parent_id',
                    'brand.parent:id,name,slug',
                ])
                ->where('is_new', true)
                ->orderBy('created_at', 'desc')
                ->limit(8)
                ->get();
        });

        return response()->json($products);
    }

    /**
     * Promotions
     */
    public function promotions()
    {
        $products = Cache::remember('products_promotions', 300, function () {
            return Product::select($this->listColumns)
                          ->with([
                    'category:id,name,slug',
                    'brand:id,name,slug,parent_id',
                    'brand.parent:id,name,slug',
                ])
                ->where('is_promo', true)
                ->orderBy('created_at', 'desc')
                ->limit(8)
                ->get();
        });

        return response()->json($products);
    }

    /**
     * Détail d'un produit
     */
    public function show($slug)
    {
        $cacheKey = 'product_' . $slug;

        $product = Cache::remember($cacheKey, 300, function () use ($slug) {
            return Product::select([
                'id', 'name', 'slug', 'description', 'reference',
                'short_description', 'benefits', 'usage_tips',
                'price', 'promo_price', 'discount_percentage',
                'stock', 'image', 'images', 'category_id', 'brand_id',
                'loyalty_points', 'is_featured', 'is_new', 'is_bestseller',
                          'is_promo', 'rating', 'reviews_count', 'created_at',
                'is_unavailable',
                'category2_id', 'display_category1', 'display_category2',
                         'has_sizes',
                'sizes',
                'has_colors',
                'colors',
                'has_age',
                'ages',
                'promo_starts_at',
                'promo_ends_at',
            ])
                   ->with([
                'category:id,name,slug,parent_id',
                'category2:id,name,slug,parent_id',
                'brand:id,name,slug,logo,parent_id',
                'brand.parent:id,name,slug,logo',
            ])
            ->where('slug', $slug)
            ->firstOrFail();
        });

        return response()->json($product);
    }

    /**
     * Données page d'accueil
     */
    public function home()
    {
        $data = Cache::remember('home_data', 300, function () {
            $cols = $this->listColumns;
            $with = [
                'category:id,name,slug',
                'brand:id,name,slug,parent_id',
                'brand.parent:id,name,slug',
            ];

            $hygieneIds = $this->getCategoryIdsWithDescendants('hygiene');

            return [
                'featured' => Product::select($cols)->with($with)
                    ->where('is_featured', true)
                    ->inRandomOrder()->limit(8)->get(),

                'newest' => Product::select($cols)->with($with)
                    ->where('is_new', true)
                    ->orderBy('created_at', 'desc')->limit(8)->get(),

                'promotions' => Product::select($cols)->with($with)
                    ->where('is_promo', true)
                    ->orderBy('created_at', 'desc')
                    ->get(),

                'products' => Product::select($cols)->with($with)
                    ->limit(15)->get(),

                'hygiene' => !empty($hygieneIds)
                    ? Product::select($cols)->with($with)
                    ->whereIn('category_id', $hygieneIds)
                    ->limit(8)->get()
                    : collect([]),

                'bestsellers' => Product::select($cols)->with($with)
                    ->where('is_bestseller', true)
                    ->orderBy('created_at', 'desc')
                    ->limit(8)->get(),
            ];
        });

        return response()->json($data);
    }
}
