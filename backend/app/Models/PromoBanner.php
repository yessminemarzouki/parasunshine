<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PromoBanner extends Model
{
    protected $fillable = [
        'messages',
        'background_color',
        'text_color',
        'interval',
        'is_active',
    ];

    protected $casts = [
        'messages'  => 'array',
        'is_active' => 'boolean',
    ];
}
