<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\User;
use App\Models\Product;
use App\Models\Review;
use App\Models\AbandonedCart;
use App\Models\Contact;
use App\Models\NewsletterSubscriber;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminStatsController extends Controller
{
    public function index(Request $request)
    {
        $cacheKey = 'admin_stats_' . md5($request->get('top_products_from', '') . '_' . $request->get('top_products_to', ''));
        return \Illuminate\Support\Facades\Cache::remember($cacheKey, 60, function () {
            return $this->buildStats();
        });
    }

    private function buildStats()
    {
        // ✅ Toutes les stats en une seule requête optimisée
        $today = now()->startOfDay();
        $thisMonth = now()->startOfMonth();
        $lastMonth = now()->subMonth()->startOfMonth();

        // Commandes
        $totalOrders      = Order::count();
        $pendingOrders    = Order::where('status', 'pending')->count();
        $processingOrders = Order::where('status', 'processing')->count();
        $todayOrders      = Order::whereDate('created_at', today())->count();
        $monthOrders      = Order::where('created_at', '>=', $thisMonth)->count();

        // Revenus RÉELS de la pharmacie — sous-total après réduction promo,
        // HORS frais de livraison (qui reviennent au livreur, pas à ParaSunshine).
        $revenueExpr = 'SUM(subtotal - COALESCE(promo_discount_amount, 0))';

        $totalRevenue     = (float) Order::where('status', 'delivered')->selectRaw($revenueExpr . ' as r')->value('r') ?? 0;
        $monthRevenue     = (float) Order::where('status', 'delivered')
            ->where('created_at', '>=', $thisMonth)
            ->selectRaw($revenueExpr . ' as r')->value('r') ?? 0;
        $lastMonthRevenue = (float) Order::where('status', 'delivered')
            ->whereBetween('created_at', [$lastMonth, $thisMonth])
            ->selectRaw($revenueExpr . ' as r')->value('r') ?? 0;
        $todayRevenue     = (float) Order::where('status', 'delivered')
            ->whereDate('created_at', today())
            ->selectRaw($revenueExpr . ' as r')->value('r') ?? 0;

        // Clients
        $totalClients  = User::where('role', 'user')->count();
        $newThisMonth  = User::where('role', 'user')
            ->where('created_at', '>=', $thisMonth)
            ->count();
        $newLast24h    = User::where('role', 'user')
            ->where('created_at', '>=', now()->subHours(24))
            ->count();

        // Produits
        $totalProducts  = Product::count();
        $lowStock       = Product::where('stock', '<=', 5)->where('stock', '>', 0)->where('is_unavailable', false)->count();
        $outOfStock     = Product::where(function ($q) {
            $q->where('stock', 0)->orWhere('is_unavailable', true);
        })->count();

        // Avis
        $pendingReviews = Review::where('is_approved', false)->count();
        $totalReviews   = Review::count();

        // Paniers abandonnés
        $abandonedCarts = AbandonedCart::where('recovered', false)->count();

        // Messages non lus
        $unreadContacts = Contact::where('is_read', false)->count();

        // Newsletter
        $newsletterSubs = NewsletterSubscriber::where('is_active', true)->count();
        $newsletterNewLast24h = NewsletterSubscriber::where('is_active', true)
            ->where('created_at', '>=', now()->subHours(24))
            ->count();
        // Panier moyen (AOV) — sur les commandes livrées
        $deliveredCount = Order::where('status', 'delivered')->count();
        $averageOrderValue = $deliveredCount > 0 ? $totalRevenue / $deliveredCount : 0;

        // Clients récurrents vs nouveaux (parmi les clients ayant au moins une commande)
        $clientsWithOrders = Order::select('user_id')
            ->whereNotNull('user_id')
            ->groupBy('user_id')
            ->selectRaw('user_id, count(*) as orders_count')
            ->get();
        $repeatClientIds = $clientsWithOrders->where('orders_count', '>', 1)->pluck('user_id');
        $oneTimeClientIds = $clientsWithOrders->where('orders_count', 1)->pluck('user_id');

        $repeatClients = $repeatClientIds->count();
        $oneTimeClients = $oneTimeClientIds->count();

        $loyalClientsDetails = User::whereIn('id', $repeatClientIds)
            ->select('id', 'first_name', 'last_name', 'name', 'email')
            ->get()
            ->map(function ($u) use ($clientsWithOrders) {
                $u->orders_count = $clientsWithOrders->firstWhere('user_id', $u->id)->orders_count ?? 0;
                return $u;
            });
        $oneTimeClientsDetails = User::whereIn('id', $oneTimeClientIds)
            ->select('id', 'first_name', 'last_name', 'name', 'email')
            ->get();

        // Produits jamais vendus
        $soldProductIds = DB::table('order_items')->distinct()->pluck('product_id');
        $neverSoldCount = Product::whereNotIn('id', $soldProductIds)->count();

        // Commandes par statut
        $ordersByStatus = Order::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        // Revenus des 7 derniers jours
        $revenueByDay = Order::where('status', 'delivered')
            ->where('created_at', '>=', now()->subDays(7))
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(subtotal - COALESCE(promo_discount_amount, 0)) as revenue'),
                DB::raw('COUNT(*) as orders')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $thisWeekTotal = $revenueByDay->sum('revenue');
        $previousWeekTotal = (float) Order::where('status', 'delivered')
            ->whereBetween('created_at', [now()->subDays(14), now()->subDays(7)])
            ->selectRaw($revenueExpr . ' as r')->value('r') ?? 0;
        $weekTrend = $previousWeekTotal > 0
            ? round((($thisWeekTotal - $previousWeekTotal) / $previousWeekTotal) * 100, 1)
            : ($thisWeekTotal > 0 ? 100 : 0);

        // Revenus des 6 derniers mois
        $revenueByMonth = Order::where('status', 'delivered')
            ->where('created_at', '>=', now()->subMonths(6))
            ->select(
                DB::raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
                DB::raw('SUM(subtotal - COALESCE(promo_discount_amount, 0)) as revenue'),
                DB::raw('COUNT(*) as orders')
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        // Top produits les plus commandés — uniquement les commandes livrées,
        // filtrable par période, tri par quantité vendue PUIS par montant
        // (en cas d'égalité de quantité).
        $topProductsQuery = DB::table('order_items')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.status', 'delivered');

        if (request()->filled('top_products_from')) {
            $topProductsQuery->whereDate('orders.created_at', '>=', request('top_products_from'));
        }
        if (request()->filled('top_products_to')) {
            $topProductsQuery->whereDate('orders.created_at', '<=', request('top_products_to'));
        }

        $topProducts = $topProductsQuery
            ->select(
                'products.id',
                'products.name',
                'products.image',
                'products.price',
                'products.stock',
                DB::raw('SUM(order_items.quantity) as total_sold'),
                DB::raw('SUM(order_items.total) as total_revenue')
            )
            ->groupBy('products.id', 'products.name', 'products.image', 'products.price', 'products.stock')
            ->orderByDesc('total_sold')
            ->orderByDesc('total_revenue')
            ->limit(15)
            ->get();

        $topProductsCount = $topProducts->count();

        // Synchronise automatiquement le badge "Meilleure vente" avec ce top 15
        $topProductIds = $topProducts->pluck('id')->all();
        Product::whereNotIn('id', $topProductIds)
            ->where('is_bestseller', true)
            ->update(['is_bestseller' => false]);
        Product::whereIn('id', $topProductIds)
            ->where('is_bestseller', false)
            ->update(['is_bestseller' => true]);

        return [
            'orders' => [
          'total'      => $totalOrders,
          'pending'    => $pendingOrders,
          'processing' => $processingOrders,
          'today'      => $todayOrders,
          'this_month' => $monthOrders,
          'by_status'  => $ordersByStatus,
            ],
          'revenue' => [
          'total'          => round($totalRevenue, 3),
          'this_month'     => round($monthRevenue, 3),
          'last_month'     => round($lastMonthRevenue, 3),
          'today'          => round($todayRevenue, 3),
          'this_week'      => round($thisWeekTotal, 3),
          'week_trend'     => $weekTrend,
          'by_day'         => $revenueByDay,
          'by_month'       => $revenueByMonth,
            ],
           'clients' => [
          'total'          => $totalClients,
          'new_this_month' => $newThisMonth,
          'new_last_24h'   => $newLast24h,
            ],
                   'products' => [
          'total'             => $totalProducts,
          'low_stock'         => $lowStock,
          'out_of_stock'      => $outOfStock,
          'top_selling'       => $topProducts,
          'top_selling_count' => $topProductsCount,
            ],
            'reviews' => [
          'pending' => $pendingReviews,
          'total'   => $totalReviews,
            ],
           'abandoned_carts' => $abandonedCarts,
            'unread_contacts' => $unreadContacts,
           'newsletter_subs' => $newsletterSubs,
            'newsletter_new_last_24h' => $newsletterNewLast24h,
            'average_order_value' => round($averageOrderValue, 3),
          'clients_loyalty' => [
          'repeat'          => $repeatClients,
          'one_time'        => $oneTimeClients,
          'repeat_list'     => $loyalClientsDetails,
          'one_time_list'   => $oneTimeClientsDetails,
            ],
                  'never_sold_products' => $neverSoldCount,
        ];
    }
    public function badges()
    {
        return \Illuminate\Support\Facades\Cache::remember('admin_badges', 60, function () {
            return [
                'orders' => [
                    'pending' => Order::where('status', 'pending')->count(),
                ],
                'clients' => [
                    'new_last_24h' => User::where('role', 'user')
                        ->where('created_at', '>=', now()->subHours(24))
                        ->count(),
                ],
                'reviews' => [
                    'pending' => Review::where('is_approved', false)->count(),
                ],
                'unread_contacts' => Contact::where('is_read', false)->count(),
                'newsletter_new_last_24h' => NewsletterSubscriber::where('is_active', true)
                    ->where('created_at', '>=', now()->subHours(24))
                    ->count(),
                'stock_requests' => [
                    'pending' => DB::table('product_notifications')
                        ->where('notified', false)
                        ->count(),
                ],
            ];
        });
    }
}
