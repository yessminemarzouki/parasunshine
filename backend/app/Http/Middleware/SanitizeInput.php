<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Mews\Purifier\Facades\Purifier;

class SanitizeInput
{
    /**
     * Champs jamais touchés : mots de passe, et champs JSON encodés en string
     * (leur contenu serait corrompu par tout nettoyage ici — ils sont
     * décodés puis validés proprement côté contrôleur).
     */
    protected $except = [
        'password',
        'password_confirmation',
        'current_password',
        'tabs',
        'sizes',
        'colors',
        'selected_size',
        'selected_color',
        'items',
        'options',
    ];

    /**
     * Champs HTML riche (venant de l'éditeur TipTap) : nettoyés avec un
     * vrai purificateur HTML qui autorise le formatage mais retire tout
     * ce qui pourrait exécuter du JS (scripts, attributs on*, liens
     * javascript:...).
     */
    protected $richHtmlFields = [
        'description',
        'short_description',
        'benefits',
        'usage_tips',
        'content',
        'excerpt',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $input = $request->all();

        array_walk_recursive($input, function (&$value, $key) {
            if (!is_string($value) || in_array($key, $this->except)) {
                return;
            }

            if (in_array($key, $this->richHtmlFields)) {
                // Purification HTML complète : formatage conservé,
                // scripts/attributs dangereux retirés.
                $value = Purifier::clean($value);
                return;
            }

            // Tous les autres champs texte : aucune balise HTML autorisée.
            $value = strip_tags($value);
        });

        $request->merge($input);

        return $next($request);
    }
}
