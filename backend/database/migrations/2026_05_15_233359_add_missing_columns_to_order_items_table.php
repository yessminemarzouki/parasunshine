<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            if (!Schema::hasColumn('order_items', 'product_name')) {
                $table->string('product_name')->nullable()->after('product_id');
            }
            if (!Schema::hasColumn('order_items', 'selected_size')) {
                $table->string('selected_size')->nullable()->after('total');
            }
            if (!Schema::hasColumn('order_items', 'selected_color')) {
                $table->string('selected_color')->nullable()->after('selected_size');
            }
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn(['product_name', 'selected_size', 'selected_color']);
        });
    }
};
