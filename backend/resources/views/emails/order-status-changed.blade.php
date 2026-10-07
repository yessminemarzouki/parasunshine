<!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mise à jour de commande</title>
    <style>
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }

        .container {
            background: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .header {
            text-align: center;
            border-bottom: 3px solid #00d4aa;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }

        .header h1 {
            color: #1a5242;
            margin: 0;
            font-size: 28px;
        }

        .status-icon {
            font-size: 60px;
            margin-bottom: 10px;
        }

        .status-badge {
            display: inline-block;
            padding: 10px 20px;
            border-radius: 20px;
            font-weight: bold;
            margin: 20px 0;
        }

        .status-pending {
            background: #fef3c7;
            color: #92400e;
        }

        .status-processing {
            background: #dbeafe;
            color: #1e40af;
        }

        .status-shipped {
            background: #fce7f3;
            color: #9f1239;
        }

        .status-delivered {
            background: #d1fae5;
            color: #065f46;
        }

        .status-cancelled {
            background: #fee2e2;
            color: #991b1b;
        }

        .order-info {
            background: #f9fafb;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
        }

        .btn {
            display: inline-block;
            padding: 12px 30px;
            background: #00d4aa;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
        }

        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
    </style>
</head>

<body>
    <div class="container">
        @php
        // 🆕 DÉFINIR LES VARIABLES AVEC VALEURS PAR DÉFAUT
        $statusIcons = [
        'pending' => '⏳',
        'processing' => '📦',
        'shipped' => '🚚',
        'delivered' => '✅',
        'cancelled' => '❌',
        ];

        $statusLabels = [
        'pending' => 'En attente',
        'processing' => 'En préparation',
        'shipped' => 'Expédiée',
        'delivered' => 'Livrée',
        'cancelled' => 'Annulée',
        ];

        // 🆕 UTILISER ?? POUR ÉVITER LES ERREURS
        $currentIcon = $statusIcons[$newStatus ?? 'pending'] ?? '📦';
        $currentLabel = $statusLabels[$newStatus ?? 'pending'] ?? 'Mise à jour';
        @endphp

        <div class="header">
            <div class="status-icon">{{ $currentIcon }}</div>
            <h1>Mise à jour de votre commande</h1>
        </div>

        <p>Bonjour {{ $order->user->name ?? 'Client' }},</p>

        <p>Le statut de votre commande a été mis à jour :</p>

        <div style="text-align: center;">
            <span class="status-badge status-{{ $newStatus ?? 'pending' }}">
                {{ $currentLabel }}
            </span>
        </div>

        <div class="order-info">
            <strong>Commande :</strong> #{{ $order->order_number ?? 'N/A' }}<br>
            <strong>Date :</strong> {{ $order->created_at ? $order->created_at->format('d/m/Y') : 'N/A' }}<br>
            <strong>Total :</strong> {{ number_format($order->total ?? 0, 3) }} DT
        </div>

        @if(isset($newStatus) && $newStatus === 'shipped')
        <div style="background: #dbeafe; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>📦 Votre colis est en route !</strong><br>
            Vous devriez le recevoir sous 2 à 3 jours ouvrables.
        </div>
        @elseif(isset($newStatus) && $newStatus === 'delivered')
        <div style="background: #d1fae5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>🎉 Livraison réussie !</strong><br>
            Nous espérons que vous êtes satisfait(e) de votre achat !
        </div>
        @elseif(isset($newStatus) && $newStatus === 'cancelled')
        <div style="background: #fee2e2; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>❌ Commande annulée</strong><br>
            Si vous avez des questions, contactez notre service client.
        </div>
        @endif

        <div style="text-align: center;">
            <a href="{{ config('app.frontend_url') }}/account/orders/{{ $order->id ?? '' }}" class="btn">
                Voir ma commande
            </a>
        </div>

        <div class="footer">
            <p>Vous avez des questions ? Contactez-nous à support@parasunshine.tn</p>
            <p>&copy; {{ date('Y') }} ParaSunshine - Tous droits réservés</p>
        </div>
    </div>
</body>

</html>