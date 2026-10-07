<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FeaturedSection;
use App\Models\Product;
use Illuminate\Support\Facades\Cache;

class FeaturedSectionController extends Controller
{
    public function show()
    {
        $data = Cache::remember('featured_section_public', 300, function () {
            $section = FeaturedSection::first();

            if (!$section || !$section->is_visible) {
                return ['visible' => false, 'products' => []];
            }

            $cols = [
                'id', 'name', 'slug', 'price', 'promo_price', 'discount_percentage',
                'image', 'stock', 'category_id', 'brand_id', 'is_promo', 'is_featured',
                'is_new', 'is_bestseller', 'loyalty_points', 'reference', 'short_description',
                'has_sizes', 'has_colors',
            ];

            $products = Product::select($cols)
                ->with(['category:id,name,slug', 'brand:id,name,slug'])
                ->where('is_featured', true)
                ->where('stock', '>', 0)
                ->orderBy('updated_at', 'desc')
                ->get();

            return ['visible' => true, 'products' => $products];
        });

        return response()->json($data);
    }
}
