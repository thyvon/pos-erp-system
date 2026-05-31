<?php

namespace Tests\Feature\Api\V1;

use App\Models\Branch;
use App\Models\Business;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\StockLevel;
use App\Models\StockMovement;
use App\Models\Supplier;
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
        $this->assertEquals('returned', $purchase->status);

        $this->assertDatabaseHas('stock_movements', [
            'reference_type' => 'App\Models\PurchaseReturn',
            'product_id' => $product->id,
            'quantity' => 2,
            'type' => 'purchase_return',
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
