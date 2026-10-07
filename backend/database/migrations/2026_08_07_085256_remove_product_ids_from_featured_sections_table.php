<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::table('featured_sections', function (Blueprint $table) {
            $table->dropColumn('product_ids');
        });
    }

    public function down(): void
    {
        Schema::table('featured_sections', function (Blueprint $table) {
            $table->json('product_ids')->nullable();
        });
    }
};
