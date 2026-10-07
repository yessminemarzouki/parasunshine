<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        // CATÉGORIE 1 : SOIN
        $soin = Category::create([
            'name' => 'Soin',
            'slug' => 'soin',
            'parent_id' => null,
        ]);

        // Sous-catégorie : VISAGE
        $visage = Category::create([
            'name' => 'Visage',
            'slug' => 'visage',
            'parent_id' => $soin->id,
        ]);

        $visageTypes = [
            'Peaux mixtes',
            'Peaux grasses',
            'Peaux sèches',
            'Peaux acnéiques',
            'Peaux sensibles',
            'Contour des yeux',
            'Nettoyants et démaquillants',
            'Anti-taches et dépigmentants',
            'Anti imperfections',
            'Anti-âge et anti-ride',
            'Apaisants',
            'Peeling du visage',
            'Stick et baume à lèvres',
        ];

        foreach ($visageTypes as $type) {
            Category::create([
                'name' => $type,
                'slug' => Str::slug($type),
                'parent_id' => $visage->id,
            ]);
        }

        // Sous-catégorie : CORPS
        $corps = Category::create([
            'name' => 'Corps',
            'slug' => 'corps',
            'parent_id' => $soin->id,
        ]);

        $corpsTypes = [
            'Hygiène corporelle',
            'Hydratation et nutrition',
            'Soins des mains',
            'Soins des pieds',
            'Gommages et exfoliants',
            'Anti grattage',
            'Produits soins minceur',
            'Massage',
            'Épilation',
            'Jambes lourdes',
            'Parfum',
        ];

        foreach ($corpsTypes as $type) {
            Category::create([
                'name' => $type,
                'slug' => Str::slug($type),
                'parent_id' => $corps->id,
            ]);
        }

        // Sous-catégorie : CAPILLAIRE
        $capillaire = Category::create([
            'name' => 'Capillaire',
            'slug' => 'capillaire',
            'parent_id' => $soin->id,
        ]);

        $capillaireTypes = [
            'Shampooing',
            'Après shampooing',
            'Masques',
            'Soins capillaires',
        ];

        foreach ($capillaireTypes as $type) {
            Category::create([
                'name' => $type,
                'slug' => Str::slug($type),
                'parent_id' => $capillaire->id,
            ]);
        }

        // CATÉGORIE 2 : SOLAIRE
        $solaire = Category::create([
            'name' => 'Solaire',
            'slug' => 'solaire',
            'parent_id' => null,
        ]);

        $solaireTypes = [
            'Crème solaire',
            'Pack solaire',
            'Après solaire',
            'Solaire bébé et enfants',
        ];

        foreach ($solaireTypes as $type) {
            Category::create([
                'name' => $type,
                'slug' => Str::slug($type),
                'parent_id' => $solaire->id,
            ]);
        }

        // CATÉGORIE 3 : BÉBÉ ET MAMAN
        $bebeMaman = Category::create([
            'name' => 'Bébé et Maman',
            'slug' => 'bebe-et-maman',
            'parent_id' => null,
        ]);

        $bebeTypes = [
            'Soins de visage',
            'Soins et toilette bébé',
            'Change et soins de siège',
            'Accessoires',
        ];

        foreach ($bebeTypes as $type) {
            Category::create([
                'name' => $type,
                'slug' => Str::slug($type),
                'parent_id' => $bebeMaman->id,
            ]);
        }

        // CATÉGORIE 4 : COMPLÉMENTS ALIMENTAIRES
        $complements = Category::create([
            'name' => 'Compléments Alimentaires',
            'slug' => 'complements-alimentaires',
            'parent_id' => null,
        ]);

        $complementsTypes = [
            'Minceur',
            'Forme et vitalité',
            'Confort',
            'Santé',
        ];

        foreach ($complementsTypes as $type) {
            Category::create([
                'name' => $type,
                'slug' => Str::slug($type),
                'parent_id' => $complements->id,
            ]);
        }

        // 5. HYGIÈNE
        $hygiene = Category::create([
            'name' => 'Hygiène',
            'slug' => 'hygiene',
            'parent_id' => null,
            'sort' => 5,
        ]);

        $hygieneTypes = [
            'Douche et bain',
            'Hygiène bucco-dentaire',
            'Anti-acarien et anti-moustique',
            'Hygiène intime',
        ];

        foreach ($hygieneTypes as $type) {
            Category::create([
                'name' => $type,
                'slug' => Str::slug($type),
                'parent_id' => $hygiene->id,
                'sort' => 0,
            ]);
        }

        // CATÉGORIE 6 : PARAMÉDICAUX
        $paramedicaux = Category::create([
            'name' => 'Paramédicaux',
            'slug' => 'paramedicaux',
            'parent_id' => null,
            'sort' => 6,
        ]);


    }
}