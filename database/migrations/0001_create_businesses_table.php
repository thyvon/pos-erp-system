<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('businesses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('legal_name')->nullable();
            $table->string('tax_id', 50)->nullable();
            $table->string('email')->unique();
            $table->string('phone', 20)->nullable();
            $table->char('currency', 3)->default('USD');
            $table->string('timezone', 100)->default('UTC');
            $table->char('country', 2)->nullable();
            $table->json('address')->nullable();
            $table->string('logo_url', 500)->nullable();
            $table->enum('tier', ['basic', 'standard', 'enterprise'])->default('basic');
            $table->enum('status', ['active', 'suspended', 'cancelled'])->default('active');
            $table->unsignedInteger('max_users')->default(1);
            $table->unsignedInteger('max_branches')->default(1);
            $table->json('financial_year')->nullable();
            $table->json('settings_cache')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('businesses');
    }
};
