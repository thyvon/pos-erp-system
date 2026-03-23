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
            $table->foreignUuid('default_branch_id')
                ->nullable()
                ->after('business_id')
                ->constrained('branches')
                ->nullOnDelete();
        });

        Schema::create('branch_user', function (Blueprint $table) {
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->timestamps();

            $table->primary(['user_id', 'branch_id']);
        });

        $users = DB::table('users')->select(['id', 'business_id'])->get();

        foreach ($users as $user) {
            $branches = DB::table('branches')
                ->where('business_id', $user->business_id)
                ->orderByDesc('is_default')
                ->orderBy('name')
                ->pluck('id')
                ->all();

            foreach ($branches as $branchId) {
                DB::table('branch_user')->updateOrInsert([
                    'user_id' => $user->id,
                    'branch_id' => $branchId,
                ], [
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            DB::table('users')
                ->where('id', $user->id)
                ->update([
                    'default_branch_id' => $branches[0] ?? null,
                ]);
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['default_branch_id']);
            $table->dropColumn('default_branch_id');
        });

        Schema::dropIfExists('branch_user');
    }
};
