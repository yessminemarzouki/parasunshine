<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Product;
use Illuminate\Support\Facades\Cache;

class ExpirePromos extends Command
{
    protected $signature   = 'promos:expire';
    protected $description = 'Désactive les promotions expirées';

    public function handle()
    {
        $count = Product::where('is_promo', true)
            ->whereNotNull('promo_ends_at')
            ->where('promo_ends_at', '<', now())
            ->update([
                'is_promo'      => false,
                'promo_price'   => null,
                'promo_ends_at' => null,
            ]);

        Cache::flush();
        $this->info("{$count} promotion(s) expirée(s) désactivée(s).");
    }
}
