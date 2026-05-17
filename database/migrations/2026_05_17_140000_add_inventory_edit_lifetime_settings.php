<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected array $settings = [
        'adjustment_edit_lifetime_days' => '30',
        'transfer_edit_lifetime_days' => '30',
        'count_edit_lifetime_days' => '30',
    ];

    public function up(): void
    {
        if (! Schema::hasTable('settings') || ! Schema::hasTable('businesses')) {
            return;
        }

        $timestamp = now();
        $businessIds = DB::table('businesses')->pluck('id');

        foreach ($businessIds as $businessId) {
            foreach ($this->settings as $key => $value) {
                DB::table('settings')->updateOrInsert(
                    [
                        'business_id' => $businessId,
                        'group' => 'stock',
                        'key' => $key,
                    ],
                    [
                        'id' => (string) str()->uuid(),
                        'value' => $value,
                        'type' => 'integer',
                        'group' => 'stock',
                        'is_encrypted' => false,
                        'created_at' => $timestamp,
                        'updated_at' => $timestamp,
                    ]
                );
            }
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('settings')) {
            return;
        }

        DB::table('settings')
            ->where('group', 'stock')
            ->whereIn('key', array_keys($this->settings))
            ->delete();
    }
};
