<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('category_id')->nullable()->constrained('product_categories')->nullOnDelete();
            $table->foreignUuid('brand_id')->nullable()->constrained('brands')->nullOnDelete();
            $table->foreignUuid('unit_id')->nullable()->constrained('units')->nullOnDelete();
            $table->foreignUuid('sub_unit_id')->nullable()->constrained('sub_units')->nullOnDelete();
            $table->foreignUuid('tax_rate_id')->nullable()->constrained('tax_rates')->nullOnDelete();
            $table->foreignUuid('rack_location_id')->nullable()->constrained('rack_locations')->nullOnDelete();
            $table->foreignUuid('variation_template_id')->nullable()->constrained('variation_templates')->nullOnDelete();
            $table->foreignUuid('price_group_id')->nullable()->constrained('price_groups')->nullOnDelete();
            $table->string('name', 150);
            $table->string('sku', 100);
            $table->string('barcode', 100)->nullable();
            $table->enum('barcode_type', ['C128', 'EAN13', 'QR'])->default('C128');
            $table->enum('type', ['single', 'variable', 'service', 'combo'])->default('single');
            $table->enum('stock_tracking', ['none', 'lot', 'serial'])->default('none');
            $table->text('description')->nullable();
            $table->boolean('has_expiry')->default(false);
            $table->decimal('selling_price', 14, 2)->default(0);
            $table->decimal('purchase_price', 14, 2)->default(0);
            $table->decimal('minimum_selling_price', 14, 2)->nullable();
            $table->decimal('profit_margin', 8, 2)->nullable();
            $table->enum('tax_type', ['inclusive', 'exclusive'])->default('exclusive');
            $table->boolean('track_inventory')->default(true);
            $table->decimal('alert_quantity', 14, 3)->nullable();
            $table->decimal('max_stock_level', 14, 3)->nullable();
            $table->boolean('is_for_selling')->default(true);
            $table->boolean('is_active')->default(true);
            $table->decimal('weight', 12, 3)->nullable();
            $table->string('image_url', 500)->nullable();
            $table->json('custom_fields')->nullable();
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['business_id', 'sku']);
            $table->index(['business_id', 'type', 'is_active'], 'products_listing_type_index');
            $table->index(['business_id', 'category_id', 'brand_id'], 'products_listing_category_brand_index');
            $table->index(['business_id', 'stock_tracking'], 'products_listing_stock_tracking_index');
            $table->fullText(['name', 'sku', 'barcode'], 'products_search_fulltext');
        });

        Schema::create('product_variations', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('name', 150);
            $table->json('variation_value_ids');
            $table->string('sku', 100);
            $table->string('barcode', 100)->nullable();
            $table->decimal('selling_price', 14, 2)->default(0);
            $table->decimal('purchase_price', 14, 2)->default(0);
            $table->decimal('minimum_selling_price', 14, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['business_id', 'sku']);
            $table->index(['product_id', 'is_active'], 'product_variations_listing_index');
        });

        Schema::create('combo_items', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignUuid('child_product_id')->constrained('products')->restrictOnDelete();
            $table->foreignUuid('child_variation_id')->nullable()->constrained('product_variations')->nullOnDelete();
            $table->decimal('quantity', 14, 4);
            $table->timestamps();

            $table->index(['product_id', 'child_product_id'], 'combo_items_parent_child_index');
        });

        Schema::create('product_packagings', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('name', 100);
            $table->string('short_name', 50)->nullable();
            $table->decimal('conversion_factor', 14, 4);
            $table->string('sku', 100)->nullable();
            $table->string('barcode', 100)->nullable();
            $table->decimal('selling_price', 14, 2)->nullable();
            $table->decimal('purchase_price', 14, 2)->nullable();
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['product_id', 'name']);
            $table->unique(['business_id', 'sku']);
            $table->index(['product_id', 'is_default', 'is_active'], 'product_packagings_listing_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_packagings');
        Schema::dropIfExists('combo_items');
        Schema::dropIfExists('product_variations');
        Schema::dropIfExists('products');
    }
};
