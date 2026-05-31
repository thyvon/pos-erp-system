<?php

namespace Tests\Feature\Api\V1;

use App\Models\Branch;
use App\Models\Business;
use App\Models\ChartOfAccount;
use App\Models\PaymentAccount;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchasePayment;
use App\Models\StockLevel;
use App\Models\StockLot;
use App\Models\StockMovement;
use App\Models\StockSerial;
use App\Models\Supplier;
use App\Models\User;
use App\Models\Warehouse;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PurchaseApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow(Carbon::parse('2026-05-28 09:00:00'));
        $this->seed(RolePermissionSeeder::class);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_admin_can_create_purchase_with_items_and_totals(): void
    {
        [$business, $admin, $branch, $warehouse, $supplier, $product] = $this->makePurchaseContext();
        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/purchases', [
            'branch_id' => $branch->id,
            'warehouse_id' => $warehouse->id,
            'supplier_id' => $supplier->id,
            'supplier_invoice_no' => 'INV-001',
            'status' => 'confirmed',
            'purchase_date' => '2026-05-28',
            'expected_date' => '2026-05-30',
            'discount_amount' => 1,
            'shipping_charges' => 2,
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 3,
                    'unit_cost' => 10,
                    'discount_amount' => 2,
                    'tax_rate' => 10,
                ],
            ],
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.purchase_number', 'PO-2026-00001')
            ->assertJsonPath('data.status', 'confirmed')
            ->assertJsonPath('data.subtotal', '30.00')
            ->assertJsonPath('data.discount_amount', '3.00')
            ->assertJsonPath('data.tax_amount', '2.80')
            ->assertJsonPath('data.shipping_charges', '2.00')
            ->assertJsonPath('data.total_amount', '31.80')
            ->assertJsonPath('data.items.0.quantity', '3.0000');

        $this->assertDatabaseHas('purchases', [
            'business_id' => $business->id,
            'branch_id' => $branch->id,
            'warehouse_id' => $warehouse->id,
            'supplier_id' => $supplier->id,
            'status' => 'confirmed',
        ]);
    }

    public function test_purchase_list_is_limited_to_assigned_branches(): void
    {
        [$business, $admin, $branch, $warehouse, $supplier, $product] = $this->makePurchaseContext();
        $otherBranch = Branch::factory()->for($business)->create();
        $otherWarehouse = Warehouse::factory()->forBranch($otherBranch)->create();
        $otherPurchase = $this->makePurchase($business, $otherBranch, $otherWarehouse, $supplier, $product, 'PO-2026-00099');
        $visiblePurchase = $this->makePurchase($business, $branch, $warehouse, $supplier, $product, 'PO-2026-00001');

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/purchases');

        $response
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonFragment(['purchase_number' => $visiblePurchase->purchase_number])
            ->assertJsonMissing(['purchase_number' => $otherPurchase->purchase_number]);
    }

    public function test_create_rejects_branch_outside_user_access(): void
    {
        [$business, $admin, $branch, $warehouse, $supplier, $product] = $this->makePurchaseContext();
        $otherBranch = Branch::factory()->for($business)->create();
        $otherWarehouse = Warehouse::factory()->forBranch($otherBranch)->create();

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/purchases', [
            'branch_id' => $otherBranch->id,
            'warehouse_id' => $otherWarehouse->id,
            'supplier_id' => $supplier->id,
            'purchase_date' => '2026-05-28',
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 1,
                    'unit_cost' => 5,
                ],
            ],
        ]);

        $response
            ->assertStatus(422)
            ->assertJsonValidationErrors(['branch_id']);
    }

    public function test_purchase_can_be_updated_while_unreceived(): void
    {
        [$business, $admin, $branch, $warehouse, $supplier, $product] = $this->makePurchaseContext();
        $purchase = $this->makePurchase($business, $branch, $warehouse, $supplier, $product, 'PO-2026-00001');

        Sanctum::actingAs($admin);

        $response = $this->putJson("/api/v1/purchases/{$purchase->id}", [
            'branch_id' => $branch->id,
            'warehouse_id' => $warehouse->id,
            'supplier_id' => $supplier->id,
            'status' => 'confirmed',
            'purchase_date' => '2026-05-28',
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 2,
                    'unit_cost' => 7,
                ],
            ],
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.status', 'confirmed')
            ->assertJsonPath('data.total_amount', '14.00')
            ->assertJsonPath('data.items.0.quantity', '2.0000');
    }

    public function test_confirmed_purchase_can_be_received_into_stock(): void
    {
        [$business, $admin, $branch, $warehouse, $supplier, $product] = $this->makePurchaseContext();
        $purchase = $this->makePurchase($business, $branch, $warehouse, $supplier, $product, 'PO-2026-00001', 'confirmed');
        $item = $purchase->items()->firstOrFail();

        Sanctum::actingAs($admin);

        $response = $this->postJson("/api/v1/purchases/{$purchase->id}/receive", [
            'items' => [
                [
                    'purchase_item_id' => $item->id,
                    'quantity' => 1,
                ],
            ],
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.status', 'received')
            ->assertJsonPath('data.items.0.received_quantity', '1.0000');

        $this->assertDatabaseHas('stock_movements', [
            'business_id' => $business->id,
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'type' => 'purchase_receipt',
            'quantity' => '1.0000',
        ]);
        $this->assertSame('1.0000', StockLevel::query()->firstOrFail()->quantity);
    }

    public function test_lot_tracked_purchase_receive_creates_lot(): void
    {
        [$business, $admin, $branch, $warehouse, $supplier, $product] = $this->makePurchaseContext([
            'stock_tracking' => 'lot',
        ]);
        $purchase = $this->makePurchase($business, $branch, $warehouse, $supplier, $product, 'PO-2026-00001', 'confirmed');
        $item = $purchase->items()->firstOrFail();

        Sanctum::actingAs($admin);

        $response = $this->postJson("/api/v1/purchases/{$purchase->id}/receive", [
            'items' => [
                [
                    'purchase_item_id' => $item->id,
                    'quantity' => 1,
                    'lot_number' => 'LOT-001',
                ],
            ],
        ]);

        $response->assertOk()->assertJsonPath('data.status', 'received');

        $lot = StockLot::query()->firstOrFail();
        $this->assertSame('LOT-001', $lot->lot_number);
        $this->assertSame('1.0000', $lot->qty_received);
        $this->assertSame('1.0000', $lot->qty_on_hand);
    }

    public function test_serial_tracked_purchase_receive_creates_serials(): void
    {
        [$business, $admin, $branch, $warehouse, $supplier, $product] = $this->makePurchaseContext([
            'stock_tracking' => 'serial',
        ]);
        $purchase = $this->makePurchase($business, $branch, $warehouse, $supplier, $product, 'PO-2026-00001', 'confirmed', 2);
        $item = $purchase->items()->firstOrFail();

        Sanctum::actingAs($admin);

        $response = $this->postJson("/api/v1/purchases/{$purchase->id}/receive", [
            'items' => [
                [
                    'purchase_item_id' => $item->id,
                    'quantity' => 2,
                    'serial_numbers' => ['SER-001', 'SER-002'],
                ],
            ],
        ]);

        $response->assertOk()->assertJsonPath('data.status', 'received');

        $this->assertSame(2, StockSerial::query()->count());
        $this->assertSame(2, StockMovement::query()->where('type', 'purchase_receipt')->count());
        $this->assertSame('2.0000', StockLevel::query()->firstOrFail()->quantity);
    }

    public function test_confirmed_purchase_can_record_payment_and_update_payment_status(): void
    {
        [$business, $admin, $branch, $warehouse, $supplier, $product] = $this->makePurchaseContext();
        $purchase = $this->makePurchase($business, $branch, $warehouse, $supplier, $product, 'PO-2026-00001', 'confirmed');

        $cashAccount = ChartOfAccount::withoutGlobalScopes()
            ->where('business_id', $business->id)
            ->where('code', '1110')
            ->firstOrFail();

        $paymentAccount = PaymentAccount::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'name' => 'Main Cash Drawer',
            'account_type' => 'cash',
            'opening_balance' => 0,
            'coa_account_id' => $cashAccount->id,
            'is_active' => true,
        ]);

        Sanctum::actingAs($admin);

        $this->postJson("/api/v1/purchases/{$purchase->id}/payments", [
            'payment_account_id' => $paymentAccount->id,
            'amount' => (float) $purchase->total_amount,
            'method' => 'cash',
            'payment_date' => '2026-05-28',
            'reference' => 'CASH-001',
        ])->assertCreated()
            ->assertJsonPath('data.purchase.payment_status', 'paid')
            ->assertJsonPath('data.purchase.paid_amount', number_format((float) $purchase->total_amount, 2, '.', ''))
            ->assertJsonPath('data.payment.amount', number_format((float) $purchase->total_amount, 2, '.', ''));

        $this->assertDatabaseHas('purchase_payments', [
            'purchase_id' => $purchase->id,
            'amount' => number_format((float) $purchase->total_amount, 2, '.', ''),
            'method' => 'cash',
        ]);

        $this->assertDatabaseHas('account_transactions', [
            'payment_account_id' => $paymentAccount->id,
            'reference_type' => 'App\\Models\\PurchasePayment',
            'type' => 'credit',
            'amount' => number_format((float) $purchase->total_amount, 2, '.', ''),
        ]);

        $this->assertDatabaseHas('journals', [
            'reference_type' => 'App\\Models\\PurchasePayment',
            'type' => 'payment_out',
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'business_id' => $business->id,
            'event' => 'payment_recorded',
            'auditable_id' => $purchase->id,
        ]);
    }

    public function test_confirmed_purchase_can_record_split_payments(): void
    {
        [$business, $admin, $branch, $warehouse, $supplier, $product] = $this->makePurchaseContext();
        $purchase = $this->makePurchase($business, $branch, $warehouse, $supplier, $product, 'PO-2026-00001', 'confirmed');

        $cashAccount = ChartOfAccount::withoutGlobalScopes()
            ->where('business_id', $business->id)
            ->where('code', '1110')
            ->firstOrFail();
        $bankAccount = ChartOfAccount::withoutGlobalScopes()
            ->where('business_id', $business->id)
            ->where('code', '1120')
            ->firstOrFail();

        $cashPaymentAccount = PaymentAccount::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'name' => 'Main Cash Drawer',
            'account_type' => 'cash',
            'opening_balance' => 0,
            'coa_account_id' => $cashAccount->id,
            'is_active' => true,
        ]);
        $bankPaymentAccount = PaymentAccount::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'name' => 'Main Bank Account',
            'account_type' => 'bank',
            'opening_balance' => 0,
            'coa_account_id' => $bankAccount->id,
            'is_active' => true,
        ]);

        Sanctum::actingAs($admin);

        $cashAmount = 5;
        $bankAmount = round((float) $purchase->total_amount - $cashAmount, 2);

        $this->postJson("/api/v1/purchases/{$purchase->id}/payments", [
            'payment_date' => '2026-05-28',
            'note' => 'Split tender',
            'payments' => [
                [
                    'payment_account_id' => $cashPaymentAccount->id,
                    'amount' => $cashAmount,
                    'method' => 'cash',
                    'reference' => 'CASH-001',
                ],
                [
                    'payment_account_id' => $bankPaymentAccount->id,
                    'amount' => $bankAmount,
                    'method' => 'bank_transfer',
                    'reference' => 'BANK-001',
                ],
            ],
        ])->assertCreated()
            ->assertJsonPath('data.purchase.payment_status', 'paid')
            ->assertJsonPath('data.purchase.paid_amount', number_format((float) $purchase->total_amount, 2, '.', ''))
            ->assertJsonCount(2, 'data.payments')
            ->assertJsonCount(2, 'data.journals');

        $this->assertSame(2, PurchasePayment::withoutGlobalScopes()->where('purchase_id', $purchase->id)->count());

        $this->assertDatabaseHas('purchase_payments', [
            'purchase_id' => $purchase->id,
            'payment_account_id' => $cashPaymentAccount->id,
            'amount' => number_format($cashAmount, 2, '.', ''),
            'method' => 'cash',
            'reference' => 'CASH-001',
        ]);
        $this->assertDatabaseHas('purchase_payments', [
            'purchase_id' => $purchase->id,
            'payment_account_id' => $bankPaymentAccount->id,
            'amount' => number_format($bankAmount, 2, '.', ''),
            'method' => 'bank_transfer',
            'reference' => 'BANK-001',
        ]);
        $this->assertDatabaseHas('audit_logs', [
            'business_id' => $business->id,
            'event' => 'payment_recorded',
            'auditable_id' => $purchase->id,
        ]);
    }

    public function test_confirmed_purchase_payment_can_be_corrected_with_reversal_and_replacement(): void
    {
        [$business, $admin, $branch, $warehouse, $supplier, $product] = $this->makePurchaseContext();
        $purchase = $this->makePurchase($business, $branch, $warehouse, $supplier, $product, 'PO-2026-00001', 'confirmed');

        $cashAccount = ChartOfAccount::withoutGlobalScopes()
            ->where('business_id', $business->id)
            ->where('code', '1110')
            ->firstOrFail();
        $bankAccount = ChartOfAccount::withoutGlobalScopes()
            ->where('business_id', $business->id)
            ->where('code', '1120')
            ->firstOrFail();

        $cashPaymentAccount = PaymentAccount::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'name' => 'Main Cash Drawer',
            'account_type' => 'cash',
            'opening_balance' => 0,
            'coa_account_id' => $cashAccount->id,
            'is_active' => true,
        ]);
        $bankPaymentAccount = PaymentAccount::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'name' => 'Main Bank Account',
            'account_type' => 'bank',
            'opening_balance' => 0,
            'coa_account_id' => $bankAccount->id,
            'is_active' => true,
        ]);

        Sanctum::actingAs($admin);

        $paymentResponse = $this->postJson("/api/v1/purchases/{$purchase->id}/payments", [
            'payment_account_id' => $cashPaymentAccount->id,
            'amount' => 10,
            'method' => 'cash',
            'payment_date' => '2026-05-28',
            'reference' => 'CASH-001',
        ])->assertCreated();

        $originalPaymentId = $paymentResponse->json('data.payment.id');

        $accountant = User::factory()->for($business)->create();
        $accountant->assignRole('accountant');
        $accountant->branches()->attach($branch->id);

        Sanctum::actingAs($accountant);

        $this->putJson("/api/v1/purchases/{$purchase->id}/payments/{$originalPaymentId}", [
            'payment_account_id' => $bankPaymentAccount->id,
            'amount' => 10,
            'method' => 'bank_transfer',
            'payment_date' => '2026-05-28',
            'reference' => 'BANK-001',
            'reason' => 'Wrong payment tender selected',
        ])->assertOk()
            ->assertJsonPath('data.reversed_payment.status', 'reversed')
            ->assertJsonPath('data.payment.replaces_payment_id', $originalPaymentId)
            ->assertJsonPath('data.payment.payment_account_id', $bankPaymentAccount->id)
            ->assertJsonPath('data.purchase.payment_status', 'paid');

        $this->assertDatabaseHas('purchase_payments', [
            'id' => $originalPaymentId,
            'status' => 'reversed',
            'reversal_reason' => 'Wrong payment tender selected',
        ]);
        $this->assertDatabaseHas('purchase_payments', [
            'purchase_id' => $purchase->id,
            'payment_account_id' => $bankPaymentAccount->id,
            'amount' => '10.00',
            'method' => 'bank_transfer',
            'reference' => 'BANK-001',
            'replaces_payment_id' => $originalPaymentId,
            'status' => 'completed',
        ]);
        $this->assertDatabaseHas('account_transactions', [
            'payment_account_id' => $cashPaymentAccount->id,
            'reference_type' => 'App\\Models\\PurchasePayment',
            'type' => 'credit',
            'amount' => '10.00',
        ]);
        $this->assertDatabaseHas('journals', [
            'type' => 'reversal',
            'reference_type' => 'App\\Models\\Journal',
        ]);
        $this->assertDatabaseHas('audit_logs', [
            'business_id' => $business->id,
            'event' => 'updated',
            'auditable_type' => 'App\\Models\\PurchasePayment',
            'auditable_id' => $originalPaymentId,
        ]);
    }

    public function test_confirmed_purchase_payment_can_be_deleted_with_reversal(): void
    {
        [$business, $admin, $branch, $warehouse, $supplier, $product] = $this->makePurchaseContext();
        $purchase = $this->makePurchase($business, $branch, $warehouse, $supplier, $product, 'PO-2026-00001', 'confirmed');

        $cashAccount = ChartOfAccount::withoutGlobalScopes()
            ->where('business_id', $business->id)
            ->where('code', '1110')
            ->firstOrFail();

        $paymentAccount = PaymentAccount::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'name' => 'Main Cash Drawer',
            'account_type' => 'cash',
            'opening_balance' => 0,
            'coa_account_id' => $cashAccount->id,
            'is_active' => true,
        ]);

        Sanctum::actingAs($admin);

        $paymentResponse = $this->postJson("/api/v1/purchases/{$purchase->id}/payments", [
            'payment_account_id' => $paymentAccount->id,
            'amount' => 10,
            'method' => 'cash',
            'payment_date' => '2026-05-28',
            'reference' => 'CASH-DELETE',
        ])->assertCreated();

        $paymentId = $paymentResponse->json('data.payment.id');

        $accountant = User::factory()->for($business)->create();
        $accountant->assignRole('accountant');
        $accountant->branches()->attach($branch->id);

        Sanctum::actingAs($accountant);

        $this->deleteJson("/api/v1/purchases/{$purchase->id}/payments/{$paymentId}", [
            'reason' => 'Supplier changed payment method',
        ])->assertOk()
            ->assertJsonPath('data.reversed_payment.status', 'reversed')
            ->assertJsonPath('data.purchase.payment_status', 'unpaid')
            ->assertJsonPath('data.purchase.paid_amount', '0.00');

        $this->assertDatabaseHas('purchase_payments', [
            'id' => $paymentId,
            'status' => 'reversed',
            'reversal_reason' => 'Supplier changed payment method',
        ]);
        $this->assertDatabaseHas('account_transactions', [
            'payment_account_id' => $paymentAccount->id,
            'reference_type' => 'App\\Models\\PurchasePayment',
            'type' => 'credit',
            'amount' => '10.00',
        ]);
        $this->assertDatabaseHas('audit_logs', [
            'business_id' => $business->id,
            'event' => 'deleted',
            'auditable_type' => 'App\\Models\\PurchasePayment',
            'auditable_id' => $paymentId,
        ]);
    }

    public function test_purchase_payment_cannot_exceed_outstanding_balance(): void
    {
        [$business, $admin, $branch, $warehouse, $supplier, $product] = $this->makePurchaseContext();
        $purchase = $this->makePurchase($business, $branch, $warehouse, $supplier, $product, 'PO-2026-00001', 'confirmed');

        $cashAccount = ChartOfAccount::withoutGlobalScopes()
            ->where('business_id', $business->id)
            ->where('code', '1110')
            ->firstOrFail();

        $paymentAccount = PaymentAccount::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'name' => 'Main Cash Drawer',
            'account_type' => 'cash',
            'opening_balance' => 0,
            'coa_account_id' => $cashAccount->id,
            'is_active' => true,
        ]);

        Sanctum::actingAs($admin);

        $this->postJson("/api/v1/purchases/{$purchase->id}/payments", [
            'payment_account_id' => $paymentAccount->id,
            'amount' => round((float) $purchase->total_amount + 5, 2),
            'method' => 'cash',
            'payment_date' => '2026-05-28',
        ])->assertStatus(422);
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
            'received_quantity' => 0,
            'unit_cost' => 10,
            'discount_amount' => 0,
            'tax_rate' => 0,
            'tax_amount' => 0,
            'total_amount' => 10 * $quantity,
        ]);

        return $purchase;
    }
}
