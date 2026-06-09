<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_opening_balances', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('warehouse_id')->constrained('warehouses')->cascadeOnDelete();
            $table->string('reference_no', 30)->unique();
            $table->date('date');
            $table->text('notes')->nullable();
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['business_id', 'warehouse_id', 'date'], 'stock_opening_balances_wh_date_idx');
        });

        Schema::create('stock_opening_balance_items', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('stock_opening_balance_id')->constrained('stock_opening_balances')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignUuid('variation_id')->nullable()->constrained('product_variations')->nullOnDelete();
            $table->foreignUuid('lot_id')->nullable()->constrained('stock_lots')->nullOnDelete();
            $table->foreignUuid('serial_id')->nullable()->constrained('stock_serials')->nullOnDelete();
            $table->decimal('quantity', 15, 4);
            $table->decimal('unit_cost', 15, 4)->default(0);
            $table->string('lot_number', 100)->nullable();
            $table->date('manufacture_date')->nullable();
            $table->date('expiry_date')->nullable();
            $table->string('serial_number', 200)->nullable();
            $table->date('warranty_expires')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['stock_opening_balance_id', 'product_id'], 'stock_opening_balance_items_doc_product_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_opening_balance_items');
        Schema::dropIfExists('stock_opening_balances');
    }
};
