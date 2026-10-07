<!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mot de passe modifié</title>
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
            border-bottom: 3px solid #1a5242;
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

        .security-note {
            background: #fee2e2;
            border-left: 4px solid #ef4444;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
        }

        .info-box {
            background: #f0fdf4;
            border-left: 4px solid #1a5242;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
            font-size: 14px;
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
            <h1>Mot de passe modifié</h1>
        </div>

        <p>Bonjour {{ $user->first_name ?? $user->name }},</p>

        <p>
            Nous vous confirmons que le mot de passe de votre compte ParaSunshine
            associé à l'adresse <strong>{{ $user->email }}</strong> vient d'être modifié avec succès.
        </p>

        <div class="info-box">
            <strong>📅 Date :</strong> {{ now()->locale('fr')->translatedFormat('d F Y à H:i') }}
        </div>

        <div class="security-note">
            <strong>🛡️ Vous n'êtes pas à l'origine de ce changement ?</strong><br>
            Contactez-nous immédiatement via notre formulaire de contact pour sécuriser votre compte.
        </div>

        <div class="footer">
            <p>&copy; {{ date('Y') }} ParaSunshine - Tous droits réservés</p>
        </div>
    </div>
</body>

</html>