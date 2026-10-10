<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Bundle;
use App\Models\User;
use App\Models\ShippingSetting;
use App\Notifications\NewOrderNotification;
use App\Mail\OrderConfirmationMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    /**
     * LISTE DES COMMANDES DE L'UTILISATEUR CONNECTÉ
     */
    public function index(Request $request)
    {
        $orders = Order::where('user_id', $request->user()->id)
            ->with(['items.product', 'items.bundle'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'orders' => $orders,
        ]);
    }

    /**
     * DÉTAILS D'UNE COMMANDE
     */
    public function show(Request $request, $id)
    {
        $order = Order::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->with(['items.product', 'items.bundle'])
            ->firstOrFail();

        return response()->json([
            'order' => $order,
        ]);
    }

    /**
     * CRÉER UNE NOUVELLE COMMANDE
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
    'items' => 'required|array|min:1|max:50',
    'items.*.product_id' => 'nullable|exists:products,id',
    'items.*.bundle_id' => 'nullable|exists:bundles,id',
    'items.*.quantity' => 'required|integer|min:1|max:100',
    'delivery_method' => 'nullable|in:delivery,store_pickup',
    'shipping_address' => 'required_unless:delivery_method,store_pickup|nullable|string|max:500|min:10',
    'phone' => [
           'required',
           'string',
           'max:20',
           'regex:/^[0-9\s\-\+\(\)]+$/',
    ],
    'promo_code' => 'nullable|string|max:50',
    'items.*.selected_size' => 'nullable|string|max:50',
    'items.*.selected_color' => 'nullable|string|max:100',
    'items.*.selected_age' => 'nullable|string|max:50',
    'shipping_city' => 'nullable|string|max:100',
    'shipping_postal_code' => 'nullable|string|max:20',
]);

        foreach ($validated['items'] as $item) {
            if (empty($item['product_id']) && empty($item['bundle_id'])) {
                return response()->json([
                    'message' => 'Chaque article doit être un produit ou un coffret.',
                ], 422);
            }
        }

        DB::beginTransaction();

        try {
            $user = $request->user();

            // Calculer le total
            $subtotal = 0;
            $itemsData = [];

            foreach ($validated['items'] as $item) {
                if (!empty($item['bundle_id'])) {
                    // ── Article de type coffret ──
                    $bundle = Bundle::with('items.product')->findOrFail($item['bundle_id']);

                    if (!$bundle->is_available) {
                        DB::rollBack();
                        return response()->json([
                            'message' => "Le coffret \"{$bundle->name}\" n'est plus disponible.",
                        ], 400);
                    }

                    if ($bundle->stock < $item['quantity']) {
                        DB::rollBack();
                        return response()->json([
                            'message' => "Stock insuffisant pour le coffret {$bundle->name}",
                        ], 400);
                    }

                    $price = $bundle->promo_price && $bundle->promo_price < $bundle->price
                        ? $bundle->promo_price
                        : $bundle->price;

                    $itemTotal = $price * $item['quantity'];
                    $subtotal += $itemTotal;

                    $itemsData[] = [
                        'type'     => 'bundle',
                        'bundle'   => $bundle,
                        'quantity' => $item['quantity'],
                        'price'    => $price,
                        'total'    => $itemTotal,
                    ];
                    continue;
                }

                // ── Article de type produit ──
                $product = Product::findOrFail($item['product_id']);

                $selectedSize  = $item['selected_size'] ?? null;
                $selectedColor = $item['selected_color'] ?? null;
                $selectedAge   = $item['selected_age'] ?? null;

                $variantStock = $product->getVariantStock($selectedSize, $selectedColor, $selectedAge);
                $availableStock = $variantStock !== null ? $variantStock : $product->stock;

                if ($availableStock < $item['quantity']) {
                    DB::rollBack();
                    return response()->json([
                        'message' => "Stock insuffisant pour {$product->name}",
                    ], 400);
                }

                $price = $product->promo_price && $product->promo_price < $product->price
                    ? $product->promo_price
                    : $product->price;

                $itemTotal = $price * $item['quantity'];
                $subtotal += $itemTotal;

                $itemsData[] = [
                    'type'           => 'product',
                    'product'        => $product,
                    'quantity'       => $item['quantity'],
                    'price'          => $price,
                    'total'          => $itemTotal,
                    'selected_size'  => $selectedSize,
                    'selected_color' => $selectedColor,
                    'selected_age'   => $selectedAge,
                ];
            }

            // Applique le code promo, si fourni — revalidé côté serveur,
            // jamais de confiance dans un montant envoyé par le client.
            $promoDiscountPercentage = null;
            $promoDiscountAmount = 0;

            if (!empty($validated['promo_code'])) {
                $promoCode = \App\Models\PromoCode::where('code', strtoupper(trim($validated['promo_code'])))->first();

                if ($promoCode) {
                    [$isValid] = $promoCode->isCurrentlyValid();

                    $hasPromoItem = collect($itemsData)->contains(function ($item) {
                        if ($item['type'] === 'bundle') {
                            $b = $item['bundle'];
                            return $b->promo_price && $b->promo_price < $b->price;
                        }
                        $p = $item['product'];
                        return $p->promo_price && $p->promo_price < $p->price;
                    });

                    if ($isValid && !($hasPromoItem && !$promoCode->allow_with_promo_items)) {
                        $promoDiscountPercentage = $promoCode->discount_percentage;
                        $promoDiscountAmount = round($subtotal * $promoCode->discount_percentage / 100, 3);
                        $promoCode->increment('used_count');
                    }
                }
            }

            $subtotalAfterDiscount = $subtotal - $promoDiscountAmount;

            // Mode de réception : livraison à domicile ou retrait magasin
            $deliveryMethod = $validated['delivery_method'] ?? 'delivery';

            // Frais de livraison : 0 si retrait magasin, sinon calcul dynamique
            if ($deliveryMethod === 'store_pickup') {
                $shippingCost = 0;
            } else {
                $shippingCost = ShippingSetting::calculateShippingCost($subtotalAfterDiscount);
            }

            $total = $subtotalAfterDiscount + $shippingCost;

            // Créer la commande
            $order = Order::create([
    'user_id' => $user->id,
    'order_number' => 'CMD-' . date('Ymd') . '-' . strtoupper(Str::random(6)),
    'status' => 'pending',
    'subtotal' => $subtotal,
    'shipping_cost' => $shippingCost,
    'total' => $total,
    'shipping_address' => $validated['shipping_address'] ?? 'Retrait en magasin',
    'shipping_phone' => $validated['phone'],
    'shipping_city' => $validated['shipping_city'] ?? '',
    'shipping_postal_code' => $validated['shipping_postal_code'] ?? '',
    'payment_method' => $deliveryMethod, // 'delivery' ou 'store_pickup'
    'payment_status' => 'pending',
    'promo_code' => $promoDiscountPercentage ? strtoupper(trim($validated['promo_code'])) : null,
    'promo_discount_percentage' => $promoDiscountPercentage,
    'promo_discount_amount' => $promoDiscountPercentage ? $promoDiscountAmount : null,
]);

            // Créer les items de la commande — le stock n'est décrémenté
            // qu'au passage en statut "livré" par l'admin, pas à la commande
            foreach ($itemsData as $itemData) {
                if ($itemData['type'] === 'bundle') {
                    OrderItem::create([
                        'order_id'    => $order->id,
                        'bundle_id'   => $itemData['bundle']->id,
                        'bundle_name' => $itemData['bundle']->name,
                        'quantity'    => $itemData['quantity'],
                        'price'       => $itemData['price'],
                        'total'       => $itemData['total'],
                    ]);
                    continue;
                }

                OrderItem::create([
                    'order_id'       => $order->id,
                    'product_id'     => $itemData['product']->id,
                    'product_name'   => $itemData['product']->name,
                    'quantity'       => $itemData['quantity'],
                    'price'          => $itemData['price'],
                    'total'          => $itemData['total'],
                    'selected_size'  => $itemData['selected_size'],
                    'selected_color' => $itemData['selected_color'],
                    'selected_age'   => $itemData['selected_age'],
                ]);
            }

            // NOTIFIER TOUS LES ADMINS
            $admins = User::where('role', 'admin')->get();
            Notification::send($admins, new NewOrderNotification($order));

            // ENVOYER L'EMAIL DE CONFIRMATION AU CLIENT
            try {
                Mail::to($user->email)->send(new OrderConfirmationMail($order->load('items.product', 'user')));
                Log::info('Email de confirmation envoyé pour la commande #' . $order->order_number);
            } catch (\Exception $e) {
                Log::error('Erreur envoi email confirmation commande: ' . $e->getMessage());
                // On ne bloque pas la commande si l'email échoue
            }

            DB::commit();

            return response()->json([
                'message' => 'Commande créée avec succès',
                'order' => $order->load('items.product'),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("ERREUR FATALE COMMANDE: " . $e->getMessage());
            Log::error("Stack trace: " . $e->getTraceAsString());

            return response()->json([
                'message' => 'Erreur lors de la création de la commande',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
