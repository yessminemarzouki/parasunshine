<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HeroSlide extends Model
{
    protected $fillable = [
        'image',
        'title',
        'subtitle',
        'link',
        'button_text',
        'order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'order' => 'integer',
    ];

    // Scope : ne récupérer que les slides actifs, triés
    public function scopeActive($query)
    {
        return $query->where('is_active', true)->orderBy('order');
    }
}
