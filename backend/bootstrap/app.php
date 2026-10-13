<?php

// ✅ FIX : Forcer le répertoire temporaire vers storage/framework/tmp
// Sans ce fix, tempnam() échoue pendant la compilation Blade des emails (erreur 500)
$tmpDir = __DIR__ . '/../storage/framework/tmp';
if (!is_dir($tmpDir)) {
    @mkdir($tmpDir, 0775, true);
}
if (is_writable($tmpDir)) {
    putenv("TMPDIR={$tmpDir}");
    putenv("TMP={$tmpDir}");
    putenv("TEMP={$tmpDir}");
    ini_set('sys_temp_dir', $tmpDir);
}

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
            // 🆕 RATE LIMITING CONFIGURÉ ICI
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

        // Alias pour le middleware admin
        $middleware->alias([
            'admin' => \App\Http\Middleware\IsAdmin::class,
        ]);

        // 🆕 Ne jamais rediriger les routes API (renvoyer 401 JSON)
        $middleware->redirectGuestsTo(function ($request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return null; // null = pas de redirect → renvoie 401
            }
            return route('login');
        });

        // 🆕 AJOUTER SECURITY HEADERS ET SANITIZATION AUX ROUTES API
        $middleware->api(append: [
            \App\Http\Middleware\SecurityHeaders::class,
            \App\Http\Middleware\SanitizeInput::class,
        ]);

        // Désactiver CSRF pour les routes API
        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
