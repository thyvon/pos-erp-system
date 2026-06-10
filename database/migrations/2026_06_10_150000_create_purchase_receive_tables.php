<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_receives', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('purchase_id')->constrained('purchases')->cascadeOnDelete();
            $table->foreignUuid('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignUuid('warehouse_id')->constrained('warehouses')->cascadeOnDelete();
            $table->string('receive_number', 50);
            $table->date('received_at');
            $table->text('notes')->nullable();
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['business_id', 'receive_number']);
        });

        Schema::create('purchase_receive_items', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('purchase_receive_id')->constrained('purchase_receives')->cascadeOnDelete();
            $table->foreignUuid('purchase_item_id')->constrained('purchase_items')->cascadeOnDelete();
            $table->decimal('quantity', 15, 4)->default(0);
            $table->string('lot_number', 100)->nullable();
            $table->date('manufacture_date')->nullable();
            $table->date('expiry_date')->nullable();
            $table->date('warranty_expires')->nullable();
            $table->json('serial_numbers')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_receive_items');
        Schema::dropIfExists('purchase_receives');
    }
};
