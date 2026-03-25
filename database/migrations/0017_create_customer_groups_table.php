<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_groups', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->string('name', 150);
            $table->decimal('discount', 5, 2)->default(0);
            $table->uuid('price_group_id')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['business_id', 'name']);
            $table->index('price_group_id');
            $table->index(['business_id', 'deleted_at', 'name'], 'customer_groups_listing_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_groups');
    }
};
