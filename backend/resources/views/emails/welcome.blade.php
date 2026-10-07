<!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenue</title>
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
            padding-bottom: 20px;
            margin-bottom: 30px;
            background: linear-gradient(135deg, #00d4aa 0%, #1a5242 100%);
            color: white;
            border-radius: 10px;
            padding: 30px;
        }

        .header h1 {
            margin: 0;
            font-size: 32px;
        }

        .welcome-icon {
            font-size: 60px;
            margin-bottom: 10px;
        }

        .features {
            display: grid;
            gap: 15px;
            margin: 30px 0;
        }

        .feature {
            background: #f9fafb;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #00d4aa;
        }

        .feature-icon {
            font-size: 24px;
            margin-right: 10px;
        }

        .btn {
            display: inline-block;
            padding: 15px 40px;
            background: #00d4aa;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
            font-size: 16px;
        }

        .promo-box {
            background: #fef3c7;
            border: 2px dashed #f59e0b;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            margin: 20px 0;
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
        <div class="header">
            <div class="welcome-icon">🌟</div>
            <h1>Bienvenue !</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">
                Merci de rejoindre ParaSunshine
            </p>
        </div>

        <p style="font-size: 18px;">
            Bonjour <strong>{{ $user->name }}</strong>,
        </p>

        <p>
            Nous sommes ravis de vous accueillir dans notre communauté !
            Chez ParaSunshine, nous nous engageons à vous offrir les meilleurs
            produits de parapharmacie avec un service client exceptionnel.
        </p>

        

        <h3 style="color: #1a5242;">Ce qui vous attend :</h3>

        <div class="features">
            <div class="feature">
                <span class="feature-icon">🚚</span>
                <strong>Livraison gratuite</strong> dès 99 DT d'achat
            </div>

           

            <div class="feature">
                <span class="feature-icon">⭐</span>
                <strong>Produits authentiques</strong> - 100% garantis
            </div>

            <div class="feature">
                <span class="feature-icon">💬</span>
                <strong>Support client</strong> - Disponible 7j/7
            </div>
        </div>

        <div style="text-align: center;">
            <a href="{{ config('app.frontend_url') }}/products" class="btn">
                Découvrir nos produits
            </a>
        </div>

        <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
            <strong>Besoin d'aide ?</strong><br>
            Notre équipe est à votre disposition à support@parasunshine.tn
        </p>

        <div class="footer">
            <p>Vous recevez cet email car vous vous êtes inscrit(e) sur ParaSunshine</p>
            <p>&copy; {{ date('Y') }} ParaSunshine - Tous droits réservés</p>
        </div>
    </div>
</body>

</html>