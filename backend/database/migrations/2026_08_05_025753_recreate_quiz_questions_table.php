<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::dropIfExists('quiz_options');
        Schema::dropIfExists('quiz_questions');

        Schema::create('quiz_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('solution_id')->constrained('quiz_solutions')->cascadeOnDelete();
            $table->string('question');
            $table->string('subtitle')->nullable();
            $table->integer('order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_skippable')->default(true);
            // Branchement : cette question ne s'affiche que si cette option précise a été choisie avant
            $table->unsignedBigInteger('show_if_option_id')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_questions');
    }
};
