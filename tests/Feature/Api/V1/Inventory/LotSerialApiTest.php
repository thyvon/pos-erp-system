<?php

namespace Tests\Feature\Api\V1\Inventory;

use App\Models\Branch;
use App\Models\Business;
use App\Models\Product;
use App\Models\StockLot;
use App\Models\StockSerial;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LotSerialApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_branch_scoped_inventory_manager_only_sees_lots_in_allowed_branch(): void
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

        StockLot::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'product_id' => $product->id,
            'warehouse_id' => $warehouseA->id,
            'lot_number' => 'LOT-A',
            'received_at' => now(),
            'unit_cost' => 2,
            'qty_received' => 5,
            'qty_on_hand' => 5,
            'qty_reserved' => 0,
            'status' => 'active',
        ]);

        StockLot::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'product_id' => $product->id,
            'warehouse_id' => $warehouseB->id,
            'lot_number' => 'LOT-B',
            'received_at' => now(),
            'unit_cost' => 2,
            'qty_received' => 5,
            'qty_on_hand' => 5,
            'qty_reserved' => 0,
            'status' => 'active',
        ]);

        $user = User::factory()->for($business)->create();
        $user->assignRole('inventory_manager');
        $user->branches()->attach($branchA->id);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/inventory/lots');

        $response
            ->assertOk()
            ->assertJsonFragment(['lot_number' => 'LOT-A'])
            ->assertJsonMissing(['lot_number' => 'LOT-B']);
    }

    public function test_writing_off_serial_updates_status_reduces_stock_and_logs_audit_event(): void
    {
        $business = Business::factory()->create();
        $branch = Branch::factory()->create(['business_id' => $business->id]);
        $warehouse = Warehouse::factory()->forBranch($branch)->create();
        $unit = Unit::factory()->create(['business_id' => $business->id]);
        $product = Product::factory()->create([
            'business_id' => $business->id,
            'unit_id' => $unit->id,
            'track_inventory' => true,
        ]);
        $user = User::factory()->for($business)->create();
        $user->assignRole('inventory_manager');
        $user->branches()->attach($branch->id);

        Sanctum::actingAs($user);

        $this->postJson('/api/v1/inventory/adjustments', [
            'warehouse_id' => $warehouse->id,
            'date' => now()->toDateString(),
            'reason' => 'Seed stock',
            'items' => [[
                'product_id' => $product->id,
                'direction' => 'in',
                'quantity' => 1,
                'unit_cost' => 4,
            ]],
        ])->assertCreated();

        $serial = StockSerial::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'serial_number' => 'SER-001',
            'status' => 'in_stock',
            'unit_cost' => 4,
            'received_at' => now(),
        ]);

        $this->postJson("/api/v1/inventory/serials/{$serial->id}/write-off", [
            'reason' => 'Damaged unit',
        ])->assertOk()
            ->assertJsonPath('data.status', 'written_off');

        $this->assertDatabaseHas('stock_serials', [
            'id' => $serial->id,
            'status' => 'written_off',
        ]);

        $this->assertDatabaseHas('stock_movements', [
            'reference_type' => StockSerial::class,
            'reference_id' => $serial->id,
            'type' => 'adjustment_out',
            'quantity' => '1.0000',
        ]);

        $this->assertDatabaseHas('stock_levels', [
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'quantity' => '0.0000',
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'event' => 'serial_written_off',
            'auditable_type' => StockSerial::class,
            'auditable_id' => $serial->id,
        ]);
    }
}
