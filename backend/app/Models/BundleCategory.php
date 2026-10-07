<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class BundleCategory extends Model
{
    protected $fillable = ['name', 'slug', 'sort'];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($category) {
            if (empty($category->slug)) {
                $category->slug = Str::slug($category->name);
            }
        });
    }

    public function bundles()
    {
        return $this->hasMany(Bundle::class);
    }
}
