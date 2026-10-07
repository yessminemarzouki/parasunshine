<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class AdminBlogController extends Controller
{
    // ── PUBLIC ──
    public function publicIndex()
    {
        $posts = BlogPost::where('is_visible', true)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'posts'           => $posts,
            'section_visible' => $posts->first()?->section_visible ?? true,
        ]);
    }

    public function publicShow($id)
    {
        $post = BlogPost::where('id', $id)
            ->where('is_visible', true)
            ->firstOrFail();

        return response()->json($post);
    }

    // ── ADMIN ──
    public function index(Request $request)
    {
        $query = BlogPost::orderByDesc('created_at');

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', '%' . $request->search . '%')
                    ->orWhere('category', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->category_slug) {
            $query->where('category_slug', $request->category_slug);
        }

        if ($request->filled('is_visible')) {
            $query->where('is_visible', filter_var($request->is_visible, FILTER_VALIDATE_BOOLEAN));
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title'            => 'required|string|max:255',
            'excerpt'          => 'required|string',
            'content'          => 'required|string',
            'category'         => 'required|string|max:100',
            'category_slug'    => 'required|string|max:100',
            'author'           => 'nullable|string|max:100',
            'read_time'        => 'nullable|string|max:20',
            'tags'             => 'nullable|string',
            'is_featured'      => 'boolean',
            'is_visible'       => 'boolean',
            'section_visible'  => 'boolean',
            'image'            => 'nullable|image|max:4096',
        ]);
        $data = $this->decodeHtmlFields($data);
        $data['slug'] = Str::slug($data['title']) . '-' . Str::random(5);
        $data['tags'] = isset($data['tags'])
            ? array_filter(array_map('trim', explode(',', $data['tags'])))
            : [];

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('blog', 'public');
        }

        $post = BlogPost::create($data);

        return response()->json([
            'message' => 'Article créé avec succès.',
            'post'    => $post,
        ], 201);
    }

    public function update(Request $request, BlogPost $blogPost)
    {
        $data = $request->validate([
            'title'           => 'sometimes|string|max:255',
            'excerpt'         => 'sometimes|string',
            'content'         => 'sometimes|string',
            'category'        => 'sometimes|string|max:100',
            'category_slug'   => 'sometimes|string|max:100',
            'author'          => 'nullable|string|max:100',
            'read_time'       => 'nullable|string|max:20',
            'tags'            => 'nullable|string',
            'is_featured'     => 'boolean',
            'is_visible'      => 'boolean',
            'section_visible' => 'boolean',
            'image'           => 'nullable|image|max:4096',

        ]);

        if (isset($data['tags']) && is_string($data['tags'])) {
            $data['tags'] = array_filter(array_map('trim', explode(',', $data['tags'])));
        }

        if ($request->hasFile('image')) {
            if ($blogPost->image) {
                Storage::disk('public')->delete($blogPost->image);
            }
            $data['image'] = $request->file('image')->store('blog', 'public');
        }

        $blogPost->update($data);

        return response()->json([
            'message' => 'Article mis à jour.',
            'post'    => $blogPost->fresh(),
        ]);
    }

    public function destroy(BlogPost $blogPost)
    {
        if ($blogPost->image) {
            Storage::disk('public')->delete($blogPost->image);
        }
        $blogPost->delete();
        return response()->json(['message' => 'Article supprimé.']);
    }
    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids'   => 'required|array|min:1',
            'ids.*' => 'integer|exists:blog_posts,id',
        ]);

        $posts = BlogPost::whereIn('id', $request->ids)->get();
        foreach ($posts as $post) {
            if ($post->image) {
                Storage::disk('public')->delete($post->image);
            }
            $post->delete();
        }

        return response()->json([
            'message' => count($posts) . ' article(s) supprimé(s) avec succès.',
        ]);
    }

    public function bulkToggleVisible(Request $request)
    {
        $request->validate([
            'ids'   => 'required|array|min:1',
            'ids.*' => 'integer|exists:blog_posts,id',
            'value' => 'required|boolean',
        ]);

        BlogPost::whereIn('id', $request->ids)->update([
            'is_visible' => $request->boolean('value'),
        ]);

        return response()->json([
            'message' => count($request->ids) . ' article(s) mis à jour.',
        ]);
    }

    public function toggleVisible(BlogPost $blogPost)
    {
        $blogPost->update(['is_visible' => !$blogPost->is_visible]);
        return response()->json([
            'message'    => 'Visibilité mise à jour.',
            'is_visible' => $blogPost->is_visible,
        ]);
    }

    public function toggleSection(BlogPost $blogPost)
    {
        $visible = !$blogPost->section_visible;
        BlogPost::query()->update(['section_visible' => $visible]);
        return response()->json([
            'message'         => 'Section blog mise à jour.',
            'section_visible' => $visible,
        ]);
    }
    private function decodeHtmlFields(array $data): array
    {
        foreach (['content', 'excerpt'] as $field) {
            if (!empty($data[$field])) {
                $decoded = html_entity_decode($data[$field], ENT_QUOTES | ENT_HTML5, 'UTF-8');
                if (strpos($decoded, '&lt;') !== false) {
                    $decoded = html_entity_decode($decoded, ENT_QUOTES | ENT_HTML5, 'UTF-8');
                }
                $data[$field] = $decoded;
            }
        }
        return $data;
    }
}
