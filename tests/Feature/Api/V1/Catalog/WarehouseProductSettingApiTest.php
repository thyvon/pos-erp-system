<?php

namespace Tests\Feature\Api\V1\Catalog;

use App\Models\Branch;
use App\Models\Business;
use App\Models\Product;
use App\Models\ProductVariation;
use App\Models\RackLocation;
use App\Models\StockLevel;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use App\Models\WarehouseProductSetting;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WarehouseProductSettingApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Cache::flush();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_manager_can_create_and_view_warehouse_product_setting(): void
    {
        [$business, $branch, $warehouse, $product, $user] = $this->fixtures();
        $rackLocation = RackLocation::factory()->create([
            'business_id' => $business->id,
            'warehouse_id' => $warehouse->id,
            'name' => 'Aisle A',
            'code' => 'A-01',
        ]);
        $supplier = Supplier::factory()->create(['business_id' => $business->id]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/v1/warehouse-product-settings', [
            'warehouse_id' => $warehouse->id,
            'product_id' => $product->id,
            'rack_location_id' => $rackLocation->id,
            'preferred_supplier_id' => $supplier->id,
            'min_stock_alert' => 5,
            'max_stock_level' => 50,
            'reorder_point' => 10,
            'reorder_quantity' => 20,
            'is_active' => true,
            'notes' => 'Keep near dispatch counter',
        ])->assertCreated()
            ->assertJsonPath('data.warehouse_id', $warehouse->id)
            ->assertJsonPath('data.product_id', $product->id)
            ->assertJsonPath('data.rack_location.id', $rackLocation->id)
            ->assertJsonPath('data.preferred_supplier.id', $supplier->id)
            ->assertJsonPath('data.min_stock_alert', '5.0000')
            ->assertJsonPath('data.reorder_quantity', '20.0000');

        $settingId = $response->json('data.id');

        $this->getJson("/api/v1/warehouse-product-settings/{$settingId}")
            ->assertOk()
            ->assertJsonPath('data.warehouse.branch.id', $branch->id)
            ->assertJsonPath('data.product.name', $product->name);

        $this->assertDatabaseHas('warehouse_product_settings', [
            'id' => $settingId,
            'business_id' => $business->id,
            'warehouse_id' => $warehouse->id,
            'product_id' => $product->id,
            'rack_location_id' => $rackLocation->id,
            'preferred_supplier_id' => $supplier->id,
            'min_stock_alert' => '5.0000',
            'reorder_point' => '10.0000',
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'business_id' => $business->id,
            'event' => 'created',
            'auditable_type' => WarehouseProductSetting::class,
            'auditable_id' => $settingId,
        ]);
    }

    public function test_duplicate_product_warehouse_variation_setting_is_rejected(): void
    {
        [, , $warehouse, $product, $user] = $this->fixtures();

        WarehouseProductSetting::withoutGlobalScopes()->create([
            'business_id' => $product->business_id,
            'warehouse_id' => $warehouse->id,
            'product_id' => $product->id,
            'is_active' => true,
        ]);

        Sanctum::actingAs($user);

        $this->postJson('/api/v1/warehouse-product-settings', [
            'warehouse_id' => $warehouse->id,
            'product_id' => $product->id,
            'min_stock_alert' => 1,
        ])->assertStatus(422)
            ->assertJsonPath('message', 'This product already has warehouse settings for the selected warehouse and variation.');
    }

    public function test_variation_setting_must_belong_to_selected_product(): void
    {
        [$business, , $warehouse, $product, $user] = $this->fixtures();
        $otherProduct = Product::factory()->create([
            'business_id' => $business->id,
            'unit_id' => $product->unit_id,
            'track_inventory' => true,
        ]);
        $variation = ProductVariation::factory()->create([
            'business_id' => $business->id,
            'product_id' => $otherProduct->id,
        ]);

        Sanctum::actingAs($user);

        $this->postJson('/api/v1/warehouse-product-settings', [
            'warehouse_id' => $warehouse->id,
            'product_id' => $product->id,
            'variation_id' => $variation->id,
        ])->assertStatus(422)
            ->assertJsonPath('message', 'Selected variation is invalid for this product.');
    }

    public function test_rack_location_must_belong_to_selected_warehouse(): void
    {
        [$business, $branch, $warehouse, $product, $user] = $this->fixtures();
        $otherWarehouse = Warehouse::factory()->forBranch($branch)->create();
        $rackLocation = RackLocation::factory()->create([
            'business_id' => $business->id,
            'warehouse_id' => $otherWarehouse->id,
        ]);

        Sanctum::actingAs($user);

        $this->postJson('/api/v1/warehouse-product-settings', [
            'warehouse_id' => $warehouse->id,
            'product_id' => $product->id,
            'rack_location_id' => $rackLocation->id,
        ])->assertStatus(422)
            ->assertJsonPath('message', 'Selected rack location does not belong to the selected warehouse.');
    }

    public function test_user_cannot_create_or_list_settings_for_unassigned_warehouse(): void
    {
        [$business, $branch, $allowedWarehouse, $product, $user] = $this->fixtures();
        $blockedWarehouse = Warehouse::factory()->forBranch($branch)->create();

        WarehouseProductSetting::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'warehouse_id' => $allowedWarehouse->id,
            'product_id' => $product->id,
            'is_active' => true,
        ]);
        WarehouseProductSetting::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'warehouse_id' => $blockedWarehouse->id,
            'product_id' => $product->id,
            'notes' => 'Hidden warehouse setting',
            'is_active' => true,
        ]);

        Sanctum::actingAs($user);

        $this->postJson('/api/v1/warehouse-product-settings', [
            'warehouse_id' => $blockedWarehouse->id,
            'product_id' => $product->id,
        ])->assertStatus(422)
            ->assertJsonValidationErrors('warehouse_id');

        $this->getJson('/api/v1/warehouse-product-settings')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.warehouse_id', $allowedWarehouse->id)
            ->assertJsonMissing(['notes' => 'Hidden warehouse setting']);
    }

    public function test_quantity_rules_are_validated_by_domain_rules(): void
    {
        [, , $warehouse, $product, $user] = $this->fixtures();

        Sanctum::actingAs($user);

        $this->postJson('/api/v1/warehouse-product-settings', [
            'warehouse_id' => $warehouse->id,
            'product_id' => $product->id,
            'min_stock_alert' => 10,
            'max_stock_level' => 5,
        ])->assertStatus(422)
            ->assertJsonPath('message', 'Maximum stock level must be greater than or equal to the minimum stock alert.');

        $this->postJson('/api/v1/warehouse-product-settings', [
            'warehouse_id' => $warehouse->id,
            'product_id' => $product->id,
            'reorder_point' => 10,
        ])->assertStatus(422)
            ->assertJsonPath('message', 'Reorder quantity is required when a reorder point is set.');
    }

    protected function fixtures(): array
    {
        $business = Business::factory()->create();
        $branch = Branch::factory()->create(['business_id' => $business->id]);
        $warehouse = Warehouse::factory()->forBranch($branch)->create();
        $unit = Unit::factory()->create(['business_id' => $business->id]);
        $product = Product::factory()->create([
            'business_id' => $business->id,
            'unit_id' => $unit->id,
            'track_inventory' => true,
            'stock_tracking' => 'none',
        ]);
        StockLevel::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'warehouse_id' => $warehouse->id,
            'product_id' => $product->id,
            'quantity' => 0,
            'reserved_quantity' => 0,
        ]);

        $user = User::factory()->for($business)->create(['default_warehouse_id' => $warehouse->id]);
        $user->assignRole('manager');
        $user->branches()->attach($branch->id);
        $user->warehouses()->attach($warehouse->id);

        return [$business, $branch, $warehouse, $product, $user];
    }
}
