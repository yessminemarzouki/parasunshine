<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PromoCampaign extends Model
{
    protected $fillable = [
        'name', 'discount_percentage', 'starts_at', 'ends_at', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'starts_at' => 'datetime:Y-m-d H:i:s',
        'ends_at'   => 'datetime:Y-m-d H:i:s',
    ];

    public function products()
    {
        return $this->hasMany(Product::class, 'promo_campaign_id');
    }
}
