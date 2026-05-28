<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchases', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('branch_id')->constrained('branches');
            $table->foreignUuid('warehouse_id')->constrained('warehouses');
            $table->foreignUuid('supplier_id')->constrained('suppliers');
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('received_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('purchase_number', 50);
            $table->string('supplier_invoice_no', 80)->nullable();
            $table->enum('status', ['draft', 'confirmed', 'partially_received', 'received', 'cancelled'])->default('draft');
            $table->enum('payment_status', ['unpaid', 'partial', 'paid'])->default('unpaid');
            $table->date('purchase_date');
            $table->date('expected_date')->nullable();
            $table->timestamp('received_at')->nullable();
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('shipping_charges', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->text('notes')->nullable();
            $table->text('staff_note')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['business_id', 'purchase_number'], 'purchases_business_number_unique');
            $table->index(['business_id', 'status', 'created_at'], 'purchases_business_status_created_idx');
            $table->index(['business_id', 'payment_status', 'expected_date'], 'purchases_business_payment_due_idx');
            $table->index(['business_id', 'supplier_id', 'created_at'], 'purchases_business_supplier_created_idx');
        });

        Schema::create('purchase_items', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('purchase_id')->constrained('purchases')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products');
            $table->foreignUuid('variation_id')->nullable()->constrained('product_variations')->nullOnDelete();
            $table->decimal('quantity', 15, 4);
            $table->decimal('received_quantity', 15, 4)->default(0);
            $table->decimal('unit_cost', 15, 4);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('tax_rate', 5, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['purchase_id', 'product_id'], 'purchase_items_purchase_product_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_items');
        Schema::dropIfExists('purchases');
    }
};
