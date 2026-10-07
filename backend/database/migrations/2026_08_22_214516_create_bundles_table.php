<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('bundles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->foreignId('brand_id')->nullable()->constrained('brands')->nullOnDelete();
            $table->foreignId('bundle_category_id')->nullable()->constrained('bundle_categories')->nullOnDelete();
            $table->text('description')->nullable();
            $table->string('image')->nullable();
            $table->json('images')->nullable();

            $table->decimal('price', 10, 3);
            $table->enum('price_mode', ['manual', 'auto'])->default('manual');
            $table->decimal('promo_price', 10, 3)->nullable();
            $table->integer('discount_percentage')->nullable();
            $table->timestamp('promo_starts_at')->nullable();
            $table->timestamp('promo_ends_at')->nullable();

            $table->integer('stock')->default(0);
            $table->boolean('is_unavailable')->default(false);

            $table->decimal('rating', 3, 2)->default(0);
            $table->integer('reviews_count')->default(0);

            $table->timestamps();

            $table->index(['is_unavailable', 'stock']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bundles');
    }
};
