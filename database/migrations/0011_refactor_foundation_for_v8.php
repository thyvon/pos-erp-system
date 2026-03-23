<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('businesses', function (Blueprint $table): void {
            if (! Schema::hasColumn('businesses', 'locale')) {
                $table->string('locale', 10)->default('en')->after('country');
            }
        });

        Schema::table('users', function (Blueprint $table): void {
            if (! Schema::hasColumn('users', 'commission_percentage')) {
                $table->decimal('commission_percentage', 5, 2)->default(0)->after('max_discount');
            }

            if (! Schema::hasColumn('users', 'sales_target_amount')) {
                $table->decimal('sales_target_amount', 15, 2)->default(0)->after('commission_percentage');
            }
        });

        if (! Schema::hasTable('custom_field_definitions')) {
            Schema::create('custom_field_definitions', function (Blueprint $table): void {
                $table->uuid('id')->primary();
                $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
                $table->enum('module', ['product', 'customer', 'supplier']);
                $table->string('field_name', 100);
                $table->string('field_label', 150);
                $table->enum('field_type', ['text', 'number', 'date', 'select', 'checkbox']);
                $table->json('options')->nullable();
                $table->boolean('is_required')->default(false);
                $table->unsignedSmallInteger('sort_order')->default(0);
                $table->timestamps();

                $table->index(['business_id', 'module']);
                $table->unique(['business_id', 'module', 'field_name']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('custom_field_definitions');

        Schema::table('users', function (Blueprint $table): void {
            if (Schema::hasColumn('users', 'sales_target_amount')) {
                $table->dropColumn('sales_target_amount');
            }

            if (Schema::hasColumn('users', 'commission_percentage')) {
                $table->dropColumn('commission_percentage');
            }
        });

        Schema::table('businesses', function (Blueprint $table): void {
            if (Schema::hasColumn('businesses', 'locale')) {
                $table->dropColumn('locale');
            }
        });
    }
};
