<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HeroSlide;

class HeroSlideController extends Controller
{
    public function index()
    {
        // Cache désactivé : la date du serveur étant décalée (2026),
        // le cache ne s'invalide pas correctement. Les requêtes sur
        // quelques slides sont instantanées, le cache est inutile ici.
        $slides = HeroSlide::active()->get([
            'id', 'image', 'title', 'subtitle', 'link', 'button_text'
        ]);

        return response()->json($slides);
    }
}
