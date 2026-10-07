<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BlogPost extends Model
{
    protected $fillable = [
        'title',
        'slug',
        'excerpt',
        'content',
        'image',
        'category',
        'category_slug',
        'author',
        'read_time',
        'tags',
        'is_featured',
        'is_visible',
        'section_visible',
    ];

    protected $casts = [
        'tags'            => 'array',
        'is_featured'     => 'boolean',
        'is_visible'      => 'boolean',
        'section_visible' => 'boolean',
    ];
}
