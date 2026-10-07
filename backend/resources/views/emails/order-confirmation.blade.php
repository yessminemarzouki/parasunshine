<!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmation de commande</title>
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

        .success-icon {
            font-size: 60px;
            margin-bottom: 10px;
        }

        .order-number {
            background: #f0fdf4;
            border-left: 4px solid #00d4aa;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
        }

        .order-details {
            margin: 20px 0;
        }

        .product-item {
            border-bottom: 1px solid #e5e7eb;
            padding: 15px 0;
            display: flex;
            justify-content: space-between;
        }

        .total-section {
            background: #f9fafb;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
        }

        .total-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
        }

        .total-row.final {
            font-weight: bold;
            font-size: 18px;
            color: #1a5242;
            border-top: 2px solid #00d4aa;
            padding-top: 10px;
            margin-top: 10px;
        }

        .shipping-info {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
        }

        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
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
    </style>
</head>

<body>
    <div class="container">
        <div class="header">
            <div class="success-icon">✅</div>
            <h1>Commande confirmée !</h1>
            <p>Merci pour votre achat, {{ $order->user->name }} !</p>
        </div>

        <div class="order-number">
            <strong>Numéro de commande :</strong> #{{ $order->order_number }}<br>
            <strong>Date :</strong> {{ $order->created_at->format('d/m/Y à H:i') }}
        </div>

        <div class="order-details">
            <h3>Détails de votre commande</h3>
            @foreach($order->items as $item)
            <div class="product-item">
                <div>
                    <strong>{{ $item->product_name }}</strong><br>
                    <small>Quantité : {{ $item->quantity }}</small>
                </div>
                <div>
                    {{ number_format($item->total, 3) }} DT
                </div>
            </div>
            @endforeach
        </div>

        <div class="total-section">
            <div class="total-row">
                <span>Sous-total :</span>
                <span>{{ number_format($order->total, 3) }} DT</span>
            </div>
            <div class="total-row">
                <span>Livraison :</span>
                <span>Gratuite</span>
            </div>
            <div class="total-row final">
                <span>Total :</span>
                <span>{{ number_format($order->total, 3) }} DT</span>
            </div>
        </div>

        <div class="shipping-info">
            <h4 style="margin-top: 0;">📦 Adresse de livraison</h4>
            <p style="margin: 5px 0;">{{ $order->shipping_address }}</p>
            <p style="margin: 5px 0;">{{ $order->shipping_city }}, {{ $order->shipping_postal_code }}</p>
            <p style="margin: 5px 0;">📞 {{ $order->shipping_phone }}</p>
        </div>

        <div style="text-align: center;">
            <a href="{{ config('app.frontend_url') }}/account/orders/{{ $order->id }}" class="btn">
                Suivre ma commande
            </a>
        </div>

        <div class="footer">
            <p>Vous avez des questions ? Contactez-nous à support@parasunshine.tn</p>
            <p>&copy; {{ date('Y') }} ParaSunshine - Tous droits réservés</p>
        </div>
    </div>
</body>

</html>