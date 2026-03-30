<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_transfer_items', function (Blueprint $table): void {
            $table->foreignUuid('lot_id')->nullable()->after('variation_id')->constrained('stock_lots')->nullOnDelete();
            $table->foreignUuid('serial_id')->nullable()->after('lot_id')->constrained('stock_serials')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('stock_transfer_items', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('serial_id');
            $table->dropConstrainedForeignId('lot_id');
        });
    }
};
