<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('bundle_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bundle_id')->constrained('bundles')->cascadeOnDelete();
            $table->string('customer_name');
            $table->string('customer_email');
            $table->integer('rating');
            $table->text('comment');
            $table->boolean('is_verified')->default(false);
            $table->boolean('is_approved')->default(false);
            $table->boolean('is_rejected')->default(false);
            $table->timestamps();

            $table->index('bundle_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bundle_reviews');
    }
};
