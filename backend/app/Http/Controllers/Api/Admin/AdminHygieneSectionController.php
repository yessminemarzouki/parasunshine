<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\HygieneSection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AdminHygieneSectionController extends Controller
{
    // ── PUBLIC ── renvoie toutes les sections visibles, triées
    public function public()
    {
        $sections = HygieneSection::where('is_visible', true)
            ->orderBy('sort')
            ->get();

        return response()->json($sections);
    }

    // ── ADMIN ──

    public function index()
    {
        $sections = HygieneSection::orderBy('sort')->get();
        return response()->json($sections);
    }

    public function show(HygieneSection $hygieneSection)
    {
        return response()->json($hygieneSection);
    }

    public function store(Request $request)
    {
        $data = $this->validateSection($request);

        $maxSort = HygieneSection::max('sort') ?? -1;
        $data['sort'] = $maxSort + 1;

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('hygiene', 'public');
        }

        $section = HygieneSection::create($data);

        return response()->json([
            'message' => 'Section créée avec succès.',
            'section' => $section,
        ], 201);
    }

    public function update(Request $request, HygieneSection $hygieneSection)
    {
        $data = $this->validateSection($request);

        if ($request->hasFile('image')) {
            if ($hygieneSection->image) {
                Storage::disk('public')->delete($hygieneSection->image);
            }
            $data['image'] = $request->file('image')->store('hygiene', 'public');
        }

        $hygieneSection->update($data);

        return response()->json([
            'message' => 'Section mise à jour.',
            'section' => $hygieneSection->fresh(),
        ]);
    }

    public function destroy(HygieneSection $hygieneSection)
    {
        if ($hygieneSection->image) {
            Storage::disk('public')->delete($hygieneSection->image);
        }

        $hygieneSection->delete();

        return response()->json(['message' => 'Section supprimée.']);
    }

    public function reorder(Request $request)
    {
        $request->validate(['order' => 'required|array']);

        foreach ($request->order as $index => $id) {
            HygieneSection::where('id', $id)->update(['sort' => $index]);
        }

        return response()->json(['message' => 'Ordre mis à jour.']);
    }

    private function validateSection(Request $request): array
    {
        $data = $request->validate([
            'title'            => 'required|string|max:100',
            'background_color' => 'required|string|max:20',
            'title_color'      => 'required|string|max:20',
            'tab_active_color' => 'required|string|max:20',
            'is_visible'       => 'required',
            'tabs'             => 'required|string',
            'image'            => 'nullable|image|max:4096',
        ]);

        $data['tabs'] = json_decode($data['tabs'], true);
        $data['is_visible'] = $data['is_visible'] === '1' || $data['is_visible'] === true;

        unset($data['image']); // géré séparément (fichier)

        return $data;
    }
}
