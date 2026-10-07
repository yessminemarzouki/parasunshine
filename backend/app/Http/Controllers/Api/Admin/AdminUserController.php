<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    private function getVipThreshold(): float
    {
        $spendings = \Illuminate\Support\Facades\DB::table('orders')
            ->where('status', 'delivered')
            ->whereNotNull('user_id')
            ->select('user_id', \Illuminate\Support\Facades\DB::raw('SUM(total) as total_spent'))
            ->groupBy('user_id')
            ->orderByDesc('total_spent')
            ->pluck('total_spent');

        if ($spendings->isEmpty()) {
            return PHP_FLOAT_MAX; // aucun VIP possible s'il n'y a pas de données
        }

        $topTenPercentIndex = max(0, (int) floor($spendings->count() * 0.1) - 1);
        return (float) $spendings[$topTenPercentIndex];
    }
    public function index(Request $request)
    {
        $query = User::withCount('orders')
            ->with('orders:id,user_id,total,status')
            ->latest();

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('email', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->purchase_status === 'with_orders') {
            $query->has('orders');
        } elseif ($request->purchase_status === 'no_orders') {
            $query->doesntHave('orders');
        }

        $result = $query->paginate($request->per_page ?? 20);

        return response()->json([
            ...$result->toArray(),
            'vip_threshold' => $this->getVipThreshold(),
        ]);
    }

    public function show(User $user)
    {
        $user->load([
            'orders.items.product:id,name,image,slug',
            'abandonedCarts',
            'wishlists.product:id,name,image,slug,price,promo_price,stock',
            'wishlists.bundle:id,name,slug,image,price,promo_price,stock,is_unavailable',
            'addresses',
        ]);

        // Un coffret n'est PAS en rupture au seul vu de son stock — sa
        // disponibilité dépend de l'accesseur is_available (voir Bundle::
        // getIsAvailableAttribute). On le calcule ici pour que la fiche
        // client affiche le même statut que le site public.
        $user->wishlists->each(function ($w) {
            if ($w->bundle) {
                $w->bundle->is_available = $w->bundle->is_available;
            }
        });

        return response()->json($user);
    }

    public function destroy(User $user)
    {
        if ($user->role === 'admin') {
            return response()->json(['message' => 'Impossible de supprimer un admin.'], 403);
        }
        $user->delete();
        return response()->json(['message' => 'Utilisateur supprimé.']);
    }
}
