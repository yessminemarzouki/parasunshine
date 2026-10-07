<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::table('product_notifications', function (Blueprint $table) {
            $table->timestamp('processed_at')->nullable()->after('notified');
        });
    }

    public function down(): void
    {
        Schema::table('product_notifications', function (Blueprint $table) {
            $table->dropColumn('processed_at');
        });
    }
};
