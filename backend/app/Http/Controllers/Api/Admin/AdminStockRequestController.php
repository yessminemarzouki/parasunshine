<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Mail\StockRequestNotifiedMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class AdminStockRequestController extends Controller
{
    public function index(Request $request)
    {
        $query = DB::table('product_notifications')
            ->leftJoin('products', 'product_notifications.product_id', '=', 'products.id')
            ->leftJoin('bundles', 'product_notifications.bundle_id', '=', 'bundles.id')
            ->select(
                'product_notifications.id',
                'product_notifications.first_name',
                'product_notifications.last_name',
                'product_notifications.phone',
                'product_notifications.size',
                'product_notifications.color',
                'product_notifications.age',
                'product_notifications.quantity',
                'product_notifications.notified',
                'product_notifications.processed_at',
                'product_notifications.created_at',
                'product_notifications.product_id',
                'product_notifications.bundle_id',
                DB::raw("COALESCE(products.name, bundles.name, 'Article supprimé') as item_name"),
                DB::raw("COALESCE(products.image, bundles.image) as item_image"),
                DB::raw("COALESCE(products.stock, bundles.stock) as item_stock"),
                DB::raw("CASE WHEN product_notifications.bundle_id IS NOT NULL THEN 'bundle' ELSE 'product' END as item_type"),
            )
            ->orderByDesc('product_notifications.created_at');

        if ($request->filled('notified')) {
            $query->where('product_notifications.notified', filter_var($request->notified, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->type && in_array($request->type, ['product', 'bundle'])) {
            if ($request->type === 'bundle') {
                $query->whereNotNull('product_notifications.bundle_id');
            } else {
                $query->whereNull('product_notifications.bundle_id');
            }
        }

        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('product_notifications.first_name', 'like', "%{$search}%")
                    ->orWhere('product_notifications.last_name', 'like', "%{$search}%")
                    ->orWhere('product_notifications.phone', 'like', "%{$search}%")
                    ->orWhere('products.name', 'like', "%{$search}%")
                    ->orWhere('bundles.name', 'like', "%{$search}%");
            });
        }

        return response()->json($query->paginate($request->per_page ?? 20));
    }

    public function markNotified($id)
    {
        DB::table('product_notifications')->where('id', $id)->update([
            'notified'     => true,
            'processed_at' => now(),
        ]);
        \Illuminate\Support\Facades\Cache::forget('admin_badges');
        return response()->json(['message' => 'Marqué comme traité.']);
    }

    /**
     * Envoie un email descriptif au client confirmant que sa demande a été
     * traitée et que l'article demandé a été commandé, puis marque la
     * demande comme traitée.
     */
    public function sendAvailabilityEmail($id)
    {
        $req = DB::table('product_notifications')
            ->leftJoin('products', 'product_notifications.product_id', '=', 'products.id')
            ->leftJoin('bundles', 'product_notifications.bundle_id', '=', 'bundles.id')
            ->where('product_notifications.id', $id)
            ->select(
                'product_notifications.*',
                DB::raw("COALESCE(products.name, bundles.name, 'votre article') as item_name"),
            )
            ->first();

        if (!$req) {
            return response()->json(['message' => 'Demande introuvable.'], 404);
        }

        DB::table('product_notifications')->where('id', $id)->update([
            'notified'     => true,
            'processed_at' => now(),
        ]);
        \Illuminate\Support\Facades\Cache::forget('admin_badges');

        $user = $req->user_id ? User::find($req->user_id) : null;

        if (!$user || !$user->email) {
            return response()->json([
                'message' => 'Demande marquée traitée — aucun email trouvé pour ce client (avertissement possible uniquement par téléphone).',
            ]);
        }

        $variantParts = [];
        if (!empty($req->size)) {
            $variantParts[] = "Taille : {$req->size}";
        }
        if (!empty($req->age)) {
            $variantParts[] = "Âge : {$req->age}";
        }
        if (!empty($req->color)) {
            $variantParts[] = "Couleur : {$req->color}";
        }
        $variantLabel = !empty($variantParts) ? implode(' — ', $variantParts) : null;

        try {
            Mail::to($user->email)->send(new StockRequestNotifiedMail(
                $req->first_name,
                $req->item_name,
                $variantLabel,
                (int) ($req->quantity ?? 1),
            ));
        } catch (\Exception $e) {
            Log::error('Erreur envoi email disponibilité stock: ' . $e->getMessage());
            return response()->json([
                'message' => 'Demande marquée traitée, mais l\'envoi de l\'email a échoué.',
            ]);
        }

        return response()->json(['message' => 'Email de disponibilité envoyé avec succès.']);
    }

    public function destroy($id)
    {
        DB::table('product_notifications')->where('id', $id)->delete();
        return response()->json(['message' => 'Demande supprimée.']);
    }
}
