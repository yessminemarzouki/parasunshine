<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->unsignedTinyInteger('promo_discount_percentage')->nullable()->after('promo_code');
            $table->decimal('promo_discount_amount', 10, 3)->nullable()->after('promo_discount_percentage');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['promo_discount_percentage', 'promo_discount_amount']);
        });
    }
};
