<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Spatie\Sitemap\Sitemap;
use Spatie\Sitemap\Tags\Url;
use App\Models\Product;
use App\Models\Category;
use App\Models\Bundle;
use App\Models\BlogPost;
use Carbon\Carbon;

class GenerateSitemap extends Command
{
    protected $signature = 'sitemap:generate';
    protected $description = 'Génère le sitemap XML du site Parasunshine';

    public function handle()
    {
        $this->info('🗺️  Génération du sitemap...');

        $baseUrl = config('app.url', 'https://www.parasunshine.tn');
        $sitemap = Sitemap::create();

        // ══════════════════════════════════════════
        // 1. PAGES STATIQUES
        // ══════════════════════════════════════════
        $staticPages = [
            '/' => ['priority' => 1.0, 'freq' => 'daily'],
            '/products' => ['priority' => 0.9, 'freq' => 'daily'],
            '/coffrets' => ['priority' => 0.9, 'freq' => 'daily'],
            '/blog' => ['priority' => 0.8, 'freq' => 'weekly'],
            '/quiz' => ['priority' => 0.7, 'freq' => 'monthly'],
            '/about' => ['priority' => 0.6, 'freq' => 'monthly'],
            '/contact' => ['priority' => 0.6, 'freq' => 'monthly'],
            '/faq' => ['priority' => 0.6, 'freq' => 'monthly'],
            '/livraison' => ['priority' => 0.5, 'freq' => 'monthly'],
            '/paiement' => ['priority' => 0.5, 'freq' => 'monthly'],
            '/garantie' => ['priority' => 0.5, 'freq' => 'monthly'],
            '/engagement' => ['priority' => 0.5, 'freq' => 'monthly'],
            '/mentions-legales' => ['priority' => 0.3, 'freq' => 'yearly'],
            '/politique-confidentialite' => ['priority' => 0.3, 'freq' => 'yearly'],
            '/terms' => ['priority' => 0.3, 'freq' => 'yearly'],
        ];

        foreach ($staticPages as $path => $config) {
            $sitemap->add(
                Url::create($path)
                    ->setPriority($config['priority'])
                    ->setChangeFrequency($config['freq'])
                    ->setLastModificationDate(Carbon::now())
            );
        }
        $this->info('  ✅ ' . count($staticPages) . ' pages statiques');

        // ══════════════════════════════════════════
        // 2. CATÉGORIES
        // ══════════════════════════════════════════
        $categories = Category::where('show_in_menu', true)->get();
        foreach ($categories as $category) {
            $sitemap->add(
                Url::create("/products?category={$category->slug}")
                    ->setPriority(0.8)
                    ->setChangeFrequency('weekly')
                    ->setLastModificationDate($category->updated_at ?? Carbon::now())
            );
        }
        $this->info('  ✅ ' . count($categories) . ' catégories');

        // ══════════════════════════════════════════
        // 3. PRODUITS
        // ══════════════════════════════════════════
        $productsCount = 0;
        Product::select('slug', 'updated_at')
            ->chunk(500, function ($products) use ($sitemap, &$productsCount) {
                foreach ($products as $product) {
                    $sitemap->add(
                        Url::create("/products/{$product->slug}")
                            ->setPriority(0.7)
                            ->setChangeFrequency('weekly')
                            ->setLastModificationDate($product->updated_at ?? Carbon::now())
                    );
                    $productsCount++;
                }
            });
        $this->info('  ✅ ' . $productsCount . ' produits');

        // ══════════════════════════════════════════
        // 4. COFFRETS
        // ══════════════════════════════════════════
        $bundlesCount = 0;
        Bundle::select('slug', 'updated_at')
            ->chunk(500, function ($bundles) use ($sitemap, &$bundlesCount) {
                foreach ($bundles as $bundle) {
                    $sitemap->add(
                        Url::create("/coffrets/{$bundle->slug}")
                            ->setPriority(0.7)
                            ->setChangeFrequency('weekly')
                            ->setLastModificationDate($bundle->updated_at ?? Carbon::now())
                    );
                    $bundlesCount++;
                }
            });
        $this->info('  ✅ ' . $bundlesCount . ' coffrets');

        // ══════════════════════════════════════════
        // 5. ARTICLES DE BLOG
        // ══════════════════════════════════════════
        $postsCount = 0;
        try {
            BlogPost::select('id', 'updated_at')
                ->chunk(500, function ($posts) use ($sitemap, &$postsCount) {
                    foreach ($posts as $post) {
                        $sitemap->add(
                            Url::create("/blog/{$post->id}")
                                ->setPriority(0.6)
                                ->setChangeFrequency('monthly')
                                ->setLastModificationDate($post->updated_at ?? Carbon::now())
                        );
                        $postsCount++;
                    }
                });
            $this->info('  ✅ ' . $postsCount . ' articles de blog');
        } catch (\Exception $e) {
            $this->warn('  ⚠️  Blog ignoré : ' . $e->getMessage());
        }

        // ══════════════════════════════════════════
        // 6. ÉCRITURE DU FICHIER
        // ══════════════════════════════════════════
        $path = public_path('sitemap.xml');
        $sitemap->writeToFile($path);

        $total = count($staticPages) + count($categories) + $productsCount + $bundlesCount + $postsCount;

        $this->info('');
        $this->info('🎉 Sitemap généré : ' . $path);
        $this->info('📊 Total : ' . $total . ' URLs');
        $this->info('🌐 URL publique : ' . $baseUrl . '/sitemap.xml');

        return Command::SUCCESS;
    }
}
