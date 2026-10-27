<?php

namespace App\Http\Controllers\Api\Admin;

use Intervention\Image\Laravel\Facades\Image;
use Illuminate\Support\Str;
use App\Http\Controllers\Controller;
use App\Models\CategoryShowcase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;

class AdminCategoryShowcaseController extends Controller
{
    public function index()
    {
        return response()->json(
            CategoryShowcase::orderBy('order')->get()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title'     => 'required|string|max:100',
            'subtitle'  => 'nullable|string|max:150',
            'link'      => 'required|string|max:255',
            'order'     => 'integer',
            'is_active' => 'boolean',
            'image'     => 'nullable|image|max:4096',
        ]);

        if ($request->hasFile('image')) {
            $optimized = Image::read($request->file('image')->getRealPath())
                ->scaleDown(width: 800, height: 800) // Format carré pour les cartes
                ->toWebp(quality: 82);
            $filename = 'cat-showcase-' . Str::lower(Str::random(10)) . '.webp';
            $fullPath = 'category-showcase/' . $filename;
            Storage::disk('public')->put($fullPath, (string) $optimized);
            $data['image'] = $fullPath;
        }

        $item = CategoryShowcase::create($data);
        Cache::forget('category_showcase_public');

        return response()->json(['message' => 'Carte créée.', 'item' => $item], 201);
    }

    public function update(Request $request, CategoryShowcase $categoryShowcase)
    {
        $data = $request->validate([
            'title'     => 'required|string|max:100',
            'subtitle'  => 'nullable|string|max:150',
            'link'      => 'required|string|max:255',
            'order'     => 'integer',
            'is_active' => 'boolean',
            'image'     => 'nullable|image|max:4096',
        ]);

        if ($request->hasFile('image')) {
            if ($categoryShowcase->image) {
                Storage::disk('public')->delete($categoryShowcase->image);
            }
            $optimized = Image::read($request->file('image')->getRealPath())
                ->scaleDown(width: 800, height: 800)
                ->toWebp(quality: 82);
            $filename = 'cat-showcase-' . Str::lower(Str::random(10)) . '.webp';
            $fullPath = 'category-showcase/' . $filename;
            Storage::disk('public')->put($fullPath, (string) $optimized);
            $data['image'] = $fullPath;
        }

        $categoryShowcase->update($data);
        Cache::forget('category_showcase_public');

        return response()->json(['message' => 'Carte mise à jour.', 'item' => $categoryShowcase]);
    }

    public function destroy(CategoryShowcase $categoryShowcase)
    {
        if ($categoryShowcase->image) {
            Storage::disk('public')->delete($categoryShowcase->image);
        }
        $categoryShowcase->delete();
        Cache::forget('category_showcase_public');

        return response()->json(['message' => 'Carte supprimée.']);
    }

    public function reorder(Request $request)
    {
        $request->validate(['order' => 'required|array']);
        foreach ($request->order as $index => $id) {
            CategoryShowcase::where('id', $id)->update(['order' => $index]);
        }
        Cache::forget('category_showcase_public');

        return response()->json(['message' => 'Ordre mis à jour.']);
    }
}
