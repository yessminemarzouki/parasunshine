<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Par défaut : catégorie principale affichée, secondaire non —
            // cohérent avec le comportement actuel et l'import Excel (la
            // 1ère catégorie saisie est celle affichée par défaut).
            $table->boolean('display_category1')->default(true)->after('category_id');
            $table->boolean('display_category2')->default(false)->after('category2_id');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['display_category1', 'display_category2']);
        });
    }
};
