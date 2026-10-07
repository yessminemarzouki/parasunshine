<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Brand;
use Illuminate\Database\Seeder;

class MenuDataSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Ordre des catégories
        $order = ['soin', 'solaire', 'bebe-et-maman', 'complements-alimentaires', 'hygiene', 'paramedicaux'];
        foreach ($order as $i => $slug) {
            Category::where('slug', $slug)->update(['sort' => $i]);
        }

        $soin = Category::where('slug', 'soin')->first();
        if ($soin) {
            foreach (['visage', 'corps', 'capillaire'] as $i => $slug) {
                Category::where('slug', $slug)->where('parent_id', $soin->id)->update(['sort' => $i]);
            }
        }
        $this->command->info('Ordre corrigé.');

        // 2. Création des marques manquantes
        $brandsToCreate = [
            ['name' => 'La Roche Posay', 'slug' => 'la-roche-posay', 'logo' => 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS1LWs1UIBcQ2V2f-S1gx3lD2yoPMd50lYVgg&s'],
            ['name' => 'Vichy', 'slug' => 'vichy', 'logo' => 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTUp5LQyiBA30zfNmROYastnqJRyZEzljjdGw&s'],
            ['name' => 'Bioderma', 'slug' => 'bioderma', 'logo' => 'https://logos-world.net/wp-content/uploads/2020/11/Bioderma-Logo.png'],
            ['name' => 'Mustela', 'slug' => 'mustela', 'logo' => 'https://www.paralabel.tn/img/m/105.jpg'],
            ['name' => 'Uriage', 'slug' => 'uriage', 'logo' => 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIdylAaCdWDRVkcJDEdPHI5lEllceNe7kfPw&s'],
            ['name' => 'Vital', 'slug' => 'vital', 'logo' => 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTB0plqwnZ5Wz5Yir5dBCxZY9sBnsootEqxUw&s'],
            ['name' => 'Doppelherz', 'slug' => 'doppelherz', 'logo' => 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRNrvgbb1fExyVeKcucc00HlJgyANuIEle7_Q&s'],
            ['name' => 'Muriac', 'slug' => 'muriac', 'logo' => 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRK9fGEYcYxo46jIEZw1O9Ev7O57ya-uZwj8A&s'],
            ['name' => 'Rogé', 'slug' => 'roge', 'logo' => 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ4L-gECMViwCOh5tZbUqd_GN4GSbSLh_Jw3Q&s'],
        ];
        foreach ($brandsToCreate as $b) {
            Brand::firstOrCreate(['slug' => $b['slug']], ['name' => $b['name'], 'logo' => $b['logo']]);
        }
        $this->command->info('Marques créées.');

        // 3. Association marques <-> catégories
        $catBrands = [
            'solaire' => ['la-roche-posay', 'vichy', 'avene', 'bioderma'],
            'bebe-et-maman' => ['mustela', 'uriage'],
            'complements-alimentaires' => ['vital', 'doppelherz'],
            'hygiene' => ['muriac', 'roge'],
        ];
        foreach ($catBrands as $catSlug => $brandSlugs) {
            $cat = Category::where('slug', $catSlug)->first();
            if (!$cat) {
                continue;
            }
            $ids = Brand::whereIn('slug', $brandSlugs)->pluck('id', 'slug');
            $sync = [];
            foreach ($brandSlugs as $i => $slug) {
                if (isset($ids[$slug])) {
                    $sync[$ids[$slug]] = ['order' => $i];
                }
            }
            $cat->brands()->sync($sync);
            $this->command->info("$catSlug : " . count($sync) . ' marque(s)');
        }

        // 4. Textes + images des packs promo
        $promos = [
            'solaire' => [
                'title' => 'Gamme Éco-responsable',
                'text' => 'Des tests dermatologiques et écologiques ultra-poussés.',
                'link' => '/products?category=solaire',
                'cta' => "Découvrir l'engagement",
                'image' => 'https://m.pharmacie-principale.ch/sites/default/files/publireportage/Publireportage_-suncare.jpg',
            ],
            'bebe-et-maman' => [
                'title' => 'Coffret bébé Chicco',
                'text' => 'Coffret Bébé Chicco Baby Moments 7 Produits + Trousse Gratuit',
                'link' => '/products?category=bebe-et-maman',
                'cta' => 'Voir la sélection',
                'image' => 'https://www.bebeetmaman.tn/17785-large_default/coffret-bebe-chicco-baby-moments-7-produits-trousse-gratuit.jpg',
            ],
            'complements-alimentaires' => [
                'title' => 'Objectif Vitalité',
                'text' => 'Boostez votre organisme avec notre sélection de vitamines et minéraux.',
                'link' => '/products?category=complements-alimentaires',
                'cta' => 'Découvrir la gamme',
                'image' => 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTC_mnkT9893W-xqZlxxiQJKSFVh8SKsjl7vw&s',
            ],
            'hygiene' => [
                'title' => 'Hygiène intime',
                'text' => 'Des soins dermatologiques pour le respect de votre peau.',
                'link' => '/products?category=hygiene',
                'cta' => 'Découvrir',
                'image' => 'https://www.parapharm.tn/media/products/13872-produits-cavailles_trousse_gel_intime_antibacterien_250_huile_douche_offerte.webp',
            ],
        ];
        foreach ($promos as $slug => $data) {
            Category::where('slug', $slug)->update([
                'promo_title' => $data['title'],
                'promo_text' => $data['text'],
                'promo_link' => $data['link'],
                'promo_cta' => $data['cta'],
                'promo_image' => $data['image'],
            ]);
        }
        $this->command->info('Packs promo mis à jour.');
    }
}
