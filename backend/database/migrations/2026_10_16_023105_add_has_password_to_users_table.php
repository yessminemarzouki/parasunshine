<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        if (!Schema::hasColumn('users', 'has_password')) {
            Schema::table('users', function (Blueprint $table) {
                $table->boolean('has_password')->default(false)->after('password');
            });

            // Backfill : utilisateurs non-Google → ont un vrai mot de passe
            DB::table('users')->whereNull('google_id')->update(['has_password' => true]);
            // Utilisateurs Google → false (mdp aléatoire en base, pas "vrai")
            DB::table('users')->whereNotNull('google_id')->update(['has_password' => false]);
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'has_password')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('has_password');
            });
        }
    }
};
