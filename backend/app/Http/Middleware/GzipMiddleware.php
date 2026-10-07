<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class GzipMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // Activer la compression si disponible
        if (
            function_exists('gzencode') &&
            strpos($request->header('Accept-Encoding'), 'gzip') !== false
        ) {

            $content = $response->getContent();
            $compressed = gzencode($content, 9);

            return response($compressed)
                ->header('Content-Encoding', 'gzip')
                ->header('Content-Length', strlen($compressed));
        }

        return $response;
    }
}
