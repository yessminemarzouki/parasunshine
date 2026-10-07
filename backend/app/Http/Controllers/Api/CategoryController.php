<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category; // <- c’est le modèle, pas le controller
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index()
    {
        $categories = Category::whereNull('parent_id')
            ->where('show_in_menu', true)
                   ->with(['children' => function ($q) {
                       $q->where('show_in_menu', true)->with(['children' => function ($q2) {
                           $q2->where('show_in_menu', true);
                       }]);
                   }, 'brands', 'bundle:id,name,slug,image'])
            ->orderBy('sort')
            ->get();

        return response()->json($categories);
    }
}
