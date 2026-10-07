<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Address;
use Illuminate\Http\Request;

class AddressController extends Controller
{
    private function resolveTargetUserId(Request $request)
    {
        $authUser = $request->user();
        if ($authUser->role === 'admin' && $request->filled('user_id')) {
            return (int) $request->query('user_id');
        }
        return $authUser->id;
    }

    // Liste des adresses de l'utilisateur connecté (ou ciblé si admin)
    public function index(Request $request)
    {
        $userId = $this->resolveTargetUserId($request);

        $addresses = Address::where('user_id', $userId)
            ->orderByDesc('is_default')
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['addresses' => $addresses]);
    }

    // Créer une nouvelle adresse
    public function store(Request $request)
    {
        $validated = $request->validate([
            'label'       => 'nullable|string|max:50',
            'first_name'  => 'required|string|max:100',
            'last_name'   => 'required|string|max:100',
            'phone'       => 'required|string|max:20',
            'governorate' => 'required|string|max:100',
            'delegation'  => 'required|string|max:100',
            'address'     => 'required|string|max:255',
            'postal_code' => 'nullable|string|max:10',
            'is_default'  => 'boolean',
        ]);

        $userId = $this->resolveTargetUserId($request);

        // Si c'est la première adresse ou marquée par défaut → default
        $isFirst = Address::where('user_id', $userId)->count() === 0;
        $isDefault = $isFirst || ($validated['is_default'] ?? false);

        // Si nouvelle adresse par défaut → retirer l'ancien défaut
        if ($isDefault) {
            Address::where('user_id', $userId)
                ->where('is_default', true)
                ->update(['is_default' => false]);
        }

        $address = Address::create([
            ...$validated,
            'user_id'    => $userId,
            'label'      => $validated['label'] ?? 'Domicile',
            'is_default' => $isDefault,
        ]);

        return response()->json(['address' => $address, 'message' => 'Adresse ajoutée avec succès.'], 201);
    }

    // Modifier une adresse
    public function update(Request $request, $id)
    {
        $userId = $this->resolveTargetUserId($request);

        $address = Address::where('user_id', $userId)
            ->findOrFail($id);

        $validated = $request->validate([
            'label'       => 'nullable|string|max:50',
            'first_name'  => 'required|string|max:100',
            'last_name'   => 'required|string|max:100',
            'phone'       => 'required|string|max:20',
            'governorate' => 'required|string|max:100',
            'delegation'  => 'required|string|max:100',
            'address'     => 'required|string|max:255',
            'postal_code' => 'nullable|string|max:10',
            'is_default'  => 'boolean',
        ]);

        if ($validated['is_default'] ?? false) {
            Address::where('user_id', $userId)
                ->where('is_default', true)
                ->update(['is_default' => false]);
        }

        $address->update($validated);

        return response()->json(['address' => $address, 'message' => 'Adresse mise à jour.']);
    }

    // Supprimer une adresse
    public function destroy(Request $request, $id)
    {
        $userId = $this->resolveTargetUserId($request);

        $address = Address::where('user_id', $userId)
            ->findOrFail($id);

        $wasDefault = $address->is_default;
        $address->delete();

        // Si c'était l'adresse par défaut → mettre la suivante par défaut
        if ($wasDefault) {
            $next = Address::where('user_id', $userId)
                ->orderByDesc('created_at')
                ->first();
            if ($next) {
                $next->update(['is_default' => true]);
            }
        }

        return response()->json(['message' => 'Adresse supprimée.']);
    }

    // Définir comme adresse par défaut
    public function setDefault(Request $request, $id)
    {
        $userId = $this->resolveTargetUserId($request);

        Address::where('user_id', $userId)
            ->update(['is_default' => false]);

        $address = Address::where('user_id', $userId)
            ->findOrFail($id);

        $address->update(['is_default' => true]);

        return response()->json(['message' => 'Adresse par défaut mise à jour.']);
    }
}
