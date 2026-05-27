<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cambodia_address_divisions', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->enum('type', ['province', 'district', 'commune', 'village']);
            $table->string('code', 50);
            $table->string('parent_code', 50)->nullable();
            $table->string('name_en', 191)->nullable();
            $table->string('name_km', 191)->nullable();
            $table->string('province_id', 50)->nullable();
            $table->string('district_id', 50)->nullable();
            $table->string('commune_id', 50)->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->json('source_payload')->nullable();
            $table->timestamp('synced_at')->nullable();
            $table->timestamps();

            $table->unique(['type', 'code'], 'cambodia_address_type_code_unique');
            $table->index(['type', 'parent_code'], 'cambodia_address_parent_idx');
            $table->index(['type', 'is_active'], 'cambodia_address_active_idx');
            $table->index('synced_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cambodia_address_divisions');
    }
};
