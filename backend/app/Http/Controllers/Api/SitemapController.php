<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Bundle;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Support\Facades\Cache;

class SitemapController extends Controller
{
    private const SITE = 'https://www.parasunshine.tn';

    public function index()
    {
        $xml = Cache::remember('sitemap_xml', 3600, fn () => $this->build());

        return response($xml, 200)->header('Content-Type', 'application/xml; charset=UTF-8');
    }

    private function url(string $path, $lastmod = null, string $freq = 'weekly', string $prio = '0.6'): string
    {
        $loc = htmlspecialchars(self::SITE . $path, ENT_XML1);
        $out = "  <url>\n    <loc>{$loc}</loc>\n";
        if ($lastmod) {
            $out .= '    <lastmod>' . $lastmod->toAtomString() . "</lastmod>\n";
        }
        $out .= "    <changefreq>{$freq}</changefreq>\n    <priority>{$prio}</priority>\n  </url>\n";

        return $out;
    }

    private function build(): string
    {
        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

        // Pages fixes
        $static = [
            ['', 'daily', '1.0'],
            ['/products', 'daily', '0.9'],
            ['/coffrets', 'weekly', '0.7'],
            ['/blog', 'weekly', '0.6'],
            ['/quiz', 'monthly', '0.5'],
            ['/about', 'monthly', '0.4'],
            ['/engagement', 'monthly', '0.4'],
            ['/faq', 'monthly', '0.4'],
            ['/contact', 'monthly', '0.4'],
            ['/livraison', 'monthly', '0.4'],
            ['/paiement', 'monthly', '0.4'],
            ['/garantie', 'monthly', '0.4'],
            ['/terms', 'yearly', '0.2'],
            ['/mentions-legales', 'yearly', '0.2'],
            ['/politique-confidentialite', 'yearly', '0.2'],
        ];
        foreach ($static as [$path, $freq, $prio]) {
            $xml .= $this->url($path, null, $freq, $prio);
        }

        // Catégories (tous niveaux)
        Category::select('slug', 'updated_at')->where('show_in_menu', true)->cursor()
            ->each(function ($c) use (&$xml) {
                $xml .= $this->url('/products?category=' . $c->slug, $c->updated_at, 'weekly', '0.7');
            });

        // Marques (marques mères)
        Brand::select('slug', 'updated_at')->whereNull('parent_id')->cursor()
            ->each(function ($b) use (&$xml) {
                $xml .= $this->url('/products?brand=' . $b->slug, $b->updated_at, 'weekly', '0.6');
            });

        // Coffrets
        Bundle::select('slug', 'updated_at')->cursor()
            ->each(function ($b) use (&$xml) {
                $xml .= $this->url('/coffrets/' . $b->slug, $b->updated_at, 'weekly', '0.6');
            });

        // Produits
        Product::select('slug', 'updated_at')->whereNotNull('slug')->orderBy('id')->cursor()
            ->each(function ($p) use (&$xml) {
                $xml .= $this->url('/products/' . $p->slug, $p->updated_at, 'weekly', '0.8');
            });

        return $xml . '</urlset>';
    }
}
