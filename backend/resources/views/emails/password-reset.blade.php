<!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Réinitialisation mot de passe</title>
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

        .icon {
            font-size: 60px;
            margin-bottom: 10px;
        }

        .warning-box {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
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

        .security-note {
            background: #fee2e2;
            border-left: 4px solid #ef4444;
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
    </style>
</head>

<body>
    <div class="container">
        <div class="header">
            <div class="icon">🔒</div>
            <h1>Réinitialisation de mot de passe</h1>
        </div>

        <p>Bonjour,</p>

        <p>
            Vous avez demandé à réinitialiser votre mot de passe pour votre compte
            ParaSunshine associé à l'adresse <strong>{{ $email }}</strong>.
        </p>

        <div class="warning-box">
            <strong>⏰ Attention :</strong> Ce lien est valable pendant <strong>60 minutes</strong> seulement.
        </div>

        <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>

        <div style="text-align: center;">
            <a href="{{ config('app.frontend_url') }}/reset-password?token={{ $token }}&email={{ urlencode($email) }}" class="btn">
                Réinitialiser mon mot de passe
            </a>
        </div>

        <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
            Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
            <a href="{{ config('app.frontend_url') }}/reset-password?token={{ $token }}&email={{ urlencode($email) }}" style="color: #00d4aa; word-break: break-all;">
                {{ config('app.frontend_url') }}/reset-password?token={{ $token }}&email={{ urlencode($email) }}
            </a>
        </p>

        <div class="security-note">
            <strong>🛡️ Vous n'avez pas demandé cette réinitialisation ?</strong><br>
            Ignorez cet email. Votre mot de passe actuel reste inchangé et votre compte est sécurisé.
        </div>

        <div class="footer">
            <p>Pour des raisons de sécurité, ce lien expirera dans 60 minutes</p>
            <p>&copy; {{ date('Y') }} ParaSunshine - Tous droits réservés</p>
        </div>
    </div>
</body>

</html>