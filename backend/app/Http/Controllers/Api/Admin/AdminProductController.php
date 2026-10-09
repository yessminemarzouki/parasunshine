<?php

namespace App\Http\Controllers\Api\Admin;

use Illuminate\Support\Facades\Http;
use Intervention\Image\Laravel\Facades\Image;
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Category;
use App\Models\Brand;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;

class AdminProductController extends Controller
{
    private function parsePrice($value): ?float
    {
        if ($value === null || $value === '') {
            return null;
        }
        $value = str_replace(' ', '', (string) $value);
        $value = str_replace(',', '.', $value);
        if (substr_count($value, '.') > 1) {
            $parts = explode('.', $value);
            $decimal = array_pop($parts);
            $value = implode('', $parts) . '.' . $decimal;
        }
        return is_numeric($value) ? (float) $value : null;
    }

    private function extractImagesFromExcel(\PhpOffice\PhpSpreadsheet\Spreadsheet $spreadsheet, array $header): array
    {
        $sheet = $spreadsheet->getActiveSheet();
        $imagesByRow = [];

        $imageCols = [];

        // Les colonnes image/image_2/image_3/image_4 sont désormais
        // totalement ignorées pendant l'import CSV — les images produit
        // sont assignées séparément via l'import ZIP par correspondance de
        // référence (voir importImagesZip). Seules les images de couleurs
        // restent traitées ici.
        $imageColNames = [];

        // Colonnes images des couleurs (jusqu'à 10)
        for ($c = 1; $c <= 10; $c++) {
            $imageColNames[] = "color_img_{$c}";
        }

        foreach ($imageColNames as $colName) {
            $colIndex = array_search($colName, $header);
            if ($colIndex !== false) {
                $imageCols[$colName] = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIndex + 1);
            }
        }

        foreach ($sheet->getDrawingCollection() as $drawing) {
            $coordinate = $drawing->getCoordinates();
            preg_match('/([A-Z]+)(\d+)/', $coordinate, $matches);
            if (empty($matches)) {
                continue;
            }

            $colLetter = $matches[1];
            $rowNumber = (int) $matches[2];

            $fieldName = array_search($colLetter, $imageCols);
            if ($fieldName === false) {
                continue;
            }

            try {
                if ($drawing instanceof \PhpOffice\PhpSpreadsheet\Worksheet\MemoryDrawing) {
                    ob_start();
                    $callBack = $drawing->getRenderingFunction();
                    $callBack($drawing->getImageResource());
                    $imageData = ob_get_clean();
                } elseif ($drawing instanceof \PhpOffice\PhpSpreadsheet\Worksheet\Drawing) {
                    $imageData = file_get_contents($drawing->getPath());
                } else {
                    continue;
                }

                if (empty($imageData)) {
                    continue;
                }

                $optimized = Image::read($imageData)
                    ->scaleDown(width: 800, height: 800)
                    ->toWebp(quality: 85);

                $filename = uniqid() . '.webp';
                $fullPath = 'products/' . $filename;
                Storage::disk('public')->put($fullPath, (string) $optimized);

                $imagesByRow[$rowNumber][$fieldName] = $fullPath;

            } catch (\Exception $e) {
                continue;
            }
        }

        return $imagesByRow;
    }
    private function generateUniqueProductSlug(string $name): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $i = 1;
        while (\App\Models\Product::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$i}";
            $i++;
        }
        return $slug;
    }
    public function importCsv(Request $request)
    {
        // 6767+ produits peuvent prendre plusieurs minutes et consommer
        // beaucoup de mémoire — on lève les limites PHP pour cette requête
        // précise uniquement, sans toucher à la config globale.
        set_time_limit(0);
        ini_set('memory_limit', '1024M');
        \Illuminate\Support\Facades\DB::connection()->disableQueryLog();

        $request->validate([
            'file' => 'required|file|mimes:csv,txt,xlsx|max:51200', // 50 Mo
        ]);

        // Mode : 'create' (défaut) ou 'upsert' (mise à jour par id)
        $mode = $request->input('mode', 'create');

        $file = $request->file('file');
        $extension = $file->getClientOriginalExtension();

        if ($extension === 'xlsx') {
            $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($file->getPathname());
            $rows = $spreadsheet->getActiveSheet()->toArray();
            $header = array_map('trim', $rows[0]);
            $dataRows = array_slice($rows, 1);
            $embeddedImages = $this->extractImagesFromExcel($spreadsheet, $header);
        } else {
            $handle = fopen($file->getPathname(), 'r');
            $header = null;
            $dataRows = [];
            while (($line = fgetcsv($handle, 2000, ',')) !== false) {
                if (!$header) {
                    $header = array_map('trim', $line);
                    continue;
                }
                $dataRows[] = $line;
            }
            fclose($handle);
            $embeddedImages = [];
        }

        $imported = 0;
        $updated = 0;
        $errors = [];
        $emptyPriceProducts = [];
        $row = 1;

        // Couleurs prédéfinies (même liste que le frontend)
        $presetColors = [
            'Blanc'     => '#FFFFFF', 'Noir'      => '#000000',
            'Rouge'     => '#FF0000', 'Bleu'      => '#0000FF',
            'Vert'      => '#008000', 'Jaune'     => '#FFFF00',
            'Rose'      => '#FFC0CB', 'Rose bébé' => '#FFB6C1',
            'Beige'     => '#F5F5DC', 'Crème'     => '#FFFDD0',
            'Marron'    => '#8B4513', 'Gris'      => '#808080',
            'Orange'    => '#FFA500', 'Violet'    => '#800080',
            'Turquoise' => '#40E0D0', 'Corail'    => '#FF7F50',
            'Lavande'   => '#E6E6FA', 'Bordeaux'  => '#800020',
            'Caramel'   => '#C68642', 'Ivoire'    => '#FFFFF0',
        ];

        foreach ($dataRows as $line) {
            $row++;
            if (empty(array_filter($line, fn ($v) => $v !== null && trim((string) $v) !== ''))) {
                continue;
            }

            $line = array_pad($line, count($header), null);
            $data = array_combine($header, $line);
            $data = array_map(fn ($v) => is_string($v) ? trim($v) : $v, $data);

            // Normalise les clés : minuscules + retire espaces normaux,
            // espaces insécables (souvent invisibles dans Excel) et BOM —
            // ces caractères cachés empêchaient certaines colonnes
            // (description, short_description, benefits, brand...) de
            // matcher malgré un en-tête visuellement identique.
            $cleanKey = function ($key) {
                $key = str_replace(["\xC2\xA0", "\xEF\xBB\xBF"], '', (string) $key);
                return strtolower(trim($key));
            };
            $normalizedData = [];
            foreach ($data as $key => $value) {
                $normalizedData[$cleanKey($key)] = $value;
            }
            $data = $normalizedData;

            // ── Seul name est réellement obligatoire ──
            if (empty($data['name'])) {
                $errors[] = "Ligne $row : ignorée — le nom est obligatoire.";
                continue;
            }

            // Prix vide ou illisible → 0, jamais bloquant. On garde le nom
            // en mémoire pour le signaler clairement dans le résultat final.
            $priceWasEmpty = empty($data['price']) && $data['price'] !== '0' && $data['price'] !== 0;

            // Stock et disponibilité toujours forcés — peu importe ce que
            // contient le fichier Excel, tous les produits importés
            // arrivent en stock plein et disponibles.
            $stock = 999;

            // ── Référence : auto-générée si absente ──
            $reference = !empty($data['reference']) ? trim($data['reference']) : null;
            if (!$reference) {
                $reference = 'AUTO-' . strtoupper(\Illuminate\Support\Str::random(10));
                $errors[] = "Ligne $row : référence manquante — '{$reference}' générée automatiquement.";
            }

            // Vérification par référence : si la référence existe déjà
            //   → en mode upsert : on met à jour le produit existant
            //   → en mode create : on dédoublonne la référence (nouveau produit)
            $existing = $reference ? \App\Models\Product::where('reference', $reference)->first() : null;

            if ($mode !== 'upsert' && $existing) {
                $original = $reference;
                $reference = $original . '-' . strtoupper(\Illuminate\Support\Str::random(4));
                $errors[] = "Ligne $row : référence '{$original}' déjà utilisée — '{$reference}' utilisée à la place.";
                $existing = null; // la nouvelle référence n'existe pas encore en base
            }

            // ── Catégorie (optionnelle, tolérante) ──
            $category = null;
            $category2 = null;
            if (!empty($data['category'])) {
                $categoryNames = array_values(array_filter(
                    array_map('trim', explode(',', $data['category']))
                ));

                if (!empty($categoryNames[0])) {
                    $category = \App\Models\Category::where('name', $categoryNames[0])->first();
                    if (!$category) {
                        $errors[] = "Ligne $row : catégorie '{$categoryNames[0]}' introuvable — produit créé sans catégorie.";
                    }
                }

                if (!empty($categoryNames[1]) && $category) {
                    if (mb_strtolower($categoryNames[1]) !== mb_strtolower($categoryNames[0])) {
                        $category2 = \App\Models\Category::where('name', $categoryNames[1])->first();
                        if (!$category2) {
                            $errors[] = "Ligne $row : deuxième catégorie '{$categoryNames[1]}' introuvable — ignorée.";
                        }
                    }
                }
            }

            // ── Marque (optionnelle, tolérante, hiérarchie complète) ──
            $brand = null;
            // Si 'brand' est vide mais 'parent_brand' est rempli, le produit
            // appartient directement à la marque mère (pas de sous-marque).
            $effectiveBrandName = !empty($data['brand'])
                ? trim($data['brand'])
                : (!empty($data['parent_brand']) ? trim($data['parent_brand']) : null);

            if (!empty($effectiveBrandName)) {
                $brandName = $effectiveBrandName;

                if (!empty($data['brand']) && !empty($data['parent_brand'])) {
                    $parentBrand = \App\Models\Brand::whereRaw('LOWER(name) = ?', [mb_strtolower(trim($data['parent_brand']))])
                        ->whereNull('parent_id')
                        ->first();

                    if ($parentBrand) {
                        $brand = \App\Models\Brand::whereRaw('LOWER(name) = ?', [mb_strtolower($brandName)])
                            ->where('parent_id', $parentBrand->id)
                            ->first();
                    } else {
                        $errors[] = "Ligne $row : marque parente '{$data['parent_brand']}' introuvable.";
                    }
                }

                if (!$brand) {
                    $brand = \App\Models\Brand::whereRaw('LOWER(name) = ?', [mb_strtolower($brandName)])
                        ->whereNull('parent_id')
                        ->first();
                }
                if (!$brand) {
                    $brand = \App\Models\Brand::whereRaw('LOWER(name) = ?', [mb_strtolower($brandName)])
                        ->first();
                }

                if (!$brand) {
                    $errors[] = "Ligne $row : marque '{$data['brand']}' introuvable — produit créé sans marque.";
                }
            }

            try {
                // Toujours nécessaire pour les images de couleurs (color_img_X)
                $rowImages = $embeddedImages[$row] ?? [];

                // ── Images principale/galerie : totalement ignorées ──
                $mainImage = null;
                $gallery = [];

                // ── Tailles (format "Label:Stock") ──
                $sizes = null;
                $hasSizes = false;
                if (!empty($data['sizes'])) {
                    $sizesArray = [];
                    foreach (explode(',', $data['sizes']) as $pair) {
                        $pair = trim($pair);
                        if ($pair === '') {
                            continue;
                        }
                        [$label, $stockStr] = array_pad(explode(':', $pair, 2), 2, null);
                        $label = trim($label);
                        if ($label === '') {
                            continue;
                        }
                        $stock = ($stockStr !== null && is_numeric(trim($stockStr)))
                            ? (int) trim($stockStr)
                            : 999;
                        $sizesArray[] = ['label' => $label, 'stock' => $stock];
                    }
                    if (!empty($sizesArray)) {
                        $sizes = $sizesArray;
                        $hasSizes = true;
                    }
                }

                // ── Couleurs (format "Nom:Stock") ──
                $normalizeColorName = function ($name) use ($presetColors) {
                    $name = trim($name);
                    foreach ($presetColors as $preset => $hex) {
                        if (mb_strtolower($preset) === mb_strtolower($name)) {
                            return $preset;
                        }
                    }
                    return $name;
                };

                $colors = null;
                $hasColors = false;
                $colorsArray = [];

                if (!empty($data['colors'])) {
                    $colorEntries = array_values(array_filter(array_map('trim', explode(',', $data['colors']))));

                    foreach ($colorEntries as $idx => $entry) {
                        [$colorNameRaw, $stockStr] = array_pad(explode(':', $entry, 2), 2, null);
                        $colorName = $normalizeColorName($colorNameRaw);
                        if ($colorName === '') {
                            continue;
                        }

                        $colorHex = null;
                        foreach ($presetColors as $name => $hex) {
                            if (mb_strtolower($name) === mb_strtolower($colorName)) {
                                $colorHex = $hex;
                                break;
                            }
                        }
                        if (!$colorHex) {
                            $colorHex = '#808080';
                            $errors[] = "Ligne $row : couleur '{$colorName}' non reconnue, #808080 utilisé par défaut.";
                        }

                        $stock = ($stockStr !== null && is_numeric(trim($stockStr)))
                            ? (int) trim($stockStr)
                            : 999;

                        $imgColKey = 'color_img_' . ($idx + 1);
                        $colorImage = $rowImages[$imgColKey] ?? null;
                        if (!$colorImage && !empty($data[$imgColKey])) {
                            try {
                                $colorImage = $this->downloadImageFromUrl($data[$imgColKey]);
                            } catch (\Exception $e) {
                                // Cellule mal remplie — ignorée silencieusement.
                                $colorImage = null;
                            }
                        }

                        $colorsArray[] = [
                            'name'  => $colorName,
                            'hex'   => $colorHex,
                            'image' => $colorImage,
                            'stock' => $stock,
                        ];
                    }

                    if (!empty($colorsArray)) {
                        $colors    = $colorsArray;
                        $hasColors = true;
                    }
                }

                // ── Âges (seul, ou combiné avec couleurs) ──
                $ages = null;
                $hasAge = false;

                if (!empty($data['ages_colors'])) {
                    $hasAge = true;
                    $agesArray = [];
                    foreach (explode(';', $data['ages_colors']) as $ageChunk) {
                        $ageChunk = trim($ageChunk);
                        if ($ageChunk === '') {
                            continue;
                        }
                        $parts = explode('=', $ageChunk, 2);
                        if (count($parts) < 2) {
                            continue;
                        }
                        $ageLabel = trim($parts[0]);
                        if ($ageLabel === '') {
                            continue;
                        }
                        $ageColors = [];
                        foreach (explode('|', $parts[1]) as $colorPair) {
                            $colorPair = trim($colorPair);
                            if ($colorPair === '') {
                                continue;
                            }
                            [$cNameRaw, $cStockStr] = array_pad(explode(':', $colorPair, 2), 2, null);
                            $cName = $normalizeColorName($cNameRaw);
                            if ($cName === '') {
                                continue;
                            }
                            $cStock = ($cStockStr !== null && is_numeric(trim($cStockStr)))
                                ? (int) trim($cStockStr)
                                : 0;
                            $ageColors[] = ['name' => $cName, 'stock' => $cStock];
                        }
                        $agesArray[] = ['label' => $ageLabel, 'colors' => $ageColors];
                    }
                    if (!empty($agesArray)) {
                        $ages = $agesArray;
                    }
                } elseif (!empty($data['ages'])) {
                    $hasAge = true;
                    $agesArray = [];
                    foreach (explode(',', $data['ages']) as $pair) {
                        $pair = trim($pair);
                        if ($pair === '') {
                            continue;
                        }
                        [$label, $stockStr] = array_pad(explode(':', $pair, 2), 2, null);
                        $label = trim($label);
                        if ($label === '') {
                            continue;
                        }
                        $stock = ($stockStr !== null && is_numeric(trim($stockStr)))
                            ? (int) trim($stockStr)
                            : 999;
                        $agesArray[] = ['label' => $label, 'stock' => $stock];
                    }
                    if (!empty($agesArray)) {
                        $ages = $agesArray;
                    }
                }

                // ── Calcul automatique prix promo / pourcentage ──
                $price = $this->parsePrice($data['price'] ?? null);
                if ($price === null) {
                    $price = 0;
                    $priceWasEmpty = true;
                }
                if ($priceWasEmpty) {
                    $emptyPriceProducts[] = $data['name'];
                }
                $promoPrice   = $this->parsePrice($data['promo_price'] ?? null);
                $promoPercent = $this->parsePrice($data['promo_percentage'] ?? null);

                if ($promoPrice && !$promoPercent && $price > 0) {
                    // Prix promo fourni → calcul automatique du pourcentage
                    $promoPercent = round((($price - $promoPrice) / $price) * 100, 2);
                } elseif ($promoPercent && !$promoPrice && $price > 0) {
                    // Pourcentage fourni → calcul automatique du prix promo
                    $promoPrice = round($price - ($price * $promoPercent / 100), 3);
                }


                $payload = [
                    'name'                => $data['name'],
                    'reference'           => $reference,
                    'display_category1'   => true,
                    'display_category2'   => false,
                    'price'               => $price,
                    'promo_price'         => $promoPrice,
                    'discount_percentage' => $promoPercent,
                    'promo_starts_at'     => !empty($data['promo_starts_at']) ? $data['promo_starts_at'] : null,
                    'promo_ends_at'       => !empty($data['promo_ends_at']) ? $data['promo_ends_at'] : null,
                    'stock'               => $stock,
                    'description'         => $data['description'] ?? null,
                    'short_description'   => $data['short_description'] ?? null,
                    'benefits'            => $data['benefits'] ?? null,
                    'usage_tips'          => $data['usage_tips'] ?? null,
                    'category_id'         => $category?->id,
                    'category2_id'        => $category2?->id,
                    'brand_id'            => $brand?->id,
                    'is_featured'         => !empty($data['is_featured']) && (int) $data['is_featured'] === 1,
                    'is_new'              => !empty($data['is_new']) && (int) $data['is_new'] === 1,
                    'is_promo'            => !empty($data['is_promo']) && (int) $data['is_promo'] === 1,
                    'is_bestseller'       => !empty($data['is_bestseller']) && (int) $data['is_bestseller'] === 1,
                    'is_unavailable'      => !empty($data['is_unavailable']) && (int) $data['is_unavailable'] === 1,
                    'has_sizes'           => $hasSizes,
                    'sizes'               => $sizes,
                    'has_colors'          => $hasColors,
                    'colors'              => $colors,
                    'has_age'             => $hasAge,
                    'ages'                => $ages,
                ];

                if ($mode === 'upsert' && $existing) {
                    // Mise à jour : on ne touche ni au slug ni aux images
                    $existing->update($payload);
                    $updated++;
                } else {
                    // Création
                    $payload['slug']   = $this->generateUniqueProductSlug($data['name']);
                    $payload['image']  = $mainImage;
                    $payload['images'] = !empty($gallery) ? $gallery : null;
                    \App\Models\Product::create($payload);
                    $imported++;
                }
            } catch (\Exception $e) {
                $errors[] = "Ligne $row : erreur — " . $e->getMessage();
            }
        }

        Cache::forget('home_data');
        Cache::forget('products_featured');
        Cache::forget('products_newest');
        Cache::forget('products_promotions');
        Cache::forget('products_bestsellers');
        Cache::increment('products_list_version');

        if (!empty($emptyPriceProducts)) {
            $errors[] = count($emptyPriceProducts) . " produit(s) sans prix dans le fichier — prix mis à 0 (à corriger manuellement) : " . implode(', ', array_slice($emptyPriceProducts, 0, 50)) . (count($emptyPriceProducts) > 50 ? '…' : '');
        }

        return response()->json([
        'message'  => "$imported créé(s), $updated mis à jour.",
        'imported' => $imported,
        'updated'  => $updated,
        'errors'   => $errors,
        ]);
    }
    public function exportExcel()
    {
        set_time_limit(0);
        ini_set('memory_limit', '1024M');

        $products = Product::with(['category:id,name', 'category2:id,name', 'brand:id,name', 'brand.parent:id,name'])
            ->orderBy('id')
            ->get();

        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Produits');

        $headers = [
    'reference', 'name', 'price', 'promo_price', 'promo_percentage',
    'promo_starts_at', 'promo_ends_at', 'stock',
    'category', 'category2', 'brand', 'parent_brand',
    'short_description', 'description', 'benefits', 'usage_tips',
    'is_featured', 'is_new', 'is_promo', 'is_bestseller', 'is_unavailable',
    'display_category1', 'display_category2',
    'has_sizes', 'sizes', 'has_colors', 'colors', 'has_age', 'ages',
];

        // Écriture des en-têtes (ligne 1)
        $col = 1;
        foreach ($headers as $h) {
            $coord = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($col) . '1';
            $sheet->setCellValue($coord, $h);
            $sheet->getStyle($coord)->getFont()->setBold(true);
            $col++;
        }

        // Écriture des lignes
        $row = 2;
        foreach ($products as $p) {
            $sizesStr = '';
            if ($p->has_sizes && is_array($p->sizes)) {
                $sizesStr = collect($p->sizes)
                    ->map(fn ($s) => ($s['label'] ?? '') . ':' . ($s['stock'] ?? 999))
                    ->implode(',');
            }

            $colorsStr = '';
            if ($p->has_colors && is_array($p->colors)) {
                $colorsStr = collect($p->colors)
                    ->map(fn ($c) => ($c['name'] ?? '') . ':' . ($c['stock'] ?? 999))
                    ->implode(',');
            }

            $agesStr = '';
            if ($p->has_age && is_array($p->ages)) {
                if ($p->has_colors) {
                    $agesStr = collect($p->ages)->map(function ($a) {
                        $label = $a['label'] ?? '';
                        $cols = collect($a['colors'] ?? [])
                            ->map(fn ($c) => ($c['name'] ?? '') . ':' . ($c['stock'] ?? 0))
                            ->implode('|');
                        return $label . '=' . $cols;
                    })->implode(';');
                } else {
                    $agesStr = collect($p->ages)
                        ->map(fn ($a) => ($a['label'] ?? '') . ':' . ($a['stock'] ?? 999))
                        ->implode(',');
                }
            }

            $values = [

                $p->reference,
                $p->name,
                $p->price,
                $p->promo_price,
                $p->discount_percentage,
                $p->promo_starts_at,
                $p->promo_ends_at,
                $p->stock,
                $p->category?->name,
                $p->category2?->name,
                $p->brand?->name,
                $p->brand?->parent?->name,
                strip_tags($p->short_description ?? ''),
                strip_tags($p->description ?? ''),
                strip_tags($p->benefits ?? ''),
                strip_tags($p->usage_tips ?? ''),
                $p->is_featured ? 1 : 0,
                $p->is_new ? 1 : 0,
                $p->is_promo ? 1 : 0,
                $p->is_bestseller ? 1 : 0,
                $p->is_unavailable ? 1 : 0,
                $p->display_category1 ? 1 : 0,
                $p->display_category2 ? 1 : 0,
                $p->has_sizes ? 1 : 0,
                $sizesStr,
                $p->has_colors ? 1 : 0,
                $colorsStr,
                $p->has_age ? 1 : 0,
                $agesStr,
            ];

            $col = 1;
            foreach ($values as $v) {
                $coord = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($col) . $row;
                $sheet->setCellValue($coord, $v);
                $col++;
            }
            $row++;
        }

        // Largeur auto
        foreach (range(1, count($headers)) as $c) {
            $letter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($c);
            $sheet->getColumnDimension($letter)->setAutoSize(true);
        }

        $filename = 'produits_export_' . date('Y-m-d_His') . '.xlsx';
        $tempPath = storage_path('app/' . $filename);

        $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
        $writer->save($tempPath);

        return response()->download($tempPath)->deleteFileAfterSend(true);
    }
    private function downloadImageFromUrl(?string $url, string $path = 'products'): ?string
    {
        if (empty($url) || !filter_var($url, FILTER_VALIDATE_URL)) {
            return null;
        }
        try {
            $response = Http::timeout(15)->get($url);
            if (!$response->successful()) {
                return null;
            }
            $contentType = $response->header('Content-Type');
            if (!$contentType || !str_starts_with($contentType, 'image/')) {
                return null;
            }
            $optimized = Image::read($response->body())
                ->scaleDown(width: 800, height: 800)
                ->toWebp(quality: 85);
            $filename = uniqid() . '.webp';
            $fullPath = $path . '/' . $filename;
            Storage::disk('public')->put($fullPath, (string) $optimized);
            return $fullPath;
        } catch (\Exception $e) {
            return null;
        }
    }

    private function handleGalleryImages(Request $request, ?Product $product = null): array
    {
        $oldImages = $product?->images ?? [];
        $newImages = [];
        for ($i = 0; $i < 3; $i++) {
            if ($request->hasFile("gallery_image_{$i}")) {
                if (!empty($oldImages[$i])) {
                    Storage::disk('public')->delete($oldImages[$i]);
                }
                $newImages[$i] = $request->file("gallery_image_{$i}")->store('products', 'public');
            } elseif ($request->filled("existing_image_{$i}")) {
                $newImages[$i] = $request->input("existing_image_{$i}");
            } elseif (!empty($oldImages[$i])) {
                Storage::disk('public')->delete($oldImages[$i]);
            }
        }
        return array_values($newImages);
    }

    // ── Import d'images en masse par correspondance de nom de fichier ──

    /**
     * Cherche récursivement un sous-dossier dont le nom correspond
     * (insensible à la casse), peu importe sa profondeur dans le ZIP extrait.
     */
    private function findSubfolder(string $root, string $name): ?string
    {
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($root, \FilesystemIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::SELF_FIRST
        );
        foreach ($iterator as $item) {
            if ($item->isDir() && strtolower($item->getFilename()) === strtolower($name)) {
                return $item->getPathname();
            }
        }
        return null;
    }

    /**
     * Liste à plat les fichiers image d'un dossier, indexés par leur nom
     * sans extension (ex: "acm-novophane-bt-60-gel-3760095250168").
     */
    private function mapImageFiles(?string $folder): array
    {
        if (!$folder || !is_dir($folder)) {
            return [];
        }
        $map = [];
        foreach (scandir($folder) as $file) {
            if ($file === '.' || $file === '..') {
                continue;
            }
            $fullPath = $folder . DIRECTORY_SEPARATOR . $file;
            if (!is_file($fullPath)) {
                continue;
            }
            $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
            if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp'])) {
                continue;
            }
            $base = pathinfo($file, PATHINFO_FILENAME);
            $map[$base] = $fullPath;
        }
        return $map;
    }

    /**
     * Trouve, dans une liste de fichiers, celui dont le nom se termine par
     * la référence produit (précédée d'un tiret ou en tout début de nom).
     * Ex: référence "3760095250168" matche
     * "acm-novophane-bt-60-gel-3760095250168.webp".
     */
    private function matchFileToReference(array $filesMap, string $reference): ?string
    {
        $pattern = '/(^|-)' . preg_quote($reference, '/') . '$/i';
        foreach ($filesMap as $base => $path) {
            if (preg_match($pattern, $base)) {
                return $path;
            }
        }
        return null;
    }

    private function storeOptimizedImageFromPath(string $path): ?string
    {
        try {
            $optimized = Image::read(file_get_contents($path))
                ->scaleDown(width: 800, height: 800)
                ->toWebp(quality: 85);
            $filename = uniqid() . '.webp';
            $fullPath = 'products/' . $filename;
            Storage::disk('public')->put($fullPath, (string) $optimized);
            return $fullPath;
        } catch (\Exception $e) {
            return null;
        }
    }

    private function deleteDirectory(string $dir): void
    {
        if (!is_dir($dir)) {
            return;
        }
        try {
            $items = new \RecursiveIteratorIterator(
                new \RecursiveDirectoryIterator($dir, \FilesystemIterator::SKIP_DOTS),
                \RecursiveIteratorIterator::CHILD_FIRST
            );
            foreach ($items as $item) {
                @($item->isDir() ? rmdir($item->getPathname()) : unlink($item->getPathname()));
            }
            @rmdir($dir);
        } catch (\Throwable $e) {
            // Le nettoyage du dossier temporaire est purement cosmétique —
            // un fichier caché (.DS_Store, verrou système...) ne doit
            // jamais faire échouer la réponse alors que l'import a réussi.
            \Illuminate\Support\Facades\Log::warning(
                "Nettoyage du dossier temporaire incomplet : {$dir} — {$e->getMessage()}"
            );
        }

        // Filet de sécurité final : si des fichiers résistent encore,
        // force la suppression via le shell plutôt que de bloquer.
        if (is_dir($dir)) {
            @exec('rm -rf ' . escapeshellarg($dir));
        }
    }

    /**
     * Trouve, dans une liste de fichiers, celui dont le nom se termine par
     * la référence produit — renvoie aussi le nom de base trouvé (pour le
     * suivi des fichiers "orphelins" non assignés).
     */
    private function matchFileWithKey(array $filesMap, string $reference): ?array
    {
        $pattern = '/(^|-)' . preg_quote($reference, '/') . '$/i';
        foreach ($filesMap as $base => $path) {
            if (preg_match($pattern, $base)) {
                return [$base, $path];
            }
        }
        return null;
    }

    private function processImagesZipImport(Request $request, string $mode): \Illuminate\Http\JsonResponse
    {
        set_time_limit(0);
        ini_set('memory_limit', '2048M');
        \Illuminate\Support\Facades\DB::connection()->disableQueryLog();

        $request->validate([
            'zip' => 'required|file|mimes:zip|max:1048576', // 1 Go max
        ]);

        $zipFile = $request->file('zip');
        $extractPath = storage_path('app/tmp_images_' . uniqid() . '_extracted');

        $zip = new \ZipArchive();
        if ($zip->open($zipFile->getPathname()) !== true) {
            return response()->json(['message' => "Impossible d'ouvrir le fichier ZIP."], 422);
        }
        $zip->extractTo($extractPath);
        $zip->close();

        $folder = $this->findSubfolder($extractPath, 'Dossier1') ?? $extractPath;
        $files = $this->mapImageFiles($folder);

        if (empty($files)) {
            $this->deleteDirectory($extractPath);
            return response()->json([
                'message' => "Aucune image trouvée — vérifiez que le ZIP contient bien un dossier 'Dossier1' avec vos images.",
            ], 422);
        }

        $usedBases = [];
        $matched = 0;

        Product::select('id', 'reference', 'image', 'images')
            ->whereNotNull('reference')
            ->chunkById(100, function ($products) use ($files, $mode, &$matched, &$usedBases) {
                foreach ($products as $product) {
                    $found = $this->matchFileWithKey($files, $product->reference);
                    if (!$found) {
                        continue;
                    }
                    [$base, $path] = $found;

                    $stored = $this->storeOptimizedImageFromPath($path);
                    if (!$stored) {
                        continue;
                    }

                    if ($mode === 'main') {
                        if ($product->image) {
                            Storage::disk('public')->delete($product->image);
                        }
                        $product->update(['image' => $stored]);
                    } else {
                        $images = $product->images ?? [];
                        $images[0] = $stored;
                        $product->update(['images' => array_values($images)]);
                    }

                    $usedBases[$base] = true;
                    $matched++;
                }
                gc_collect_cycles();
            });

        $this->deleteDirectory($extractPath);

        Cache::forget('home_data');
        Cache::forget('products_featured');
        Cache::forget('products_newest');
        Cache::forget('products_promotions');
        Cache::forget('products_bestsellers');
        Cache::increment('products_list_version');

        // Images présentes dans le ZIP mais n'ayant matché aucun produit —
        // à vérifier manuellement (référence absente du catalogue, faute
        // de frappe dans le nom de fichier, etc.)
        $unmatchedFiles = array_values(array_diff(array_keys($files), array_keys($usedBases)));

        $label = $mode === 'main' ? 'principale(s)' : 'optionnelle(s)';

        return response()->json([
            'message' => "{$matched} image(s) {$label} assignée(s). " . count($unmatchedFiles) . " image(s) du ZIP sans produit correspondant.",
            'matched'          => $matched,
            'unmatched_count'  => count($unmatchedFiles),
            'unmatched_files'  => array_slice($unmatchedFiles, 0, 100),
        ]);
    }

    public function importMainImagesZip(Request $request)
    {
        return $this->processImagesZipImport($request, 'main');
    }

    public function importOptionalImagesZip(Request $request)
    {
        return $this->processImagesZipImport($request, 'optional');
    }

    public function stats(Product $product)
    {
        $allItems = \App\Models\OrderItem::where('product_id', $product->id)->with('order')->get();
        $deliveredItems = $allItems->filter(fn ($item) => $item->order?->status === 'delivered');
        $totalOrders   = $allItems->count();
        $totalRevenue  = $deliveredItems->sum('total');
        $totalQuantity = $deliveredItems->sum('quantity');
        $recentOrders = $allItems->sortByDesc('created_at')->take(5)->map(function ($item) {
            return [
                'order_number' => $item->order->order_number ?? '—',
                'quantity'     => $item->quantity,
                'total'        => $item->total,
                'date'         => $item->created_at->format('d/m/Y'),
                'status'       => $item->order->status ?? '—',
            ];
        })->values();
        return response()->json([
            'total_orders'   => $totalOrders,
            'total_revenue'  => round($totalRevenue, 3),
            'total_quantity' => $totalQuantity,
            'recent_orders'  => $recentOrders,
        ]);
    }
    public function index(Request $request)
    {
        $query = Product::with([
         'category:id,name',
         'category2:id,name',
         'brand:id,name,parent_id',
         'brand.parent:id,name',
         'promoCampaign:id,name,discount_percentage,starts_at,ends_at,is_active',
        ])
         ->select([
        'id', 'name', 'slug', 'reference', 'price', 'promo_price',
                     'discount_percentage', 'stock', 'image', 'images', 'category_id', 'category2_id',
           'display_category1', 'display_category2', 'brand_id',
        'is_featured', 'is_new', 'is_promo', 'is_bestseller', 'is_unavailable',
        'has_sizes', 'has_colors', 'sizes', 'colors', 'loyalty_points',
        'rating', 'reviews_count', 'promo_starts_at', 'promo_ends_at',
        'promo_campaign_id',
        'description', 'short_description', 'benefits', 'usage_tips',
        'updated_at', 'created_at',
         ])->latest();

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('reference', 'like', '%' . $request->search . '%');
            });
        }
        if ($request->category_id) {
            $query->where('category_id', $request->category_id);
        }
        if ($request->brand_id) {
            $query->where('brand_id', $request->brand_id);
        }
        if ($request->stock === 'low') {
            $query->where('stock', '<=', 5)->where('stock', '>', 0)->where('is_unavailable', false);
        } elseif ($request->stock === 'out') {
            $query->where(function ($q) {
                $q->where('stock', 0)->orWhere('is_unavailable', true);
            });
        }
        if ($request->boolean('bestseller')) {
            $query->where('is_bestseller', true);
        }
        if ($request->boolean('never_sold')) {
            $soldIds = \Illuminate\Support\Facades\DB::table('order_items')
                ->distinct()
                ->pluck('product_id');
            $query->whereNotIn('id', $soldIds);
        }
        if ($request->badge) {
            $badgeField = match ($request->badge) {
                'featured'   => 'is_featured',
                'new'        => 'is_new',
                'promo'      => 'is_promo',
                'bestseller' => 'is_bestseller',
                default      => null,
            };
            if ($badgeField) {
                $query->where($badgeField, true);
            }
        }
        if ($request->boolean('no_image')) {
            $query->where(function ($q) {
                $q->whereNull('image')->orWhere('image', '');
            });
        }
        if ($request->boolean('with_image')) {
            $query->whereNotNull('image')->where('image', '!=', '');
        }
        if ($request->boolean('no_brand')) {
            $query->whereNull('brand_id');
        }
        if ($request->boolean('no_category')) {
            $query->whereNull('category_id');
        }

        $emptyField = fn ($q, $field) => $q->where(function ($q2) use ($field) {
            $q2->whereNull($field)->orWhere($field, '');
        });

        if ($request->boolean('missing_description')) {
            $emptyField($query, 'description');
        }
        if ($request->boolean('missing_short_description')) {
            $emptyField($query, 'short_description');
        }
        if ($request->boolean('missing_benefits')) {
            $emptyField($query, 'benefits');
        }
        if ($request->boolean('missing_usage_tips')) {
            $emptyField($query, 'usage_tips');
        }
        if ($request->boolean('missing_all_content')) {
            foreach (['description', 'short_description', 'benefits', 'usage_tips'] as $field) {
                $emptyField($query, $field);
            }
        }

        return response()->json($query->paginate($request->per_page ?? 20));
    }

    public function show(Product $product)
    {
        return response()->json($product->load(['category', 'category2', 'brand.parent', 'reviews', 'promoCampaign']));
    }

    private function handleProductData(Request $request): array
    {
        return [
            'name'                => $request->name,
            'slug'                => $request->slug ?: Str::slug($request->name),
            'reference'           => $request->reference ?: null,
            'description'         => $request->description ?: null,
            'short_description'   => $request->short_description ?: null,
            'benefits'            => $request->benefits ?: null,
            'usage_tips'          => $request->usage_tips ?: null,
            'price'               => $request->price,
            'promo_price'         => $request->promo_price ?: null,
            'discount_percentage' => $request->discount_percentage ?: null,
            'stock'               => $request->stock ?? 999,
            'is_unavailable'      => filter_var($request->is_unavailable, FILTER_VALIDATE_BOOLEAN),
                    'category_id'         => $request->category_id ?: null,
            'category2_id'        => $request->category2_id ?: null,
            'display_category1'   => filter_var($request->display_category1 ?? '1', FILTER_VALIDATE_BOOLEAN),
            'display_category2'   => filter_var($request->display_category2, FILTER_VALIDATE_BOOLEAN),
            'brand_id'            => $request->brand_id ?: null,
            'is_featured'         => filter_var($request->is_featured, FILTER_VALIDATE_BOOLEAN),
            'is_new'              => filter_var($request->is_new, FILTER_VALIDATE_BOOLEAN),
            'is_promo'            => filter_var($request->is_promo, FILTER_VALIDATE_BOOLEAN),
           'is_bestseller'        => filter_var($request->is_bestseller, FILTER_VALIDATE_BOOLEAN),
            'promo_starts_at'     => $request->promo_starts_at ?: null,
            'promo_ends_at'       => $request->promo_ends_at ?: null,
            'has_sizes'           => filter_var($request->has_sizes, FILTER_VALIDATE_BOOLEAN),
            'sizes'               => $request->sizes ? json_decode($request->sizes, true) : null,
               'has_colors'          => filter_var($request->has_colors, FILTER_VALIDATE_BOOLEAN),
            'colors'              => $request->colors ? json_decode($request->colors, true) : null,
            'has_age'             => filter_var($request->has_age, FILTER_VALIDATE_BOOLEAN),
            'ages'                => $request->ages ? json_decode($request->ages, true) : null,
        ];
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'         => 'required|string|max:255',
            'price'        => 'required|numeric|min:0',
            'stock'        => 'required|integer|min:0',
            'reference'    => 'required|string|unique:products,reference',
            'slug'         => 'nullable|string|unique:products,slug',
            'category2_id' => 'nullable|different:category_id',
        ], [
            'reference.required'    => 'La référence du produit est obligatoire.',
            'reference.unique'      => 'Cette référence est déjà utilisée.',
            'category2_id.different' => 'La catégorie secondaire doit être différente de la catégorie principale.',
        ]);

        $data = $this->handleProductData($request);
        $data['images'] = $this->handleGalleryImages($request);

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('products', 'public');
        }
        if (!empty($data['colors'])) {
            foreach ($data['colors'] as $idx => $color) {
                if ($request->hasFile("color_image_{$idx}")) {
                    $data['colors'][$idx]['image'] = $request->file("color_image_{$idx}")->store('products/colors', 'public');
                }
            }
        }

        $product = Product::create($data);

        Cache::forget('product_' . $product->slug);
        Cache::forget('home_data');
        Cache::forget('products_featured');
        Cache::forget('products_newest');
        Cache::forget('products_promotions');
        Cache::forget('products_bestsellers');
        Cache::increment('products_list_version');

        return response()->json($product, 201);
    }

    public function update(Request $request, Product $product)
    {
        $request->validate([
            'name'         => 'sometimes|required|string|max:255',
            'price'        => 'sometimes|required|numeric|min:0',
            'stock'        => 'sometimes|required|integer|min:0',
            'reference'    => 'required|string|unique:products,reference,' . $product->id,
            'slug'         => 'nullable|string|unique:products,slug,' . $product->id,
            'category2_id' => 'nullable|different:category_id',
        ], [
            'reference.required'    => 'La référence du produit est obligatoire.',
            'reference.unique'      => 'Cette référence est déjà utilisée.',
            'category2_id.different' => 'La catégorie secondaire doit être différente de la catégorie principale.',
        ]);

        $data = $this->handleProductData($request);
        $data['images'] = $this->handleGalleryImages($request, $product);

        if ($request->hasFile('image')) {
            if ($product->image) {
                Storage::disk('public')->delete($product->image);
            }
            $data['image'] = $request->file('image')->store('products', 'public');
        }
        if (!empty($data['colors'])) {
            foreach ($data['colors'] as $idx => $color) {
                if ($request->hasFile("color_image_{$idx}")) {
                    $data['colors'][$idx]['image'] = $request->file("color_image_{$idx}")->store('products/colors', 'public');
                }
            }
        }

        $product->update($data);

        Cache::forget('product_' . $product->slug);
        Cache::forget('home_data');
        Cache::forget('products_featured');
        Cache::forget('products_newest');
        Cache::forget('products_promotions');
        Cache::forget('products_bestsellers');
        Cache::increment('products_list_version');

        return response()->json($product);
    }

    public function destroy(Product $product)
    {
        if ($product->image) {
            Storage::disk('public')->delete($product->image);
        }
        if (!empty($product->images)) {
            foreach ($product->images as $img) {
                Storage::disk('public')->delete($img);
            }
        }
        $product->delete();
        Cache::increment('products_list_version');
        return response()->json(['message' => 'Produit supprimé.']);
    }
    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids'   => 'required|array|min:1',
            'ids.*' => 'integer',
        ]);

        // Les IDs qui ne correspondent plus à rien (déjà supprimés entre
        // temps, liste obsolète côté client...) sont simplement ignorés
        // plutôt que de faire échouer toute la suppression groupée.
        $products = Product::whereIn('id', $request->ids)->get();

        foreach ($products as $product) {
            if ($product->image) {
                Storage::disk('public')->delete($product->image);
            }
            if (!empty($product->images)) {
                foreach ($product->images as $img) {
                    Storage::disk('public')->delete($img);
                }
            }
            $product->delete();
        }

        Cache::forget('home_data');
        Cache::forget('products_featured');
        Cache::forget('products_newest');
        Cache::forget('products_promotions');
        Cache::forget('products_bestsellers');
        Cache::increment('products_list_version');

        $skipped = count($request->ids) - count($products);

        return response()->json([
            'message' => count($products) . ' produit(s) supprimé(s) avec succès.'
                . ($skipped > 0 ? " ({$skipped} déjà supprimé(s) ou introuvable(s), ignoré(s))" : ''),
        ]);
    }

    public function bulkToggle(Request $request)
    {
        $request->validate([
            'ids'   => 'required|array|min:1',
            'ids.*' => 'integer|exists:products,id',
            'field' => 'required|in:is_featured,is_new,is_promo,is_unavailable',
            'value' => 'required|boolean',
        ]);

        Product::whereIn('id', $request->ids)
            ->update([$request->field => $request->boolean('value')]);

        Cache::forget('home_data');
        Cache::forget('products_featured');
        Cache::forget('products_newest');
        Cache::forget('products_promotions');
        Cache::forget('products_bestsellers');
        Cache::increment('products_list_version');

        return response()->json([
            'message' => count($request->ids) . ' produit(s) mis à jour avec succès.',
        ]);
    }
}
