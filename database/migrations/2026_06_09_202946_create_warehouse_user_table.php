<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_warehouse', function (Blueprint $table) {
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('warehouse_id')->constrained('warehouses')->cascadeOnDelete();
            $table->timestamps();

            $table->primary(['user_id', 'warehouse_id']);
        });

        $driver = DB::connection()->getDriverName();
        $now = $driver === 'sqlite' ? "datetime('now')" : 'NOW()';

        DB::table('user_warehouse')->insertUsing(
            ['user_id', 'warehouse_id', 'created_at', 'updated_at'],
            DB::table('users')
                ->join('branch_user', 'users.id', '=', 'branch_user.user_id')
                ->join('warehouses', function ($join) {
                    $join->on('warehouses.business_id', '=', 'users.business_id')
                        ->whereColumn('warehouses.branch_id', '=', 'branch_user.branch_id');
                })
                ->select('users.id', 'warehouses.id', DB::raw($now), DB::raw($now))
                ->distinct()
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('user_warehouse');
    }
};
