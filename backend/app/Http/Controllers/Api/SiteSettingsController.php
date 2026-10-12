<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use Illuminate\Support\Facades\Cache;

class SiteSettingsController extends Controller
{
    public function show()
    {
        $settings = Cache::remember('site_settings_public', 3600, function () {
            return SiteSetting::getOrCreate();
        });

        return response()->json($settings);
    }
}
