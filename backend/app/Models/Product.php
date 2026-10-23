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
        'reference',
        'short_description',
        'benefits',
        'usage_tips',
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
        'rating',
        'reviews_count',
        'is_new',
        'is_bestseller',
        'promo_ends_at',
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
        'promo_ends_at'   => 'datetime:Y-m-d H:i:s',
        'promo_starts_at' => 'datetime:Y-m-d H:i:s',
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

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($product) {
            if (empty($product->slug)) {
                $product->slug = Str::slug($product->name);
            }
        });
    }

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
        return $age['label'] ?? trim(($age['value'] ?? '') . ' ' . ($age['unit'] ?? ''));
    }

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
     * ✅ CORRECTION DÉFINITIVE : Utilise l'heure du serveur au fuseau Africa/Tunis
     * et compare avec les dates de la base qui sont également en Africa/Tunis.
     */
    public function getIsPromoActiveAttribute()
    {
        if (!$this->is_promo && !$this->promo_campaign_id) {
            return false;
        }

        if ($this->promo_campaign_id && $this->promoCampaign) {
            if (!$this->promoCampaign->is_active) {
                return false;
            }
        }

        // 🎯 On force le fuseau de Tunis pour être sûr à 100%
        $now = \Carbon\Carbon::now('Africa/Tunis');

        $startsAt = $this->effective_promo_starts_at;
        $endsAt   = $this->effective_promo_ends_at;

        // Si date de début existe et qu'elle est dans le futur → pas encore active
        if ($startsAt) {
            $start = \Carbon\Carbon::parse($startsAt, 'Africa/Tunis');
            if ($now->lt($start)) {
                return false;
            }
        }

        // Si date de fin existe et qu'elle est passée → expirée
        if ($endsAt) {
            $end = \Carbon\Carbon::parse($endsAt, 'Africa/Tunis');
            if ($now->gt($end)) {
                return false;
            }
        }

        return true;
    }

    public function getIsPromoScheduledAttribute(): bool
    {
        if (!$this->is_promo && !$this->promo_campaign_id) {
            return false;
        }
        $startsAt = $this->effective_promo_starts_at;
        if (!$startsAt) {
            return false;
        }
        $now = \Carbon\Carbon::now('Africa/Tunis');
        $start = \Carbon\Carbon::parse($startsAt, 'Africa/Tunis');
        return $now->lt($start);
    }

    public function getIsPromoExpiredAttribute(): bool
    {
        if (!$this->is_promo && !$this->promo_campaign_id) {
            return false;
        }
        $endsAt = $this->effective_promo_ends_at;
        if (!$endsAt) {
            return false;
        }
        $now = \Carbon\Carbon::now('Africa/Tunis');
        $end = \Carbon\Carbon::parse($endsAt, 'Africa/Tunis');
        return $now->gt($end);
    }

    public function formatPromoForFrontend()
    {
        $this->promo_starts_at = $this->effective_promo_starts_at;
        $this->promo_ends_at   = $this->effective_promo_ends_at;

        $this->setAttribute('is_promo_active', $this->is_promo_active);
        $this->setAttribute('is_promo_scheduled', $this->is_promo_scheduled);
        $this->setAttribute('is_promo_expired', $this->is_promo_expired);

        if ($this->is_promo_active && !$this->promo_price && $this->promoCampaign && $this->promoCampaign->discount_percentage) {
            $this->setAttribute('promo_price', round($this->price * (1 - $this->promoCampaign->discount_percentage / 100), 3));
            $this->setAttribute('discount_percentage', $this->promoCampaign->discount_percentage);
        }

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
}
