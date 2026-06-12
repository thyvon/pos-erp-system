<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sale_returns', function (Blueprint $table): void {
            $table->foreignUuid('payment_account_id')
                ->nullable()
                ->after('refund_method')
                ->constrained('payment_accounts')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('sale_returns', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('payment_account_id');
        });
    }
};
