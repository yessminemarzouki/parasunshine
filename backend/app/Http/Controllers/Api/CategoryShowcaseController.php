<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CategoryShowcase;
use Illuminate\Support\Facades\Cache;

class CategoryShowcaseController extends Controller
{
    public function show()
    {
        $items = Cache::remember('category_showcase_public', 300, function () {
            return CategoryShowcase::where('is_active', true)
                ->orderBy('order')
                ->get();
        });

        return response()->json($items);
    }
}
