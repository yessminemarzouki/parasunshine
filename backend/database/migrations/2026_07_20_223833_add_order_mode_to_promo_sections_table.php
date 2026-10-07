<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::table('promo_sections', function (Blueprint $table) {
            $table->string('order_mode')->default('recent')->after('use_auto');
        });
    }

    public function down(): void
    {
        Schema::table('promo_sections', function (Blueprint $table) {
            $table->dropColumn('order_mode');
        });
    }
};
