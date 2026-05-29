<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchase_items', function (Blueprint $table): void {
            $table->string('discount_type')->nullable()->after('discount_amount');
            $table->foreignUuid('tax_rate_id')->nullable()->after('tax_rate')->constrained('tax_rates')->nullOnDelete();
        });

        Schema::table('purchases', function (Blueprint $table): void {
            $table->string('discount_type')->nullable()->after('discount_amount');
        });
    }

    public function down(): void
    {
        Schema::table('purchases', function (Blueprint $table): void {
            $table->dropColumn('discount_type');
        });

        Schema::table('purchase_items', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('tax_rate_id');
            $table->dropColumn('discount_type');
        });
    }
};
