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
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
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

        $visibleBranches = Branch::factory()->for($business)->count(2)->create();
        Branch::factory()->for($otherBusiness)->count(2)->create();
        $admin->branches()->sync($visibleBranches->pluck('id')->all());
        $admin->forceFill(['default_branch_id' => $visibleBranches->first()->id])->save();

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/branches');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.total', 2);
    }

    public function test_branches_index_only_returns_assigned_branches_for_user(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');
        $branchA = Branch::factory()->for($business)->create(['name' => 'Branch A']);
        $branchB = Branch::factory()->for($business)->create(['name' => 'Branch B']);

        $admin->branches()->sync([$branchA->id]);
        $admin->forceFill(['default_branch_id' => $branchA->id])->save();

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/branches');

        $response
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonFragment(['name' => 'Branch A'])
            ->assertJsonMissing(['name' => 'Branch B']);
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

    public function test_branch_store_auto_generates_v8_code_when_missing(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');
        $branch = Branch::factory()->for($business)->create(['code' => 'LEGACY001']);
        $admin->branches()->sync([$branch->id]);
        $admin->forceFill(['default_branch_id' => $branch->id])->save();

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/branches', [
            'name' => 'Auto Code Branch',
            'is_active' => true,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.code', 'BR-001');
    }

    public function test_branch_delete_is_blocked_when_branch_has_assigned_users(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');
        $branch = Branch::factory()->for($business)->create();
        $admin->branches()->sync([$branch->id]);
        $admin->forceFill(['default_branch_id' => $branch->id])->save();

        $staff = User::factory()->for($business)->create();
        $staff->assignRole('cashier');
        $staff->branches()->sync([$branch->id]);
        $staff->forceFill(['default_branch_id' => $branch->id])->save();

        Sanctum::actingAs($admin);

        $response = $this->deleteJson("/api/v1/branches/{$branch->id}");

        $response
            ->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Branch cannot be deleted because it is still assigned to users.');
    }

    public function test_branch_delete_is_blocked_when_branch_has_warehouses(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');
        $branch = Branch::factory()->for($business)->create();
        $admin->branches()->sync([$branch->id]);
        $admin->forceFill(['default_branch_id' => $branch->id])->save();
        Warehouse::factory()->forBranch($branch)->create();

        Sanctum::actingAs($admin);

        $response = $this->deleteJson("/api/v1/branches/{$branch->id}");

        $response
            ->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Branch cannot be deleted because it still has warehouses.');
    }

    public function test_get_settings_group_returns_values_and_populates_cache(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');
        $branch = Branch::factory()->for($business)->create();
        $admin->branches()->sync([$branch->id]);
        $admin->forceFill(['default_branch_id' => $branch->id])->save();

        $this->seed(DefaultSettingsSeeder::class);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/settings/stock');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.enable_lot_tracking', false)
            ->assertJsonPath('data.enable_serial_tracking', false);

        $cacheValue = Cache::get("settings:{$business->id}:stock:enable_lot_tracking");
        $this->assertFalse($cacheValue);
    }

    public function test_warehouse_delete_is_blocked_when_stock_movements_exist(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');
        $branch = Branch::factory()->for($business)->create();
        $admin->branches()->sync([$branch->id]);
        $admin->forceFill(['default_branch_id' => $branch->id])->save();
        $warehouse = Warehouse::factory()->forBranch($branch)->create();

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
        $branch = Branch::factory()->for($business)->create();
        $admin->branches()->sync([$branch->id]);
        $admin->forceFill(['default_branch_id' => $branch->id])->save();

        Setting::query()->updateOrCreate([
            'business_id' => $business->id,
            'group' => 'stock',
            'key' => 'enable_lot_tracking',
        ], [
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

    public function test_settings_group_update_returns_forbidden_without_settings_edit_permission(): void
    {
        $business = Business::factory()->create();
        $manager = User::factory()->for($business)->create();
        $manager->assignRole('manager');
        $branch = Branch::factory()->for($business)->create();
        $manager->branches()->sync([$branch->id]);
        $manager->forceFill(['default_branch_id' => $branch->id])->save();

        Sanctum::actingAs($manager);

        $response = $this->putJson('/api/v1/settings/stock', [
            'settings' => [
                'enable_lot_tracking' => true,
            ],
        ]);

        $response
            ->assertForbidden()
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'You do not have permission.');
    }
}
