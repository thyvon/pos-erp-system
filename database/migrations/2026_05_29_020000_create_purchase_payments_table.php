<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('purchase_id')->constrained('purchases')->cascadeOnDelete();
            $table->foreignUuid('payment_account_id')->constrained('payment_accounts');
            $table->decimal('amount', 15, 2);
            $table->char('payment_currency', 3)->default('USD');
            $table->decimal('payment_amount', 18, 2)->nullable();
            $table->foreignUuid('exchange_rate_id')->nullable()->constrained('exchange_rates');
            $table->decimal('exchange_rate', 18, 6)->nullable();
            $table->enum('method', ['cash', 'card', 'bank_transfer', 'cheque', 'reward_points', 'gift_card', 'other']);
            $table->string('reference', 120)->nullable();
            $table->date('payment_date');
            $table->text('note')->nullable();
            $table->enum('status', ['completed', 'reversed'])->default('completed');
            $table->uuid('replaces_payment_id')->nullable();
            $table->foreignUuid('reversed_by')->nullable()->constrained('users');
            $table->timestamp('reversed_at')->nullable();
            $table->text('reversal_reason')->nullable();
            $table->foreignUuid('created_by')->nullable()->constrained('users');
            $table->timestamps();

            $table->index(['business_id', 'purchase_id'], 'purchase_payments_business_purchase_idx');
            $table->index(['purchase_id', 'status'], 'purchase_payments_purchase_status_idx');
        });

        Schema::table('purchase_payments', function (Blueprint $table): void {
            $table->foreign('replaces_payment_id')->references('id')->on('purchase_payments')->deferrable()->initiallyDeferred();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_payments');
    }
};
