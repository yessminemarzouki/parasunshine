<?php

namespace App\Providers;

use App\Models\Order;
use App\Models\Product;
use App\Observers\OrderObserver;
use Illuminate\Support\Facades\Cache;
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
