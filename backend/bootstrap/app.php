<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
        then: function () {
            RateLimiter::for('api', function (Request $request) {
                return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
            });

            RateLimiter::for('login', function (Request $request) {
                return Limit::perMinute(5)->by($request->ip());
            });

            RateLimiter::for('register', function (Request $request) {
                return Limit::perHour(3)->by($request->ip());
            });

            RateLimiter::for('orders', function (Request $request) {
                return Limit::perHour(10)->by($request->user()?->id ?: $request->ip());
            });
        }
    )
    ->withMiddleware(function (Middleware $middleware): void {

        // ✅ LIGNE AJOUTÉE POUR SANCTUM (Résout le bug de login)
        $middleware->statefulApi();

        // Alias pour le middleware admin
        $middleware->alias([
            'admin' => \App\Http\Middleware\IsAdmin::class,
        ]);

        // Ne jamais rediriger les routes API (renvoyer 401 JSON)
        $middleware->redirectGuestsTo(function ($request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return null; // null = pas de redirect → renvoie 401
            }
            return route('login');
        });

        // AJOUTER SECURITY HEADERS ET SANITIZATION AUX ROUTES API
        $middleware->api(append: [
            \App\Http\Middleware\SecurityHeaders::class,
            \App\Http\Middleware\SanitizeInput::class,
        ]);

        // ❌ Le bloc validateCsrfTokens a été supprimé volontairement
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
