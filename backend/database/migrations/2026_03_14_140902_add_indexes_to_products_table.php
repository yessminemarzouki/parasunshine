<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('products', function (Blueprint $table) {
            $table->index('category_id');
            $table->index('brand_id');
            $table->index('is_featured');
            $table->index('is_new');
            $table->index('is_promo');
            $table->index('is_bestseller');
            $table->index('stock');
            $table->index('slug');
            $table->index('created_at');
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->index('slug');
            $table->index('parent_id');
        });
    }

    public function down()
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['category_id']);
            $table->dropIndex(['brand_id']);
            $table->dropIndex(['is_featured']);
            $table->dropIndex(['is_new']);
            $table->dropIndex(['is_promo']);
            $table->dropIndex(['is_bestseller']);
            $table->dropIndex(['stock']);
            $table->dropIndex(['slug']);
            $table->dropIndex(['created_at']);
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->dropIndex(['slug']);
            $table->dropIndex(['parent_id']);
        });
    }
};
