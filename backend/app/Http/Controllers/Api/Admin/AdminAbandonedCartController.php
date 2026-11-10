<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AbandonedCart;
use Illuminate\Http\Request;

class AdminAbandonedCartController extends Controller
{
    private function baseQuery(Request $request)
    {
        $query = AbandonedCart::query();

        $idle = max(0, (int) $request->get('idle_minutes', 60));
        if ($idle > 0) {
            $query->where('last_activity', '<=', now()->subMinutes($idle));
        }

        $status = $request->get('status', 'pending');
        if ($status === 'pending') {
            $query->where('recovered', false)->whereNull('cancelled_at');
        } elseif ($status === 'recovered') {
            $query->where('recovered', true);
        } elseif ($status === 'cancelled') {
            $query->whereNotNull('cancelled_at');
        }

        if ($request->filled('from')) {
            $query->whereDate('last_activity', '>=', $request->get('from'));
        }
        if ($request->filled('to')) {
            $query->whereDate('last_activity', '<=', $request->get('to'));
        }

        if ($request->filled('search')) {
            $s = trim($request->get('search'));
            $query->where(function ($q) use ($s) {
                $q->where('customer_name', 'like', "%{$s}%")
                    ->orWhere('customer_email', 'like', "%{$s}%")
                    ->orWhereHas('user', fn ($u) => $u->where('phone', 'like', "%{$s}%"));
            });
        }

        return $query;
    }

    private function applyType($query, Request $request)
    {
        $type = $request->get('type');
        if ($type === 'guests') {
            $query->whereNull('user_id');
        } elseif ($type === 'customers') {
            $query->whereNotNull('user_id');
        }

        return $query;
    }

    public function index(Request $request)
    {
        $base = $this->baseQuery($request);

        $row = (clone $base)->selectRaw(
            'COALESCE(SUM(CASE WHEN user_id IS NULL THEN 1 ELSE 0 END), 0) AS guests_count,
             COALESCE(SUM(CASE WHEN user_id IS NULL THEN total ELSE 0 END), 0) AS guests_value,
             COALESCE(SUM(CASE WHEN user_id IS NOT NULL THEN 1 ELSE 0 END), 0) AS customers_count,
             COALESCE(SUM(CASE WHEN user_id IS NOT NULL THEN total ELSE 0 END), 0) AS customers_value'
        )->first();

        $stats = [
            'guests_count'    => (int) $row->guests_count,
            'guests_value'    => round((float) $row->guests_value, 3),
            'customers_count' => (int) $row->customers_count,
            'customers_value' => round((float) $row->customers_value, 3),
            'cancelled_total' => AbandonedCart::whereNotNull('cancelled_at')->count(),
        ];

        $this->applyType($base, $request);

        $perPage = min(max((int) $request->get('per_page', 20), 1), 50);

        $carts = $base
            ->with('user:id,name,first_name,last_name,email,phone')
            ->orderByDesc('last_activity')
            ->paginate($perPage);

        return response()->json([
            'stats' => $stats,
            'carts' => $carts,
        ]);
    }






    public function destroy(AbandonedCart $abandonedCart)
    {
        $abandonedCart->delete();

        return response()->json(['message' => 'Panier supprimé.']);
    }

    public function purge(Request $request)
    {
        $validated = $request->validate([
            'days' => 'required|integer|min:7|max:365',
        ]);

        $count = AbandonedCart::whereNull('user_id')
            ->where('last_activity', '<', now()->subDays($validated['days']))
            ->delete();

        return response()->json([
            'message' => "{$count} panier(s) visiteur supprimé(s).",
            'deleted' => $count,
        ]);
    }
}
