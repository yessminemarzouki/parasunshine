<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HomepageVideo;
use Illuminate\Support\Facades\Cache;

class HomepageVideoController extends Controller
{
    public function index()
    {
        return Cache::remember('homepage_videos_public', 300, function () {
            return HomepageVideo::where('is_active', true)
                ->select('position', 'title', 'video', 'poster')
                ->get();
        });
    }
}
