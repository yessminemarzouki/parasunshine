<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Brand;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;
use Intervention\Image\Laravel\Facades\Image;

class AdminCategoryController extends Controller
{
    // ---- CATÉGORIES ----
    public function categories()
    {
        return response()->json(
            Category::withCount('products')
                ->with(['children.children', 'parent', 'brands', 'bundle:id,name,slug,image'])
                ->orderBy('sort')
                ->get()
        );
    }

    /**
     * Liste légère des coffrets, pour le sélecteur "Coffret à afficher dans
     * le mega-menu" du formulaire catégorie.
     */
    public function bundlesForMenu()
    {
        return response()->json(
            \App\Models\Bundle::select('id', 'name', 'slug', 'image')
                ->orderBy('name')
                ->get()
        );
    }

    public function storeCategory(Request $request)
    {
        $data = $request->validate([
            'name'              => 'required|string|max:255',
            'parent_id'         => 'nullable|exists:categories,id',
            'sort'              => 'nullable|integer',
            'show_in_menu'      => 'boolean',
            'show_in_megamenu'  => 'boolean',
            'icon'              => 'nullable|string|max:50',
            'image'             => 'nullable|image|max:4096',
            'promo_title'       => 'nullable|string|max:150',
            'promo_text'        => 'nullable|string|max:255',
            'promo_cta'         => 'nullable|string|max:80',
            'bundle_id'         => 'nullable|exists:bundles,id',
        ]);
        $data['slug'] = Str::slug($data['name']);

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('categories', 'public');
        }

        $category = Category::create($data);
        Cache::forget('all_categories_tree');
        return response()->json($category->load('bundle:id,name,slug,image'), 201);
    }

    public function updateCategory(Request $request, Category $category)
    {
        $data = $request->validate([
            'name'              => 'sometimes|string|max:255',
            'parent_id'         => 'nullable|exists:categories,id',
            'sort'              => 'nullable|integer',
            'show_in_menu'      => 'boolean',
            'show_in_megamenu'  => 'boolean',
            'icon'              => 'nullable|string|max:50',
            'image'             => 'nullable|image|max:4096',
            'promo_title'       => 'nullable|string|max:150',
            'promo_text'        => 'nullable|string|max:255',
            'promo_cta'         => 'nullable|string|max:80',
            'bundle_id'         => 'nullable|exists:bundles,id',
        ]);
        if (isset($data['name'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        if ($request->hasFile('image')) {
            if ($category->image) {
                Storage::disk('public')->delete($category->image);
            }
            $data['image'] = $request->file('image')->store('categories', 'public');
        }

        $category->update($data);
        Cache::forget('all_categories_tree');
        return response()->json($category->fresh(['brands', 'bundle:id,name,slug,image']));
    }

    /**
     * Réordonnancement par glisser-déposer (niveau par niveau)
     */
    public function reorderCategories(Request $request)
    {
        $request->validate(['order' => 'required|array']);
        foreach ($request->order as $index => $id) {
            Category::where('id', $id)->update(['sort' => $index]);
        }
        Cache::forget('all_categories_tree');
        return response()->json(['message' => 'Ordre mis à jour.']);
    }

    /**
     * Associer les marques populaires à une catégorie (remplace la liste existante)
     */
    public function syncCategoryBrands(Request $request, Category $category)
    {
        $request->validate([
            'brand_ids'   => 'required|array',
            'brand_ids.*' => 'integer|exists:brands,id',
        ]);

        $syncData = [];
        foreach ($request->brand_ids as $index => $brandId) {
            $syncData[$brandId] = ['order' => $index];
        }
        $category->brands()->sync($syncData);
        Cache::forget('all_categories_tree');

        return response()->json([
            'message' => 'Marques mises à jour.',
            'brands'  => $category->fresh()->brands,
        ]);
    }

    public function destroyCategory(Category $category)
    {
        if ($category->image) {
            Storage::disk('public')->delete($category->image);
        }
        if ($category->promo_image) {
            Storage::disk('public')->delete($category->promo_image);
        }
        $category->delete();
        Cache::forget('all_categories_tree');
        return response()->json(['message' => 'Catégorie supprimée.']);
    }

    // ---- MARQUES ----
    public function brands()
    {
        return response()->json(
            Brand::withCount('products')
                ->with('parent:id,name,slug,logo')
                ->orderBy('name')
                ->get()
        );
    }

    public function storeBrand(Request $request)
    {
        $data = $request->validate([
            'name'      => 'required|string|max:255',
            'logo'      => 'nullable|image|max:2048',
            'parent_id' => 'nullable|exists:brands,id',
        ]);

        // Empêche plus d'un niveau d'imbrication (pas de sous-sous-marque)
        if (!empty($data['parent_id'])) {
            $parent = Brand::find($data['parent_id']);
            if ($parent && $parent->parent_id) {
                return response()->json([
                    'message' => 'Impossible de créer une sous-marque d\'une sous-marque.',
                ], 422);
            }
            // Une sous-marque n'a pas sa propre image — elle affiche toujours
            // celle de sa marque parente.
            $data['logo'] = null;
        } elseif ($request->hasFile('logo')) {
            $data['logo'] = $request->file('logo')->store('brands', 'public');
        }

        $data['slug'] = $this->generateUniqueBrandSlug($data['name']);

        return response()->json(
            Brand::create($data)->load('parent:id,name,slug,logo'),
            201,
        );
    }

    private function generateUniqueBrandSlug(string $name): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $i = 1;
        while (Brand::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$i}";
            $i++;
        }
        return $slug;
    }
    private function generateUniqueBrandSlugExcluding(string $name, int $excludeId): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $i = 1;
        while (Brand::where('slug', $slug)->where('id', '!=', $excludeId)->exists()) {
            $slug = "{$base}-{$i}";
            $i++;
        }
        return $slug;
    }

    public function updateBrand(Request $request, Brand $brand)
    {
        $data = $request->validate([
            'name'        => 'sometimes|string|max:255',
            'logo'        => 'nullable|image|max:2048',
            'remove_logo' => 'nullable|boolean',
            'parent_id'   => 'nullable|exists:brands,id',
        ]);

        if (isset($data['name']) && $data['name'] !== $brand->name) {
            $data['slug'] = $this->generateUniqueBrandSlugExcluding($data['name'], $brand->id);
        }

        if (array_key_exists('parent_id', $data) && $data['parent_id']) {
            if ((int) $data['parent_id'] === $brand->id) {
                return response()->json([
                    'message' => 'Une marque ne peut pas être sa propre sous-marque.',
                ], 422);
            }
            $parent = Brand::find($data['parent_id']);
            if ($parent && $parent->parent_id) {
                return response()->json([
                    'message' => 'Impossible de créer une sous-marque d\'une sous-marque.',
                ], 422);
            }
            // Devient une sous-marque → perd son image propre
            if ($brand->logo) {
                Storage::disk('public')->delete($brand->logo);
            }
            $data['logo'] = null;
        } elseif ($request->hasFile('logo')) {
            if ($brand->logo) {
                Storage::disk('public')->delete($brand->logo);
            }
            $data['logo'] = $request->file('logo')->store('brands', 'public');
        } elseif ($request->boolean('remove_logo')) {
            if ($brand->logo) {
                Storage::disk('public')->delete($brand->logo);
            }
            $data['logo'] = null;
        }

        unset($data['remove_logo']);
        $brand->update($data);
        return response()->json($brand->fresh()->load('parent:id,name,slug,logo'));
    }
    // ── Import de marques en masse via Excel ──
    // ── Import de marques en masse via Excel ──
    public function importBrandsExcel(Request $request)
    {
        set_time_limit(0);
        ini_set('memory_limit', '1024M');

        $request->validate([
            'file' => 'required|file|mimes:csv,txt,xlsx|max:51200',
        ]);

        $file = $request->file('file');
        $extension = $file->getClientOriginalExtension();

        if ($extension === 'xlsx') {
            $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($file->getPathname());
            $rows = $spreadsheet->getActiveSheet()->toArray();
            $header = array_map('trim', $rows[0]);
            $dataRows = array_slice($rows, 1);
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
        }

        // Normalise toutes les lignes une seule fois, en gardant leur
        // numéro de ligne pour les messages d'erreur.
        $parsedRows = [];
        $row = 1;
        foreach ($dataRows as $line) {
            $row++;
            if (empty(array_filter($line, fn ($v) => $v !== null && trim((string) $v) !== ''))) {
                continue;
            }
            $line = array_pad($line, count($header), null);
            $data = array_combine($header, $line);
            $data = array_map(fn ($v) => is_string($v) ? trim($v) : $v, $data);
            $parsedRows[] = ['row' => $row, 'data' => $data];
        }

        $imported = 0;
        $errors = [];

        // ── Passe 1 : créer TOUTES les marques, sans lien parent pour
        // l'instant. Élimine toute dépendance à l'ordre des lignes dans
        // le fichier — qu'une sous-marque apparaisse avant ou après sa
        // marque parente dans l'Excel ne change plus rien.
        foreach ($parsedRows as $entry) {
            $data = $entry['data'];
            $row = $entry['row'];

            if (empty($data['name'])) {
                $errors[] = "Ligne $row : ignorée — le nom est obligatoire.";
                continue;
            }

            if (Brand::where('name', $data['name'])->exists()) {
                $errors[] = "Ligne $row : marque '{$data['name']}' existe déjà — ignorée.";
                continue;
            }

            try {
                Brand::create([
                    'name'      => $data['name'],
                    'slug'      => $this->generateUniqueBrandSlug($data['name']),
                    'parent_id' => null,
                ]);
                $imported++;
            } catch (\Exception $e) {
                $errors[] = "Ligne $row : erreur — " . $e->getMessage();
            }
        }

        // ── Passe 2 : maintenant que tous les noms existent en base, on
        // relie chaque sous-marque à sa marque parente.
        foreach ($parsedRows as $entry) {
            $data = $entry['data'];
            $row = $entry['row'];

            if (empty($data['name']) || empty($data['parent_brand'])) {
                continue;
            }

            $brand = Brand::where('name', $data['name'])->first();
            if (!$brand) {
                continue; // non créée en passe 1 (doublon ou erreur) — déjà signalé
            }

            $parent = Brand::where('name', $data['parent_brand'])
                ->whereNull('parent_id')
                ->first();

            if (!$parent) {
                $errors[] = "Ligne $row : marque parente '{$data['parent_brand']}' introuvable — '{$data['name']}' reste une marque indépendante.";
                continue;
            }

            if ($parent->id === $brand->id) {
                $errors[] = "Ligne $row : '{$data['name']}' ne peut pas être sa propre marque parente — ignoré.";
                continue;
            }

            $brand->update(['parent_id' => $parent->id]);
        }

        Cache::forget('all_brands');

        return response()->json([
            'message'  => "$imported marque(s) importée(s) avec succès.",
            'imported' => $imported,
            'errors'   => $errors,
        ]);
    }

    // ── Import des logos en masse par correspondance de nom de fichier ──

    private function findBrandSubfolder(string $root, string $name): ?string
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
     * Si le ZIP ne contient qu'un seul sous-dossier (peu importe son nom),
     * on le détecte automatiquement — couvre tous les cas futurs sans
     * dépendre d'un nom de dossier précis.
     */
    private function autoDetectSingleSubfolder(string $root): ?string
    {
        $entries = array_values(array_diff(scandir($root), ['.', '..']));
        $dirs = array_filter($entries, fn ($e) => is_dir($root . DIRECTORY_SEPARATOR . $e));
        if (count($dirs) === 1) {
            return $root . DIRECTORY_SEPARATOR . reset($dirs);
        }
        return null;
    }
    private function mapBrandLogoFiles(?string $folder): array
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
            $map[Str::slug($base)] = $fullPath;
        }
        return $map;
    }

    private function deleteTmpDirectory(string $dir): void
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
            \Illuminate\Support\Facades\Log::warning("Nettoyage incomplet : {$dir} — {$e->getMessage()}");
        }
        if (is_dir($dir)) {
            @exec('rm -rf ' . escapeshellarg($dir));
        }
    }

    public function importBrandLogosZip(Request $request)
    {
        set_time_limit(0);
        ini_set('memory_limit', '2048M');

        $request->validate([
            'zip' => 'required|file|mimes:zip|max:1048576',
        ]);

        $zipFile = $request->file('zip');
        $extractPath = storage_path('app/tmp_brand_logos_' . uniqid() . '_extracted');

        $zip = new \ZipArchive();
        if ($zip->open($zipFile->getPathname()) !== true) {
            return response()->json(['message' => "Impossible d'ouvrir le fichier ZIP."], 422);
        }
        $zip->extractTo($extractPath);
        $zip->close();

        // Accepte plusieurs noms de dossier connus, sinon détecte
        // automatiquement l'unique sous-dossier présent dans le ZIP, quel
        // que soit son nom — robuste peu importe comment l'admin nomme
        // son dossier à l'avenir.
        $logoFolder = $this->findBrandSubfolder($extractPath, 'LOGOS_MARQUES')
            ?? $this->findBrandSubfolder($extractPath, 'Logos')
            ?? $this->findBrandSubfolder($extractPath, 'logos')
            ?? $this->autoDetectSingleSubfolder($extractPath)
            ?? $extractPath;
        $logoFiles = $this->mapBrandLogoFiles($logoFolder);

        $matched = 0;
        $skipped = [];

        Brand::select('id', 'name', 'slug', 'logo', 'parent_id')
            ->whereNull('parent_id') // les sous-marques n'ont pas de logo propre
            ->chunkById(100, function ($brands) use ($logoFiles, &$matched, &$skipped) {
                foreach ($brands as $brand) {
                    $file = $logoFiles[$brand->slug] ?? null;

                    if ($file) {
                        try {
                            $optimized = Image::read(file_get_contents($file))
                                ->scaleDown(width: 400, height: 400)
                                ->toWebp(quality: 85);
                            $filename = uniqid() . '.webp';
                            $fullPath = 'brands/' . $filename;
                            Storage::disk('public')->put($fullPath, (string) $optimized);

                            if ($brand->logo) {
                                Storage::disk('public')->delete($brand->logo);
                            }
                            $brand->update(['logo' => $fullPath]);
                            $matched++;
                        } catch (\Exception $e) {
                            $skipped[] = $brand->name;
                        }
                    } else {
                        $skipped[] = $brand->name;
                    }
                }
                gc_collect_cycles();
            });

        $this->deleteTmpDirectory($extractPath);

        Cache::forget('all_brands');

        return response()->json([
            'message'       => "{$matched} logo(s) assigné(s) avec succès.",
            'matched'       => $matched,
            'skipped_count' => count($skipped),
            'skipped_names' => array_slice($skipped, 0, 50),
        ]);
    }
    /**
     * Export Excel des marques : name + parent_brand
     * → même format que l'import Excel, pour permettre un aller-retour
     */
    public function exportBrandsExcel()
    {
        set_time_limit(0);
        ini_set('memory_limit', '1024M');

        $brands = Brand::with('parent:id,name')
            ->orderBy('name')
            ->get();

        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Marques');

        // En-têtes
        $headers = ['name', 'parent_brand'];
        $col = 1;
        foreach ($headers as $h) {
            $coord = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($col) . '1';
            $sheet->setCellValue($coord, $h);
            $sheet->getStyle($coord)->getFont()->setBold(true);
            $col++;
        }

        // Lignes
        $row = 2;
        foreach ($brands as $b) {
            $sheet->setCellValueExplicit(
                'A' . $row,
                (string) $b->name,
                \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_STRING
            );
            $sheet->setCellValueExplicit(
                'B' . $row,
                (string) ($b->parent?->name ?? ''),
                \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_STRING
            );
            $row++;
        }

        // Largeur auto
        $sheet->getColumnDimension('A')->setAutoSize(true);
        $sheet->getColumnDimension('B')->setAutoSize(true);

        $filename = 'marques_export_' . date('Y-m-d_His') . '.xlsx';
        $tempPath = storage_path('app/' . $filename);

        $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
        $writer->save($tempPath);

        return response()->download($tempPath)->deleteFileAfterSend(true);
    }

    /**
     * Export ZIP des logos de marques
     * → nommés comme les marques (slug.webp), prêts à être ré-importés
     */
    public function exportBrandLogosZip()
    {
        set_time_limit(0);
        ini_set('memory_limit', '1024M');

        $brands = Brand::whereNull('parent_id')
            ->whereNotNull('logo')
            ->select('id', 'name', 'slug', 'logo')
            ->get();

        $zipFilename = 'logos_marques_' . date('Y-m-d_His') . '.zip';
        $zipPath = storage_path('app/' . $zipFilename);

        $zip = new \ZipArchive();
        if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
            return response()->json(['message' => 'Impossible de créer le ZIP.'], 500);
        }

        $added = 0;
        foreach ($brands as $brand) {
            $fullPath = \Illuminate\Support\Facades\Storage::disk('public')->path($brand->logo);
            if (file_exists($fullPath)) {
                // Nom du fichier = slug de la marque + extension d'origine
                $ext = pathinfo($brand->logo, PATHINFO_EXTENSION);
                $zip->addFile($fullPath, $brand->slug . '.' . $ext);
                $added++;
            }
        }

        $zip->close();

        return response()->download($zipPath)->deleteFileAfterSend(true);
    }
    public function destroyBrand(Brand $brand)
    {
        if ($brand->logo) {
            Storage::disk('public')->delete($brand->logo);
        }
        $brand->delete();
        return response()->json(['message' => 'Marque supprimée.']);
    }
}
