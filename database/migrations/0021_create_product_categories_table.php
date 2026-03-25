<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_categories', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('parent_id')->nullable()->constrained('product_categories')->nullOnDelete();
            $table->string('name', 150);
            $table->string('code', 50)->nullable();
            $table->string('short_code', 10)->nullable();
            $table->string('image_url', 500)->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['business_id', 'name']);
            $table->index(['business_id', 'parent_id'], 'product_categories_business_parent_index');
            $table->index(['business_id', 'sort_order', 'name'], 'product_categories_listing_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_categories');
    }
};
