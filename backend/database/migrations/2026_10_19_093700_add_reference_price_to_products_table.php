<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Prix barré (gonflé) affiché pendant la promo
            if (!Schema::hasColumn('products', 'reference_price')) {
                $table->decimal('reference_price', 10, 3)->nullable()->after('price');
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'reference_price')) {
                $table->dropColumn('reference_price');
            }
        });
    }
};
