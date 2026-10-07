<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HygieneSection extends Model
{
    protected $fillable = [
        'title', 'image', 'background_color',
        'title_color', 'tab_active_color',
        'is_visible', 'tabs', 'sort',
    ];

    protected $casts = [
        'tabs'       => 'array',
        'is_visible' => 'boolean',
    ];
}
