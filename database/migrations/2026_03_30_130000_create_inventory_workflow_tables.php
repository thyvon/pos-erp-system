<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_adjustments', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('warehouse_id')->constrained('warehouses')->cascadeOnDelete();
            $table->string('reference_no', 30)->unique();
            $table->date('date');
            $table->string('reason', 120)->nullable();
            $table->text('notes')->nullable();
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['business_id', 'warehouse_id', 'date'], 'stock_adjustments_wh_date_idx');
        });

        Schema::create('stock_adjustment_items', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('stock_adjustment_id')->constrained('stock_adjustments')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignUuid('variation_id')->nullable()->constrained('product_variations')->nullOnDelete();
            $table->foreignUuid('lot_id')->nullable()->constrained('stock_lots')->nullOnDelete();
            $table->foreignUuid('serial_id')->nullable()->constrained('stock_serials')->nullOnDelete();
            $table->enum('direction', ['in', 'out']);
            $table->decimal('quantity', 15, 4);
            $table->decimal('unit_cost', 15, 4)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['stock_adjustment_id', 'product_id'], 'stock_adjustment_items_adj_product_idx');
        });

        Schema::create('stock_transfers', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('from_warehouse_id')->constrained('warehouses')->cascadeOnDelete();
            $table->foreignUuid('to_warehouse_id')->constrained('warehouses')->cascadeOnDelete();
            $table->string('reference_no', 30)->unique();
            $table->enum('status', ['completed'])->default('completed');
            $table->date('date');
            $table->text('notes')->nullable();
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['business_id', 'from_warehouse_id', 'date'], 'stock_transfers_from_wh_date_idx');
            $table->index(['business_id', 'to_warehouse_id', 'date'], 'stock_transfers_to_wh_date_idx');
        });

        Schema::create('stock_transfer_items', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('stock_transfer_id')->constrained('stock_transfers')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignUuid('variation_id')->nullable()->constrained('product_variations')->nullOnDelete();
            $table->decimal('quantity', 15, 4);
            $table->decimal('unit_cost', 15, 4)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['stock_transfer_id', 'product_id'], 'stock_transfer_items_transfer_product_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_transfer_items');
        Schema::dropIfExists('stock_transfers');
        Schema::dropIfExists('stock_adjustment_items');
        Schema::dropIfExists('stock_adjustments');
    }
};
