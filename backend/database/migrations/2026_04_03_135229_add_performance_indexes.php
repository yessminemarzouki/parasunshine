<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ✅ Index sur orders pour accélérer les requêtes admin
        Schema::table('orders', function (Blueprint $table) {
            if (!$this->indexExists('orders', 'orders_status_created_at_index')) {
                $table->index(['status', 'created_at']);
            }
            if (!$this->indexExists('orders', 'orders_user_id_status_index')) {
                $table->index(['user_id', 'status']);
            }
        });

        // ✅ Index sur order_items
        Schema::table('order_items', function (Blueprint $table) {
            if (!$this->indexExists('order_items', 'order_items_order_id_index')) {
                $table->index('order_id');
            }
            if (!$this->indexExists('order_items', 'order_items_product_id_index')) {
                $table->index('product_id');
            }
        });

        // ✅ Index sur reviews
        Schema::table('reviews', function (Blueprint $table) {
            if (!$this->indexExists('reviews', 'reviews_is_approved_index')) {
                $table->index('is_approved');
            }
            if (!$this->indexExists('reviews', 'reviews_product_id_is_approved_index')) {
                $table->index(['product_id', 'is_approved']);
            }
        });

        // ✅ Index sur abandoned_carts
        Schema::table('abandoned_carts', function (Blueprint $table) {
            if (!$this->indexExists('abandoned_carts', 'abandoned_carts_user_id_index')) {
                $table->index('user_id');
            }
        });

        // ✅ Index sur users
        Schema::table('users', function (Blueprint $table) {
            if (!$this->indexExists('users', 'users_role_index')) {
                $table->index('role');
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['status', 'created_at']);
            $table->dropIndex(['user_id', 'status']);
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->dropIndex(['order_id']);
            $table->dropIndex(['product_id']);
        });

        Schema::table('reviews', function (Blueprint $table) {
            $table->dropIndex(['is_approved']);
            $table->dropIndex(['product_id', 'is_approved']);
        });

        Schema::table('abandoned_carts', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['role']);
        });
    }

    private function indexExists(string $table, string $index): bool
    {
        try {
            $sm = \Illuminate\Support\Facades\DB::getDoctrineSchemaManager();
            $indexes = $sm->listTableIndexes($table);
            return array_key_exists($index, $indexes);
        } catch (\Exception $e) {
            return false;
        }
    }
};
