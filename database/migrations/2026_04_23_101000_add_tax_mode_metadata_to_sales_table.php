<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table): void {
            $table->enum('tax_scope', ['line', 'sale'])->default('line')->after('discount_amount');
            $table->foreignUuid('tax_rate_id')->nullable()->after('tax_scope')->constrained('tax_rates')->nullOnDelete();
            $table->enum('tax_rate_type', ['percentage', 'fixed'])->nullable()->after('tax_rate_id');
            $table->decimal('tax_rate', 10, 2)->default(0)->after('tax_rate_type');
            $table->enum('tax_type', ['inclusive', 'exclusive'])->nullable()->after('tax_rate');
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('tax_rate_id');
            $table->dropColumn(['tax_scope', 'tax_rate_type', 'tax_rate', 'tax_type']);
        });
    }
};
