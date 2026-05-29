<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchases', function (Blueprint $table): void {
            $table->string('tax_scope')->default('line')->after('shipping_charges');
            $table->foreignUuid('tax_rate_id')->nullable()->after('tax_scope')->constrained('tax_rates')->nullOnDelete();
            $table->string('tax_rate_type', 20)->nullable()->after('tax_rate_id');
            $table->decimal('tax_rate', 5, 2)->default(0)->after('tax_rate_type');
            $table->string('tax_type', 20)->nullable()->after('tax_rate');
        });
    }

    public function down(): void
    {
        Schema::table('purchases', function (Blueprint $table): void {
            $table->dropColumn(['tax_scope', 'tax_rate_type', 'tax_rate', 'tax_type']);
            $table->dropConstrainedForeignId('tax_rate_id');
        });
    }
};
