@php
    $shipping = \App\Models\ShippingSetting::getOrCreate();
@endphp
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenue chez ParaSunshine</title>
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
            padding: 40px 30px;
            text-align: center;
        }
        .header img {
            max-height: 70px;
            margin-bottom: 15px;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        .header p {
            color: #fef3c7;
            margin: 8px 0 0 0;
            font-size: 16px;
        }
        .content {
            padding: 35px 30px;
            background: #ffffff;
        }
        .content p {
            color: #374151;
            font-size: 15px;
            margin: 0 0 15px 0;
        }
        .content h3 {
            color: #1a5242;
            font-size: 17px;
            margin: 25px 0 15px 0;
        }
        .feature {
            background: #fef3c7;
            border-left: 4px solid #fde68a;
            padding: 15px 18px;
            border-radius: 8px;
            margin: 12px 0;
        }
        .feature strong {
            color: #1a5242;
            font-size: 14.5px;
        }
        .btn {
            display: inline-block;
            padding: 14px 32px;
            background: linear-gradient(135deg, #1a5242 0%, #2d7a5f 100%);
            color: #ffffff !important;
            text-decoration: none !important;
            border-radius: 10px;
            margin: 20px 0;
            font-weight: 700;
            font-size: 15px;
        }
        .footer {
            text-align: center;
            padding: 25px 30px;
            background: #f9fafb;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 13px;
        }
        .footer a {
            color: #2d7a5f;
            text-decoration: none;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://www.parasunshine.tn/logo.png" alt="ParaSunshine">
            <h1>Bienvenue chez ParaSunshine</h1>
            <p>Merci de nous rejoindre</p>
        </div>

        <div class="content">
            <p>Bonjour <strong>{{ $user->first_name ?? $user->name }}</strong>,</p>

            <p>
                Nous sommes ravis de vous accueillir dans notre communauté.
                Chez ParaSunshine, nous nous engageons à vous offrir les meilleurs
                produits de parapharmacie avec un service client de qualité.
            </p>

            <h3>Ce qui vous attend</h3>

            @if($shipping->free_shipping_enabled)
                <div class="feature">
                    <strong>Livraison gratuite</strong> dès {{ number_format($shipping->free_shipping_threshold, 0) }} DT d'achat
                </div>
            @endif

            <div class="feature">
                <strong>Produits authentiques</strong> — 100% garantis d'origine officielle
            </div>

            <div class="feature">
                <strong>Support client</strong> — Du lundi au samedi, 9h à 20h
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="{{ config('app.frontend_url') }}/products" class="btn">
                    Découvrir nos produits
                </a>
            </div>

            <p style="font-size: 14px; color: #6b7280;">
                <strong style="color: #1a5242;">Besoin d'aide ?</strong><br>
                Notre équipe est à votre disposition à
                <a href="mailto:contact@parasunshine.tn" style="color: #2d7a5f;">contact@parasunshine.tn</a>
            </p>
        </div>

        <div class="footer">
            <p>Vous recevez cet email car vous vous êtes inscrit(e) sur ParaSunshine.</p>
            <p>&copy; {{ date('Y') }} ParaSunshine - Tous droits réservés</p>
        </div>
    </div>
</body>
</html>