<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Recalcule les points de fidélité pour tous les produits existants
        // Utilise une requête SQL directe pour être plus performant

        DB::statement('
            UPDATE products 
            SET loyalty_points = FLOOR(
                CASE 
                    WHEN promo_price IS NOT NULL AND promo_price < price 
                    THEN promo_price 
                    ELSE price 
                END
            )
        ');
    }

    public function down(): void
    {
        // Pas de rollback nécessaire
        // On pourrait remettre les points à 0 si besoin
        // DB::statement('UPDATE products SET loyalty_points = 0');
    }
};
