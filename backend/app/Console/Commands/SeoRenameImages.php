<?php

namespace App\Console\Commands;

use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
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

        // Récupère tous les IDs de produits à traiter
        $productIds = Product::query()
            ->whereNotNull('image')
            ->orWhereNotNull('images')
            ->pluck('id');

        $this->info("Produits à traiter : " . $productIds->count());

        $bar = $this->output->createProgressBar($productIds->count());
        $bar->start();

        foreach ($productIds as $productId) {
            $product = Product::find($productId);
            if (!$product) {
                $bar->advance();
                continue;
            }

            // ── Image principale ──
            if (!$onlyGallery && $product->image && !$this->isSeoFriendly($product->image)) {
                $newPath = $this->processMainImage($product, $dryRun);
                if ($newPath === true) {
                    $processed++;
                } elseif ($newPath === false) {
                    $errors++;
                } else {
                    $skipped++;
                }
            } else {
                $skipped++;
            }

            // ── Images de galerie ──
            if (!$onlyMain && !empty($product->images)) {
                $changed = $this->processGalleryImages($product, $dryRun);
                $processed += $changed;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

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
     */
    private function isSeoFriendly(string $path): bool
    {
        $filename = pathinfo($path, PATHINFO_FILENAME);
        return strlen($filename) > 15 && substr_count($filename, '-') >= 2;
    }

    /**
     * Traite l'image principale d'un produit.
     * Retourne true si succès, false si erreur, null si rien à faire.
     */
    private function processMainImage(Product $product, bool $dryRun): ?bool
    {
        $oldPath = $product->image;
        $newPath = $this->buildNewPath($oldPath, $product->name, $product->reference);

        if ($newPath === $oldPath) {
            return null;
        }

        if ($dryRun) {
            $this->line("✓ Produit #{$product->id} : {$oldPath} → {$newPath}");
            return true;
        }

        try {
            DB::beginTransaction();

            // 1. Renomme le fichier sur le disque
            $renamed = $this->renameFile($oldPath, $newPath);
            if (!$renamed) {
                DB::rollBack();
                $this->warn("✗ Produit #{$product->id} : impossible de renommer {$oldPath}");
                return false;
            }

            // 2. Met à jour la BDD
            $product->update(['image' => $newPath]);

            DB::commit();
            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            $this->warn("✗ Produit #{$product->id} : " . $e->getMessage());
            return false;
        }
    }

    /**
     * Traite les images de galerie d'un produit.
     * Retourne le nombre d'images traitées.
     */
    private function processGalleryImages(Product $product, bool $dryRun): int
    {
        $oldImages = $product->images ?? [];
        $newImages = $oldImages;
        $changed = 0;

        foreach ($oldImages as $i => $img) {
            if (!$img || $this->isSeoFriendly($img)) {
                continue;
            }

            $newPath = $this->buildNewPath($img, $product->name, $product->reference, 'galerie-' . ($i + 1));
            if ($newPath === $img) {
                continue;
            }

            if ($dryRun) {
                $this->line("✓ Produit #{$product->id} (galerie) : {$img} → {$newPath}");
                $changed++;
                continue;
            }

            try {
                DB::beginTransaction();

                $renamed = $this->renameFile($img, $newPath);
                if (!$renamed) {
                    DB::rollBack();
                    $this->warn("✗ Produit #{$product->id} (galerie) : impossible de renommer {$img}");
                    continue;
                }

                $newImages[$i] = $newPath;
                $product->update(['images' => array_values($newImages)]);
                DB::commit();
                $changed++;
            } catch (\Exception $e) {
                DB::rollBack();
                $this->warn("✗ Produit #{$product->id} (galerie) : " . $e->getMessage());
            }
        }

        return $changed;
    }

    /**
     * Construit le nouveau chemin SEO-friendly.
     */
    private function buildNewPath(string $oldPath, string $name, ?string $reference, string $suffix = ''): string
    {
        $folder = pathinfo($oldPath, PATHINFO_DIRNAME);
        $ext = pathinfo($oldPath, PATHINFO_EXTENSION);

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
        $parts[] = Str::lower(Str::random(5));

        $newFilename = implode('-', $parts) . '.' . $ext;

        return ($folder !== '.' ? $folder . '/' : '') . $newFilename;
    }

    /**
     * Renomme un fichier sur le disque (rename natif + fallback copy/delete).
     */
    private function renameFile(string $oldPath, string $newPath): bool
    {
        $disk = Storage::disk('public');

        if (!$disk->exists($oldPath)) {
            return false;
        }

        // Évite les collisions
        $counter = 1;
        while ($disk->exists($newPath)) {
            $ext = pathinfo($newPath, PATHINFO_EXTENSION);
            $base = pathinfo($newPath, PATHINFO_FILENAME);
            $newPath = pathinfo($newPath, PATHINFO_DIRNAME) . '/' . $base . '-' . $counter . '.' . $ext;
            $counter++;
        }

        $absoluteOld = $disk->path($oldPath);
        $absoluteNew = $disk->path($newPath);

        // Tentative 1 : rename() natif PHP
        if (@rename($absoluteOld, $absoluteNew)) {
            @chmod($absoluteNew, 0644);
            return true;
        }

        // Tentative 2 : copy + unlink
        if (@copy($absoluteOld, $absoluteNew)) {
            @unlink($absoluteOld);
            @chmod($absoluteNew, 0644);
            return true;
        }

        // Tentative 3 : Storage
        try {
            if ($disk->copy($oldPath, $newPath)) {
                $disk->delete($oldPath);
                return true;
            }
        } catch (\Exception $e) {
            // silently fail
        }

        return false;
    }
}
