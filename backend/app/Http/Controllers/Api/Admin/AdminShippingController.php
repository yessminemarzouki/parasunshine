<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ShippingSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class AdminShippingController extends Controller
{
    public function show()
    {
        return response()->json(ShippingSetting::getOrCreate());
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'free_shipping_enabled'   => 'required|boolean',
            'free_shipping_threshold' => 'required_if:free_shipping_enabled,true|nullable|numeric|min:0',
            'shipping_cost'           => 'required|numeric|min:0',
            'delivery_days_min'       => 'required|integer|min:1|max:30',
            'delivery_days_max'       => 'required|integer|min:1|max:30|gte:delivery_days_min',
        ]);

        $settings = ShippingSetting::getOrCreate();
        $settings->update($validated);

        Cache::forget('shipping_settings_public');

        return response()->json([
            'message'  => 'Paramètres de livraison mis à jour avec succès.',
            'settings' => $settings,
        ]);
    }
}
