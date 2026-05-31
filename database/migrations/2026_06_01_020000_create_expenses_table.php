<?php

use App\Models\Branch;
use App\Models\Business;
use App\Models\ChartOfAccount;
use App\Models\PaymentAccount;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignUuid('expense_account_id')->constrained('chart_of_accounts')->restrictOnDelete();
            $table->foreignUuid('payment_account_id')->constrained('payment_accounts')->restrictOnDelete();
            $table->date('expense_date');
            $table->string('reference_no', 80)->nullable();
            $table->string('description');
            $table->decimal('amount', 15, 2)->default(0);
            $table->string('payment_method', 30)->nullable();
            $table->text('notes')->nullable();
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index('expense_date');
            $table->index(['business_id', 'expense_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
