<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CategoryShowcase extends Model
{
    protected $fillable = [
        'title',
        'subtitle',
        'link',
        'image',
        'order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
