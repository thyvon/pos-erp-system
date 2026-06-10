<?php

namespace Tests\Feature\Api\V1;

use App\Models\Branch;
use App\Models\Business;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseReturn;
use App\Models\StockLevel;
use App\Models\StockLot;
use App\Models\StockMovement;
use App\Models\StockSerial;
use App\Models\SubUnit;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PurchaseReturnApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow(Carbon::parse('2026-06-01 09:00:00'));
        $this->seed(RolePermissionSeeder::class);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_admin_can_return_received_purchase_items_and_stock_decreases(): void
    {
        [$business, $admin, $branch, $warehouse, $supplier, $product] = $this->makePurchaseContext();
        Sanctum::actingAs($admin);

        $purchase = $this->makeReceivedPurchase($business, $branch, $warehouse, $supplier, $product, 'PO-001', 5);

        $originalStock = StockLevel::where('warehouse_id', $warehouse->id)
            ->where('product_id', $product->id)
            ->value('quantity') ?? 0;

        $this->assertEquals(5, $originalStock, 'Stock should be 5 after receive');

        $purchaseItem = $purchase->items()->first();

        $response = $this->postJson("/api/v1/purchases/{$purchase->id}/returns", [
            'return_date' => '2026-06-01',
            'notes' => 'Damaged goods',
            'items' => [
                [
                    'purchase_item_id' => $purchaseItem->id,
                    'quantity' => 2,
                ],
            ],
        ]);

        $response->assertCreated();
        $response->assertJsonPath('data.return_number', 'PRT-2026-00001');
        $response->assertJsonPath('data.status', 'completed');
        $response->assertJsonPath('data.total_amount', '20.00');
        $response->assertJsonCount(1, 'data.items');

        $this->assertDatabaseHas('purchase_returns', [
            'purchase_id' => $purchase->id,
            'return_number' => 'PRT-2026-00001',
            'total_amount' => 20.00,
        ]);

        $this->assertDatabaseHas('purchase_return_items', [
            'purchase_item_id' => $purchaseItem->id,
            'quantity' => 2,
            'unit_cost' => 10,
            'total_amount' => 20.00,
        ]);

        $purchase->refresh();
        $this->assertEquals('received', $purchase->status);

        $this->assertDatabaseHas('stock_movements', [
            'reference_type' => 'App\Models\PurchaseReturn',
            'product_id' => $product->id,
            'quantity' => 2,
            'type' => 'purchase_return',
        ]);

        $this->assertDatabaseHas('journals', [
            'business_id' => $business->id,
            'type' => 'purchase_return',
            'total_amount' => '20.00',
        ]);

        $this->assertEquals(
            $originalStock - 2,
            StockLevel::where('warehouse_id', $warehouse->id)
                ->where('product_id', $product->id)
                ->value('quantity')
        );
    }

    public function test_admin_cannot_return_draft_or_confirmed_purchase(): void
    {
        [$business, $admin, $branch, $warehouse, $supplier, $product] = $this->makePurchaseContext();
        Sanctum::actingAs($admin);

        $purchase = $this->makePurchase($business, $branch, $warehouse, $supplier, $product, 'PO-002', 'draft');
        $purchaseItem = $purchase->items()->first();

        $response = $this->postJson("/api/v1/purchases/{$purchase->id}/returns", [
            'return_date' => '2026-06-01',
            'items' => [
                ['purchase_item_id' => $purchaseItem->id, 'quantity' => 1],
            ],
        ]);

        $response->assertStatus(422);
    }

    public function test_admin_can_list_purchase_returns(): void
    {
        [$business, $admin, $branch, $warehouse, $supplier, $product] = $this->makePurchaseContext();
        Sanctum::actingAs($admin);

        $purchase = $this->makeReceivedPurchase($business, $branch, $warehouse, $supplier, $product, 'PO-003', 3);
        $purchaseItem = $purchase->items()->first();

        $this->postJson("/api/v1/purchases/{$purchase->id}/returns", [
            'return_date' => '2026-06-01',
            'items' => [
                ['purchase_item_id' => $purchaseItem->id, 'quantity' => 1],
            ],
        ]);

        $response = $this->getJson('/api/v1/purchase-returns');

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.return_number', 'PRT-2026-00001');
    }

    public function test_purchase_return_list_is_limited_to_assigned_branches(): void
    {
        [$business, $admin, $branch, $warehouse, $supplier, $product] = $this->makePurchaseContext();
        $otherBranch = Branch::factory()->for($business)->create();
        $otherWarehouse = Warehouse::factory()->forBranch($otherBranch)->create();

        $visiblePurchase = $this->makeReceivedPurchase($business, $branch, $warehouse, $supplier, $product, 'PO-VISIBLE', 2);
        $hiddenPurchase = $this->makeReceivedPurchase($business, $otherBranch, $otherWarehouse, $supplier, $product, 'PO-HIDDEN', 2);

        PurchaseReturn::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'purchase_id' => $visiblePurchase->id,
            'branch_id' => $branch->id,
            'warehouse_id' => $warehouse->id,
            'return_number' => 'PRT-2026-00001',
            'status' => 'completed',
            'return_date' => '2026-06-01',
            'total_amount' => 10,
            'created_by' => $admin->id,
        ]);
        PurchaseReturn::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'purchase_id' => $hiddenPurchase->id,
            'branch_id' => $otherBranch->id,
            'warehouse_id' => $otherWarehouse->id,
            'return_number' => 'PRT-2026-00002',
            'status' => 'completed',
            'return_date' => '2026-06-01',
            'total_amount' => 10,
            'created_by' => $admin->id,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/purchase-returns');

        $response
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonFragment(['return_number' => 'PRT-2026-00001'])
            ->assertJsonMissing(['return_number' => 'PRT-2026-00002']);
    }

    public function test_purchase_can_record_multiple_returns_until_received_quantity_is_used(): void
    {
        [$business, $admin, $branch, $warehouse, $supplier, $product] = $this->makePurchaseContext();
        Sanctum::actingAs($admin);

        $purchase = $this->makeReceivedPurchase($business, $branch, $warehouse, $supplier, $product, 'PO-MULTI-RETURN', 5);
        $purchaseItem = $purchase->items()->firstOrFail();

        $this->postJson("/api/v1/purchases/{$purchase->id}/returns", [
            'return_date' => '2026-06-01',
            'items' => [
                ['purchase_item_id' => $purchaseItem->id, 'quantity' => 2],
            ],
        ])->assertCreated()
            ->assertJsonPath('data.return_number', 'PRT-2026-00001');

        $this->postJson("/api/v1/purchases/{$purchase->id}/returns", [
            'return_date' => '2026-06-02',
            'items' => [
                ['purchase_item_id' => $purchaseItem->id, 'quantity' => 3],
            ],
        ])->assertCreated()
            ->assertJsonPath('data.return_number', 'PRT-2026-00002');

        $this->postJson("/api/v1/purchases/{$purchase->id}/returns", [
            'return_date' => '2026-06-03',
            'items' => [
                ['purchase_item_id' => $purchaseItem->id, 'quantity' => 1],
            ],
        ])->assertStatus(422);

        $purchase->refresh();
        $this->assertSame('received', $purchase->status);
        $this->assertSame('0.0000', StockLevel::where('warehouse_id', $warehouse->id)
            ->where('product_id', $product->id)
            ->firstOrFail()
            ->quantity);
    }

    public function test_purchase_return_converts_sub_unit_quantity_to_base_stock_quantity(): void
    {
        [$business, $admin, $branch, $warehouse, $supplier, $product] = $this->makePurchaseContext();
        $unit = Unit::factory()->for($business)->create([
            'name' => 'Return Bottle',
            'short_name' => 'rbtl',
        ]);
        $subUnit = SubUnit::factory()->for($business)->for($unit, 'parentUnit')->create([
            'name' => 'Return Case',
            'short_name' => 'rcase',
            'conversion_factor' => 12,
        ]);
        $product->forceFill([
            'unit_id' => $unit->id,
            'sub_unit_id' => $subUnit->id,
        ])->save();
        $purchase = $this->makeReceivedPurchase($business, $branch, $warehouse, $supplier, $product, 'PO-SUB-RETURN', 2);
        $purchaseItem = $purchase->items()->firstOrFail();
        $purchaseItem->forceFill([
            'sub_unit_id' => $subUnit->id,
            'quantity' => 2,
            'received_quantity' => 2,
            'unit_cost' => 120,
            'total_amount' => 240,
        ])->save();
        StockLevel::where('warehouse_id', $warehouse->id)
            ->where('product_id', $product->id)
            ->update(['quantity' => 24]);

        Sanctum::actingAs($admin);

        $response = $this->postJson("/api/v1/purchases/{$purchase->id}/returns", [
            'return_date' => '2026-06-01',
            'items' => [
                [
                    'purchase_item_id' => $purchaseItem->id,
                    'quantity' => 1,
                ],
            ],
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.total_amount', '120.00')
            ->assertJsonPath('data.items.0.quantity', '1.0000')
            ->assertJsonPath('data.items.0.unit_cost', '120.0000');

        $this->assertDatabaseHas('stock_movements', [
            'reference_type' => 'App\Models\PurchaseReturn',
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'quantity' => '12.0000',
            'unit_cost' => '10.0000',
            'type' => 'purchase_return',
        ]);
        $this->assertSame('12.0000', StockLevel::where('warehouse_id', $warehouse->id)
            ->where('product_id', $product->id)
            ->firstOrFail()
            ->quantity);
    }

    public function test_lot_tracked_purchase_can_return_remaining_lot_quantity_after_prior_return(): void
    {
        [$business, $admin, $branch, $warehouse, $supplier, $product] = $this->makePurchaseContext([
            'stock_tracking' => 'lot',
        ]);
        Sanctum::actingAs($admin);

        $purchase = $this->makeReceivedPurchase($business, $branch, $warehouse, $supplier, $product, 'PO-LOT-RETURN', 5);
        $purchaseItem = $purchase->items()->firstOrFail();
        $lot = StockLot::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'supplier_id' => $supplier->id,
            'lot_number' => 'LOT-RETURN-001',
            'received_at' => now(),
            'unit_cost' => 10,
            'qty_received' => 5,
            'qty_on_hand' => 5,
            'qty_reserved' => 0,
            'status' => 'active',
            'created_by' => $admin->id,
        ]);

        $this->postJson("/api/v1/purchases/{$purchase->id}/returns", [
            'return_date' => '2026-06-01',
            'items' => [
                [
                    'purchase_item_id' => $purchaseItem->id,
                    'quantity' => 2,
                    'lot_id' => $lot->id,
                ],
            ],
        ])->assertCreated();

        $this->postJson("/api/v1/purchases/{$purchase->id}/returns", [
            'return_date' => '2026-06-02',
            'items' => [
                [
                    'purchase_item_id' => $purchaseItem->id,
                    'quantity' => 3,
                    'lot_id' => $lot->id,
                ],
            ],
        ])->assertCreated()
            ->assertJsonPath('data.items.0.lot_id', $lot->id);

        $this->assertSame('0.0000', $lot->refresh()->qty_on_hand);
    }

    public function test_user_without_purchases_return_permission_cannot_create_return(): void
    {
        [$business, $admin, $branch, $warehouse, $supplier, $product] = $this->makePurchaseContext();

        $user = User::factory()->for($business)->create();
        $user->assignRole('cashier');
        $user->branches()->attach($branch->id);

        Sanctum::actingAs($user);

        $purchase = $this->makeReceivedPurchase($business, $branch, $warehouse, $supplier, $product, 'PO-004', 2);
        $purchaseItem = $purchase->items()->first();

        $response = $this->postJson("/api/v1/purchases/{$purchase->id}/returns", [
            'return_date' => '2026-06-01',
            'items' => [
                ['purchase_item_id' => $purchaseItem->id, 'quantity' => 1],
            ],
        ]);

        $response->assertForbidden();
    }

    public function test_return_quantity_cannot_exceed_received_quantity(): void
    {
        [$business, $admin, $branch, $warehouse, $supplier, $product] = $this->makePurchaseContext();
        Sanctum::actingAs($admin);

        $purchase = $this->makeReceivedPurchase($business, $branch, $warehouse, $supplier, $product, 'PO-005', 3);
        $purchaseItem = $purchase->items()->first();

        $response = $this->postJson("/api/v1/purchases/{$purchase->id}/returns", [
            'return_date' => '2026-06-01',
            'items' => [
                ['purchase_item_id' => $purchaseItem->id, 'quantity' => 10],
            ],
        ]);

        $response->assertStatus(422);
    }

    public function test_serial_tracked_purchase_return_requires_serials(): void
    {
        [$business, $admin, $branch, $warehouse, $supplier, $product] = $this->makePurchaseContext([
            'stock_tracking' => 'serial',
        ]);
        Sanctum::actingAs($admin);

        $purchase = $this->makeReceivedPurchase($business, $branch, $warehouse, $supplier, $product, 'PO-006', 2);
        $purchaseItem = $purchase->items()->first();

        $response = $this->withHeader('Accept', 'application/json')
            ->postJson("/api/v1/purchases/{$purchase->id}/returns", [
                'return_date' => '2026-06-01',
                'items' => [
                    [
                        'purchase_item_id' => $purchaseItem->id,
                        'quantity' => 1,
                    ],
                ],
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'message' => 'Serial-tracked purchase items require serial_ids when returned.',
            ]);
    }

    public function test_serial_tracked_purchase_return_moves_selected_serial_out_of_stock(): void
    {
        [$business, $admin, $branch, $warehouse, $supplier, $product] = $this->makePurchaseContext([
            'stock_tracking' => 'serial',
        ]);
        $purchase = $this->makeReceivedPurchase($business, $branch, $warehouse, $supplier, $product, 'PO-007', 2);
        $purchaseItem = $purchase->items()->firstOrFail();
        $serial = StockSerial::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'supplier_id' => $supplier->id,
            'serial_number' => 'SER-RETURN-001',
            'status' => 'in_stock',
            'purchase_item_id' => $purchaseItem->id,
            'unit_cost' => 10,
            'received_at' => now(),
            'created_by' => $admin->id,
        ]);

        Sanctum::actingAs($admin);

        $this->postJson("/api/v1/purchases/{$purchase->id}/returns", [
            'return_date' => '2026-06-01',
            'items' => [
                [
                    'purchase_item_id' => $purchaseItem->id,
                    'quantity' => 1,
                    'serial_ids' => [$serial->id],
                ],
            ],
        ])->assertCreated()
            ->assertJsonPath('data.items.0.serial_ids.0', $serial->id);

        $serial->refresh();
        $this->assertSame('returned', $serial->status);
        $this->assertNull($serial->warehouse_id);
        $this->assertDatabaseHas('stock_movements', [
            'reference_type' => 'App\Models\PurchaseReturn',
            'product_id' => $product->id,
            'serial_id' => $serial->id,
            'quantity' => '1.0000',
            'type' => 'purchase_return',
        ]);
        $this->assertSame('1.0000', StockLevel::where('warehouse_id', $warehouse->id)
            ->where('product_id', $product->id)
            ->firstOrFail()
            ->quantity);
    }

    protected function makePurchaseContext(array $productOverrides = []): array
    {
        $business = Business::factory()->create();
        $branch = Branch::factory()->for($business)->create();
        $warehouse = Warehouse::factory()->forBranch($branch)->create();
        $supplier = Supplier::factory()->for($business)->create();
        $product = Product::factory()->create(array_merge(['business_id' => $business->id], $productOverrides));
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');
        $admin->branches()->attach($branch->id);

        return [$business, $admin, $branch, $warehouse, $supplier, $product];
    }

    protected function makePurchase(
        Business $business,
        Branch $branch,
        Warehouse $warehouse,
        Supplier $supplier,
        Product $product,
        string $number,
        string $status = 'draft',
        float $quantity = 1,
    ): Purchase {
        $purchase = Purchase::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'branch_id' => $branch->id,
            'warehouse_id' => $warehouse->id,
            'supplier_id' => $supplier->id,
            'purchase_number' => $number,
            'status' => $status,
            'payment_status' => 'unpaid',
            'purchase_date' => '2026-05-28',
            'subtotal' => 10 * $quantity,
            'discount_amount' => 0,
            'tax_amount' => 0,
            'shipping_charges' => 0,
            'total_amount' => 10 * $quantity,
            'paid_amount' => 0,
        ]);

        $purchase->items()->create([
            'product_id' => $product->id,
            'quantity' => $quantity,
            'received_quantity' => $status === 'received' ? $quantity : 0,
            'unit_cost' => 10,
            'discount_amount' => 0,
            'tax_rate' => 0,
            'tax_amount' => 0,
            'total_amount' => 10 * $quantity,
        ]);

        return $purchase;
    }

    protected function makeReceivedPurchase(
        Business $business,
        Branch $branch,
        Warehouse $warehouse,
        Supplier $supplier,
        Product $product,
        string $number,
        float $quantity = 1,
    ): Purchase {
        $purchase = $this->makePurchase($business, $branch, $warehouse, $supplier, $product, $number, 'received', $quantity);

        $purchase->items()->update(['received_quantity' => $quantity]);

        StockLevel::updateOrCreate(
            ['warehouse_id' => $warehouse->id, 'product_id' => $product->id],
            ['business_id' => $business->id, 'quantity' => $quantity]
        );

        return $purchase;
    }
}
