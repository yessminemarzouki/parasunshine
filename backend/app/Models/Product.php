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
        'reference_price',
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
     'rating'          => 'float',
     'reviews_count'   => 'integer',
        'price'           => 'float',
     'reference_price' => 'float',
     'promo_price'     => 'float',
     'discount_percentage' => 'integer',
     'stock'           => 'integer',
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
    /**
     * Récupère la date de début effective de la promo
     * (soit celle du produit, soit celle de la campagne liée)
     */
    public function getEffectivePromoStartsAtAttribute()
    {
        if ($this->promo_starts_at) {
            return $this->promo_starts_at;
        }
        if ($this->promoCampaign) {
            return $this->promoCampaign->starts_at;
        }
        return null;
    }

    /**
     * Récupère la date de fin effective de la promo
     */
    public function getEffectivePromoEndsAtAttribute()
    {
        if ($this->promo_ends_at) {
            return $this->promo_ends_at;
        }
        if ($this->promoCampaign) {
            return $this->promoCampaign->ends_at;
        }
        return null;
    }

    /**
     * Détermine si la promotion est réellement active à l'instant T
     * (vérifie le flag is_promo OU la présence d'une campagne, + les dates)
     */
    public function getIsPromoActiveAttribute()
    {
        if (!$this->is_promo && !$this->promo_campaign_id) {
            return false;
        }

        // ✅ Si lié à une campagne, vérifier qu'elle est bien active (toggle)
        if ($this->promo_campaign_id && $this->promoCampaign) {
            if (!$this->promoCampaign->is_active) {
                return false;
            }
        }

        $now = now();
        $startsAt = $this->effective_promo_starts_at;
        $endsAt = $this->effective_promo_ends_at;

        $hasStarted = !$startsAt || $startsAt <= $now;
        $hasEnded = $endsAt && $endsAt < $now;

        return $hasStarted && !$hasEnded;
    }

    /**
     * Formate automatiquement les données de promo pour le frontend
     * (à appeler dans les contrôleurs avant de renvoyer la réponse)
     */
    public function formatPromoForFrontend()
    {
        // ⚠️ On ne modifie JAMAIS les champs en base (is_promo, promo_price, etc.)
        // On ajoute des attributs virtuels pour le frontend.

        // Injecte les dates effectives (produit ou campagne) dans les champs
        // renvoyés au frontend, sans toucher à la base.
        $this->promo_starts_at = $this->effective_promo_starts_at;
        $this->promo_ends_at   = $this->effective_promo_ends_at;

        // 🎯 Statut "calculé" (jamais sauvegardé en base)
        $this->setAttribute('is_promo_active', $this->is_promo_active);
        $this->setAttribute('is_promo_scheduled', $this->is_promo_scheduled);
        $this->setAttribute('is_promo_expired', $this->is_promo_expired);

        // Si la promo est active ET que le prix promo n'est pas calculé
        // (cas d'une campagne sans prix promo explicite), on le calcule
        // virtuellement pour le frontend sans toucher à la base.
        if ($this->is_promo_active && !$this->promo_price && $this->promoCampaign && $this->promoCampaign->discount_percentage) {
            $this->setAttribute('promo_price', round($this->price * (1 - $this->promoCampaign->discount_percentage / 100), 3));
            $this->setAttribute('discount_percentage', $this->promoCampaign->discount_percentage);
        }

        // Si la promo n'est PAS active, on n'efface PAS les champs en base,
        // mais on ajoute un "prix effectif" virtuel que le frontend public
        // peut utiliser : le prix promo si actif, sinon le prix normal.
        if (!$this->is_promo_active) {
            $this->setAttribute('effective_price', (float) $this->price);
            $this->setAttribute('effective_reference_price', null);
            $this->setAttribute('effective_discount_percentage', null);
        } else {
            $this->setAttribute('effective_price', (float) ($this->promo_price ?? $this->price));
            $this->setAttribute('effective_reference_price', (float) ($this->reference_price ?? $this->price));
            $this->setAttribute('effective_discount_percentage', (int) ($this->discount_percentage ?? 0));
        }

        return $this;

    }
    /**
     * La promo est-elle programmée mais pas encore commencée ? (date future)
     */
    public function getIsPromoScheduledAttribute(): bool
    {
        if (!$this->is_promo && !$this->promo_campaign_id) {
            return false;
        }
        $startsAt = $this->effective_promo_starts_at;
        $endsAt   = $this->effective_promo_ends_at;
        if (!$startsAt) {
            return false;
        }
        if ($startsAt > now()) {
            return true;
        }
        return false;
    }

    /**
     * La promo est-elle expirée ? (date de fin passée)
     */
    public function getIsPromoExpiredAttribute(): bool
    {
        if (!$this->is_promo && !$this->promo_campaign_id) {
            return false;
        }
        $endsAt = $this->effective_promo_ends_at;
        if (!$endsAt) {
            return false;
        }
        return $endsAt < now();
    }
}
