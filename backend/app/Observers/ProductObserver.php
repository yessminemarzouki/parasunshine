<?php

namespace App\Observers;

use App\Models\Product;

class ProductObserver
{
    /**
     * Handle the Product "creating" event.
     */
    public function creating(Product $product): void
    {
        $this->calculateLoyaltyPoints($product);
    }

    /**
     * Handle the Product "updating" event.
     */
    public function updating(Product $product): void
    {
        $this->calculateLoyaltyPoints($product);
    }

    /**
     * Calcule automatiquement les points de fidélité
     * 1 DT = 1 point
     */
    private function calculateLoyaltyPoints(Product $product): void
    {
        // Utilise le prix promo si disponible, sinon le prix normal
        $price = $product->promo_price && $product->promo_price < $product->price
            ? $product->promo_price
            : $product->price;

        // 1 DT = 1 point de fidélité
        $product->loyalty_points = (int) $price;
    }
}
