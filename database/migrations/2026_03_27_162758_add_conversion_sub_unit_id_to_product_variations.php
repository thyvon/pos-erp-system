<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_variations', function (Blueprint $table): void {
            $table->uuid('sub_unit_id')
                  ->nullable()
                  ->after('sub_unit_purchase_price');
        });
    }

    public function down(): void
    {
        Schema::table('product_variations', function (Blueprint $table): void {
            $table->dropColumn('sub_unit_id');
        });
    }
};
