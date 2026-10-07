<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StockRequestNotifiedMail extends Mailable
{
    use Queueable;
    use SerializesModels;

    public function __construct(
        public string $firstName,
        public string $itemName,
        public ?string $variantLabel = null,
        public int $quantity = 1,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Bonne nouvelle — votre produit est disponible !',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.stock-request-notified',
        );
    }
}
