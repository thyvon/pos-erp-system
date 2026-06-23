<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // The clean-install schema now contains every workflow status and defaults to pending.
        // The final PostgreSQL hardening migration also repairs pre-existing development databases.
    }

    public function down(): void
    {
        DB::table('stock_transfers')
            ->where('status', 'pending')
            ->update([
                'status' => 'completed',
            ]);
    }
};
