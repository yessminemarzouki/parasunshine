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
        .info-box {
            background: #fef3c7;
            border-left: 4px solid #fde68a;
            padding: 15px;
            margin: 20px 0;
            border-radius: 8px;
            font-size: 14px;
        }
        .info-box strong { color: #1a5242; }
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
            <h1>Mot de passe modifié</h1>
        </div>

        <div class="content">
            <p>Bonjour {{ $user->first_name ?? $user->name }},</p>

            <p>
                Nous vous confirmons que le mot de passe de votre compte ParaSunshine,
                associé à l'adresse <strong>{{ $user->email }}</strong>,
                vient d'être modifié avec succès.
            </p>

            <div class="info-box">
                <strong>Date :</strong> {{ now()->locale('fr')->translatedFormat('d F Y à H:i') }}
            </div>

            <div class="security-note">
                <strong>Vous n'êtes pas à l'origine de ce changement ?</strong><br>
                Contactez-nous immédiatement à
                <a href="mailto:contact@parasunshine.tn" style="color: #2d7a5f;">contact@parasunshine.tn</a>
                pour sécuriser votre compte.
            </div>
        </div>

        <div class="footer">
            <p>&copy; {{ date('Y') }} ParaSunshine - Tous droits réservés</p>
        </div>
    </div>
</body>
</html>