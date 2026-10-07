<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::table('quiz_solutions', function (Blueprint $table) {
            $table->string('advice_video')->nullable()->after('image');
            $table->string('advice_video_poster')->nullable()->after('advice_video');
            $table->string('advice_video_title')->nullable()->after('advice_video_poster');
        });
    }

    public function down(): void
    {
        Schema::table('quiz_solutions', function (Blueprint $table) {
            $table->dropColumn(['advice_video', 'advice_video_poster', 'advice_video_title']);
        });
    }
};
