<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        // ── Non-negative CHECK constraints for unsigned* integer columns ──
        // PostgreSQL doesn't support UNSIGNED, so these enforce the same
        // constraints that MySQL's unsigned types would provide natively.

        $unsignedColumns = [
            ['jobs', 'attempts', 'attempts >= 0'],
            ['jobs', 'reserved_at', 'reserved_at IS NULL OR reserved_at >= 0'],
            ['jobs', 'available_at', 'available_at >= 0'],
            ['jobs', 'created_at', 'created_at >= 0'],
            ['job_batches', 'total_jobs', 'total_jobs >= 0'],
            ['job_batches', 'pending_jobs', 'pending_jobs >= 0'],
            ['job_batches', 'failed_jobs', 'failed_jobs >= 0'],
            ['job_batches', 'cancelled_at', 'cancelled_at IS NULL OR cancelled_at >= 0'],
            ['job_batches', 'created_at', 'created_at >= 0'],
            ['job_batches', 'finished_at', 'finished_at IS NULL OR finished_at >= 0'],
            ['businesses', 'max_users', 'max_users >= 0'],
            ['businesses', 'max_branches', 'max_branches >= 0'],
            ['customers', 'pay_term', 'pay_term >= 0'],
            ['suppliers', 'pay_term', 'pay_term >= 0'],
            ['custom_field_definitions', 'sort_order', 'sort_order >= 0'],
        ];

        foreach ($unsignedColumns as [$table, $col, $check]) {
            $constraint = "{$table}_{$col}_non_negative";
            DB::statement("ALTER TABLE {$table} DROP CONSTRAINT IF EXISTS {$constraint}");
            DB::statement("ALTER TABLE {$table} ADD CONSTRAINT {$constraint} CHECK ({$check})");
        }

        // ── Explicit CHECK constraints for enum columns not yet hardened ──

        $enumChecks = [
            // Migrations that use enum() and didn't get explicit names in the hardening migration
            ['purchases', 'status', 'status IN (\'draft\', \'confirmed\', \'partially_received\', \'received\', \'cancelled\')'],
            ['purchases', 'payment_status', 'payment_status IN (\'unpaid\', \'partial\', \'paid\')'],
            ['stock_adjustment_items', 'direction', 'direction IN (\'in\', \'out\')'],
        ];

        foreach ($enumChecks as [$table, $col, $check]) {
            $constraint = "{$table}_{$col}_check";
            DB::statement("ALTER TABLE {$table} DROP CONSTRAINT IF EXISTS {$constraint}");
            DB::statement("ALTER TABLE {$table} ADD CONSTRAINT {$constraint} CHECK ({$check})");
        }

        // ── Fix discount_type mismatch between sales (enum) and purchases (string) ──
        // Purchases uses string()->nullable() so invalid values could leak in.
        // Add CHECK constraints that mirror the sales enum values.

        $discountChecks = [
            ['purchases', 'discount_type', 'discount_type IS NULL OR discount_type IN (\'fixed\', \'percentage\')'],
            ['purchase_items', 'discount_type', 'discount_type IS NULL OR discount_type IN (\'fixed\', \'percentage\')'],
        ];

        foreach ($discountChecks as [$table, $col, $check]) {
            $constraint = "{$table}_{$col}_valid_enum";
            DB::statement("ALTER TABLE {$table} DROP CONSTRAINT IF EXISTS {$constraint}");
            DB::statement("ALTER TABLE {$table} ADD CONSTRAINT {$constraint} CHECK ({$check})");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        // Drop all CHECK constraints added by this migration.
        DB::statement('ALTER TABLE purchases DROP CONSTRAINT IF EXISTS purchases_discount_type_valid_enum');
        DB::statement('ALTER TABLE purchase_items DROP CONSTRAINT IF EXISTS purchase_items_discount_type_valid_enum');
        DB::statement('ALTER TABLE purchases DROP CONSTRAINT IF EXISTS purchases_status_check');
        DB::statement('ALTER TABLE purchases DROP CONSTRAINT IF EXISTS purchases_payment_status_check');
        DB::statement('ALTER TABLE stock_adjustment_items DROP CONSTRAINT IF EXISTS stock_adjustment_items_direction_check');
    }
};
