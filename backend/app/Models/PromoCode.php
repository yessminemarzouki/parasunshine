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
    'usage_limit_per_user',
        'used_count',
    ];

    protected $casts = [
        'is_active'               => 'boolean',
        'allow_with_promo_items'  => 'boolean',
        'starts_at'               => 'datetime:Y-m-d H:i:s',
          'ends_at'                 => 'datetime:Y-m-d H:i:s',
    'usage_limit'             => 'integer',
    'usage_limit_per_user'    => 'integer',
    'used_count'              => 'integer',
    ];

    protected static function boot()
    {
        parent::boot();

        static::saving(function ($promoCode) {
            $promoCode->code = strtoupper(trim($promoCode->code));
        });
    }
    public function usages()
    {
        return $this->hasMany(\App\Models\PromoCodeUsage::class);
    }

    /**
     * Nombre de fois que CE client a déjà utilisé ce code
     * (hors commandes annulées).
     */
    public function usageCountForUser(int $userId): int
    {
        return $this->usages()
            ->where('user_id', $userId)
            ->whereHas('order', function ($q) {
                $q->where('status', '!=', 'cancelled');
            })
            ->count();
    }

    /**
     * Vérifie si ce code peut être utilisé par cet utilisateur
     * (limite par personne).
     */
    public function isUsableByUser(int $userId): array
    {
        if ($this->usage_limit_per_user === null) {
            return [true, null]; // pas de limite par user
        }

        $used = $this->usageCountForUser($userId);

        if ($used >= $this->usage_limit_per_user) {
            return [
                false,
                $this->usage_limit_per_user === 1
                    ? "Vous avez déjà utilisé ce code promo."
                    : "Vous avez atteint la limite d'utilisation de ce code promo ({$this->usage_limit_per_user} fois).",
            ];
        }

        return [true, null];
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
