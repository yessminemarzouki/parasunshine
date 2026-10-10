<?php

namespace App\Providers;

use App\Models\Order;
use App\Models\Product;
use App\Observers\OrderObserver;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
    }

    public function boot(): void
    {
        Order::observe(OrderObserver::class);

        // Vider les caches liés aux produits après chaque modification
        Product::created(function ($product) {
            $this->clearProductCaches($product);
        });

        Product::updated(function ($product) {
            $this->clearProductCaches($product);
        });

        Product::deleted(function ($product) {
            $this->clearProductCaches($product);
        });

        // ────────────────────────────────────────────────
        // Rate limiters nommés (utilisés dans routes/api.php)
        // ────────────────────────────────────────────────

        // Commandes : 5 tentatives / 10 minutes par utilisateur connecté
        RateLimiter::for('orders', function (Request $request) {
            return Limit::perMinutes(10, 5)->by($request->user()?->id ?: $request->ip());
        });

        // Inscription : 5 tentatives / heure par IP
        RateLimiter::for('register', function (Request $request) {
            return Limit::perHour(5)->by($request->ip());
        });
    }

    private function clearProductCaches(Product $product): void
    {
        Cache::forget('home_data');
        Cache::forget('products_featured');
        Cache::forget('products_bestsellers');
        Cache::forget('products_newest');
        Cache::forget('products_promotions');
        Cache::forget('product_' . $product->slug);
        Cache::forget('all_categories_tree');
        Cache::forget('all_brands');

        // Vider le cache de la catégorie du produit
        if ($product->category) {
            Cache::forget('category_ids_' . $product->category->slug);
            Cache::forget('brands_category_' . $product->category->slug);
        }
    }
}
