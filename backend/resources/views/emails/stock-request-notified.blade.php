@component('mail::message')
# Bonne nouvelle, {{ $firstName }} !

Votre demande a bien été traitée — ParaSunshine a commandé l'article que vous attendiez, dans la quantité que vous avez demandée :

**{{ $itemName }}**
@if($variantLabel)
{{ $variantLabel }}
@endif

Quantité demandée : **{{ $quantity }}**

Le produit est maintenant disponible et prêt à être commandé sur notre site.

@component('mail::button', ['url' => config('app.frontend_url', config('app.url'))])
Commander maintenant
@endcomponent

Merci de votre confiance,
L'équipe ParaSunshine
@endcomponent