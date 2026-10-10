<?php

namespace App\Console\Commands;

use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SeoRenameImages extends Command
{
    protected $signature = 'images:seo-rename
                            {--dry-run : Afficher ce qui serait fait sans le faire}
                            {--only-main : Ne traiter que les images principales}
                            {--only-gallery : Ne traiter que les images de galerie}';

    protected $description = 'Renomme les images produits avec des noms SEO-friendly';

    public function handle(): int
    {
        $dryRun = $this->option('dry-run');
        $onlyMain = $this->option('only-main');
        $onlyGallery = $this->option('only-gallery');

        $processed = 0;
        $skipped = 0;
        $errors = 0;

        Product::query()
            ->select('id', 'name', 'reference', 'image', 'images')
            ->chunkById(100, function ($products) use ($dryRun, $onlyMain, $onlyGallery, &$processed, &$skipped, &$errors) {
                foreach ($products as $product) {
                    // ── Image principale ──
                    if (!$onlyGallery && $product->image && !$this->isSeoFriendly($product->image)) {
                        $newPath = $this->renameImage(
                            $product->image,
                            $product->name,
                            $product->reference,
                            ''
                        );
                        if ($newPath) {
                            if (!$dryRun) {
                                $product->update(['image' => $newPath]);
                            }
                            $this->line("✓ Produit #{$product->id} : {$product->image} → {$newPath}");
                            $processed++;
                        } else {
                            $this->warn("✗ Produit #{$product->id} : impossible de renommer {$product->image}");
                            $errors++;
                        }
                    } else {
                        $skipped++;
                    }

                    // ── Images de galerie ──
                    if (!$onlyMain && !empty($product->images)) {
                        $newImages = [];
                        $changed = false;
                        foreach ($product->images as $i => $img) {
                            if ($img && !$this->isSeoFriendly($img)) {
                                $newPath = $this->renameImage(
                                    $img,
                                    $product->name,
                                    $product->reference,
                                    'galerie-' . ($i + 1)
                                );
                                if ($newPath) {
                                    $newImages[$i] = $newPath;
                                    $changed = true;
                                    $this->line("✓ Produit #{$product->id} : {$img} → {$newPath}");
                                    $processed++;
                                } else {
                                    $newImages[$i] = $img;
                                    $errors++;
                                }
                            } else {
                                $newImages[$i] = $img;
                                $skipped++;
                            }
                        }
                        if ($changed && !$dryRun) {
                            $product->update(['images' => array_values($newImages)]);
                        }
                    }
                }
            });

        $this->newLine();
        $this->info("✅ Terminé.");
        $this->line("   Traité : {$processed}");
        $this->line("   Ignoré : {$skipped}");
        $this->line("   Erreur : {$errors}");

        if ($dryRun) {
            $this->warn("Mode dry-run : aucune modification en base n'a été faite.");
            $this->line("Relancez sans --dry-run pour appliquer.");
        }

        return self::SUCCESS;
    }

    /**
     * Vérifie si le chemin d'image est déjà SEO-friendly.
     * (contient le slug du nom ou de la référence)
     */
    private function isSeoFriendly(string $path): bool
    {
        $filename = pathinfo($path, PATHINFO_FILENAME);
        // Si le nom contient au moins un tiret ET fait plus de 15 caractères
        // → probablement déjà SEO-friendly
        return strlen($filename) > 15 && substr_count($filename, '-') >= 2;
    }

    /**
     * Renomme une image sur le disque + retourne le nouveau chemin.
     * Retourne null en cas d'erreur.
     */
    private function renameImage(string $oldPath, string $name, ?string $reference, string $suffix = ''): ?string
    {
        try {
            $disk = Storage::disk('public');

            if (!$disk->exists($oldPath)) {
                return null;
            }

            $ext = pathinfo($oldPath, PATHINFO_EXTENSION);
            $folder = pathinfo($oldPath, PATHINFO_DIRNAME);

            // Construit le nouveau nom
            $slug = Str::slug($name) ?: 'image';
            $slug = substr($slug, 0, 80);

            $parts = [$slug];
            if ($reference) {
                $refSlug = Str::slug($reference);
                if ($refSlug) {
                    $parts[] = $refSlug;
                }
            }
            if ($suffix) {
                $parts[] = $suffix;
            }
            // Suffixe unique pour éviter les collisions
            $parts[] = Str::lower(Str::random(5));

            $newFilename = implode('-', $parts) . '.' . $ext;
            $newPath = ($folder !== '.' ? $folder . '/' : '') . $newFilename;

            // Si le nouveau chemin est identique à l'ancien, ne rien faire
            if ($newPath === $oldPath) {
                return null;
            }

            // Évite d'écraser un fichier existant
            $counter = 1;
            while ($disk->exists($newPath)) {
                $newPath = ($folder !== '.' ? $folder . '/' : '')
                    . implode('-', $parts) . '-' . $counter . '.' . $ext;
                $counter++;
            }

            // Copie + suppression (plus sûr que rename cross-filesystem)
            $disk->copy($oldPath, $newPath);
            $disk->delete($oldPath);

            return $newPath;
        } catch (\Exception $e) {
            return null;
        }
    }
}
