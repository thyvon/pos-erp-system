<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('products')) {
            if (in_array(DB::getDriverName(), ['mysql', 'mariadb'], true)) {
                try {
                    DB::statement('ALTER TABLE products DROP INDEX products_search_fulltext');
                } catch (\Throwable) {
                }
            }

            Schema::table('products', function (Blueprint $table) {
                if (Schema::hasColumn('products', 'barcode')) {
                    $table->dropColumn('barcode');
                }

                // ❌ removed image_url logic
            });

            if (in_array(DB::getDriverName(), ['mysql', 'mariadb'], true)) {
                try {
                    DB::statement('ALTER TABLE products ADD FULLTEXT products_search_fulltext (name, sku)');
                } catch (\Throwable) {
                }
            }
        }

        if (Schema::hasTable('product_variations')) {
            Schema::table('product_variations', function (Blueprint $table) {
                if (Schema::hasColumn('product_variations', 'barcode')) {
                    $table->dropColumn('barcode');
                }

                // ❌ removed image_url logic
            });
        }

        if (Schema::hasTable('product_packagings') && Schema::hasColumn('product_packagings', 'barcode')) {
            Schema::table('product_packagings', function (Blueprint $table) {
                $table->dropColumn('barcode');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('products')) {
            if (in_array(DB::getDriverName(), ['mysql', 'mariadb'], true)) {
                try {
                    DB::statement('ALTER TABLE products DROP INDEX products_search_fulltext');
                } catch (\Throwable) {
                }
            }

            Schema::table('products', function (Blueprint $table) {
                if (! Schema::hasColumn('products', 'barcode')) {
                    $table->string('barcode', 100)->nullable()->after('sku');
                }

                // ❌ no restore image_url
            });

            if (in_array(DB::getDriverName(), ['mysql', 'mariadb'], true)) {
                try {
                    DB::statement('ALTER TABLE products ADD FULLTEXT products_search_fulltext (name, sku, barcode)');
                } catch (\Throwable) {
                }
            }
        }

        if (Schema::hasTable('product_variations')) {
            Schema::table('product_variations', function (Blueprint $table) {
                if (! Schema::hasColumn('product_variations', 'barcode')) {
                    $table->string('barcode', 100)->nullable()->after('sku');
                }

                // ❌ no restore image_url
            });
        }

        if (Schema::hasTable('product_packagings') && ! Schema::hasColumn('product_packagings', 'barcode')) {
            Schema::table('product_packagings', function (Blueprint $table) {
                $table->string('barcode', 100)->nullable()->after('sku');
            });
        }
    }
};
