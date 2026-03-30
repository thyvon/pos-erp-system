<?php

namespace Tests\Feature\Api\V1\Inventory;

use App\Models\Branch;
use App\Models\Business;
use App\Models\Product;
use App\Models\StockLot;
use App\Models\StockSerial;
use App\Models\User;
use App\Models\Unit;
use App\Models\Warehouse;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class InventoryWorkflowApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_branch_scoped_inventory_manager_can_adjust_only_allowed_branch_warehouses(): void
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
        $user = User::factory()->for($business)->create();
        $user->assignRole('inventory_manager');
        $user->branches()->attach($branchA->id);

        Sanctum::actingAs($user);

        $allowedResponse = $this->postJson('/api/v1/inventory/adjustments', [
            'warehouse_id' => $warehouseA->id,
            'date' => now()->toDateString(),
            'reason' => 'Opening correction',
            'items' => [[
                'product_id' => $product->id,
                'direction' => 'in',
                'quantity' => 5,
                'unit_cost' => 1.2,
            ]],
        ]);

        $allowedResponse->assertCreated();

        $forbiddenResponse = $this->postJson('/api/v1/inventory/adjustments', [
            'warehouse_id' => $warehouseB->id,
            'date' => now()->toDateString(),
            'reason' => 'Other branch',
            'items' => [[
                'product_id' => $product->id,
                'direction' => 'in',
                'quantity' => 5,
                'unit_cost' => 1.2,
            ]],
        ]);

        $forbiddenResponse->assertForbidden();
    }

    public function test_cross_branch_transfer_appears_in_both_sides_transfer_lists(): void
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

        $userA = User::factory()->for($business)->create();
        $userA->assignRole('inventory_manager');
        $userA->branches()->attach($branchA->id);

        $userB = User::factory()->for($business)->create();
        $userB->assignRole('inventory_manager');
        $userB->branches()->attach($branchB->id);

        Sanctum::actingAs($userA);

        $this->postJson('/api/v1/inventory/adjustments', [
            'warehouse_id' => $warehouseA->id,
            'date' => now()->toDateString(),
            'reason' => 'Seed stock',
            'items' => [[
                'product_id' => $product->id,
                'direction' => 'in',
                'quantity' => 20,
                'unit_cost' => 2,
            ]],
        ])->assertCreated();

        $createTransfer = $this->postJson('/api/v1/inventory/transfers', [
            'from_warehouse_id' => $warehouseA->id,
            'to_warehouse_id' => $warehouseB->id,
            'date' => now()->toDateString(),
            'items' => [[
                'product_id' => $product->id,
                'quantity' => 7,
                'unit_cost' => 2,
            ]],
        ])->assertCreated();

        $transferId = $createTransfer->json('data.id');

        $this->getJson('/api/v1/inventory/transfers')
            ->assertOk()
            ->assertJsonFragment(['id' => $transferId]);

        Sanctum::actingAs($userB);

        $this->getJson('/api/v1/inventory/transfers')
            ->assertOk()
            ->assertJsonFragment(['id' => $transferId]);
    }

    public function test_transfer_can_persist_lot_and_serial_context_from_scanned_item(): void
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

        $lot = StockLot::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'product_id' => $product->id,
            'warehouse_id' => $warehouseA->id,
            'lot_number' => 'LOT-TRF-1',
            'received_at' => now(),
            'unit_cost' => 2,
            'qty_received' => 10,
            'qty_on_hand' => 10,
            'qty_reserved' => 0,
            'status' => 'active',
        ]);

        $serial = StockSerial::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'product_id' => $product->id,
            'warehouse_id' => $warehouseA->id,
            'serial_number' => 'SER-TRF-1',
            'status' => 'in_stock',
            'unit_cost' => 2,
            'received_at' => now(),
        ]);

        $user = User::factory()->for($business)->create();
        $user->assignRole('inventory_manager');
        $user->branches()->attach($branchA->id);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/v1/inventory/transfers', [
            'from_warehouse_id' => $warehouseA->id,
            'to_warehouse_id' => $warehouseB->id,
            'date' => now()->toDateString(),
            'items' => [[
                'product_id' => $product->id,
                'lot_id' => $lot->id,
                'serial_id' => $serial->id,
                'quantity' => 1,
                'unit_cost' => 2,
            ]],
        ])->assertCreated();

        $transferId = $response->json('data.id');

        $this->assertDatabaseHas('stock_transfer_items', [
            'stock_transfer_id' => $transferId,
            'lot_id' => $lot->id,
            'serial_id' => $serial->id,
        ]);

        $this->assertDatabaseHas('stock_movements', [
            'reference_type' => \App\Models\StockTransfer::class,
            'reference_id' => $transferId,
            'lot_id' => $lot->id,
            'serial_id' => $serial->id,
        ]);
    }
}
