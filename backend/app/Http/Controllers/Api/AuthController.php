<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\NewsletterSubscriber;
use App\Mail\WelcomeMail; // 🆕 AJOUTÉ
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail; // 🆕 AJOUTÉ
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;
use App\Mail\PasswordResetMail;
use App\Mail\PasswordChangedMail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class AuthController extends Controller
{
    /**
     * INSCRIPTION
     */
    public function register(Request $request)
    {
        $request->validate([
             'civility' => 'nullable|in:M.,Mme',
             'newsletter_opt_in' => 'boolean',
             'gdpr_accepted' => 'required|accepted',
             'first_name' => [
                   'required',
                   'string',
                   'max:255',
                   'min:2',
                   'regex:/^[\pL\s\-]+$/u',
               ],
               'last_name' => [
                   'required',
                   'string',
                   'max:255',
                   'min:2',
                   'regex:/^[\pL\s\-]+$/u',
               ],
               'email' => [
                   'required',
                   'string',
                   'email:rfc,dns',
                   'max:255',
                   'unique:users',
               ],
               'password' => [
                   'required',
                   'string',
                   'min:8',
                   'confirmed',
                   'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/',
               ],
               'phone' => [
                   'nullable',
                   'string',
                   'max:20',
                   'regex:/^[0-9\s\-\+\(\)]+$/',
               ],
           ], [
             'first_name.regex' => 'Le prénom ne peut contenir que des lettres et espaces',
             'last_name.regex' => 'Le nom ne peut contenir que des lettres et espaces',
             'password.regex' => 'Le mot de passe doit contenir au moins une majuscule et un chiffre',
             'phone.regex' => 'Format de téléphone invalide',
             'email.unique' => 'Cet email est déjà utilisé',
         ]);

        $user = User::create([
             'civility' => $request->civility,
             'first_name' => $request->first_name,
             'last_name' => $request->last_name,
             'name' => trim($request->first_name . ' ' . $request->last_name),
             'email' => $request->email,
             'phone' => $request->phone,
             'password' => Hash::make($request->password),
             'role' => 'user',
             'newsletter_opt_in' => $request->boolean('newsletter_opt_in'),
         ]);

        // Inscrit également à la newsletter si la case est cochée
        if ($request->boolean('newsletter_opt_in')) {
            $existing = NewsletterSubscriber::where('email', $user->email)->first();
            if ($existing) {
                $existing->update(['is_active' => true]);
            } else {
                NewsletterSubscriber::create([
                    'email' => $user->email,
                    'is_active' => true,
                ]);
            }
        }

        //  ENVOYER L'EMAIL DE BIENVENUE
        try {
            Mail::to($user->email)->send(new WelcomeMail($user));
            Log::info('Email de bienvenue envoyé à ' . $user->email);
        } catch (\Exception $e) {
            Log::error('Erreur envoi email bienvenue: ' . $e->getMessage());
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
            'message' => 'Compte créé avec succès',
        ], 201);
    }

    /**
     * CONNEXION
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            // LOGGER LA TENTATIVE ÉCHOUÉE
            Log::channel('security')->warning('Tentative de connexion échouée', [
                'email' => $request->email,
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'timestamp' => now(),
            ]);

            return response()->json([
                'message' => 'Email ou mot de passe incorrect',
            ], 401);
        }

        $user = User::where('email', $request->email)->first();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
            'message' => 'Connexion réussie',
        ]);
    }

    /**
     * DÉCONNEXION
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Déconnexion réussie',
        ]);
    }

    /**
     * UTILISATEUR CONNECTÉ
     */
    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user(),
        ]);
    }

    /**
     * REDIRECTION VERS GOOGLE
     */
    public function redirectToGoogle()
    {
        $url = Socialite::driver('google')
            ->stateless()
            ->redirect()
            ->getTargetUrl();

        return response()->json(['url' => $url]);
    }

    /**
     * CALLBACK GOOGLE - AVEC REDIRECTION VERS LE FRONTEND
     */
    public function handleGoogleCallback(Request $request)
    {
        try {
            // Récupérer les infos de l'utilisateur depuis Google
            $googleUser = Socialite::driver('google')
                ->stateless()
                ->user();

            // Chercher ou créer l'utilisateur
            $user = User::where('email', $googleUser->email)->first();

            if (!$user) {
                // Créer un nouvel utilisateur
                $user = User::create([
                    'name' => $googleUser->name,
                    'email' => $googleUser->email,
                    'password' => Hash::make(Str::random(16)),
                    'role' => 'user',
                    'phone' => null,
                    'google_id' => $googleUser->id,
                    'email_verified_at' => now(),
                ]);

                // 🆕 ENVOYER L'EMAIL DE BIENVENUE (nouveau utilisateur Google)
                try {
                    Mail::to($user->email)->send(new WelcomeMail($user));
                    Log::info('Email de bienvenue envoyé à ' . $user->email . ' (Google OAuth)');
                } catch (\Exception $e) {
                    Log::error('Erreur envoi email bienvenue Google: ' . $e->getMessage());
                }
            } else {
                // Mettre à jour le google_id si nécessaire
                if (!$user->google_id) {
                    $user->update(['google_id' => $googleUser->id]);
                }
            }

            // Génère un code d'échange à usage unique, valide 60 secondes
            $code = Str::random(48);
            Cache::put('google_auth_code:' . $code, $user->id, now()->addSeconds(60));

            $frontendUrl = rtrim(config('app.frontend_url'), '/') . '/auth/google/callback';
            $redirectUrl = $frontendUrl . '?' . http_build_query(['code' => $code]);

            return redirect($redirectUrl);
        } catch (\Exception $e) {
            Log::error('Erreur Google OAuth: ' . $e->getMessage());

            $frontendUrl = rtrim(config('app.frontend_url'), '/');
            return redirect($frontendUrl . '/login?error=' . urlencode($e->getMessage()));
        }
    }

    /**
     * ÉCHANGE DU CODE TEMPORAIRE CONTRE UN VRAI TOKEN (flow Google OAuth sécurisé)
     */
    public function exchangeGoogleCode(Request $request)
    {
        $request->validate(['code' => 'required|string']);

        $cacheKey = 'google_auth_code:' . $request->code;
        $userId = Cache::pull($cacheKey); // pull = lit et supprime en une opération (usage unique garanti)

        if (!$userId) {
            return response()->json([
                'message' => 'Code invalide ou expiré. Veuillez réessayer la connexion.',
            ], 400);
        }

        $user = User::findOrFail($userId);
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }
    /**
     * ENVOYER LE LIEN DE RÉINITIALISATION
     */
    public function sendResetLinkEmail(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $genericMessage = 'Si un compte est associé à cet email, un lien de réinitialisation vient de vous être envoyé.';

        $user = User::where('email', $request->email)->first();

        // On ne révèle jamais si l'email existe ou non — toujours le même message,
        // que le compte existe ou pas (évite l'énumération de comptes)
        if (!$user) {
            return response()->json(['message' => $genericMessage]);
        }

        try {
            $token = Str::random(64);

            DB::table('password_reset_tokens')
                ->where('email', $request->email)
                ->delete();

            DB::table('password_reset_tokens')->insert([
                'email' => $request->email,
                'token' => Hash::make($token),
                'created_at' => now(),
            ]);

            Mail::to($request->email)->send(new PasswordResetMail($token, $request->email));

            Log::info('Email de reset password envoyé à ' . $request->email);
        } catch (\Exception $e) {
            Log::error('Erreur envoi email reset password: ' . $e->getMessage());
            // On ne révèle pas l'échec non plus — le message reste identique
        }

        return response()->json(['message' => $genericMessage]);
    }

    /**
     * RÉINITIALISER LE MOT DE PASSE
     */
    /**
     * RÉINITIALISER LE MOT DE PASSE
     */
    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email|exists:users,email',
            'token' => 'required|string',
            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/',
            ],
        ], [
            'password.regex' => 'Le mot de passe doit contenir au moins une majuscule et un chiffre',
            'email.exists' => 'Aucun compte associé à cet email',
        ]);

        try {
            // Récupérer le token de la base
            $resetRecord = DB::table('password_reset_tokens')
                ->where('email', $validated['email'])
                ->first();

            if (!$resetRecord) {
                return response()->json([
                    'message' => 'Token invalide ou expiré',
                ], 400);
            }

            // Vérifier si le token a expiré (60 minutes)
            $createdAt = \Carbon\Carbon::parse($resetRecord->created_at);
            if ($createdAt->addMinutes(60)->isPast()) {
                // Supprimer le token expiré
                DB::table('password_reset_tokens')
                    ->where('email', $validated['email'])
                    ->delete();

                return response()->json([
                    'message' => 'Le lien de réinitialisation a expiré',
                ], 400);
            }

            // Vérifier le token
            if (!Hash::check($validated['token'], $resetRecord->token)) {
                return response()->json([
                    'message' => 'Token invalide',
                ], 400);
            }

            // Mettre à jour le mot de passe
            $user = User::where('email', $validated['email'])->first();
            $user->password = Hash::make($validated['password']);
            $user->save();

            // Supprimer le token utilisé
            DB::table('password_reset_tokens')
                ->where('email', $validated['email'])
                ->delete();

            Log::info('Mot de passe réinitialisé pour ' . $validated['email']);

            try {
                Mail::to($user->email)->send(new PasswordChangedMail($user));
            } catch (\Exception $e) {
                Log::error('Erreur envoi email confirmation changement mot de passe: ' . $e->getMessage());
            }

            return response()->json([
                'message' => 'Mot de passe réinitialisé avec succès',
            ], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Erreur reset password: ' . $e->getMessage());

            return response()->json([
                'message' => 'Erreur lors de la réinitialisation',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'civility'          => 'nullable|in:M.,Mme',
            'first_name'        => 'required|string|max:255',
            'last_name'         => 'required|string|max:255',
            'phone'             => 'nullable|string|max:20',
            'birthdate'         => 'nullable|date',
            'newsletter_opt_in' => 'boolean',
        ]);

        $data['name'] = trim($data['first_name'] . ' ' . $data['last_name']);

        $newsletterChanged = $request->has('newsletter_opt_in')
            && $request->boolean('newsletter_opt_in') !== (bool) $user->newsletter_opt_in;

        $data['newsletter_opt_in'] = $request->boolean('newsletter_opt_in');

        $user->update($data);

        // Synchronise avec la table newsletter_subscribers
        if ($newsletterChanged) {
            $subscriber = NewsletterSubscriber::where('email', $user->email)->first();

            if ($data['newsletter_opt_in']) {
                if ($subscriber) {
                    $subscriber->update(['is_active' => true]);
                } else {
                    NewsletterSubscriber::create([
                        'email'     => $user->email,
                        'is_active' => true,
                    ]);
                }
            } else {
                if ($subscriber) {
                    $subscriber->update(['is_active' => false]);
                }
            }
        }

        return response()->json([
            'message' => 'Profil mis à jour avec succès.',
            'user'    => $user->fresh(),
        ]);
    }

    public function updatePassword(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'current_password' => 'required|string',
            'password'         => 'required|string|min:8|confirmed|regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/',
        ], [
            'password.regex' => 'Le mot de passe doit contenir au moins une majuscule et un chiffre',
        ]);

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'Mot de passe actuel incorrect.',
            ], 422);
        }

        $user->update(['password' => Hash::make($request->password)]);

        try {
            Mail::to($user->email)->send(new PasswordChangedMail($user));
            Log::info('Email de confirmation changement mot de passe envoyé à ' . $user->email);
        } catch (\Exception $e) {
            Log::error('Erreur envoi email confirmation changement mot de passe: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Mot de passe mis à jour avec succès.',
        ]);
    }
}
