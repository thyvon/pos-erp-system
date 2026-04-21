<?php

namespace Tests\Feature\Api\V1\Sales;

use App\Models\Branch;
use App\Models\Business;
use App\Models\Product;
use App\Models\Sale;
use App\Models\StockLevel;
use App\Models\StockSerial;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SaleReturnApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_completed_sale_can_create_return_and_restore_inventory(): void
    {
        [$business, $branch, $warehouse, $product, $saleId, $user] = $this->createCompletedSale();

        Sanctum::actingAs($user);

        $saleItemId = Sale::withoutGlobalScopes()
            ->with('items')
            ->findOrFail($saleId)
            ->items
            ->first()
            ->id;
        $saleItem = Sale::withoutGlobalScopes()
            ->with('items')
            ->findOrFail($saleId)
            ->items
            ->first();
        $expectedReturnAmount = number_format(
            round(((float) $saleItem->total_amount / max((float) $saleItem->quantity, 1)) * 1, 2),
            2,
            '.',
            ''
        );

        $this->postJson("/api/v1/sales/{$saleId}/returns", [
            'return_date' => now()->toDateString(),
            'refund_method' => 'credit_note',
            'items' => [[
                'sale_item_id' => $saleItemId,
                'quantity' => 1,
            ]],
        ])->assertCreated()
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.total_amount', $expectedReturnAmount);

        $this->assertDatabaseHas('sales', [
            'id' => $saleId,
            'status' => 'returned',
        ]);

        $this->assertDatabaseHas('stock_levels', [
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'quantity' => '4.0000',
            'reserved_quantity' => '0.0000',
        ]);

        $this->assertDatabaseHas('sale_returns', [
            'sale_id' => $saleId,
            'refund_method' => 'credit_note',
            'total_amount' => $expectedReturnAmount,
        ]);

        $this->assertDatabaseHas('stock_movements', [
            'reference_type' => 'App\\Models\\SaleReturn',
            'type' => 'sale_return',
            'quantity' => '1.0000',
        ]);

        $this->assertDatabaseHas('journals', [
            'reference_type' => 'App\\Models\\SaleReturn',
            'type' => 'sale_return',
        ]);
    }

    public function test_serial_tracked_sale_return_restores_serial_to_stock(): void
    {
        $business = Business::factory()->create();
        $branch = Branch::factory()->create(['business_id' => $business->id]);
        $warehouse = Warehouse::factory()->forBranch($branch)->create();
        $unit = Unit::factory()->create(['business_id' => $business->id]);
        $product = Product::factory()->create([
            'business_id' => $business->id,
            'unit_id' => $unit->id,
            'track_inventory' => true,
            'stock_tracking' => 'serial',
            'selling_price' => 50,
            'minimum_selling_price' => 30,
            'purchase_price' => 20,
        ]);
        StockLevel::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'quantity' => 1,
            'reserved_quantity' => 0,
        ]);
        $serial = StockSerial::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'serial_number' => 'SER-1001',
            'status' => 'in_stock',
            'unit_cost' => 20,
        ]);

        $user = User::factory()->for($business)->create();
        $user->assignRole('manager');
        $user->branches()->attach($branch->id);

        Sanctum::actingAs($user);

        $saleId = $this->postJson('/api/v1/sales', [
            'branch_id' => $branch->id,
            'warehouse_id' => $warehouse->id,
            'type' => 'invoice',
            'sale_date' => now()->toDateString(),
            'items' => [[
                'product_id' => $product->id,
                'quantity' => 1,
                'unit_price' => 50,
                'unit_cost' => 20,
                'serial_ids' => [$serial->id],
            ]],
        ])->assertCreated()->json('data.id');

        $this->postJson("/api/v1/sales/{$saleId}/confirm")->assertOk();
        $this->postJson("/api/v1/sales/{$saleId}/complete")->assertOk();

        $saleItemId = Sale::withoutGlobalScopes()
            ->with('items.serials')
            ->findOrFail($saleId)
            ->items
            ->first()
            ->id;

        $this->postJson("/api/v1/sales/{$saleId}/returns", [
            'return_date' => now()->toDateString(),
            'refund_method' => 'credit_note',
            'items' => [[
                'sale_item_id' => $saleItemId,
                'quantity' => 1,
                'serial_ids' => [$serial->id],
            ]],
        ])->assertCreated();

        $this->assertDatabaseHas('stock_serials', [
            'id' => $serial->id,
            'warehouse_id' => $warehouse->id,
            'status' => 'in_stock',
        ]);

        $this->assertDatabaseHas('stock_levels', [
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'quantity' => '1.0000',
        ]);
    }

    public function test_return_quantity_cannot_exceed_remaining_sold_quantity(): void
    {
        [, , , , $saleId, $user] = $this->createCompletedSale();

        Sanctum::actingAs($user);

        $saleItemId = Sale::withoutGlobalScopes()
            ->with('items')
            ->findOrFail($saleId)
            ->items
            ->first()
            ->id;

        $this->postJson("/api/v1/sales/{$saleId}/returns", [
            'return_date' => now()->toDateString(),
            'refund_method' => 'credit_note',
            'items' => [[
                'sale_item_id' => $saleItemId,
                'quantity' => 2,
            ]],
        ])->assertCreated();

        $this->postJson("/api/v1/sales/{$saleId}/returns", [
            'return_date' => now()->toDateString(),
            'refund_method' => 'credit_note',
            'items' => [[
                'sale_item_id' => $saleItemId,
                'quantity' => 2,
            ]],
        ])->assertStatus(422);
    }

    protected function createCompletedSale(): array
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
            'selling_price' => 15,
            'minimum_selling_price' => 10,
            'purchase_price' => 4,
        ]);
        StockLevel::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'quantity' => 5,
            'reserved_quantity' => 0,
        ]);

        $user = User::factory()->for($business)->create();
        $user->assignRole('manager');
        $user->branches()->attach($branch->id);

        Sanctum::actingAs($user);

        $saleId = $this->postJson('/api/v1/sales', [
            'branch_id' => $branch->id,
            'warehouse_id' => $warehouse->id,
            'type' => 'invoice',
            'sale_date' => now()->toDateString(),
            'items' => [[
                'product_id' => $product->id,
                'quantity' => 2,
                'unit_price' => 15,
                'unit_cost' => 4,
            ]],
        ])->assertCreated()->json('data.id');

        $this->postJson("/api/v1/sales/{$saleId}/confirm")->assertOk();
        $this->postJson("/api/v1/sales/{$saleId}/complete")->assertOk();

        return [$business, $branch, $warehouse, $product, $saleId, $user];
    }
}
