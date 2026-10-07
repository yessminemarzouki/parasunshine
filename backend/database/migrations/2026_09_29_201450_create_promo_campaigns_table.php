<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('promo_campaigns', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->unsignedTinyInteger('discount_percentage');
            $table->dateTime('starts_at')->nullable();
            $table->dateTime('ends_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::table('products', function (Blueprint $table) {
            $table->foreignId('promo_campaign_id')
                ->nullable()
                ->after('promo_ends_at')
                ->constrained('promo_campaigns')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['promo_campaign_id']);
            $table->dropColumn('promo_campaign_id');
        });
        Schema::dropIfExists('promo_campaigns');
    }
};
