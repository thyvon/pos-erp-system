<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('customer_group_id')->nullable()->constrained('customer_groups')->nullOnDelete();
            $table->uuid('created_by')->nullable();
            $table->string('code', 50);
            $table->string('name', 191);
            $table->enum('type', ['individual', 'company'])->default('individual');
            $table->string('email', 191)->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('mobile', 50)->nullable();
            $table->string('tax_id', 100)->nullable();
            $table->date('date_of_birth')->nullable();
            $table->json('address')->nullable();
            $table->decimal('credit_limit', 15, 2)->default(0);
            $table->unsignedSmallInteger('pay_term')->default(0);
            $table->decimal('opening_balance', 15, 2)->default(0);
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->text('notes')->nullable();
            $table->json('custom_fields')->nullable();
            $table->json('documents')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['business_id', 'code']);
            $table->index(['business_id', 'status'], 'customers_business_status_index');
            $table->index(['business_id', 'phone'], 'customers_business_phone_index');
            $table->index(['business_id', 'customer_group_id'], 'customers_business_group_index');

            if (DB::getDriverName() !== 'sqlite') {
                $table->fullText(['name', 'email', 'phone', 'mobile'], 'customers_search_fulltext');
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
