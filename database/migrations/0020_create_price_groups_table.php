<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('price_groups', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->string('name', 150);
            $table->text('description')->nullable();
            $table->boolean('is_default')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['business_id', 'name']);
            $table->index(['business_id', 'is_default'], 'price_groups_business_default_index');
            $table->index(['business_id', 'deleted_at', 'name'], 'price_groups_listing_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('price_groups');
    }
};
