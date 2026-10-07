<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class () extends Migration {
    public function up(): void
    {
        DB::statement('ALTER TABLE shipping_settings MODIFY free_shipping_threshold DECIMAL(8,3) NULL');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE shipping_settings MODIFY free_shipping_threshold DECIMAL(8,3) NOT NULL DEFAULT 99.000');
    }
};
