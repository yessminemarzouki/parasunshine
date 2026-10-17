<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Product;
use App\Models\PromoSection;
use App\Models\PromoCampaign;
use Illuminate\Support\Facades\Cache;

class ExpirePromos extends Command
{
    protected $signature   = 'promos:expire';
    protected $description = 'Désactive les promotions expirées et les retire de la section Top Promo';

    public function handle()
    {
        $now = now();

        // 1. Trouver et désactiver les produits dont la promo est expirée
        $expiredProducts = Product::where('is_promo', true)
            ->whereNotNull('promo_ends_at')
            ->where('promo_ends_at', '<', $now)
            ->get();

        if ($expiredProducts->isNotEmpty()) {
            $ids = $expiredProducts->pluck('id')->toArray();

            Product::whereIn('id', $ids)->update([
                'is_promo'            => false,
                'promo_price'         => null,
                'discount_percentage' => null,
                'promo_starts_at'     => null,
                'promo_ends_at'       => null,
                'promo_campaign_id'   => null,
            ]);

            // Nettoyer les caches individuels
            foreach ($expiredProducts as $p) {
                Cache::forget('product_' . $p->slug);
            }

            // Retirer ces produits de la section Top Promo
            $section = PromoSection::first();
            if ($section && !empty($section->product_ids)) {
                $remainingIds = array_values(array_diff($section->product_ids, $ids));
                $section->update(['product_ids' => $remainingIds]);
            }

            $this->info(count($ids) . ' promotion(s) expirée(s) désactivée(s).');
        } else {
            $this->info('Aucune promotion expirée à désactiver.');
        }

        // 2. Désactiver les campagnes de promotion expirées
        $expiredCampaigns = PromoCampaign::where('is_active', true)
            ->whereNotNull('ends_at')
            ->where('ends_at', '<', $now)
            ->get();

        foreach ($expiredCampaigns as $campaign) {
            $campaign->update(['is_active' => false]);
            foreach ($campaign->products as $product) {
                $product->update([
                    'is_promo'            => false,
                    'promo_price'         => null,
                    'discount_percentage' => null,
                    'promo_starts_at'     => null,
                    'promo_ends_at'       => null,
                ]);
                Cache::forget('product_' . $product->slug);
            }
            $this->info("Campagne '{$campaign->name}' désactivée.");
        }

        // Vider les caches globaux
        Cache::forget('home_data');
        Cache::forget('products_promotions');
        Cache::forget('products_featured');
        Cache::forget('products_bestsellers');
        Cache::forget('products_newest');
    }
}
