<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::table('product_notifications', function (Blueprint $table) {
            $table->string('size')->nullable()->after('product_id');
            $table->string('color')->nullable()->after('size');
            $table->string('age')->nullable()->after('color');
            $table->unsignedInteger('quantity')->default(1)->after('age');
        });
    }

    public function down(): void
    {
        Schema::table('product_notifications', function (Blueprint $table) {
            $table->dropColumn(['size', 'color', 'age', 'quantity']);
        });
    }
};
