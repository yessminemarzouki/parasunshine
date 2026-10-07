<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->boolean('show_in_menu')->default(true)->after('sort');
            $table->boolean('show_in_megamenu')->default(true)->after('show_in_menu');
            $table->string('icon')->nullable()->after('show_in_megamenu');
        });
    }

    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn(['show_in_menu', 'show_in_megamenu', 'icon']);
        });
    }
};
