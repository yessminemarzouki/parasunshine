<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ShippingSetting;
use Illuminate\Support\Facades\Cache;

class ShippingController extends Controller
{
    public function show()
    {
        $settings = Cache::remember('shipping_settings_public', 3600, function () {
            return ShippingSetting::getOrCreate();
        });

        return response()->json($settings);
    }
}
