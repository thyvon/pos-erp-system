<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_count_entries', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('stock_count_id')->constrained('stock_counts')->cascadeOnDelete();
            $table->foreignUuid('stock_count_item_id')->constrained('stock_count_items')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignUuid('variation_id')->nullable()->constrained('product_variations')->nullOnDelete();
            $table->decimal('quantity', 15, 4);
            $table->decimal('unit_cost', 15, 4)->default(0);
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['business_id', 'stock_count_id'], 'stock_count_entries_business_count_idx');
            $table->index(['stock_count_id', 'created_at'], 'stock_count_entries_count_created_idx');
            $table->index(['stock_count_id', 'product_id', 'variation_id'], 'stock_count_entries_item_lookup_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_count_entries');
    }
};
