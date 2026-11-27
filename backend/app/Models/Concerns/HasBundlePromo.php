<?php

namespace App\Models\Concerns;

use Carbon\Carbon;

trait HasBundlePromo
{
    /** Ajoute ces champs calculés à toutes les réponses JSON d'un coffret */
    public function initializeHasBundlePromo(): void
    {
        $this->append(['is_promo_active', 'effective_price', 'effective_reference_price']);
    }

    /** Promo valide = prix promo inférieur au prix normal ET dans sa fenêtre de dates */
    public function getIsPromoActiveAttribute(): bool
    {
        $price = (float) $this->price;
        $promo = (float) $this->promo_price;

        if ($promo <= 0 || $promo >= $price) {
            return false;
        }

        $now = now();
        if ($this->promo_starts_at && Carbon::parse($this->promo_starts_at)->gt($now)) {
            return false;
        }
        if ($this->promo_ends_at && Carbon::parse($this->promo_ends_at)->lt($now)) {
            return false;
        }

        return true;
    }

    public function getEffectivePriceAttribute(): float
    {
        return $this->is_promo_active ? (float) $this->promo_price : (float) $this->price;
    }

    public function getEffectiveReferencePriceAttribute(): ?float
    {
        return $this->is_promo_active ? (float) $this->price : null;
    }
}
