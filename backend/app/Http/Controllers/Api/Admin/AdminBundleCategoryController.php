<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\BundleCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminBundleCategoryController extends Controller
{
    public function index()
    {
        return response()->json(
            BundleCategory::withCount('bundles')->orderBy('sort')->get()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'sort' => 'nullable|integer',
        ]);

        $data['slug'] = Str::slug($data['name']);

        $category = BundleCategory::create($data);

        return response()->json($category, 201);
    }

    public function update(Request $request, BundleCategory $bundleCategory)
    {
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'sort' => 'nullable|integer',
        ]);

        if (isset($data['name'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        $bundleCategory->update($data);

        return response()->json($bundleCategory);
    }

    public function reorder(Request $request)
    {
        $request->validate(['order' => 'required|array']);

        foreach ($request->order as $index => $id) {
            BundleCategory::where('id', $id)->update(['sort' => $index]);
        }

        return response()->json(['message' => 'Ordre mis à jour.']);
    }

    public function destroy(BundleCategory $bundleCategory)
    {
        $bundleCategory->delete();

        return response()->json(['message' => 'Catégorie de coffret supprimée.']);
    }
}
