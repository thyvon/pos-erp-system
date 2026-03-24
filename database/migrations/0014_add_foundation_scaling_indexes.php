<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('businesses', function (Blueprint $table): void {
            $table->index(['status', 'tier', 'created_at'], 'businesses_status_tier_created_at_index');
        });

        Schema::table('branches', function (Blueprint $table): void {
            $table->index(['business_id', 'deleted_at', 'is_active', 'is_default', 'name'], 'branches_listing_index');
            $table->index(['business_id', 'deleted_at', 'manager_id'], 'branches_business_manager_index');
        });

        Schema::table('warehouses', function (Blueprint $table): void {
            $table->index(['business_id', 'deleted_at', 'branch_id', 'type', 'is_default', 'name'], 'warehouses_listing_index');
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->index(['business_id', 'deleted_at', 'status', 'created_at'], 'users_listing_index');
        });

        Schema::table('branch_user', function (Blueprint $table): void {
            $table->index(['branch_id', 'user_id'], 'branch_user_branch_user_index');
        });
    }

    public function down(): void
    {
        Schema::table('branch_user', function (Blueprint $table): void {
            $table->dropIndex('branch_user_branch_user_index');
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->dropIndex('users_listing_index');
        });

        Schema::table('warehouses', function (Blueprint $table): void {
            $table->dropIndex('warehouses_listing_index');
        });

        Schema::table('branches', function (Blueprint $table): void {
            $table->dropIndex('branches_listing_index');
            $table->dropIndex('branches_business_manager_index');
        });

        Schema::table('businesses', function (Blueprint $table): void {
            $table->dropIndex('businesses_status_tier_created_at_index');
        });
    }
};
