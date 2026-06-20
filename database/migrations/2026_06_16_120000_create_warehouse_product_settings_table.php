<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('warehouse_product_settings', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('warehouse_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('variation_id')->nullable()->constrained('product_variations')->nullOnDelete();
            $table->foreignUuid('rack_location_id')->nullable()->constrained('rack_locations')->nullOnDelete();
            $table->foreignUuid('preferred_supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
            $table->decimal('min_stock_alert', 15, 4)->nullable();
            $table->decimal('max_stock_level', 15, 4)->nullable();
            $table->decimal('reorder_point', 15, 4)->nullable();
            $table->decimal('reorder_quantity', 15, 4)->nullable();
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['business_id', 'warehouse_id', 'product_id'], 'warehouse_product_settings_lookup_idx');
            $table->index(['business_id', 'rack_location_id']);
            $table->index(['business_id', 'preferred_supplier_id'], 'warehouse_product_settings_supplier_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('warehouse_product_settings');
    }
};
