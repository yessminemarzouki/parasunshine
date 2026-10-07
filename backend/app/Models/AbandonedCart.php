<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Collection;

class AbandonedCart extends Model
{
    protected $fillable = [
        'user_id',
        'session_id',
        'customer_email',
        'customer_name',
        'cart_items',
        'total',
        'last_activity',
        'recovered',
    ];

    protected $casts = [
        'cart_items'    => 'array',
        'total'         => 'decimal:3',
        'last_activity' => 'datetime',
        'recovered'     => 'boolean',
    ];

    // Expose l'accesseur getCartProductsAttribute() dans la sérialisation
    // JSON — sans ça, l'API ne renvoie jamais cart_products et la fiche
    // client admin affiche un panier vide.
    protected $appends = ['cart_products'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * ✅ Retourne les produits du panier avec leurs données DB
     * Utilisé par Filament pour afficher les images
     */
    public function getCartProductsAttribute(): Collection
    {
        $items = $this->cart_items ?? [];

        if (empty($items)) {
            return new Collection();
        }

        // Récupère tous les product_ids du panier
        $productIds = collect($items)
            ->pluck('product_id')
            ->filter()
            ->unique()
            ->values();

        // Charge tous les produits en 1 requête
        $products = Product::whereIn('id', $productIds)
            ->select('id', 'name', 'image', 'price', 'promo_price', 'slug')
            ->get()
            ->keyBy('id');

        // Fusionne les données JSON + données DB
        // ✅ APRÈS
        return \Illuminate\Database\Eloquent\Collection::make(
            collect($items)->map(function ($item) use ($products) {
                $productId = $item['product_id'] ?? null;
                $product   = $productId ? $products->get($productId) : null;

                return (object) [
                    'id'       => $productId,
                    'name'     => $item['name']     ?? $product?->name ?? 'Produit inconnu',
                    'image'    => $product?->image  ?? null,
                    'quantity' => $item['quantity'] ?? 1,
                    'price'    => $item['price']    ?? $product?->price ?? 0,
                    'slug'     => $product?->slug   ?? null,
                ];
            })->all()
        );
    }
}
