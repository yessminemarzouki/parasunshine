<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PromoCode extends Model
{
    protected $fillable = [
        'code',
        'discount_percentage',
        'is_active',
        'allow_with_promo_items',
        'starts_at',
        'ends_at',
        'usage_limit',
        'used_count',
    ];

    protected $casts = [
        'is_active'               => 'boolean',
        'allow_with_promo_items'  => 'boolean',
        'starts_at'               => 'datetime:Y-m-d H:i:s',
        'ends_at'                 => 'datetime:Y-m-d H:i:s',
    ];

    protected static function boot()
    {
        parent::boot();

        static::saving(function ($promoCode) {
            $promoCode->code = strtoupper(trim($promoCode->code));
        });
    }

    public function isCurrentlyValid(): array
    {
        if (!$this->is_active) {
            return [false, "Ce code promo n'est plus actif."];
        }
        if ($this->starts_at && now()->lt($this->starts_at)) {
            return [false, "Ce code promo n'est pas encore actif."];
        }
        if ($this->ends_at && now()->gt($this->ends_at)) {
            return [false, "Ce code promo a expiré."];
        }
        if ($this->usage_limit !== null && $this->used_count >= $this->usage_limit) {
            return [false, "Ce code promo a atteint sa limite d'utilisation."];
        }
        return [true, null];
    }
}
