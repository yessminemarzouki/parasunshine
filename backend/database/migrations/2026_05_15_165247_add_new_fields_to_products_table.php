<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->boolean('is_unavailable')->default(false)->after('stock');
            $table->boolean('has_sizes')->default(false)->after('is_unavailable');
            $table->json('sizes')->nullable()->after('has_sizes');
            $table->boolean('has_colors')->default(false)->after('sizes');
            $table->json('colors')->nullable()->after('has_colors');
            $table->timestamp('promo_starts_at')->nullable()->after('promo_ends_at');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn([
                'is_unavailable',
                'has_sizes',
                'sizes',
                'has_colors',
                'colors',
                'promo_starts_at',
            ]);
        });
    }
};
