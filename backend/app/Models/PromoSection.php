<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PromoSection extends Model
{
    protected $fillable = [
    'title', 'background_color', 'title_color',
    'is_visible', 'starts_at', 'ends_at',
    'product_ids', 'use_auto', 'order_mode',
];

    protected $casts = [
        'product_ids' => 'array',
        'is_visible'  => 'boolean',
        'use_auto'    => 'boolean',
        'starts_at'   => 'datetime',
        'ends_at'     => 'datetime',
    ];

    public function isCurrentlyVisible(): bool
    {
        if (!$this->is_visible) {
            return false;
        }
        $now = now();
        if ($this->starts_at && $now->lt($this->starts_at)) {
            return false;
        }
        if ($this->ends_at && $now->gt($this->ends_at)) {
            return false;
        }
        return true;
    }
}
