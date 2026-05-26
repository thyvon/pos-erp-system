<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table): void {
            $table->string('client_request_id', 80)->nullable()->after('sale_number');
            $table->unique(['business_id', 'client_request_id'], 'sales_business_client_request_unique');
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table): void {
            $table->dropUnique('sales_business_client_request_unique');
            $table->dropColumn('client_request_id');
        });
    }
};
