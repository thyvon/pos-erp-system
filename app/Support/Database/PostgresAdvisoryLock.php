<?php

namespace App\Support\Database;

use Illuminate\Support\Facades\DB;
use LogicException;

final class PostgresAdvisoryLock
{
    public static function acquire(string $key): void
    {
        $connection = DB::connection();

        if ($connection->getDriverName() !== 'pgsql') {
            return;
        }

        if ($connection->transactionLevel() < 1) {
            throw new LogicException('PostgreSQL advisory locks must be acquired inside a database transaction.');
        }

        DB::select('select pg_advisory_xact_lock(hashtext(?))', [$key]);
    }
}
