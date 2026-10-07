<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::table('shipping_settings', function (Blueprint $table) {
            $table->unsignedTinyInteger('delivery_days_min')->default(2)->after('shipping_cost');
            $table->unsignedTinyInteger('delivery_days_max')->default(5)->after('delivery_days_min');
        });
    }

    public function down(): void
    {
        Schema::table('shipping_settings', function (Blueprint $table) {
            $table->dropColumn(['delivery_days_min', 'delivery_days_max']);
        });
    }
};
