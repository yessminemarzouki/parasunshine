<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promo_sections', function (Blueprint $table) {
            $table->id();
            $table->string('title')->default('Top Promo');
            $table->string('background_color')->default('#faf0e6');
            $table->string('title_color')->default('#1a1a1a');
            $table->boolean('is_visible')->default(true);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->json('product_ids')->nullable();
            $table->boolean('use_auto')->default(true); // true = utilise is_promo, false = produits manuels
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promo_sections');
    }
};