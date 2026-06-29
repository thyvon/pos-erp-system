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

        DB::unprepared(<<<'SQL'
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        SQL);

        DB::unprepared(<<<'SQL'
            DROP TRIGGER IF EXISTS trg_stock_levels_updated_at ON stock_levels;
            CREATE TRIGGER trg_stock_levels_updated_at
                BEFORE UPDATE ON stock_levels
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        SQL);
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::unprepared('DROP TRIGGER IF EXISTS trg_stock_levels_updated_at ON stock_levels');
        DB::unprepared('DROP FUNCTION IF EXISTS update_updated_at_column()');
    }
};
