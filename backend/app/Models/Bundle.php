<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Bundle extends Model
{
    protected $fillable = [
        'name', 'slug', 'brand_id', 'bundle_category_id', 'description',
        'image', 'images', 'price', 'price_mode', 'promo_price',
        'discount_percentage', 'promo_starts_at', 'promo_ends_at',
        'stock', 'is_unavailable', 'rating', 'reviews_count',
    ];

    protected $casts = [
        'images'          => 'array',
        'is_unavailable'  => 'boolean',
        'promo_starts_at' => 'datetime:Y-m-d H:i:s',
        'promo_ends_at'   => 'datetime:Y-m-d H:i:s',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($bundle) {
            if (empty($bundle->slug)) {
                $bundle->slug = Str::slug($bundle->name) . '-' . Str::random(4);
            }
        });
    }

    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }

    public function category()
    {
        return $this->belongsTo(BundleCategory::class, 'bundle_category_id');
    }

    public function items()
    {
        return $this->hasMany(BundleItem::class)->orderBy('sort');
    }

    public function reviews()
    {
        return $this->hasMany(BundleReview::class);
    }

    /**
     * Disponibilité entièrement contrôlée par l'admin via la case
     * "indisponible" — n'est plus jamais recalculée automatiquement à
     * partir du stock du coffret ou de ses produits composants. L'admin
     * peut donc forcer un coffret disponible à tout moment, quel que soit
     * l'état réel de son stock ou de ses composants.
     */
    public function getIsAvailableAttribute(): bool
    {
        return !$this->is_unavailable;
    }

    /**
     * Un coffret ne peut être en promo que s'il ne contient aucun produit offert.
     */
    public function getHasFreeItemsAttribute(): bool
    {
        return $this->items->contains('is_free', true);
    }
}
