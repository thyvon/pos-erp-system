<?php

namespace Tests\Feature\Api\V1\Inventory;

use App\Models\Branch;
use App\Models\Business;
use App\Models\Product;
use App\Models\StockSerial;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class InventoryProductLookupApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_branch_scoped_inventory_lookup_returns_exact_serial_match_only_from_selected_warehouse(): void
    {
        $business = Business::factory()->create();
        $branchA = Branch::factory()->create(['business_id' => $business->id]);
        $branchB = Branch::factory()->create(['business_id' => $business->id]);
        $warehouseA = Warehouse::factory()->forBranch($branchA)->create();
        $warehouseB = Warehouse::factory()->forBranch($branchB)->create();
        $unit = Unit::factory()->create(['business_id' => $business->id]);
        $product = Product::factory()->create([
            'business_id' => $business->id,
            'unit_id' => $unit->id,
            'track_inventory' => true,
        ]);

        $serialA = StockSerial::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'product_id' => $product->id,
            'warehouse_id' => $warehouseA->id,
            'serial_number' => 'SER-A-001',
            'status' => 'in_stock',
            'unit_cost' => 5,
            'received_at' => now(),
        ]);

        StockSerial::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'product_id' => $product->id,
            'warehouse_id' => $warehouseB->id,
            'serial_number' => 'SER-B-001',
            'status' => 'in_stock',
            'unit_cost' => 5,
            'received_at' => now(),
        ]);

        $user = User::factory()->for($business)->create();
        $user->assignRole('inventory_manager');
        $user->branches()->attach($branchA->id);

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/inventory/product-lookup?q=SER-A-001&warehouse_id='.$warehouseA->id)
            ->assertOk()
            ->assertJsonFragment([
                'serial_id' => $serialA->id,
                'serial_number' => 'SER-A-001',
                'match_type' => 'serial',
                'is_exact_match' => true,
            ])
            ->assertJsonMissing([
                'serial_number' => 'SER-B-001',
            ]);
    }

    public function test_inventory_lookup_can_match_product_description_without_warehouse_context(): void
    {
        $business = Business::factory()->create();
        $unit = Unit::factory()->create(['business_id' => $business->id]);
        $product = Product::factory()->create([
            'business_id' => $business->id,
            'unit_id' => $unit->id,
            'track_inventory' => true,
            'name' => 'Premium Coffee',
            'description' => 'Single origin roasted beans',
        ]);

        $user = User::factory()->for($business)->create();
        $user->assignRole('inventory_manager');

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/inventory/product-lookup?q=roasted')
            ->assertOk()
            ->assertJsonFragment([
                'product_id' => $product->id,
                'product_name' => 'Premium Coffee',
                'match_type' => 'product_description',
            ]);
    }
}
