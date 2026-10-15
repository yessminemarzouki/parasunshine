<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Produit de nouveau disponible</title>
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
        .header img { max-height: 70px; margin-bottom: 15px; }
        .header h1 {
            color: #1a5242;
            margin: 0;
            font-size: 24px;
            font-weight: 700;
        }
        .content { padding: 30px; }
        .product-box {
            background: #fef3c7;
            border-left: 4px solid #fde68a;
            padding: 18px;
            margin: 20px 0;
            border-radius: 8px;
            font-size: 15px;
        }
        .product-box strong { color: #1a5242; }
        .btn {
            display: inline-block;
            padding: 14px 34px;
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
            <h1>Produit de nouveau disponible</h1>
        </div>

        <div class="content">
            <p>Bonjour <strong>{{ $firstName }}</strong>,</p>

            <p>
                Bonne nouvelle ! Votre demande a bien été traitée.
                ParaSunshine a commandé l'article que vous attendiez,
                dans la quantité que vous avez demandée.
            </p>

            <div class="product-box">
                <strong>{{ $itemName }}</strong>
                @if($variantLabel)
                    <br><span style="color: #6b7280; font-size: 13px;">{{ $variantLabel }}</span>
                @endif
                <br><br>
                Quantité demandée : <strong>{{ $quantity }}</strong>
            </div>

            <p>
                Le produit est maintenant disponible et prêt à être commandé sur notre site.
            </p>

            <div style="text-align: center;">
                <a href="{{ config('app.frontend_url', config('app.url')) }}" class="btn">
                    Commander maintenant
                </a>
            </div>

            <p style="font-size: 13px; color: #6b7280; margin-top: 25px;">
                Merci de votre confiance,<br>
                L'équipe ParaSunshine
            </p>
        </div>

        <div class="footer">
            <p>&copy; {{ date('Y') }} ParaSunshine - Tous droits réservés</p>
        </div>
    </div>
</body>
</html>