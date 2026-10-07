<?php

namespace App\Services;

use Intervention\Image\Laravel\Facades\Image;
use Illuminate\Support\Facades\Storage;

class ImageService
{
    /**
     * Optimise et sauvegarde une image
     * 
     * @param mixed $image Fichier uploadé
     * @param string $path Chemin de destination
     * @return string Chemin relatif de l'image sauvegardée
     */
    public function optimizeAndStore($image, $path = 'products')
    {
        // Lire et optimiser l'image
        $optimized = Image::read($image)
            ->scaleDown(width: 800, height: 800) // Réduit à max 800x800px
            ->toWebp(quality: 85); // Convertit en WebP avec qualité 85%
        
        // Générer un nom de fichier unique
        $filename = uniqid() . '.webp';
        $fullPath = $path . '/' . $filename;
        
        // Sauvegarder dans storage/app/public
        Storage::disk('public')->put($fullPath, (string) $optimized);
        
        return $fullPath;
    }

    /**
     * Optimise plusieurs images (galerie)
     */
    public function optimizeMultiple($images, $path = 'products')
    {
        $paths = [];
        
        foreach ($images as $image) {
            $paths[] = $this->optimizeAndStore($image, $path);
        }
        
        return $paths;
    }
}