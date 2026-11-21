<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MetaConversionsService
{
    public function send(
        string $eventName,
        string $eventId,
        array $customData = [],
        ?Request $request = null,
        ?object $user = null,
        ?string $sourceUrl = null,
        ?string $phone = null,
    ): void {
        $pixelId = config('services.meta.pixel_id');
        $token = config('services.meta.capi_token');

        // Pas de jeton valide : on ne fait rien (le Pixel navigateur continue de marcher)
        if (!$pixelId || !$token || $token === 'COLLE_ICI_LE_JETON') {
            return;
        }

        $hash = fn (?string $v) => $v ? hash('sha256', mb_strtolower(trim($v))) : null;

        $digits = preg_replace('/\D+/', '', (string) ($phone ?: ($user->phone ?? '')));
        if ($digits !== '' && strlen($digits) === 8) {
            $digits = '216' . $digits; // numéro tunisien sans indicatif
        }

        $userData = array_filter([
            'client_ip_address' => $request?->ip(),
            'client_user_agent' => $request?->userAgent(),
            'fbp'               => $request?->cookie('_fbp'),
            'fbc'               => $request?->cookie('_fbc'),
            'em'                => !empty($user->email) ? [$hash($user->email)] : null,
            'ph'                => $digits !== '' ? [$hash($digits)] : null,
            'external_id'       => !empty($user->id) ? [$hash((string) $user->id)] : null,
        ]);

        $payload = [
            'data' => [[
                'event_name'       => $eventName,
                'event_time'       => time(),
                'event_id'         => $eventId,
                'action_source'    => 'website',
                'event_source_url' => $sourceUrl,
                'user_data'        => $userData,
                'custom_data'      => $customData,
            ]],
            'access_token' => $token,
        ];

        if ($code = config('services.meta.test_code')) {
            $payload['test_event_code'] = $code;
        }

        try {
            $res = Http::timeout(5)->post(
                "https://graph.facebook.com/v21.0/{$pixelId}/events",
                $payload
            );
            if (!$res->successful()) {
                Log::warning('Meta CAPI: ' . $res->body());
            }
        } catch (\Throwable $e) {
            Log::warning('Meta CAPI exception: ' . $e->getMessage());
        }
    }
}
