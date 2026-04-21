<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('audit_logs', function (Blueprint $table): void {
            $table->foreignUuid('branch_id')
                ->nullable()
                ->after('business_id')
                ->constrained('branches')
                ->nullOnDelete();
            $table->string('notes', 500)->nullable()->after('new_values');

            $table->index(['business_id', 'branch_id', 'created_at'], 'audit_logs_business_branch_created_index');
            $table->index(['business_id', 'event', 'created_at'], 'audit_logs_business_event_created_index');
        });
    }

    public function down(): void
    {
        Schema::table('audit_logs', function (Blueprint $table): void {
            $table->dropIndex('audit_logs_business_branch_created_index');
            $table->dropIndex('audit_logs_business_event_created_index');
            $table->dropForeign(['branch_id']);
            $table->dropColumn(['branch_id', 'notes']);
        });
    }
};
