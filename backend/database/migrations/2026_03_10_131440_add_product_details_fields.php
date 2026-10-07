<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Points de fidélité
            $table->integer('loyalty_points')->default(0)->after('stock');
            
            // Onglets description détaillée
            $table->text('benefits')->nullable()->after('description'); // Bienfaits
            $table->text('usage_tips')->nullable()->after('benefits'); // Conseils d'utilisation
            
            // Notation moyenne et nombre d'avis (calculés automatiquement)
            $table->decimal('rating', 3, 2)->default(0)->after('usage_tips');
            $table->integer('reviews_count')->default(0)->after('rating');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['loyalty_points', 'benefits', 'usage_tips', 'rating', 'reviews_count']);
        });
    }
};