<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::table('quiz_results', function (Blueprint $table) {
            $table->foreignId('solution_id')->nullable()->after('user_id')->constrained('quiz_solutions')->nullOnDelete();
            $table->text('explanation')->nullable()->after('recommended_products');
        });
    }

    public function down(): void
    {
        Schema::table('quiz_results', function (Blueprint $table) {
            $table->dropForeign(['solution_id']);
            $table->dropColumn(['solution_id', 'explanation']);
        });
    }
};
