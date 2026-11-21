<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\MetaConversionsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MetaEventController extends Controller
{
    public function store(Request $request, MetaConversionsService $meta)
    {
        $data = $request->validate([
            'event_name'  => 'required|in:ViewContent,AddToCart,InitiateCheckout,PageView',
            'event_id'    => 'required|string|max:100',
            'source_url'  => 'nullable|string|max:500',
            'custom_data' => 'nullable|array',
        ]);

        $user = Auth::guard('sanctum')->user();

        // Envoi après la réponse : n'impacte pas la vitesse du site
        app()->terminating(function () use ($meta, $data, $request, $user) {
            try {
                $meta->send(
                    $data['event_name'],
                    $data['event_id'],
                    $data['custom_data'] ?? [],
                    $request,
                    $user,
                    $data['source_url'] ?? null,
                );
            } catch (\Throwable $e) {
                // jamais bloquant
            }
        });

        return response()->json(['ok' => true]);
    }
}
