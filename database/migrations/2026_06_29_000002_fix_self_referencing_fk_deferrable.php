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

        // Convert the self-referencing FK on purchase_payments.replaces_payment_id
        // to DEFERRABLE INITIALLY DEFERRED so bulk inserts/restores don't fail
        // with circular FK violations.
        DB::statement('ALTER TABLE purchase_payments DROP CONSTRAINT IF EXISTS purchase_payments_replaces_payment_id_foreign');
        DB::statement('ALTER TABLE purchase_payments ADD CONSTRAINT purchase_payments_replaces_payment_id_foreign FOREIGN KEY (replaces_payment_id) REFERENCES purchase_payments(id) DEFERRABLE INITIALLY DEFERRED');
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('ALTER TABLE purchase_payments DROP CONSTRAINT IF EXISTS purchase_payments_replaces_payment_id_foreign');
        DB::statement('ALTER TABLE purchase_payments ADD CONSTRAINT purchase_payments_replaces_payment_id_foreign FOREIGN KEY (replaces_payment_id) REFERENCES purchase_payments(id)');
    }
};
