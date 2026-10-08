<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HeroSlide;
use Illuminate\Support\Facades\Cache;

class HeroSlideController extends Controller
{
    public function index()
    {
        $slides = Cache::remember('hero_slides_active', 300, function () {
            return HeroSlide::active()->get(['id', 'image', 'title', 'subtitle', 'link', 'button_text']);
        });

        return response()->json($slides);
    }
}
