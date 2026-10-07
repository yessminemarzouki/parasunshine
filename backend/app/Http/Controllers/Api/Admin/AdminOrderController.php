<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\Bundle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminOrderController extends Controller
{
    // Liste paginée avec filtres
    public function index(Request $request)
    {
        $query = Order::with([
            'user:id,name,email,phone',
            'items.product:id,name,image,slug',
            'items.bundle:id,name,image,slug',
        ])->latest();

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('order_number', 'like', '%' . $request->search . '%')
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', '%' . $request->search . '%')
                        ->orWhere('email', 'like', '%' . $request->search . '%'));
            });
        }

        if ($request->date === 'today') {
            $query->whereDate('created_at', today());
        } elseif ($request->date === 'week') {
            $query->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()]);
        } elseif ($request->date === 'month') {
            $query->where('created_at', '>=', now()->startOfMonth());
        }

        $orders = $query->paginate($request->per_page ?? 15);

        return response()->json($orders);
    }

    // Détail d'une commande
    public function show(Order $order)
    {
        $order->load([
            'user:id,name,email,phone',
            'items.product:id,name,image,slug,price',
            'items.bundle:id,name,image,slug,price',
            'statusHistories.user:id,name',
        ]);

        return response()->json($order);
    }

    // Changer le statut
    public function updateStatus(Request $request, Order $order)
    {
        $request->validate([
            'status' => 'required|in:pending,processing,shipped,delivered,cancelled',
            'note'   => 'nullable|string|max:500',
        ]);

        $oldStatus = $order->status;
        $newStatus = $request->status;

        DB::beginTransaction();
        try {
            // Passage VERS "livré" (depuis un autre statut) → décrémente le stock
            if ($newStatus === 'delivered' && $oldStatus !== 'delivered') {
                $this->adjustStock($order, -1);
            }

            // Sortie DEPUIS "livré" (vers un autre statut) → restaure le stock
            if ($oldStatus === 'delivered' && $newStatus !== 'delivered') {
                $this->adjustStock($order, 1);
            }

            $updateData = ['status' => $newStatus];

            // Paiement à la livraison : le paiement est considéré effectué
            // dès que la commande passe au statut "Livrée". S'il en sort
            // (ex: erreur admin, retour), on repasse le paiement en attente.
            if ($order->payment_method === 'cash_on_delivery') {
                if ($newStatus === 'delivered') {
                    $updateData['payment_status'] = 'paid';
                } elseif ($oldStatus === 'delivered' && $newStatus !== 'delivered') {
                    $updateData['payment_status'] = 'pending';
                }
            }

            $order->update($updateData);

            \App\Models\OrderStatusHistory::create([
                'order_id'   => $order->id,
                'user_id'    => auth('sanctum')->id(),
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
                'note'       => $request->note ?? null,
            ]);

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Erreur lors de la mise à jour du statut.',
                'error'   => $e->getMessage(),
            ], 500);
        }

        return response()->json([
            'message' => 'Statut mis à jour avec succès.',
            'order'   => $order->fresh(['user', 'items.product', 'statusHistories.user']),
        ]);
    }

    /**
     * Ajuste le stock des produits d'une commande.
     * $direction : -1 pour décrémenter (livraison), +1 pour restaurer (annulation d'une livraison)
     */
    private function adjustStock(Order $order, int $direction): void
    {
        $items = $order->items()
            ->select('product_id', 'bundle_id', 'quantity', 'selected_size', 'selected_color', 'selected_age')
            ->get();

        foreach ($items as $item) {
            if ($item->bundle_id) {
                $bundle = Bundle::where('id', $item->bundle_id)
                    ->with('items') // uniquement les articles catalogue avec product_id
                    ->lockForUpdate()
                    ->first();

                if (!$bundle) {
                    continue; // coffret supprimé depuis, on ignore
                }

                if ($direction < 0) {
                    $bundle->decrement('stock', $item->quantity);
                } else {
                    $bundle->increment('stock', $item->quantity);
                }

                // Décrémente aussi le stock des produits catalogue composant
                // le coffret, proportionnellement à leur quantité définie
                // dans le coffret × quantité de coffrets commandés.
                // Les articles manuels (sans product_id) n'ont aucune
                // contrainte de stock — toujours ignorés ici.
                foreach ($bundle->items as $bundleItem) {
                    if (!$bundleItem->product_id) {
                        continue;
                    }
                    $componentProduct = Product::where('id', $bundleItem->product_id)
                        ->lockForUpdate()
                        ->first();
                    if (!$componentProduct) {
                        continue;
                    }
                    $totalQty = $bundleItem->quantity * $item->quantity;
                    if ($direction < 0) {
                        $componentProduct->decrement('stock', $totalQty);
                    } else {
                        $componentProduct->increment('stock', $totalQty);
                    }
                }
                continue;
            }

            if (!$item->product_id) {
                continue;
            }

            $product = Product::where('id', $item->product_id)
                ->lockForUpdate()
                ->first();

            if (!$product) {
                continue; // produit supprimé depuis, on ignore
            }

            $delta = $direction < 0 ? -$item->quantity : $item->quantity;

            $variantAdjusted = false;
            if ($item->selected_size || $item->selected_color || $item->selected_age) {
                $variantAdjusted = $product->adjustVariantStock(
                    $item->selected_size,
                    $item->selected_color,
                    $item->selected_age,
                    $delta,
                );
            }

            if (!$variantAdjusted) {
                if ($direction < 0) {
                    $product->decrement('stock', $item->quantity);
                } else {
                    $product->increment('stock', $item->quantity);
                }
            }
        }
    }

    // Supprimer
    public function destroy(Order $order)
    {
        $order->delete();
        return response()->json(['message' => 'Commande supprimée.']);
    }
}
