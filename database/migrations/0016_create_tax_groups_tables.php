<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tax_groups', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->string('name', 150);
            $table->string('description', 500)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['business_id', 'name']);
            $table->index(['business_id', 'deleted_at', 'is_active', 'name'], 'tax_groups_listing_index');
        });

        Schema::create('tax_group_items', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('tax_group_id')->constrained('tax_groups')->cascadeOnDelete();
            $table->foreignUuid('tax_rate_id')->constrained('tax_rates')->restrictOnDelete();

            $table->unique(['tax_group_id', 'tax_rate_id']);
            $table->index('tax_group_id');
            $table->index('tax_rate_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tax_group_items');
        Schema::dropIfExists('tax_groups');
    }
};
