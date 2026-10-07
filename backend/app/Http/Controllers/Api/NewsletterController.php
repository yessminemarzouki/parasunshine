<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NewsletterSubscriber;
use Illuminate\Http\Request;

class NewsletterController extends Controller
{
    public function subscribe(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email|max:255',
        ]);

        $existing = NewsletterSubscriber::where('email', $validated['email'])->first();

        if ($existing) {
            if ($existing->is_active) {
                return response()->json([
                    'success' => true,
                    'already_subscribed' => true,
                    'message' => 'Vous êtes déjà inscrit(e) à notre newsletter — merci de votre fidélité !',
                ], 200);
            }
            // Réactive si désabonné
            $existing->update(['is_active' => true]);
            return response()->json([
                'success' => true,
                'message' => 'Votre inscription a été réactivée avec succès !',
            ]);
        }

        NewsletterSubscriber::create([
            'email'     => $validated['email'],
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Merci ! Vous êtes maintenant inscrit(e) à notre newsletter.',
        ], 201);
    }

    public function unsubscribe(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
        ]);

        $subscriber = NewsletterSubscriber::where('email', $validated['email'])->first();

        if (!$subscriber) {
            return response()->json([
                'success' => false,
                'message' => 'Adresse email non trouvée.',
            ], 404);
        }

        $subscriber->update(['is_active' => false]);

        return response()->json([
            'success' => true,
            'message' => 'Vous avez été désabonné(e) avec succès.',
        ]);
    }
}
