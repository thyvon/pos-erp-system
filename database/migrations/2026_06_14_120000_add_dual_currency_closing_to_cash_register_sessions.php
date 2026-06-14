<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cash_register_sessions', function (Blueprint $table): void {
            $table->decimal('expected_cash_usd', 18, 2)->nullable()->after('closing_float');
            $table->decimal('expected_cash_khr', 18, 2)->nullable()->after('expected_cash_usd');
            $table->decimal('closing_cash_usd', 18, 2)->nullable()->after('expected_cash_khr');
            $table->decimal('closing_cash_khr', 18, 2)->nullable()->after('closing_cash_usd');
            $table->decimal('difference_usd', 18, 2)->nullable()->after('closing_cash_khr');
            $table->decimal('difference_khr', 18, 2)->nullable()->after('difference_usd');
        });
    }

    public function down(): void
    {
        Schema::table('cash_register_sessions', function (Blueprint $table): void {
            $table->dropColumn([
                'expected_cash_usd',
                'expected_cash_khr',
                'closing_cash_usd',
                'closing_cash_khr',
                'difference_usd',
                'difference_khr',
            ]);
        });
    }
};
