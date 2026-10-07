<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\PromoCode;
use Illuminate\Http\Request;

class AdminPromoCodeController extends Controller
{
    public function index(Request $request)
    {
        $query = PromoCode::orderByDesc('created_at');

        if ($request->search) {
            $query->where('code', 'like', '%' . strtoupper($request->search) . '%');
        }
        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        return response()->json($query->paginate($request->per_page ?? 20));
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        $promoCode = PromoCode::create($data);
        return response()->json($promoCode, 201);
    }

    public function update(Request $request, PromoCode $promoCode)
    {
        $data = $this->validateData($request, $promoCode->id);
        $promoCode->update($data);
        return response()->json($promoCode->fresh());
    }

    public function destroy(PromoCode $promoCode)
    {
        $promoCode->delete();
        return response()->json(['message' => 'Code promo supprimé.']);
    }

    public function toggleActive(PromoCode $promoCode)
    {
        $promoCode->update(['is_active' => !$promoCode->is_active]);
        return response()->json($promoCode->fresh());
    }

    private function validateData(Request $request, ?int $excludeId = null): array
    {
        $data = $request->validate([
            'code'                     => 'required|string|max:50|unique:promo_codes,code,' . ($excludeId ?? 'NULL') . ',id',
            'discount_percentage'      => 'required|integer|min:1|max:100',
            'is_active'                => 'boolean',
            'allow_with_promo_items'   => 'boolean',
            'starts_at'                => 'nullable|date',
            'ends_at'                  => 'nullable|date|after_or_equal:starts_at',
            'usage_limit'              => 'nullable|integer|min:1',
        ]);

        $data['code'] = strtoupper(trim($data['code']));
        $data['is_active'] = $data['is_active'] ?? true;
        $data['allow_with_promo_items'] = $data['allow_with_promo_items'] ?? true;

        return $data;
    }
}
