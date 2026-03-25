<?php

namespace Tests\Feature\Api\V1\Catalog;

use App\Models\Business;
use App\Models\RackLocation;
use App\Models\Setting;
use App\Models\User;
use App\Models\Warehouse;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RackLocationApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_admin_can_create_rack_location_when_feature_is_enabled(): void
    {
        [$business, $admin, $warehouse] = $this->setUpRackLocationContext();
        $this->enableRackLocations($business->id);

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/rack-locations', [
            'warehouse_id' => $warehouse->id,
            'name' => 'Aisle A',
            'code' => 'A-01',
            'description' => 'Front beverage aisle',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.name', 'Aisle A')
            ->assertJsonPath('data.code', 'A-01');
    }

    public function test_create_is_blocked_when_rack_location_feature_is_disabled(): void
    {
        [, $admin, $warehouse] = $this->setUpRackLocationContext();

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/rack-locations', [
            'warehouse_id' => $warehouse->id,
            'name' => 'Aisle A',
            'code' => 'A-01',
        ]);

        $response
            ->assertStatus(400)
            ->assertJsonPath('message', 'Rack locations are disabled in stock settings.');
    }

    public function test_index_returns_only_current_business_rack_locations(): void
    {
        [$business, $admin, $warehouse] = $this->setUpRackLocationContext();
        $otherBusiness = Business::factory()->create();
        $otherWarehouse = Warehouse::withoutGlobalScopes()->create([
            'business_id' => $otherBusiness->id,
            'branch_id' => $warehouse->branch_id,
            'name' => 'Other Warehouse',
            'code' => 'OTH',
            'type' => 'main',
            'is_active' => true,
            'is_default' => false,
            'allow_negative_stock' => false,
        ]);

        RackLocation::factory()->for($warehouse)->create([
            'business_id' => $business->id,
            'name' => 'Visible Rack',
            'code' => 'VIS-1',
        ]);

        RackLocation::withoutGlobalScopes()->create([
            'business_id' => $otherBusiness->id,
            'warehouse_id' => $otherWarehouse->id,
            'name' => 'Hidden Rack',
            'code' => 'HID-1',
            'description' => null,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/rack-locations');

        $response
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonFragment(['name' => 'Visible Rack'])
            ->assertJsonMissing(['name' => 'Hidden Rack']);
    }

    public function test_options_return_current_business_rack_locations_only(): void
    {
        [$business, $admin, $warehouse] = $this->setUpRackLocationContext();
        $otherBusiness = Business::factory()->create();
        $otherWarehouse = Warehouse::withoutGlobalScopes()->create([
            'business_id' => $otherBusiness->id,
            'branch_id' => $warehouse->branch_id,
            'name' => 'Other Warehouse',
            'code' => 'OTH',
            'type' => 'main',
            'is_active' => true,
            'is_default' => false,
            'allow_negative_stock' => false,
        ]);

        RackLocation::factory()->for($warehouse)->create([
            'business_id' => $business->id,
            'name' => 'Visible Rack',
            'code' => 'VIS-1',
        ]);

        RackLocation::withoutGlobalScopes()->create([
            'business_id' => $otherBusiness->id,
            'warehouse_id' => $otherWarehouse->id,
            'name' => 'Hidden Rack',
            'code' => 'HID-1',
            'description' => null,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/rack-locations/options');

        $response
            ->assertOk()
            ->assertJsonFragment(['name' => 'Visible Rack'])
            ->assertJsonMissing(['name' => 'Hidden Rack']);
    }

    public function test_rack_location_can_be_deleted_when_unused(): void
    {
        [$business, $admin, $warehouse] = $this->setUpRackLocationContext();
        $rackLocation = RackLocation::factory()->for($warehouse)->create([
            'business_id' => $business->id,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->deleteJson("/api/v1/rack-locations/{$rackLocation->id}");

        $response->assertOk();
        $this->assertSoftDeleted('rack_locations', ['id' => $rackLocation->id]);
    }

    protected function setUpRackLocationContext(): array
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');
        $branch = \App\Models\Branch::factory()->for($business)->create();
        $admin->branches()->attach($branch->id);
        $warehouse = Warehouse::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'branch_id' => $branch->id,
            'name' => 'Main Warehouse',
            'code' => 'MAIN',
            'type' => 'main',
            'is_active' => true,
            'is_default' => true,
            'allow_negative_stock' => false,
        ]);

        return [$business, $admin, $warehouse];
    }

    protected function enableRackLocations(string $businessId): void
    {
        Setting::withoutGlobalScopes()->create([
            'business_id' => $businessId,
            'group' => 'stock',
            'key' => 'enable_rack_location',
            'value' => '1',
            'type' => 'boolean',
            'is_encrypted' => false,
        ]);
    }
}
