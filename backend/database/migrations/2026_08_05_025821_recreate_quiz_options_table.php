<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('quiz_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_id')->constrained('quiz_questions')->cascadeOnDelete();
            $table->string('label');
            $table->json('tags');
            $table->integer('weight')->default(1);
            $table->integer('order')->default(0);
            $table->timestamps();
        });

        // Ajoute la contrainte de clé étrangère différée (quiz_options doit exister pour quiz_questions.show_if_option_id)
        Schema::table('quiz_questions', function (Blueprint $table) {
            $table->foreign('show_if_option_id')->references('id')->on('quiz_options')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('quiz_questions', function (Blueprint $table) {
            $table->dropForeign(['show_if_option_id']);
        });
        Schema::dropIfExists('quiz_options');
    }
};
