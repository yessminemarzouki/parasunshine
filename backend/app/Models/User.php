<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Auth\Passwords\CanResetPassword;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens;
    use Notifiable;
    use CanResetPassword;

    protected $fillable = [
         'name',
         'first_name',
         'last_name',
         'email',
         'password',
         'phone',
         'phone_history',
         'role',
         'google_id',
         'birthdate',
         'civility',
         'newsletter_opt_in',
         'last_seen_orders_at',
         'last_seen_users_at',
         'last_seen_reviews_at',
         'last_seen_contacts_at',
         'last_seen_newsletter_at',
         'last_seen_stock_at',
     ];

    protected $hidden = [
        'password',
        'remember_token',
    ];


    protected $casts = [
         'email_verified_at'       => 'datetime',
         'password'                => 'hashed',
         'newsletter_opt_in'       => 'boolean',
         'phone_history'           => 'array',
         'last_seen_orders_at'     => 'datetime',
         'last_seen_users_at'      => 'datetime',
         'last_seen_reviews_at'    => 'datetime',
         'last_seen_contacts_at'   => 'datetime',
         'last_seen_newsletter_at' => 'datetime',
         'last_seen_stock_at'      => 'datetime',
     ];

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function wishlists()
    {
        return $this->hasMany(Wishlist::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class, 'customer_email', 'email');
    }

    public function abandonedCarts()
    {
        return $this->hasMany(AbandonedCart::class);
    }
    public function addresses()
    {
        return $this->hasMany(Address::class);
    }

    /**
     * Enregistre un nouveau numéro de téléphone.
     * - Met à jour `phone` (numéro actuel)
     * - Ajoute le numéro à `phone_history` (sans doublons)
     */
    public function recordPhone(?string $newPhone): void
    {
        $newPhone = trim((string) $newPhone);
        if ($newPhone === '') {
            return;
        }

        $history = $this->phone_history ?? [];

        // Ajoute tous les anciens numéros à l'historique s'ils n'y sont pas
        if ($this->phone && !in_array($this->phone, $history, true)) {
            $history[] = $this->phone;
        }

        // Ajoute le nouveau numéro à l'historique s'il n'y est pas déjà
        if (!in_array($newPhone, $history, true)) {
            $history[] = $newPhone;
        }

        // Met à jour le numéro actuel + l'historique
        $this->update([
            'phone'         => $newPhone,
            'phone_history' => $history,
        ]);
    }
}
