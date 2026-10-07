<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BundleReview extends Model
{
    protected $fillable = [
        'bundle_id', 'customer_name', 'customer_email',
        'rating', 'comment', 'is_verified', 'is_approved', 'is_rejected',
    ];

    protected $casts = [
        'is_verified' => 'boolean',
        'is_approved' => 'boolean',
        'is_rejected' => 'boolean',
        'rating'      => 'integer',
    ];

    public function bundle()
    {
        return $this->belongsTo(Bundle::class);
    }
}
