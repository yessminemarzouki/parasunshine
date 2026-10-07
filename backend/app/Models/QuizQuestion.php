<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuizQuestion extends Model
{
    protected $fillable = [
        'solution_id', 'question', 'subtitle', 'order',
        'is_active', 'is_skippable', 'show_if_option_id',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_skippable' => 'boolean',
    ];

    public function options()
    {
        return $this->hasMany(QuizOption::class, 'question_id')->orderBy('order');
    }

    public function solution()
    {
        return $this->belongsTo(QuizSolution::class, 'solution_id');
    }

    public function showIfOption()
    {
        return $this->belongsTo(QuizOption::class, 'show_if_option_id');
    }
}
