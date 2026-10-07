<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuizSolution extends Model
{
    protected $fillable = [
        'name', 'slug', 'description', 'icon', 'image',
        'category_id', 'order', 'is_active',
        'advice_video', 'advice_video_poster', 'advice_video_title',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function questions()
    {
        return $this->hasMany(QuizQuestion::class, 'solution_id')->orderBy('order');
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }
}
