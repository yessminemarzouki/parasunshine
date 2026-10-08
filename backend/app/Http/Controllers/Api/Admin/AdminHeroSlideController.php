<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\HeroSlide;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;

class AdminHeroSlideController extends Controller
{
    public function index()
    {
        return response()->json(
            HeroSlide::orderBy('order')->get()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'image'       => 'required|image|max:4096',
            'title'       => 'nullable|string|max:150',
            'subtitle'    => 'nullable|string|max:255',
            'link'        => 'nullable|string|max:255',
            'button_text' => 'nullable|string|max:80',
            'order'       => 'nullable|integer',
            'is_active'   => 'boolean',
        ]);

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('hero_slides', 'public');
        }

        $slide = HeroSlide::create($data);
        $this->clearCache();

        return response()->json($slide, 201);
    }

    public function update(Request $request, HeroSlide $heroSlide)
    {
        $data = $request->validate([
            'image'       => 'nullable|image|max:4096',
            'title'       => 'nullable|string|max:150',
            'subtitle'    => 'nullable|string|max:255',
            'link'        => 'nullable|string|max:255',
            'button_text' => 'nullable|string|max:80',
            'order'       => 'nullable|integer',
            'is_active'   => 'boolean',
        ]);

        if ($request->hasFile('image')) {
            if ($heroSlide->image) {
                Storage::disk('public')->delete($heroSlide->image);
            }
            $data['image'] = $request->file('image')->store('hero_slides', 'public');
        }

        $heroSlide->update($data);
        $this->clearCache();

        return response()->json($heroSlide->fresh());
    }

    public function destroy(HeroSlide $heroSlide)
    {
        if ($heroSlide->image) {
            Storage::disk('public')->delete($heroSlide->image);
        }
        $heroSlide->delete();
        $this->clearCache();

        return response()->json(['message' => 'Slide supprimé.']);
    }

    public function toggle(HeroSlide $heroSlide)
    {
        $heroSlide->update(['is_active' => !$heroSlide->is_active]);
        $this->clearCache();

        return response()->json($heroSlide->fresh());
    }

    public function reorder(Request $request)
    {
        $request->validate(['order' => 'required|array']);

        foreach ($request->order as $index => $id) {
            HeroSlide::where('id', $id)->update(['order' => $index]);
        }

        $this->clearCache();

        return response()->json(['message' => 'Ordre mis à jour.']);
    }

    private function clearCache(): void
    {
        Cache::forget('hero_slides_active');
    }
}
