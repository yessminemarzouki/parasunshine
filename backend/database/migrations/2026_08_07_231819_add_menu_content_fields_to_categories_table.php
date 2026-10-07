<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            // Image illustrative (utilisée pour les sous-catégories type "Soin")
            $table->string('image')->nullable()->after('icon');

            // Carte promo affichée dans le mega menu (catégories principales)
            $table->string('promo_image')->nullable()->after('image');
            $table->string('promo_title')->nullable()->after('promo_image');
            $table->text('promo_text')->nullable()->after('promo_title');
            $table->string('promo_link')->nullable()->after('promo_text');
            $table->string('promo_cta')->nullable()->after('promo_link');
        });

        Schema::create('category_brand', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->foreignId('brand_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('order')->default(0);
            $table->timestamps();
            $table->unique(['category_id', 'brand_id']);
        });
    }

    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn(['image', 'promo_image', 'promo_title', 'promo_text', 'promo_link', 'promo_cta']);
        });
        Schema::dropIfExists('category_brand');
    }
};
