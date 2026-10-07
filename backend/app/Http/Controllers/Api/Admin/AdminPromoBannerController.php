<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\PromoBanner;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class AdminPromoBannerController extends Controller
{
    public function show()
    {
        $banner = PromoBanner::first();
        if (!$banner) {
            $banner = PromoBanner::create([
                'messages' => [
                    ['icon' => 'Truck',       'text' => 'Livraison gratuite à partir de 99 DT'],
                    ['icon' => 'ShieldCheck', 'text' => 'Produits 100% authentiques garantis'],
                    ['icon' => 'Gift',        'text' => 'Points de fidélité sur chaque achat'],
                ],
                'background_color' => '#d4af37',
                'text_color'       => '#1a3d2b',
                'interval'         => 3000,
                'is_active'        => true,
            ]);
        }
        return response()->json($banner);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'messages'         => 'required|array|min:1',
            'messages.*.icon'  => 'required|string',
            'messages.*.text'  => 'required|string|max:255',
            'background_color' => 'required|string|max:20',
            'text_color'       => 'required|string|max:20',
            'interval'         => 'required|integer|min:1000|max:10000',
            'is_active'        => 'boolean',
        ]);

        $banner = PromoBanner::first();
        if (!$banner) {
            $banner = new PromoBanner();
        }
        $banner->fill($data)->save();
        Cache::forget('promo_banner');

        return response()->json([
            'message' => 'Bannière mise à jour avec succès.',
            'banner'  => $banner,
        ]);
    }
}
