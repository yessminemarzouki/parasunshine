<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array<int, string>
     */
    protected $except = [
        // ⚠️ NE RIEN METTRE ICI pour les routes API.
        // Sanctum gère le CSRF via les cookies pour les SPA.
        // Seules des routes très spécifiques (webhooks) devraient être ajoutées ici.
    ];
}
