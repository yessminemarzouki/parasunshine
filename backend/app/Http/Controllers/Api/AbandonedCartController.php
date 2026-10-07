<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AbandonedCart;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class AbandonedCartController extends Controller
{
    /**
     * SAUVEGARDER LE PANIER
     * ✅ Fonctionne pour utilisateurs connectés ET invités
     */
    public function store(Request $request)
    {
        $request->validate([
            'cart_items' => 'required|array',
            'total'      => 'required|numeric',
        ]);

        $user = Auth::guard('sanctum')->user();

        // Filet de sécurité : si le guard ne résout pas l'utilisateur malgré
        // un token Bearer présent, on le résout manuellement — indépendant
        // de la configuration du guard/middleware sur cette route publique.
        if (!$user) {
            $bearerToken = $request->bearerToken();
            if ($bearerToken) {
                $accessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($bearerToken);
                $user = $accessToken?->tokenable;
            }
        }

        // Calculé systématiquement, même connecté — sert à retrouver un
        // panier "invité" créé sur ce même appareil avant la connexion.
        $sessionId = md5($request->ip() . $request->userAgent());

        if ($user) {
            // 1. Un panier déjà rattaché à ce compte ?
            $abandonedCart = AbandonedCart::where('user_id', $user->id)->first();

            // 2. Sinon, un panier invité créé sur ce même appareil avant la
            //    connexion — on le récupère et on le rattache au compte au
            //    lieu de le laisser orphelin pour toujours.
            if (!$abandonedCart) {
                $abandonedCart = AbandonedCart::whereNull('user_id')
                    ->where('session_id', $sessionId)
                    ->first();
            }
        } else {
            $abandonedCart = AbandonedCart::where('session_id', $sessionId)
                ->whereNull('user_id')
                ->first();
        }

        $cartData = [
            'cart_items'     => $request->cart_items,
            'total'          => $request->total,
            'last_activity'  => now(),
            'customer_email' => $user?->email,
            'customer_name'  => $user?->name,
        ];

        if ($abandonedCart) {
            if ($user) {
                // Rattache définitivement le panier au compte, qu'il ait
                // été trouvé par user_id ou récupéré via session_id.
                $cartData['user_id'] = $user->id;
                $cartData['session_id'] = null;
            }
            $abandonedCart->update($cartData);
        } else {
            $abandonedCart = AbandonedCart::create(array_merge($cartData, [
                'user_id'    => $user?->id,
                'session_id' => $user ? null : $sessionId,
            ]));
        }

        return response()->json([
            'message' => 'Panier sauvegardé',
            'cart'    => $abandonedCart,
        ]);
    }
}
