<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        // 1. Nouvelle colonne sur promo_codes
        if (!Schema::hasColumn('promo_codes', 'usage_limit_per_user')) {
            Schema::table('promo_codes', function (Blueprint $table) {
                $table->unsignedInteger('usage_limit_per_user')
                      ->nullable()
                      ->after('usage_limit');
            });
        }

        // 2. Nouvelle table d'historique par utilisateur
        if (!Schema::hasTable('promo_code_usages')) {
            Schema::create('promo_code_usages', function (Blueprint $table) {
                $table->id();
                $table->foreignId('promo_code_id')->constrained()->cascadeOnDelete();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
                $table->timestamps();

                $table->index(['promo_code_id', 'user_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('promo_code_usages');

        if (Schema::hasColumn('promo_codes', 'usage_limit_per_user')) {
            Schema::table('promo_codes', function (Blueprint $table) {
                $table->dropColumn('usage_limit_per_user');
            });
        }
    }
};
