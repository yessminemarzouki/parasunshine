<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Protection contre XSS (legacy, ignoré par les navigateurs récents mais inoffensif)
        $response->headers->set('X-XSS-Protection', '1; mode=block');

        // Empêcher le sniffing MIME
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // Protection contre le clickjacking
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');

        // Politique de sécurité du contenu (CSP)
        $response->headers->set('Content-Security-Policy', "default-src 'self'");

        // Ne pas divulguer l'URL complète du referrer vers des sites tiers
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Désactive les APIs navigateur sensibles non utilisées par cette API
        $response->headers->set('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()');

        // Forcer HTTPS — uniquement si la requête est déjà en HTTPS
        // (évite d'envoyer ce header en dev/local où tout tourne en HTTP)
        if ($request->secure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        return $response;
    }
}
