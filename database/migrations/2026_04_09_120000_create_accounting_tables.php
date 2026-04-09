<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chart_of_accounts', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('parent_id')->nullable()->constrained('chart_of_accounts')->nullOnDelete();
            $table->string('code', 20);
            $table->string('name', 255);
            $table->enum('type', ['asset', 'liability', 'equity', 'revenue', 'expense']);
            $table->string('sub_type', 50)->nullable();
            $table->enum('normal_balance', ['debit', 'credit']);
            $table->boolean('is_system')->default(false);
            $table->boolean('is_active')->default(true);
            $table->text('description')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['business_id', 'code'], 'chart_of_accounts_business_code_unique');
            $table->index(['business_id', 'type', 'is_active'], 'chart_of_accounts_type_active_idx');
        });

        Schema::create('fiscal_years', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->string('name', 100);
            $table->date('start_date');
            $table->date('end_date');
            $table->enum('status', ['active', 'closed'])->default('active');
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();

            $table->index(['business_id', 'status'], 'fiscal_years_business_status_idx');
        });

        Schema::create('payment_accounts', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->string('name', 100);
            $table->enum('account_type', ['cash', 'bank', 'other'])->default('cash');
            $table->string('account_number', 50)->nullable();
            $table->string('bank_name', 100)->nullable();
            $table->decimal('opening_balance', 15, 2)->default(0);
            $table->foreignUuid('coa_account_id')->nullable()->constrained('chart_of_accounts')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->text('note')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['business_id', 'account_type', 'is_active'], 'payment_accounts_type_active_idx');
        });

        Schema::create('journals', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('fiscal_year_id')->nullable()->constrained('fiscal_years')->nullOnDelete();
            $table->string('journal_number', 50);
            $table->enum('type', [
                'sale',
                'purchase',
                'payment_in',
                'payment_out',
                'sale_return',
                'purchase_return',
                'expense',
                'manual',
                'reversal',
                'opening',
                'manufacturing',
            ]);
            $table->string('reference_type', 100)->nullable();
            $table->char('reference_id', 36)->nullable();
            $table->string('description', 500);
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->timestamp('posted_at')->useCurrent();
            $table->foreignUuid('posted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('reversed_by_id')->nullable()->constrained('journals')->nullOnDelete();
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['business_id', 'journal_number'], 'journals_business_number_unique');
            $table->index(['business_id', 'type', 'posted_at'], 'journals_business_type_posted_idx');
            $table->index(['reference_type', 'reference_id'], 'journals_reference_idx');
        });

        Schema::create('journal_entries', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('journal_id')->constrained('journals')->cascadeOnDelete();
            $table->foreignUuid('account_id')->constrained('chart_of_accounts')->restrictOnDelete();
            $table->enum('type', ['debit', 'credit']);
            $table->decimal('amount', 15, 2);
            $table->string('description', 255)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['account_id', 'created_at'], 'journal_entries_account_created_idx');
        });

        Schema::create('account_transactions', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('payment_account_id')->constrained('payment_accounts')->cascadeOnDelete();
            $table->enum('type', ['credit', 'debit']);
            $table->decimal('amount', 15, 2);
            $table->string('reference_type', 100)->nullable();
            $table->char('reference_id', 36)->nullable();
            $table->date('transaction_date');
            $table->text('note')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(
                ['business_id', 'payment_account_id', 'transaction_date'],
                'account_transactions_account_date_idx'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('account_transactions');
        Schema::dropIfExists('journal_entries');
        Schema::dropIfExists('journals');
        Schema::dropIfExists('payment_accounts');
        Schema::dropIfExists('fiscal_years');
        Schema::dropIfExists('chart_of_accounts');
    }
};
