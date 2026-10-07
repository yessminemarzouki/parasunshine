<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class NewOrderNotification extends Notification
{
    use Queueable;

    public $order;

    public function __construct(Order $order)
    {
        $this->order = $order;
    }

    public function via($notifiable)
    {
        return ['database', 'mail']; // Database pour le badge Filament + Email
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('🛒 Nouvelle commande #' . $this->order->order_number)
            ->greeting('Bonjour Admin,')
            ->line('Une nouvelle commande vient d\'être passée !')
            ->line('**Numéro de commande :** #' . $this->order->order_number)
            ->line('**Client :** ' . $this->order->user->name)
            ->line('**Montant total :** ' . number_format($this->order->total, 3) . ' DT')
            ->line('**Articles :** ' . $this->order->items->count())
            ->action('Voir la commande', url('/admin/orders/' . $this->order->id))
            ->line('Merci de traiter cette commande rapidement !');
    }

    public function toArray($notifiable)
    {
        return [
            'order_id' => $this->order->id,
            'order_number' => $this->order->order_number,
            'customer_name' => $this->order->user->name,
            'total' => $this->order->total,
            'items_count' => $this->order->items->count(),
        ];
    }
}
