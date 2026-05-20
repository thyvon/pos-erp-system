<?php

namespace Tests\Feature\Api\V1\Inventory;

use App\Models\Branch;
use App\Models\Business;
use App\Models\Product;
use App\Models\StockLevel;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StockLevelApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_branch_scoped_inventory_manager_only_sees_stock_levels_in_allowed_branch(): void
    {
        $business = Business::factory()->create();
        $branchA = Branch::factory()->create(['business_id' => $business->id]);
        $branchB = Branch::factory()->create(['business_id' => $business->id]);
        $warehouseA = Warehouse::factory()->forBranch($branchA)->create(['name' => 'Main Warehouse']);
        $warehouseB = Warehouse::factory()->forBranch($branchB)->create(['name' => 'Overflow Warehouse']);
        $unit = Unit::factory()->create(['business_id' => $business->id]);
        $productA = Product::factory()->create([
            'business_id' => $business->id,
            'unit_id' => $unit->id,
            'name' => 'Allowed Item',
            'sku' => 'SKU-ALLOWED',
            'track_inventory' => true,
        ]);
        $productB = Product::factory()->create([
            'business_id' => $business->id,
            'unit_id' => $unit->id,
            'name' => 'Hidden Item',
            'sku' => 'SKU-HIDDEN',
            'track_inventory' => true,
        ]);

        StockLevel::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'product_id' => $productA->id,
            'warehouse_id' => $warehouseA->id,
            'quantity' => 12,
            'reserved_quantity' => 2,
        ]);

        StockLevel::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'product_id' => $productB->id,
            'warehouse_id' => $warehouseB->id,
            'quantity' => 7,
            'reserved_quantity' => 0,
        ]);

        $user = User::factory()->for($business)->create();
        $user->assignRole('inventory_manager');
        $user->branches()->attach($branchA->id);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/inventory/stock');

        $response
            ->assertOk()
            ->assertJsonFragment(['name' => 'Allowed Item'])
            ->assertJsonMissing(['name' => 'Hidden Item'])
            ->assertJsonPath('data.0.quantity', '12.0000')
            ->assertJsonPath('data.0.reserved_quantity', '2.0000')
            ->assertJsonPath('data.0.available_qty', '10.0000');
    }

    public function test_stock_level_detail_requires_branch_access(): void
    {
        $business = Business::factory()->create();
        $allowedBranch = Branch::factory()->create(['business_id' => $business->id]);
        $blockedBranch = Branch::factory()->create(['business_id' => $business->id]);
        $allowedWarehouse = Warehouse::factory()->forBranch($allowedBranch)->create();
        $blockedWarehouse = Warehouse::factory()->forBranch($blockedBranch)->create();
        $unit = Unit::factory()->create(['business_id' => $business->id]);
        $product = Product::factory()->create([
            'business_id' => $business->id,
            'unit_id' => $unit->id,
            'track_inventory' => true,
        ]);

        $allowedLevel = StockLevel::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'product_id' => $product->id,
            'warehouse_id' => $allowedWarehouse->id,
            'quantity' => 4,
            'reserved_quantity' => 1,
        ]);

        $blockedLevel = StockLevel::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'product_id' => $product->id,
            'warehouse_id' => $blockedWarehouse->id,
            'quantity' => 5,
            'reserved_quantity' => 0,
        ]);

        $user = User::factory()->for($business)->create();
        $user->assignRole('inventory_manager');
        $user->branches()->attach($allowedBranch->id);

        Sanctum::actingAs($user);

        $this->getJson("/api/v1/inventory/stock/{$allowedLevel->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $allowedLevel->id);

        $this->getJson("/api/v1/inventory/stock/{$blockedLevel->id}")
            ->assertForbidden();
    }
}
