<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_levels', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignUuid('variation_id')->nullable()->constrained('product_variations')->nullOnDelete();
            $table->foreignUuid('warehouse_id')->constrained('warehouses')->cascadeOnDelete();
            $table->decimal('quantity', 15, 4)->default(0);
            $table->decimal('reserved_quantity', 15, 4)->default(0);
            $table->decimal('available_qty', 15, 4)->storedAs('quantity - reserved_quantity');
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->unique(['business_id', 'product_id', 'variation_id', 'warehouse_id'], 'stock_levels_unique_idx');
            $table->index(['business_id', 'warehouse_id'], 'stock_levels_wh_idx');
        });

        Schema::create('stock_lots', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignUuid('variation_id')->nullable()->constrained('product_variations')->nullOnDelete();
            $table->foreignUuid('warehouse_id')->constrained('warehouses')->cascadeOnDelete();
            $table->foreignUuid('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
            $table->string('lot_number', 100);
            $table->date('manufacture_date')->nullable();
            $table->date('expiry_date')->nullable();
            $table->timestamp('received_at')->useCurrent();
            $table->decimal('unit_cost', 15, 4)->default(0);
            $table->decimal('qty_received', 15, 4)->default(0);
            $table->decimal('qty_on_hand', 15, 4)->default(0);
            $table->decimal('qty_reserved', 15, 4)->default(0);
            $table->decimal('qty_available', 15, 4)->storedAs('qty_on_hand - qty_reserved');
            $table->enum('status', ['active', 'depleted', 'expired', 'recalled', 'quarantine'])->default('active');
            $table->text('notes')->nullable();
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['business_id', 'lot_number'], 'stock_lots_unique_idx');
            $table->index(['business_id', 'warehouse_id', 'status'], 'stock_lots_wh_status_idx');
        });

        Schema::create('stock_serials', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignUuid('variation_id')->nullable()->constrained('product_variations')->nullOnDelete();
            $table->foreignUuid('warehouse_id')->nullable()->constrained('warehouses')->nullOnDelete();
            $table->foreignUuid('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
            $table->string('serial_number', 200);
            $table->enum('status', ['in_stock', 'sold', 'returned', 'transferred', 'written_off', 'reserved'])->default('in_stock');
            $table->uuid('purchase_item_id')->nullable();
            $table->uuid('sale_item_id')->nullable();
            $table->decimal('unit_cost', 15, 4)->default(0);
            $table->date('warranty_expires')->nullable();
            $table->timestamp('received_at')->useCurrent();
            $table->timestamp('sold_at')->nullable();
            $table->text('notes')->nullable();
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['business_id', 'serial_number'], 'stock_serials_unique_idx');
            $table->index(['business_id', 'warehouse_id', 'status'], 'stock_serials_wh_status_idx');
        });

        Schema::create('stock_movements', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignUuid('variation_id')->nullable()->constrained('product_variations')->nullOnDelete();
            $table->foreignUuid('warehouse_id')->constrained('warehouses')->cascadeOnDelete();
            $table->foreignUuid('lot_id')->nullable()->constrained('stock_lots')->nullOnDelete();
            $table->foreignUuid('serial_id')->nullable()->constrained('stock_serials')->nullOnDelete();
            $table->enum('type', [
                'opening_stock',
                'purchase_receipt',
                'sale',
                'sale_return',
                'purchase_return',
                'adjustment_in',
                'adjustment_out',
                'transfer_in',
                'transfer_out',
                'combo_deduction',
                'stock_count_correction',
                'manufacturing_in',
                'manufacturing_out',
            ]);
            $table->decimal('quantity', 15, 4);
            $table->decimal('unit_cost', 15, 4)->default(0);
            $table->string('reference_type', 100)->nullable();
            $table->char('reference_id', 36)->nullable();
            $table->text('notes')->nullable();
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['business_id', 'product_id', 'warehouse_id'], 'stock_movements_product_wh_idx');
            $table->index(['business_id', 'variation_id', 'warehouse_id'], 'stock_movements_var_wh_idx');
            $table->index(['business_id', 'type', 'created_at'], 'stock_movements_type_created_idx');
        });

        Schema::create('stock_counts', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('warehouse_id')->constrained('warehouses')->cascadeOnDelete();
            $table->string('reference_no', 30)->unique();
            $table->enum('status', ['in_progress', 'completed', 'cancelled'])->default('in_progress');
            $table->date('date');
            $table->text('notes')->nullable();
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('completed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['business_id', 'warehouse_id', 'status'], 'stock_counts_wh_status_idx');
        });

        Schema::create('stock_count_items', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('stock_count_id')->constrained('stock_counts')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignUuid('variation_id')->nullable()->constrained('product_variations')->nullOnDelete();
            $table->foreignUuid('lot_id')->nullable()->constrained('stock_lots')->nullOnDelete();
            $table->decimal('system_quantity', 15, 4)->default(0);
            $table->decimal('counted_quantity', 15, 4)->nullable();
            $table->decimal('difference', 15, 4)->storedAs('coalesce(counted_quantity, 0) - system_quantity');
            $table->decimal('unit_cost', 15, 4)->default(0);

            $table->index(['stock_count_id', 'product_id'], 'stock_count_items_count_product_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_count_items');
        Schema::dropIfExists('stock_counts');
        Schema::dropIfExists('stock_serials');
        Schema::dropIfExists('stock_lots');
        Schema::dropIfExists('stock_levels');
        Schema::dropIfExists('stock_movements');
    }
};
