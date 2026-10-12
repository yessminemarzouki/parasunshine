<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class AdminSiteSettingsController extends Controller
{
    public function show()
    {
        return response()->json(SiteSetting::getOrCreate());
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'address'              => 'nullable|string|max:255',
            'phone'                => 'nullable|string|max:50',
            'email'                => 'nullable|email|max:255',
            'whatsapp'             => 'nullable|string|max:50',
            'opening_hours'        => 'nullable|string|max:150',
            'facebook_url'         => 'nullable|url|max:255',
            'instagram_url'        => 'nullable|url|max:255',
            'tiktok_url'           => 'nullable|url|max:255',
            'legal_form'           => 'nullable|string|max:150',
            'capital'              => 'nullable|string|max:100',
            'hosting_provider'     => 'nullable|string|max:255',
            'publication_director' => 'nullable|string|max:150',
        ]);

        $settings = SiteSetting::getOrCreate();
        $settings->update($validated);

        Cache::forget('site_settings_public');

        return response()->json([
            'message'  => 'Informations du site mises à jour avec succès.',
            'settings' => $settings,
        ]);
    }
}
