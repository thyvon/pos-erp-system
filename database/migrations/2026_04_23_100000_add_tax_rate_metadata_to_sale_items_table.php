<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sale_items', function (Blueprint $table): void {
            $table->foreignUuid('tax_rate_id')->nullable()->after('discount_amount')->constrained('tax_rates')->nullOnDelete();
            $table->enum('tax_rate_type', ['percentage', 'fixed'])->nullable()->after('tax_rate_id');
        });
    }

    public function down(): void
    {
        Schema::table('sale_items', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('tax_rate_id');
            $table->dropColumn('tax_rate_type');
        });
    }
};
