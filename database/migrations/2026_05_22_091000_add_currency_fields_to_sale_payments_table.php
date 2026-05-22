<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sale_payments', function (Blueprint $table): void {
            $table->char('payment_currency', 3)->default('USD')->after('amount');
            $table->decimal('payment_amount', 18, 2)->nullable()->after('payment_currency');
            $table->foreignUuid('exchange_rate_id')->nullable()->after('payment_amount')->constrained('exchange_rates')->nullOnDelete();
            $table->decimal('exchange_rate', 18, 6)->nullable()->after('exchange_rate_id');
        });
    }

    public function down(): void
    {
        Schema::table('sale_payments', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('exchange_rate_id');
            $table->dropColumn(['payment_currency', 'payment_amount', 'exchange_rate']);
        });
    }
};
