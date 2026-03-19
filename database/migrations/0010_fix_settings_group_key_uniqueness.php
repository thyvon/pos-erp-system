<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->index('business_id', 'settings_business_id_index');
            $table->dropUnique('settings_business_id_key_unique');
            $table->unique(['business_id', 'group', 'key']);
        });
    }

    public function down(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->dropUnique('settings_business_id_group_key_unique');
            $table->dropIndex('settings_business_id_index');
            $table->unique(['business_id', 'key']);
        });
    }
};
