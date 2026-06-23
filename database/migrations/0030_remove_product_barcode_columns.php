<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('products') && Schema::hasColumn('products', 'barcode')) {
            Schema::table('products', function (Blueprint $table): void {
                $table->dropColumn('barcode');
            });
        }

        if (Schema::hasTable('product_variations') && Schema::hasColumn('product_variations', 'barcode')) {
            Schema::table('product_variations', function (Blueprint $table): void {
                $table->dropColumn('barcode');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('products') && ! Schema::hasColumn('products', 'barcode')) {
            Schema::table('products', function (Blueprint $table): void {
                $table->string('barcode', 100)->nullable();
            });
        }

        if (Schema::hasTable('product_variations') && ! Schema::hasColumn('product_variations', 'barcode')) {
            Schema::table('product_variations', function (Blueprint $table): void {
                $table->string('barcode', 100)->nullable();
            });
        }
    }
};
