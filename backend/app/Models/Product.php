<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'price',
        'reference',           // ← AJOUTE ÇA
        'short_description',   // ← AJOUTE ÇA
        'benefits',        // ← Nouveau
        'usage_tips',      // ← Nouveau
             'promo_price',
        'discount_percentage',
        'stock',
        'image',
        'images',
           'category_id',
        'category2_id',
        'display_category1',
        'display_category2',
        'brand_id',
        'is_featured',
        'is_promo',

        'rating',          // ← Nouveau
        'reviews_count',   // ← Nouveau
        'is_new',          // ← Vérifie qu'il est là
        'is_bestseller',   // ← Ajoute

        'promo_ends_at', // ← ajoute
        'is_unavailable',
             'has_sizes',
        'sizes',
        'has_colors',
        'colors',
        'has_age',
        'ages',
             'promo_starts_at',
        'promo_campaign_id',
        'quiz_tags',
    ];

    protected $casts = [
     'images'          => 'array',
     'is_featured'     => 'boolean',
     'is_promo'        => 'boolean',
     'is_new'          => 'boolean',
     'is_bestseller'   => 'boolean',
     'promo_ends_at'   => 'datetime:Y-m-d H:i:s',  // ← change
     'promo_starts_at' => 'datetime:Y-m-d H:i:s',  // ← change
        'is_unavailable'  => 'boolean',
     'display_category1' => 'boolean',
     'display_category2' => 'boolean',
     'has_sizes'       => 'boolean',
     'sizes'           => 'array',
      'has_colors'      => 'boolean',
    'colors'          => 'array',
     'has_age'         => 'boolean',
     'ages'            => 'array',
     'quiz_tags'       => 'array',
];

    // Auto-generate slug
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($product) {
            if (empty($product->slug)) {
                $product->slug = Str::slug($product->name);
            }
        });
    }

    // Relations
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function category2()
    {
        return $this->belongsTo(Category::class, 'category2_id');
    }
    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }

    public function promoCampaign()
    {
        return $this->belongsTo(PromoCampaign::class);
    }

    private function ageLabel(array $age): string
    {
        // Le label est désormais stocké directement (gère valeur unique et plage).
        return $age['label'] ?? trim(($age['value'] ?? '') . ' ' . ($age['unit'] ?? ''));
    }

    /**
     * Renvoie le stock de la variante précise sélectionnée, ou null si le
     * produit n'a pas de variante correspondante (→ utiliser le stock global).
     */
    public function getVariantStock(?string $size, ?string $color, ?string $age): ?int
    {
        if ($size && $this->has_sizes && is_array($this->sizes)) {
            foreach ($this->sizes as $s) {
                if (($s['label'] ?? null) === $size) {
                    return (int) ($s['stock'] ?? 0);
                }
            }
            return 0;
        }

        if ($this->has_age && $this->has_colors && $age && $color && is_array($this->ages)) {
            foreach ($this->ages as $a) {
                if ($this->ageLabel($a) === $age) {
                    foreach (($a['colors'] ?? []) as $c) {
                        if (($c['name'] ?? null) === $color) {
                            return (int) ($c['stock'] ?? 0);
                        }
                    }
                    return 0;
                }
            }
            return 0;
        }

        if ($this->has_age && $age && is_array($this->ages)) {
            foreach ($this->ages as $a) {
                if ($this->ageLabel($a) === $age) {
                    return (int) ($a['stock'] ?? 0);
                }
            }
            return 0;
        }

        if ($this->has_colors && $color && is_array($this->colors)) {
            foreach ($this->colors as $c) {
                if (($c['name'] ?? null) === $color) {
                    return (int) ($c['stock'] ?? 0);
                }
            }
            return 0;
        }

        return null;
    }

    /**
     * Ajuste (incrémente/décrémente) le stock de la variante précise.
     * $delta négatif = décrémente, positif = restaure.
     * Renvoie true si une variante correspondante a été trouvée et modifiée.
     */
    public function adjustVariantStock(?string $size, ?string $color, ?string $age, int $delta): bool
    {
        if ($size && $this->has_sizes && is_array($this->sizes)) {
            $sizes = $this->sizes;
            $found = false;
            foreach ($sizes as &$s) {
                if (($s['label'] ?? null) === $size) {
                    $s['stock'] = max(0, (int) ($s['stock'] ?? 0) + $delta);
                    $found = true;
                    break;
                }
            }
            unset($s);
            if ($found) {
                $this->sizes = $sizes;
                $this->save();
            }
            return $found;
        }

        if ($this->has_age && $this->has_colors && $age && $color && is_array($this->ages)) {
            $ages = $this->ages;
            $found = false;
            foreach ($ages as &$a) {
                if ($this->ageLabel($a) === $age) {
                    foreach ($a['colors'] ?? [] as &$c) {
                        if (($c['name'] ?? null) === $color) {
                            $c['stock'] = max(0, (int) ($c['stock'] ?? 0) + $delta);
                            $found = true;
                            break;
                        }
                    }
                    unset($c);
                    break;
                }
            }
            unset($a);
            if ($found) {
                $this->ages = $ages;
                $this->save();
            }
            return $found;
        }

        if ($this->has_age && $age && is_array($this->ages)) {
            $ages = $this->ages;
            $found = false;
            foreach ($ages as &$a) {
                if ($this->ageLabel($a) === $age) {
                    $a['stock'] = max(0, (int) ($a['stock'] ?? 0) + $delta);
                    $found = true;
                    break;
                }
            }
            unset($a);
            if ($found) {
                $this->ages = $ages;
                $this->save();
            }
            return $found;
        }

        if ($this->has_colors && $color && is_array($this->colors)) {
            $colors = $this->colors;
            $found = false;
            foreach ($colors as &$c) {
                if (($c['name'] ?? null) === $color) {
                    $c['stock'] = max(0, (int) ($c['stock'] ?? 0) + $delta);
                    $found = true;
                    break;
                }
            }
            unset($c);
            if ($found) {
                $this->colors = $colors;
                $this->save();
            }
            return $found;
        }

        return false;
    }
}
