<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShippingSetting extends Model
{
    protected $fillable = [
    'free_shipping_enabled',
    'free_shipping_threshold',
    'shipping_cost',
    'delivery_days_min',
    'delivery_days_max',
];

    protected $casts = [
        'free_shipping_enabled'   => 'boolean',
        'free_shipping_threshold' => 'decimal:3',
        'shipping_cost'           => 'decimal:3',
    ];

    /**
     * Calcule le coût de livraison pour un sous-total donné
     */
    public static function calculateShippingCost(float $subtotal): float
    {
        $settings = self::getOrCreate();

        if ($settings->free_shipping_enabled && $subtotal >= $settings->free_shipping_threshold) {
            return 0;
        }

        return (float) $settings->shipping_cost;
    }

    public static function getOrCreate(): self
    {
        $settings = self::first();
        if (!$settings) {
            $settings = self::create([
                'free_shipping_enabled'   => true,
                'free_shipping_threshold' => 99.000,
                'shipping_cost'           => 7.000,
            ]);
        }
        return $settings;
    }
}
