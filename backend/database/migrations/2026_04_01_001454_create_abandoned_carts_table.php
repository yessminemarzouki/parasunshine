<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('abandoned_carts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('session_id')->nullable(); // Pour les invités
            $table->string('customer_email')->nullable();
            $table->string('customer_name')->nullable();
            $table->json('cart_items'); // Produits dans le panier
            $table->decimal('total', 10, 3);
            $table->timestamp('last_activity')->useCurrent();
            $table->boolean('recovered')->default(false); // Si converti en commande
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('abandoned_carts');
    }
};
