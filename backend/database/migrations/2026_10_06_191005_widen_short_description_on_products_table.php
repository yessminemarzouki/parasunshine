<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->longText('description')->nullable()->change();
            $table->longText('short_description')->nullable()->change();
            $table->longText('benefits')->nullable()->change();
            $table->longText('usage_tips')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->text('description')->nullable()->change();
            $table->text('short_description')->nullable()->change();
            $table->text('benefits')->nullable()->change();
            $table->text('usage_tips')->nullable()->change();
        });
    }
};
