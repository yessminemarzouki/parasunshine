<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class GzipMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // Ne pas compresser si :
        // - gzencode n'existe pas
        // - le client n'accepte pas gzip
        // - la réponse n'est pas du JSON ou du texte (ex: images, fichiers)
        // - la réponse est déjà compressée
        if (
            !function_exists('gzencode') ||
            strpos($request->header('Accept-Encoding', ''), 'gzip') === false ||
            $response->headers->has('Content-Encoding')
        ) {
            return $response;
        }

        // Ne compresser que les types texte/JSON
        $contentType = $response->headers->get('Content-Type', '');
        if (
            strpos($contentType, 'application/json') === false &&
            strpos($contentType, 'text/') === false
        ) {
            return $response;
        }

        $content = $response->getContent();

        // Ne pas compresser les petites réponses (< 1 Ko) : overhead inutile
        if (strlen($content) < 1024) {
            return $response;
        }

        // Niveau 6 : le meilleur compromis vitesse/taille (niveau 9 = trop lent)
        $compressed = gzencode($content, 6);

        return response($compressed)
            ->header('Content-Encoding', 'gzip')
            ->header('Content-Length', strlen($compressed))
            ->header('Vary', 'Accept-Encoding');
    }
}
