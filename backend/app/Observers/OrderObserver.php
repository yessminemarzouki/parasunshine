<?php

namespace App\Observers;

use App\Models\Order;
use App\Mail\OrderStatusChangedMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class OrderObserver
{
    /**
     * Handle the Order "updated" event.
     */
    public function updated(Order $order): void
    {
        // Vérifier si le statut a changé
        if ($order->isDirty('status')) {
            $oldStatus = $order->getOriginal('status');
            $newStatus = $order->status;

            // Ne pas envoyer d'email si c'est la première fois (création)
            if ($oldStatus && $newStatus !== $oldStatus) {
                try {
                    Mail::to($order->user->email)
                        ->send(new OrderStatusChangedMail($order, $oldStatus, $newStatus));

                    Log::info('Email de changement de statut envoyé pour la commande #' . $order->order_number);
                } catch (\Exception $e) {
                    Log::error('Erreur envoi email changement statut: ' . $e->getMessage());
                }
            }
        }
    }
}
