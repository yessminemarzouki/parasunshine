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
            background: #ffffff;
            padding: 35px 30px 25px 30px;
            text-align: center;
            border-bottom: 3px solid #1a5242;
        }
        .header img {
            max-height: 70px;
            margin-bottom: 15px;
        }
        .header h1 {
            color: #1a5242;
            margin: 0;
            font-size: 24px;
            font-weight: 700;
        }
        .header p {
            color: #6b7280;
            margin: 6px 0 0 0;
            font-size: 15px;
        }
        .content { padding: 30px; }
        .order-number {
            background: #fef3c7;
            border-left: 4px solid #fde68a;
            padding: 15px;
            margin: 20px 0;
            border-radius: 8px;
            font-size: 14px;
        }
        .order-number strong { color: #1a5242; }
        .product-item {
            border-bottom: 1px solid #e5e7eb;
            padding: 14px 0;
            font-size: 14px;
        }
        .product-item strong { color: #1f2937; }
        .total-section {
            background: #f9fafb;
            padding: 18px;
            border-radius: 8px;
            margin-top: 20px;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            font-size: 14px;
        }
        .total-row.final {
            font-weight: 700;
            font-size: 17px;
            color: #1a5242;
            border-top: 2px solid #2d7a5f;
            padding-top: 12px;
            margin-top: 12px;
        }
        .shipping-info {
            background: #fef3c7;
            border-left: 4px solid #fde68a;
            padding: 15px;
            margin: 20px 0;
            border-radius: 8px;
            font-size: 14px;
        }
        .shipping-info h4 {
            margin: 0 0 10px 0;
            color: #1a5242;
            font-size: 14px;
        }
        .shipping-info p { margin: 4px 0; }
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
    <div class="container">
        <div class="header">
            <img src="https://www.parasunshine.tn/logo.png" alt="ParaSunshine">
            <h1>Commande confirmée</h1>
            <p>Merci pour votre achat</p>
        </div>

        <div class="content">
            <p>Bonjour <strong>{{ $order->user->name }}</strong>,</p>

            <p>
                Nous avons bien reçu votre commande et nous vous en remercions.
                Elle est en cours de traitement et sera expédiée sous 24 à 48 heures.
            </p>

            <div class="order-number">
                <strong>Numéro de commande :</strong> #{{ $order->order_number }}<br>
                <strong>Date :</strong> {{ $order->created_at->format('d/m/Y à H:i') }}
            </div>

            <h3 style="color: #1a5242; font-size: 16px; margin: 20px 0 10px 0;">Détails de votre commande</h3>

            @foreach($order->items as $item)
                <div class="product-item">
                    <strong>{{ $item->product_name }}</strong><br>
                    <span style="color: #6b7280; font-size: 13px;">Quantité : {{ $item->quantity }}</span>
                    <span style="float: right; font-weight: 600; color: #1a5242;">
                        {{ number_format($item->total, 3) }} DT
                    </span>
                </div>
            @endforeach

            <div class="total-section">
                <div class="total-row">
                    <span>Sous-total :</span>
                    <span>{{ number_format($order->subtotal, 3) }} DT</span>
                </div>
                @if($order->promo_discount_amount)
                    <div class="total-row" style="color: #2d7a5f;">
                        <span>Remise ({{ $order->promo_code }}) :</span>
                        <span>-{{ number_format($order->promo_discount_amount, 3) }} DT</span>
                    </div>
                @endif
                <div class="total-row">
                    <span>Livraison :</span>
                    <span>{{ $order->shipping_cost > 0 ? number_format($order->shipping_cost, 3) . ' DT' : 'Gratuite' }}</span>
                </div>
                <div class="total-row final">
                    <span>Total :</span>
                    <span>{{ number_format($order->total, 3) }} DT</span>
                </div>
            </div>

            <div class="shipping-info">
                <h4>Adresse de livraison</h4>
                <p>{{ $order->shipping_address }}</p>
                @if($order->shipping_city)
                    <p>{{ $order->shipping_city }}{{ $order->shipping_postal_code ? ', ' . $order->shipping_postal_code : '' }}</p>
                @endif
                <p>Téléphone : {{ $order->shipping_phone }}</p>
            </div>

            <div style="text-align: center;">
                <a href="{{ config('app.frontend_url') }}/account/orders/{{ $order->id }}" class="btn">
                    Suivre ma commande
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