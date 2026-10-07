<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::table('product_notifications', function (Blueprint $table) {
            $table->string('first_name')->nullable()->after('product_id');
            $table->string('last_name')->nullable()->after('first_name');
            $table->string('phone')->nullable()->after('last_name');
            $table->boolean('notified')->default(false)->after('phone');
            $table->string('email')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('product_notifications', function (Blueprint $table) {
            $table->dropColumn(['first_name', 'last_name', 'phone', 'notified']);
        });
    }
};
