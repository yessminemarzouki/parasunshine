<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuizResult extends Model
{
    protected $fillable = ['user_id', 'solution_id', 'answers', 'recommended_products', 'explanation'];

    protected $casts = [
        'answers'              => 'array',
        'recommended_products' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
    public function solution()
    {
        return $this->belongsTo(QuizSolution::class, 'solution_id');
    }
}
