<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sale_payments', function (Blueprint $table): void {
            $table->enum('status', ['completed', 'reversed'])
                ->default('completed')
                ->after('note');
            $table->foreignUuid('replaces_payment_id')
                ->nullable()
                ->after('status')
                ->constrained('sale_payments')
                ->nullOnDelete();
            $table->foreignUuid('reversed_by')
                ->nullable()
                ->after('replaces_payment_id')
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamp('reversed_at')->nullable()->after('reversed_by');
            $table->text('reversal_reason')->nullable()->after('reversed_at');
            $table->index(['sale_id', 'status'], 'sale_payments_sale_status_idx');
        });
    }

    public function down(): void
    {
        Schema::table('sale_payments', function (Blueprint $table): void {
            $table->dropIndex('sale_payments_sale_status_idx');
            $table->dropConstrainedForeignId('reversed_by');
            $table->dropConstrainedForeignId('replaces_payment_id');
            $table->dropColumn(['status', 'reversed_at', 'reversal_reason']);
        });
    }
};
