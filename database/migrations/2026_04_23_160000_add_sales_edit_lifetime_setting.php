<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('settings') || ! Schema::hasTable('businesses')) {
            return;
        }

        $timestamp = now();
        $businessIds = DB::table('businesses')->pluck('id');

        foreach ($businessIds as $businessId) {
            DB::table('settings')->updateOrInsert(
                [
                    'business_id' => $businessId,
                    'group' => 'sales',
                    'key' => 'edit_lifetime_days',
                ],
                [
                    'id' => (string) str()->uuid(),
                    'value' => '30',
                    'type' => 'integer',
                    'group' => 'sales',
                    'is_encrypted' => false,
                    'created_at' => $timestamp,
                    'updated_at' => $timestamp,
                ]
            );
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('settings')) {
            return;
        }

        DB::table('settings')
            ->where('group', 'sales')
            ->where('key', 'edit_lifetime_days')
            ->delete();
    }
};
