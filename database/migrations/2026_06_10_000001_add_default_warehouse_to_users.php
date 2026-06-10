<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignUuid('default_warehouse_id')
                ->nullable()
                ->after('default_branch_id')
                ->constrained('warehouses')
                ->nullOnDelete();
        });

        DB::table('users')->orderBy('id')->each(function (object $user): void {
            $warehouseIds = DB::table('user_warehouse')
                ->where('user_id', $user->id)
                ->pluck('warehouse_id')
                ->all();

            if ($warehouseIds !== []) {
                $defaultWarehouseId = DB::table('warehouses')
                    ->whereIn('id', $warehouseIds)
                    ->orderByDesc('is_default')
                    ->orderBy('name')
                    ->value('id');

                if ($defaultWarehouseId !== null) {
                    DB::table('users')
                        ->where('id', $user->id)
                        ->update(['default_warehouse_id' => $defaultWarehouseId]);
                }
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['default_warehouse_id']);
            $table->dropColumn('default_warehouse_id');
        });
    }
};
