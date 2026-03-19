<?php

namespace Tests\Feature\Api\V1;

use App\Models\Branch;
use App\Models\Business;
use App\Models\Setting;
use App\Models\User;
use App\Models\Warehouse;
use Database\Seeders\DefaultSettingsSeeder;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BranchWarehouseSettingsApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_branches_index_returns_only_current_business_branches(): void
    {
        $business = Business::factory()->create();
        $otherBusiness = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');

        Branch::factory()->for($business)->count(2)->create();
        Branch::factory()->for($otherBusiness)->count(2)->create();

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/branches');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.total', 2);
    }

    public function test_setting_one_default_branch_clears_default_flag_on_other_branches(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');

        $firstBranch = Branch::factory()->for($business)->create([
            'name' => 'Old Default',
            'code' => 'OLD001',
            'is_default' => true,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/branches', [
            'name' => 'New Default',
            'code' => 'NEW001',
            'is_default' => true,
            'is_active' => true,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.is_default', true);

        $this->assertFalse($firstBranch->fresh()->is_default);
    }

    public function test_get_settings_group_returns_values_and_populates_redis_cache(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');

        $this->seed(DefaultSettingsSeeder::class);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/settings/stock');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.enable_lot_tracking', false)
            ->assertJsonPath('data.enable_serial_tracking', false);

        $cacheValue = Redis::get("settings:{$business->id}:stock:enable_lot_tracking");

        $this->assertNotNull($cacheValue);
    }

    public function test_warehouse_delete_is_blocked_when_stock_movements_exist(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');
        $warehouse = Warehouse::factory()->for($business)->create();

        Schema::create('stock_movements', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('warehouse_id');
        });

        try {
            DB::table('stock_movements')->insert([
                'id' => (string) Str::uuid(),
                'warehouse_id' => $warehouse->id,
            ]);

            Sanctum::actingAs($admin);

            $response = $this->deleteJson("/api/v1/warehouses/{$warehouse->id}");

            $response
                ->assertStatus(422)
                ->assertJsonPath('success', false);
        } finally {
            Schema::dropIfExists('stock_movements');
        }
    }

    public function test_settings_group_update_persists_and_returns_new_values(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');

        Setting::query()->create([
            'business_id' => $business->id,
            'group' => 'stock',
            'key' => 'enable_lot_tracking',
            'value' => '0',
            'type' => 'boolean',
            'is_encrypted' => false,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->putJson('/api/v1/settings/stock', [
            'settings' => [
                'enable_lot_tracking' => true,
                'lot_expiry_alert_days' => 45,
            ],
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.enable_lot_tracking', true)
            ->assertJsonPath('data.lot_expiry_alert_days', 45);
    }
}
