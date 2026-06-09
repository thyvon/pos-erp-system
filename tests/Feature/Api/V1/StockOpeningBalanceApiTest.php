<?php

namespace Tests\Feature\Api\V1;

use App\Models\Business;
use App\Models\Product;
use App\Models\StockLot;
use App\Models\StockMovement;
use App\Models\StockSerial;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StockOpeningBalanceApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_admin_can_create_opening_balance_for_standard_product(): void
    {
        [$business, $admin, $warehouse] = $this->actingAdminWithWarehouse();
        $product = $this->inventoryProduct($business);

        $response = $this->postJson('/api/v1/inventory/opening-balances', [
            'warehouse_id' => $warehouse->id,
            'date' => '2026-06-09',
            'notes' => 'Initial migration stock',
            'items' => [[
                'product_id' => $product->id,
                'quantity' => 12,
                'unit_cost' => 4.5,
            ]],
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.warehouse_id', $warehouse->id)
            ->assertJsonPath('data.items.0.product_id', $product->id);

        $this->assertDatabaseHas('stock_levels', [
            'business_id' => $business->id,
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'quantity' => '12.0000',
        ]);
        $this->assertDatabaseHas('stock_movements', [
            'business_id' => $business->id,
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'type' => 'opening_stock',
            'quantity' => '12.0000',
            'unit_cost' => '4.5000',
            'created_by' => $admin->id,
        ]);
    }

    public function test_lot_product_opening_balance_creates_lot_and_stock(): void
    {
        [$business, , $warehouse] = $this->actingAdminWithWarehouse();
        $product = $this->inventoryProduct($business, ['stock_tracking' => 'lot']);

        $response = $this->postJson('/api/v1/inventory/opening-balances', [
            'warehouse_id' => $warehouse->id,
            'date' => '2026-06-09',
            'items' => [[
                'product_id' => $product->id,
                'quantity' => 5,
                'unit_cost' => 3,
                'lot_number' => 'LOT-OPEN-1',
                'expiry_date' => '2027-06-09',
            ]],
        ]);

        $response->assertCreated();

        $lot = StockLot::query()->where('lot_number', 'LOT-OPEN-1')->firstOrFail();

        $this->assertSame($product->id, $lot->product_id);
        $this->assertSame($warehouse->id, $lot->warehouse_id);
        $this->assertSame('5.0000', (string) $lot->qty_received);
        $this->assertSame('5.0000', (string) $lot->qty_on_hand);
    }

    public function test_serial_product_opening_balance_requires_one_serial_per_line(): void
    {
        [$business, , $warehouse] = $this->actingAdminWithWarehouse();
        $product = $this->inventoryProduct($business, ['stock_tracking' => 'serial']);

        $response = $this->postJson('/api/v1/inventory/opening-balances', [
            'warehouse_id' => $warehouse->id,
            'date' => '2026-06-09',
            'items' => [[
                'product_id' => $product->id,
                'quantity' => 1,
                'unit_cost' => 9,
                'serial_number' => 'SER-OPEN-1',
                'warranty_expires' => '2027-06-09',
            ]],
        ]);

        $response->assertCreated();

        $serial = StockSerial::query()->where('serial_number', 'SER-OPEN-1')->firstOrFail();

        $this->assertSame($product->id, $serial->product_id);
        $this->assertSame($warehouse->id, $serial->warehouse_id);
        $this->assertSame('in_stock', $serial->status);
        $this->assertDatabaseHas('stock_levels', [
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'quantity' => '1.0000',
        ]);
    }

    public function test_opening_balance_is_blocked_after_stock_history_exists(): void
    {
        [$business, , $warehouse] = $this->actingAdminWithWarehouse();
        $product = $this->inventoryProduct($business);

        StockMovement::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'type' => 'adjustment_in',
            'quantity' => 1,
            'unit_cost' => 1,
        ]);

        $response = $this->postJson('/api/v1/inventory/opening-balances', [
            'warehouse_id' => $warehouse->id,
            'date' => '2026-06-09',
            'items' => [[
                'product_id' => $product->id,
                'quantity' => 3,
                'unit_cost' => 2,
            ]],
        ]);

        $response
            ->assertStatus(422)
            ->assertJsonPath('message', 'Opening balance can only be entered before stock history exists for the selected product and warehouse.');
    }

    private function actingAdminWithWarehouse(): array
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');
        $branch = $this->assignBranchAccess($admin);
        $warehouse = Warehouse::factory()->for($business)->create(['branch_id' => $branch->id]);

        Sanctum::actingAs($admin);

        return [$business, $admin, $warehouse];
    }

    private function inventoryProduct(Business $business, array $overrides = []): Product
    {
        $unit = Unit::factory()->for($business)->create();

        return Product::factory()->for($business)->create(array_merge([
            'unit_id' => $unit->id,
            'track_inventory' => true,
            'stock_tracking' => 'none',
            'type' => 'single',
        ], $overrides));
    }
}
