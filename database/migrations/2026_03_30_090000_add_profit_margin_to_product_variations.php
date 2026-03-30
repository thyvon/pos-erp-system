<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_variations', function (Blueprint $table): void {
            $table->decimal('profit_margin', 8, 2)->nullable()->after('minimum_selling_price');
        });
    }

    public function down(): void
    {
        Schema::table('product_variations', function (Blueprint $table): void {
            $table->dropColumn('profit_margin');
        });
    }
};
