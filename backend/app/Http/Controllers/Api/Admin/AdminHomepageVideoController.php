<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\HomepageVideo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AdminHomepageVideoController extends Controller
{
    /**
     * Liste ordonnée des emplacements possibles sur la page d'accueil —
     * autorité unique de cette liste, partagée par l'admin (dropdown) et
     * la validation ci-dessous.
     */
    public const POSITIONS = [
        'after_hero'               => "Après le carrousel principal",
        'after_category_showcase'  => "Après les catégories mises en avant",
        'after_top_promo'          => "Après le carrousel Top Promo",
        'after_bestsellers'        => "Après les meilleures ventes",
        'after_featured'           => "Après la sélection vedette",
        'after_newest'             => "Après les nouveautés",
        'after_hygiene'            => "Après le bandeau hygiène",
        'after_brands'             => "Après les marques partenaires",
        'after_blog'               => "Après le blog",
        'after_services'           => "Tout en bas de page (après les garanties)",
    ];

    public function positions()
    {
        $list = [];
        foreach (self::POSITIONS as $key => $label) {
            $list[] = ['key' => $key, 'label' => $label];
        }
        return response()->json($list);
    }

    public function index()
    {
        $videos = HomepageVideo::all()->keyBy('position');

        $ordered = [];
        foreach (self::POSITIONS as $key => $label) {
            $ordered[] = [
                'key'   => $key,
                'label' => $label,
                'video' => $videos->get($key),
            ];
        }

        return response()->json($ordered);
    }

    /**
     * Crée ou remplace la vidéo d'un emplacement (une seule vidéo par
     * emplacement — un nouvel envoi sur le même emplacement remplace
     * l'ancienne, fichiers compris).
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'position'  => 'required|string|in:' . implode(',', array_keys(self::POSITIONS)),
            'title'     => 'nullable|string|max:150',
            'video'     => 'nullable|file|mimetypes:video/mp4,video/quicktime,video/webm|max:307200',
            'poster'    => 'nullable|image|max:5120',
            'is_active' => 'boolean',
        ]);

        $existing = HomepageVideo::where('position', $data['position'])->first();

        if ($request->hasFile('video')) {
            if ($existing?->video) {
                Storage::disk('public')->delete($existing->video);
            }
            $data['video'] = $request->file('video')->store('homepage-videos', 'public');
        } elseif (!$existing) {
            return response()->json(['message' => "Une vidéo est obligatoire pour cet emplacement."], 422);
        } else {
            unset($data['video']);
        }

        if ($request->hasFile('poster')) {
            if ($existing?->poster) {
                Storage::disk('public')->delete($existing->poster);
            }
            $data['poster'] = $request->file('poster')->store('homepage-videos/posters', 'public');
        }

        $data['is_active'] = $request->boolean('is_active', true);

        $video = HomepageVideo::updateOrCreate(['position' => $data['position']], $data);

        return response()->json($video, 201);
    }

    public function toggleActive(HomepageVideo $homepageVideo)
    {
        $homepageVideo->update(['is_active' => !$homepageVideo->is_active]);
        return response()->json($homepageVideo->fresh());
    }

    public function destroy(HomepageVideo $homepageVideo)
    {
        if ($homepageVideo->video) {
            Storage::disk('public')->delete($homepageVideo->video);
        }
        if ($homepageVideo->poster) {
            Storage::disk('public')->delete($homepageVideo->poster);
        }
        $homepageVideo->delete();
        return response()->json(['message' => 'Vidéo supprimée.']);
    }
}
