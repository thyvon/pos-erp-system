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

        // Laravel's ofMany()/latestOfMany()/oldestOfMany() relations always add a
        // MAX(<primary key>) tiebreaker subquery. Postgres ships no MAX/MIN
        // aggregate for uuid (unlike MySQL, which sorts it as a string), so any
        // ofMany relation on a uuid-keyed model fails with "function max(uuid)
        // does not exist" unless these aggregates are defined.
        DB::unprepared(<<<'SQL'
            DROP AGGREGATE IF EXISTS max(uuid);
            DROP AGGREGATE IF EXISTS min(uuid);

            CREATE OR REPLACE FUNCTION uuid_greater(uuid, uuid) RETURNS uuid AS $$
                SELECT CASE WHEN $1 IS NULL THEN $2 WHEN $2 IS NULL THEN $1 WHEN $1 > $2 THEN $1 ELSE $2 END;
            $$ LANGUAGE sql IMMUTABLE;

            CREATE OR REPLACE FUNCTION uuid_least(uuid, uuid) RETURNS uuid AS $$
                SELECT CASE WHEN $1 IS NULL THEN $2 WHEN $2 IS NULL THEN $1 WHEN $1 < $2 THEN $1 ELSE $2 END;
            $$ LANGUAGE sql IMMUTABLE;

            CREATE AGGREGATE max(uuid) (SFUNC = uuid_greater, STYPE = uuid);
            CREATE AGGREGATE min(uuid) (SFUNC = uuid_least, STYPE = uuid);
        SQL);
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::unprepared(<<<'SQL'
            DROP AGGREGATE IF EXISTS max(uuid);
            DROP AGGREGATE IF EXISTS min(uuid);
            DROP FUNCTION IF EXISTS uuid_greater(uuid, uuid);
            DROP FUNCTION IF EXISTS uuid_least(uuid, uuid);
        SQL);
    }
};
