<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cash_registers', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('branch_id')->constrained('branches');
            $table->string('name', 120);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['business_id', 'branch_id'], 'cash_registers_business_branch_idx');
        });

        Schema::create('cash_register_sessions', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('cash_register_id')->constrained('cash_registers')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('users');
            $table->decimal('opening_float', 15, 2)->default(0);
            $table->decimal('closing_float', 15, 2)->nullable();
            $table->json('denominations_at_close')->nullable();
            $table->decimal('total_sales', 15, 2)->default(0);
            $table->enum('status', ['open', 'closed'])->default('open');
            $table->timestamp('opened_at')->useCurrent();
            $table->timestamp('closed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['cash_register_id', 'status'], 'cash_register_sessions_register_status_idx');
            $table->index(['user_id', 'status'], 'cash_register_sessions_user_status_idx');
        });

        Schema::create('sales', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('branch_id')->constrained('branches');
            $table->foreignUuid('warehouse_id')->constrained('warehouses');
            $table->foreignUuid('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->foreignUuid('cash_register_session_id')->nullable()->constrained('cash_register_sessions')->nullOnDelete();
            $table->foreignUuid('commission_agent_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('parent_sale_id')->nullable()->constrained('sales')->nullOnDelete();
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('sale_number', 50);
            $table->enum('type', ['pos_sale', 'invoice', 'draft', 'quotation', 'suspended'])->default('draft');
            $table->enum('status', ['draft', 'quotation', 'suspended', 'confirmed', 'completed', 'converted', 'cancelled', 'returned'])->default('draft');
            $table->enum('payment_status', ['unpaid', 'partial', 'paid'])->default('unpaid');
            $table->enum('delivery_status', ['pending', 'dispatched', 'delivered', 'returned'])->nullable();
            $table->boolean('is_recurring')->default(false);
            $table->enum('recurring_interval', ['daily', 'weekly', 'monthly'])->nullable();
            $table->date('next_recurring_date')->nullable();
            $table->unsignedSmallInteger('recurring_count')->nullable();
            $table->unsignedSmallInteger('recurring_generated')->default(0);
            $table->date('sale_date');
            $table->date('due_date')->nullable();
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->enum('discount_type', ['fixed', 'percentage'])->nullable();
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('shipping_charges', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->decimal('change_amount', 15, 2)->default(0);
            $table->foreignUuid('price_group_id')->nullable()->constrained('price_groups')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->text('staff_note')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['business_id', 'sale_number'], 'sales_business_number_unique');
            $table->index(['business_id', 'status', 'created_at'], 'sales_business_status_created_idx');
            $table->index(['business_id', 'payment_status', 'due_date'], 'sales_business_payment_due_idx');
            $table->index(['business_id', 'customer_id', 'created_at'], 'sales_business_customer_created_idx');
        });

        Schema::create('sale_items', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('sale_id')->constrained('sales')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products');
            $table->foreignUuid('variation_id')->nullable()->constrained('product_variations')->nullOnDelete();
            $table->foreignUuid('sub_unit_id')->nullable()->constrained('sub_units')->nullOnDelete();
            $table->decimal('quantity', 15, 4);
            $table->decimal('unit_price', 15, 4);
            $table->enum('discount_type', ['fixed', 'percentage'])->nullable();
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('tax_rate', 5, 2)->default(0);
            $table->enum('tax_type', ['inclusive', 'exclusive'])->nullable();
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('unit_cost', 15, 4)->default(0);
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['sale_id', 'product_id'], 'sale_items_sale_product_idx');
        });

        Schema::create('sale_item_lots', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('sale_item_id')->constrained('sale_items')->cascadeOnDelete();
            $table->foreignUuid('lot_id')->constrained('stock_lots');
            $table->decimal('quantity', 15, 4);
            $table->decimal('unit_cost', 15, 4)->default(0);

            $table->index(['sale_item_id', 'lot_id'], 'sale_item_lots_item_lot_idx');
        });

        Schema::create('sale_item_serials', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('sale_item_id')->constrained('sale_items')->cascadeOnDelete();
            $table->foreignUuid('serial_id')->constrained('stock_serials');
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['sale_item_id', 'serial_id'], 'sale_item_serials_item_serial_unique');
        });

        Schema::create('sale_payments', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('sale_id')->constrained('sales')->cascadeOnDelete();
            $table->foreignUuid('payment_account_id')->constrained('payment_accounts');
            $table->decimal('amount', 15, 2);
            $table->enum('method', ['cash', 'card', 'bank_transfer', 'cheque', 'reward_points', 'gift_card', 'other']);
            $table->uuid('gift_card_id')->nullable();
            $table->string('reference', 120)->nullable();
            $table->date('payment_date');
            $table->text('note')->nullable();
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['business_id', 'sale_id'], 'sale_payments_business_sale_idx');
            $table->index('gift_card_id', 'sale_payments_gift_card_idx');
        });

        Schema::create('sale_returns', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('sale_id')->constrained('sales');
            $table->foreignUuid('branch_id')->constrained('branches');
            $table->foreignUuid('warehouse_id')->constrained('warehouses');
            $table->string('return_number', 50);
            $table->enum('status', ['draft', 'completed'])->default('draft');
            $table->date('return_date');
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->enum('refund_method', ['cash', 'credit_note', 'bank_transfer', 'reward_points'])->nullable();
            $table->text('notes')->nullable();
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['business_id', 'return_number'], 'sale_returns_business_number_unique');
            $table->index(['business_id', 'sale_id'], 'sale_returns_business_sale_idx');
        });

        Schema::create('sale_return_items', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('sale_return_id')->constrained('sale_returns')->cascadeOnDelete();
            $table->foreignUuid('sale_item_id')->constrained('sale_items');
            $table->foreignUuid('product_id')->constrained('products');
            $table->foreignUuid('variation_id')->nullable()->constrained('product_variations')->nullOnDelete();
            $table->decimal('quantity', 15, 4);
            $table->decimal('unit_price', 15, 4)->default(0);
            $table->decimal('unit_cost', 15, 4)->default(0);
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->foreignUuid('lot_id')->nullable()->constrained('stock_lots')->nullOnDelete();
            $table->json('serial_ids')->nullable();

            $table->index(['sale_return_id', 'sale_item_id'], 'sale_return_items_return_item_idx');
        });

        Schema::create('sale_commissions', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('sale_id')->constrained('sales')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('users');
            $table->decimal('commission_percentage', 5, 2)->default(0);
            $table->decimal('commission_amount', 15, 2)->default(0);
            $table->enum('payment_status', ['pending', 'paid'])->default('pending');
            $table->timestamp('paid_at')->nullable();
            $table->uuid('paid_via_expense_id')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'payment_status', 'created_at'], 'sale_commissions_user_status_created_idx');
            $table->index('paid_via_expense_id', 'sale_commissions_expense_idx');
        });

        Schema::create('sale_targets', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('users');
            $table->unsignedTinyInteger('month');
            $table->unsignedSmallInteger('year');
            $table->decimal('target_amount', 15, 2)->default(0);
            $table->decimal('achieved_amount', 15, 2)->default(0);
            $table->timestamps();

            $table->unique(['business_id', 'user_id', 'month', 'year'], 'sale_targets_business_user_period_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sale_targets');
        Schema::dropIfExists('sale_commissions');
        Schema::dropIfExists('sale_return_items');
        Schema::dropIfExists('sale_returns');
        Schema::dropIfExists('sale_payments');
        Schema::dropIfExists('sale_item_serials');
        Schema::dropIfExists('sale_item_lots');
        Schema::dropIfExists('sale_items');
        Schema::dropIfExists('sales');
        Schema::dropIfExists('cash_register_sessions');
        Schema::dropIfExists('cash_registers');
    }
};
