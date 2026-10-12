<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteSetting extends Model
{
    protected $fillable = [
        'address',
        'phone',
        'email',
        'whatsapp',
        'opening_hours',
        'facebook_url',
        'instagram_url',
        'tiktok_url',
        'legal_form',
        'capital',
        'hosting_provider',
        'publication_director',
    ];

    /**
     * Retourne l'unique instance de paramètres, ou la crée avec des valeurs par défaut.
     */
    public static function getOrCreate(): self
    {
        $settings = self::first();
        if (!$settings) {
            $settings = self::create([
                'address'              => 'Route Gremda Km3, en face Clinique Chams, Sfax, Tunisie',
                'phone'                => '+216 94 169 416',
                'email'                => 'parasunshine25@gmail.com',
                'whatsapp'             => '+216 94 169 416',
                'opening_hours'        => 'Lun – Sam : 9h – 20h',
                'facebook_url'         => 'https://www.facebook.com/ParaSunShine',
                'instagram_url'        => 'https://www.instagram.com/para_sunshine_tunisie',
                'tiktok_url'           => null,
                'legal_form'           => 'Société à responsabilité limitée (SARL)',
                'capital'              => '—',
                'hosting_provider'     => '—',
                'publication_director' => '—',
            ]);
        }
        return $settings;
    }
}
