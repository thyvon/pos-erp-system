<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchase_items', function (Blueprint $table): void {
            $table->foreignUuid('sub_unit_id')
                ->nullable()
                ->after('variation_id')
                ->constrained('sub_units')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('purchase_items', function (Blueprint $table): void {
            $table->dropForeign(['sub_unit_id']);
            $table->dropColumn('sub_unit_id');
        });
    }
};
