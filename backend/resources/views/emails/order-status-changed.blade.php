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
            color: #1f2937;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9fafb;
        }
        .container {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .header {
            background: linear-gradient(135deg, #1a5242 0%, #2d7a5f 100%);
            padding: 35px 30px;
            text-align: center;
        }
        .header img {
            max-height: 60px;
            margin-bottom: 12px;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 22px;
            font-weight: 700;
        }
        .content { padding: 30px; }
        .status-badge {
            display: inline-block;
            padding: 10px 22px;
            border-radius: 20px;
            font-weight: 700;
            font-size: 14px;
            margin: 15px 0;
            color: #ffffff;
            background: #1a5242;
        }
        .status-badge.pending { background: #d4af37; color: #ffffff; }
        .status-badge.processing { background: #2d7a5f; color: #ffffff; }
        .status-badge.shipped { background: #1a5242; color: #ffffff; }
        .status-badge.delivered { background: #1a5242; color: #fef3c7; }
        .status-badge.cancelled { background: #6b7280; color: #ffffff; }
        .order-info {
            background: #f9fafb;
            padding: 18px;
            border-radius: 8px;
            margin: 20px 0;
            font-size: 14px;
        }
        .order-info strong { color: #1a5242; }
        .info-block {
            background: #fef3c7;
            border-left: 4px solid #fde68a;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            font-size: 14px;
        }
        .info-block strong { color: #1a5242; }
        .btn {
            display: inline-block;
            padding: 13px 30px;
            background: linear-gradient(135deg, #1a5242 0%, #2d7a5f 100%);
            color: #ffffff !important;
            text-decoration: none !important;
            border-radius: 10px;
            margin: 15px 0;
            font-weight: 700;
            font-size: 14px;
        }
        .footer {
            text-align: center;
            padding: 25px;
            background: #f9fafb;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 13px;
        }
        .footer a { color: #2d7a5f; text-decoration: none; }
    </style>
</head>
<body>
    @php
        $statusLabels = [
            'pending' => 'En attente',
            'processing' => 'En préparation',
            'shipped' => 'Expédiée',
            'delivered' => 'Livrée',
            'cancelled' => 'Annulée',
        ];
        $currentLabel = $statusLabels[$newStatus ?? 'pending'] ?? 'Mise à jour';
    @endphp

    <div class="container">
        <div class="header">
            <img src="https://www.parasunshine.tn/logo.png" alt="ParaSunshine">
            <h1>Mise à jour de votre commande</h1>
        </div>

        <div class="content">
            <p>Bonjour {{ $order->user->name ?? 'Client' }},</p>

            <p>Le statut de votre commande a été mis à jour :</p>

            <div style="text-align: center;">
                <span class="status-badge {{ $newStatus ?? 'pending' }}">
                    {{ $currentLabel }}
                </span>
            </div>

            <div class="order-info">
                <strong>Commande :</strong> #{{ $order->order_number ?? 'N/A' }}<br>
                <strong>Date :</strong> {{ $order->created_at ? $order->created_at->format('d/m/Y') : 'N/A' }}<br>
                <strong>Total :</strong> {{ number_format($order->total ?? 0, 3) }} DT
            </div>

            @if(isset($newStatus) && $newStatus === 'shipped')
                <div class="info-block">
                    <strong>Votre colis est en route</strong><br>
                    Vous devriez le recevoir sous 2 à 3 jours ouvrables.
                </div>
            @elseif(isset($newStatus) && $newStatus === 'delivered')
                <div class="info-block">
                    <strong>Livraison réussie</strong><br>
                    Nous espérons que vous êtes satisfait(e) de votre achat.
                </div>
            @elseif(isset($newStatus) && $newStatus === 'cancelled')
                <div class="info-block" style="background: #f3f4f6; border-left-color: #9ca3af;">
                    <strong style="color: #6b7280;">Commande annulée</strong><br>
                    Si vous avez des questions, contactez notre service client.
                </div>
            @elseif(isset($newStatus) && $newStatus === 'processing')
                <div class="info-block">
                    <strong>Votre commande est en préparation</strong><br>
                    Nous préparons vos articles avec soin.
                </div>
            @endif

            <div style="text-align: center;">
                <a href="{{ config('app.frontend_url') }}/account/orders/{{ $order->id ?? '' }}" class="btn">
                    Voir ma commande
                </a>
            </div>

            <p style="font-size: 13px; color: #6b7280; margin-top: 25px;">
                Vous avez des questions ? Contactez-nous à
                <a href="mailto:contact@parasunshine.tn" style="color: #2d7a5f;">contact@parasunshine.tn</a>
            </p>
        </div>

        <div class="footer">
            <p>&copy; {{ date('Y') }} ParaSunshine - Tous droits réservés</p>
        </div>
    </div>
</body>
</html>