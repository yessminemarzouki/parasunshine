<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeaturedSection extends Model
{
    protected $fillable = ['is_visible', 'product_ids'];

    protected $casts = [
        'is_visible'  => 'boolean',
        'product_ids' => 'array',
    ];
}
