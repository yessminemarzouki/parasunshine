<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Modifier les colonnes pour accepter 3 décimales
            $table->decimal('price', 10, 3)->change();
            $table->decimal('promo_price', 10, 3)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Revenir à 2 décimales
            $table->decimal('price', 10, 2)->change();
            $table->decimal('promo_price', 10, 2)->nullable()->change();
        });
    }
};