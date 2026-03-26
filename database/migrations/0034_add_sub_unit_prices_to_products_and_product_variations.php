<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table): void {
            $table->decimal('sub_unit_selling_price', 14, 2)->nullable()->after('purchase_price');
            $table->decimal('sub_unit_purchase_price', 14, 2)->nullable()->after('sub_unit_selling_price');
        });

        Schema::table('product_variations', function (Blueprint $table): void {
            $table->decimal('sub_unit_selling_price', 14, 2)->nullable()->after('purchase_price');
            $table->decimal('sub_unit_purchase_price', 14, 2)->nullable()->after('sub_unit_selling_price');
        });
    }

    public function down(): void
    {
        Schema::table('product_variations', function (Blueprint $table): void {
            $table->dropColumn(['sub_unit_selling_price', 'sub_unit_purchase_price']);
        });

        Schema::table('products', function (Blueprint $table): void {
            $table->dropColumn(['sub_unit_selling_price', 'sub_unit_purchase_price']);
        });
    }
};
