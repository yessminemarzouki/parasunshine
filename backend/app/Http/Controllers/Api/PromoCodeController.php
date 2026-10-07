<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\PromoCode;
use Illuminate\Http\Request;

class PromoCodeController extends Controller
{
    /**
     * Vérifie un code promo par rapport au contenu réel du panier envoyé
     * par le client (jamais de confiance aveugle dans les prix envoyés).
     */
    public function validateCode(Request $request)
    {
        $validated = $request->validate([
            'code'               => 'required|string|max:50',
            'items'              => 'required|array|min:1',
            'items.*.product_id' => 'nullable|integer',
            'items.*.bundle_id'  => 'nullable|integer',
            'items.*.quantity'   => 'required|integer|min:1',
        ]);

        $promoCode = PromoCode::where('code', strtoupper(trim($validated['code'])))->first();

        if (!$promoCode) {
            return response()->json(['valid' => false, 'message' => 'Code promo invalide.'], 404);
        }

        [$isValid, $error] = $promoCode->isCurrentlyValid();
        if (!$isValid) {
            return response()->json(['valid' => false, 'message' => $error], 422);
        }

        // Recalcule le sous-total et détecte les articles en promo
        // directement depuis la base — jamais depuis ce que le client envoie.
        $subtotal = 0;
        $hasPromoItem = false;

        foreach ($validated['items'] as $item) {
            if (!empty($item['product_id'])) {
                $product = Product::find($item['product_id']);
                if (!$product) {
                    continue;
                }
                $hasOwnPromo = $product->promo_price && $product->promo_price < $product->price;
                if ($hasOwnPromo) {
                    $hasPromoItem = true;
                }
                $price = $hasOwnPromo ? $product->promo_price : $product->price;
                $subtotal += $price * $item['quantity'];
            } elseif (!empty($item['bundle_id'])) {
                $bundle = \App\Models\Bundle::find($item['bundle_id']);
                if (!$bundle) {
                    continue;
                }
                $hasOwnPromo = $bundle->promo_price && $bundle->promo_price < $bundle->price;
                if ($hasOwnPromo) {
                    $hasPromoItem = true;
                }
                $price = $hasOwnPromo ? $bundle->promo_price : $bundle->price;
                $subtotal += $price * $item['quantity'];
            }
        }

        if ($hasPromoItem && !$promoCode->allow_with_promo_items) {
            return response()->json([
                'valid'   => false,
                'message' => 'Ce code promo ne peut pas être utilisé car votre panier contient un ou plusieurs articles déjà en promotion.',
            ], 422);
        }

        $discountAmount = round($subtotal * $promoCode->discount_percentage / 100, 3);

        return response()->json([
            'valid'                => true,
            'code'                 => $promoCode->code,
            'discount_percentage'  => $promoCode->discount_percentage,
            'discount_amount'      => $discountAmount,
            'message'              => "Code promo appliqué : -{$promoCode->discount_percentage}% sur votre commande.",
        ]);
    }
}
