<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exchange_rates', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->char('from_currency', 3)->default('USD');
            $table->char('to_currency', 3)->default('KHR');
            $table->decimal('rate', 18, 6);
            $table->date('effective_date');
            $table->boolean('is_default')->default(false);
            $table->text('note')->nullable();
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['business_id', 'from_currency', 'to_currency', 'is_default'], 'exchange_rates_default_idx');
            $table->index(['business_id', 'from_currency', 'to_currency', 'effective_date'], 'exchange_rates_effective_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exchange_rates');
    }
};
