<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HomepageVideo extends Model
{
    protected $fillable = ['position', 'title', 'video', 'poster', 'is_active'];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
