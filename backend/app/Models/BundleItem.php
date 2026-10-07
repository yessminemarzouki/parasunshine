<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BundleItem extends Model
{
    protected $fillable = [
      'bundle_id', 'product_id', 'custom_name', 'custom_price', 'custom_image',
      'quantity', 'is_free', 'sort',
    ];

    protected $casts = [
        'is_free' => 'boolean',
    ];

    public function bundle()
    {
        return $this->belongsTo(Bundle::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Nom affiché : celui du produit lié, ou le nom manuel saisi par l'admin.
     */
    public function getDisplayNameAttribute(): string
    {
        return $this->product?->name ?? $this->custom_name ?? '—';
    }

    /**
     * Prix unitaire : celui du produit lié, ou le prix manuel saisi par l'admin.
     */
    public function getDisplayPriceAttribute(): float
    {
        return $this->product?->price ?? (float) ($this->custom_price ?? 0);
    }

    /**
     * Image affichée : celle du produit lié, ou l'image manuelle uploadée.
     */
    public function getDisplayImageAttribute(): ?string
    {
        return $this->product?->image ?? $this->custom_image;
    }
}
