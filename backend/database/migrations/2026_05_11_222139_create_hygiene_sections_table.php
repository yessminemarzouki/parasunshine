<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hygiene_sections', function (Blueprint $table) {
            $table->id();
            $table->string('title')->default('Hygiène');
            $table->string('image')->nullable();
            $table->string('background_color')->default('#ffffff');
            $table->string('title_color')->default('#111827');
            $table->string('tab_active_color')->default('#1a5242');
            $table->boolean('is_visible')->default(true);
            $table->json('tabs')->nullable(); // [{label, slug}]
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hygiene_sections');
    }
};