<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Staudenmeir\LaravelAdjacencyList\Eloquent\HasRecursiveRelationships;

class Category extends Model
{
    use HasFactory;
    use HasRecursiveRelationships;

    protected $fillable = [
    'name', 'slug', 'parent_id', 'sort',
    'show_in_menu', 'show_in_megamenu', 'icon', 'image',
    'promo_image', 'promo_title', 'promo_text', 'promo_link', 'promo_cta',
    'bundle_id',
];
    protected $casts = [
        'show_in_menu' => 'boolean',
        'show_in_megamenu' => 'boolean',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($category) {
            if (empty($category->slug)) {
                $category->slug = Str::slug($category->name);
            }
        });
    }

    // Relations
    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function parent()
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Category::class, 'parent_id');
    }

    public function brands()
    {
        return $this->belongsToMany(Brand::class, 'category_brand')
            ->withPivot('order')
            ->orderBy('category_brand.order');
    }

    public function bundle()
    {
        return $this->belongsTo(Bundle::class);
    }
}
