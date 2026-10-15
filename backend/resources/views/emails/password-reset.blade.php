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
        .header img { max-height: 60px; margin-bottom: 12px; }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 22px;
            font-weight: 700;
        }
        .content { padding: 30px; }
        .warning-box {
            background: #fef3c7;
            border-left: 4px solid #fde68a;
            padding: 15px;
            margin: 20px 0;
            border-radius: 8px;
            font-size: 14px;
        }
        .warning-box strong { color: #1a5242; }
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
        .security-note {
            background: #f3f4f6;
            border-left: 4px solid #6b7280;
            padding: 15px;
            margin: 20px 0;
            border-radius: 8px;
            font-size: 13.5px;
        }
        .security-note strong { color: #1f2937; }
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
            <h1>Réinitialisation de mot de passe</h1>
        </div>

        <div class="content">
            <p>Bonjour,</p>

            <p>
                Vous avez demandé à réinitialiser votre mot de passe pour votre compte
                ParaSunshine, associé à l'adresse <strong>{{ $email }}</strong>.
            </p>

            <div class="warning-box">
                <strong>Attention :</strong> ce lien est valable pendant <strong>60 minutes</strong> seulement.
            </div>

            <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>

            <div style="text-align: center;">
                <a href="{{ config('app.frontend_url') }}/reset-password?token={{ $token }}&email={{ urlencode($email) }}" class="btn">
                    Réinitialiser mon mot de passe
                </a>
            </div>

            <p style="font-size: 13px; color: #6b7280; margin-top: 20px;">
                Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br>
                <a href="{{ config('app.frontend_url') }}/reset-password?token={{ $token }}&email={{ urlencode($email) }}" style="color: #2d7a5f; word-break: break-all;">
                    {{ config('app.frontend_url') }}/reset-password?token={{ $token }}&email={{ urlencode($email) }}
                </a>
            </p>

            <div class="security-note">
                <strong>Vous n'avez pas demandé cette réinitialisation ?</strong><br>
                Ignorez cet email. Votre mot de passe actuel reste inchangé et votre compte est sécurisé.
            </div>
        </div>

        <div class="footer">
            <p>Pour des raisons de sécurité, ce lien expirera dans 60 minutes.</p>
            <p>&copy; {{ date('Y') }} ParaSunshine - Tous droits réservés</p>
        </div>
    </div>
</body>
</html>