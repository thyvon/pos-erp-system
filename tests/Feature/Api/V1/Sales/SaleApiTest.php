<?php

namespace Tests\Feature\Api\V1\Sales;

use App\Models\Branch;
use App\Models\Business;
use App\Models\ChartOfAccount;
use App\Models\ExchangeRate;
use App\Models\Journal;
use App\Models\PaymentAccount;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SalePayment;
use App\Models\Setting;
use App\Models\StockLevel;
use App\Models\StockLot;
use App\Models\SubUnit;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SaleApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Cache::flush();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_branch_scoped_cashier_can_create_and_confirm_sale_in_allowed_branch(): void
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
            'selling_price' => 12,
            'minimum_selling_price' => 8,
        ]);
        StockLevel::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'quantity' => 5,
            'reserved_quantity' => 0,
        ]);

        $user = User::factory()->for($business)->create(['max_discount' => 10]);
        $user->assignRole('cashier');
        $user->branches()->attach($branch->id);

        Sanctum::actingAs($user);

        $createResponse = $this->postJson('/api/v1/sales', [
            'branch_id' => $branch->id,
            'warehouse_id' => $warehouse->id,
            'type' => 'invoice',
            'sale_date' => now()->toDateString(),
            'items' => [[
                'product_id' => $product->id,
                'quantity' => 2,
                'unit_price' => 12,
                'unit_cost' => 5,
            ]],
        ])->assertCreated()
            ->assertJsonPath('data.status', 'draft');

        $saleId = $createResponse->json('data.id');

        $this->assertDatabaseHas('audit_logs', [
            'business_id' => $business->id,
            'event' => 'created',
            'auditable_id' => $saleId,
        ]);

        $this->postJson("/api/v1/sales/{$saleId}/confirm")
            ->assertOk()
            ->assertJsonPath('data.status', 'confirmed');

        $this->assertDatabaseHas('stock_levels', [
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'quantity' => '5.0000',
            'reserved_quantity' => '2.0000',
        ]);
    }

    public function test_confirmed_sale_can_be_completed_and_posts_inventory_and_accounting(): void
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
            'quantity' => 6,
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
                'quantity' => 3,
                'unit_price' => 15,
                'unit_cost' => 4,
            ]],
        ])->assertCreated()->json('data.id');

        $this->postJson("/api/v1/sales/{$saleId}/confirm")->assertOk();

        $this->postJson("/api/v1/sales/{$saleId}/complete")
            ->assertOk()
            ->assertJsonPath('data.status', 'completed');

        $this->assertDatabaseHas('stock_levels', [
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'quantity' => '3.0000',
            'reserved_quantity' => '0.0000',
        ]);

        $this->assertDatabaseHas('stock_movements', [
            'reference_type' => Sale::class,
            'reference_id' => $saleId,
            'type' => 'sale',
            'quantity' => '3.0000',
        ]);

        $this->assertDatabaseHas('journals', [
            'reference_type' => Sale::class,
            'reference_id' => $saleId,
            'type' => 'sale',
        ]);
    }

    public function test_completed_sale_can_be_edited_within_sale_edit_window(): void
    {
        [$business, $branch, $warehouse, $product] = $this->saleEditFixtures(stockQuantity: 6);

        $saleId = $this->postJson('/api/v1/sales', $this->salePayload($branch, $warehouse, $product, quantity: 3))
            ->assertCreated()
            ->json('data.id');

        $this->postJson("/api/v1/sales/{$saleId}/confirm")->assertOk();
        $this->postJson("/api/v1/sales/{$saleId}/complete")->assertOk();

        $this->putJson("/api/v1/sales/{$saleId}", $this->salePayload($branch, $warehouse, $product, quantity: 2))
            ->assertOk()
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.payment_status', 'unpaid')
            ->assertJsonPath('data.items.0.quantity', '2.0000');

        $this->assertDatabaseHas('stock_levels', [
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'quantity' => '4.0000',
            'reserved_quantity' => '0.0000',
        ]);

        $this->assertSame(1, Journal::withoutGlobalScopes()
            ->where('business_id', $business->id)
            ->where('type', 'sale')
            ->where('reference_type', Sale::class)
            ->where('reference_id', $saleId)
            ->whereNull('reversed_by_id')
            ->count());
    }

    public function test_sale_with_payments_update_accepts_post_alias(): void
    {
        [$business, $branch, $warehouse, $product] = $this->saleEditFixtures(stockQuantity: 6);

        $saleId = $this->postJson('/api/v1/sales', $this->salePayload($branch, $warehouse, $product, quantity: 3))
            ->assertCreated()
            ->json('data.id');

        $this->postJson("/api/v1/sales/{$saleId}/confirm")->assertOk();
        $this->postJson("/api/v1/sales/{$saleId}/complete")->assertOk();

        $this->postJson("/api/v1/sales/{$saleId}/with-payments", $this->salePayload($branch, $warehouse, $product, quantity: 2))
            ->assertOk()
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.items.0.quantity', '2.0000');

        $this->assertDatabaseHas('stock_levels', [
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'quantity' => '4.0000',
            'reserved_quantity' => '0.0000',
        ]);

        $this->assertSame(1, Journal::withoutGlobalScopes()
            ->where('business_id', $business->id)
            ->where('type', 'sale')
            ->where('reference_type', Sale::class)
            ->where('reference_id', $saleId)
            ->whereNull('reversed_by_id')
            ->count());
    }

    public function test_sale_edit_respects_sale_edit_lifetime_setting_without_status_gate(): void
    {
        [$business, $branch, $warehouse, $product] = $this->saleEditFixtures(stockQuantity: 6);

        Setting::withoutGlobalScopes()->updateOrCreate([
            'business_id' => $business->id,
            'group' => 'sales',
            'key' => 'edit_lifetime_days',
        ], [
            'value' => '1',
            'type' => 'integer',
            'is_encrypted' => false,
        ]);

        $saleId = $this->postJson('/api/v1/sales', $this->salePayload(
            $branch,
            $warehouse,
            $product,
            quantity: 2,
            saleDate: now()->subDays(5)->toDateString()
        ))
            ->assertCreated()
            ->json('data.id');

        $this->putJson("/api/v1/sales/{$saleId}", $this->salePayload($branch, $warehouse, $product, quantity: 1))
            ->assertForbidden();
    }

    public function test_sale_with_return_documents_cannot_be_edited_even_inside_edit_window(): void
    {
        [$business, $branch, $warehouse, $product] = $this->saleEditFixtures(stockQuantity: 6);

        $saleId = $this->postJson('/api/v1/sales', $this->salePayload($branch, $warehouse, $product, quantity: 2))
            ->assertCreated()
            ->json('data.id');

        $this->postJson("/api/v1/sales/{$saleId}/confirm")->assertOk();
        $this->postJson("/api/v1/sales/{$saleId}/complete")->assertOk();

        $sale = Sale::withoutGlobalScopes()->with('items')->findOrFail($saleId);

        $this->postJson("/api/v1/sales/{$saleId}/returns", [
            'return_date' => now()->toDateString(),
            'refund_method' => 'cash',
            'items' => [[
                'sale_item_id' => $sale->items->first()->id,
                'quantity' => 1,
            ]],
        ])->assertCreated();

        $this->putJson("/api/v1/sales/{$saleId}", $this->salePayload($branch, $warehouse, $product, quantity: 1))
            ->assertStatus(422)
            ->assertJsonPath('message', 'Sales with return documents cannot be edited because return lines reference the original sale items.');

        $this->assertDatabaseHas('sales', [
            'id' => $saleId,
            'business_id' => $business->id,
            'status' => 'returned',
        ]);
    }

    public function test_confirmed_sale_can_be_cancelled_and_releases_reserved_stock(): void
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
        ]);
        StockLevel::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'quantity' => 4,
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

        $this->postJson("/api/v1/sales/{$saleId}/cancel", [
            'reason' => 'Customer changed mind',
        ])->assertOk()
            ->assertJsonPath('data.status', 'cancelled');

        $this->assertDatabaseHas('stock_levels', [
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'quantity' => '4.0000',
            'reserved_quantity' => '0.0000',
        ]);
    }

    public function test_branch_scoped_user_only_sees_sales_from_allowed_branches(): void
    {
        $business = Business::factory()->create();
        $branchA = Branch::factory()->create(['business_id' => $business->id]);
        $branchB = Branch::factory()->create(['business_id' => $business->id]);
        $warehouseA = Warehouse::factory()->forBranch($branchA)->create();
        $warehouseB = Warehouse::factory()->forBranch($branchB)->create();

        Sale::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'branch_id' => $branchA->id,
            'warehouse_id' => $warehouseA->id,
            'sale_number' => 'INV-2026-00001',
            'type' => 'invoice',
            'status' => 'draft',
            'payment_status' => 'unpaid',
            'sale_date' => now()->toDateString(),
            'subtotal' => 10,
            'discount_amount' => 0,
            'tax_amount' => 0,
            'shipping_charges' => 0,
            'total_amount' => 10,
            'paid_amount' => 0,
            'change_amount' => 0,
        ]);

        Sale::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'branch_id' => $branchB->id,
            'warehouse_id' => $warehouseB->id,
            'sale_number' => 'INV-2026-00002',
            'type' => 'invoice',
            'status' => 'draft',
            'payment_status' => 'unpaid',
            'sale_date' => now()->toDateString(),
            'subtotal' => 20,
            'discount_amount' => 0,
            'tax_amount' => 0,
            'shipping_charges' => 0,
            'total_amount' => 20,
            'paid_amount' => 0,
            'change_amount' => 0,
        ]);

        $user = User::factory()->for($business)->create();
        $user->assignRole('cashier');
        $user->branches()->attach($branchA->id);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/sales');

        $response
            ->assertOk()
            ->assertJsonFragment(['sale_number' => 'INV-2026-00001'])
            ->assertJsonMissing(['sale_number' => 'INV-2026-00002']);
    }

    public function test_completed_sale_can_record_payment_and_update_payment_status(): void
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
            'quantity' => 6,
            'reserved_quantity' => 0,
        ]);

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
                'quantity' => 3,
                'unit_price' => 15,
                'unit_cost' => 4,
            ]],
        ])->assertCreated()->json('data.id');

        $this->postJson("/api/v1/sales/{$saleId}/confirm")->assertOk();
        $this->postJson("/api/v1/sales/{$saleId}/complete")->assertOk();
        $sale = Sale::withoutGlobalScopes()->findOrFail($saleId);

        $this->postJson("/api/v1/sales/{$saleId}/payments", [
            'payment_account_id' => $paymentAccount->id,
            'amount' => (float) $sale->total_amount,
            'method' => 'cash',
            'payment_date' => now()->toDateString(),
            'reference' => 'CASH-001',
        ])->assertCreated()
            ->assertJsonPath('data.sale.payment_status', 'paid')
            ->assertJsonPath('data.sale.paid_amount', number_format((float) $sale->total_amount, 2, '.', ''))
            ->assertJsonPath('data.payment.amount', number_format((float) $sale->total_amount, 2, '.', ''));

        $this->assertDatabaseHas('sale_payments', [
            'sale_id' => $saleId,
            'amount' => number_format((float) $sale->total_amount, 2, '.', ''),
            'method' => 'cash',
        ]);

        $this->assertDatabaseHas('account_transactions', [
            'payment_account_id' => $paymentAccount->id,
            'reference_type' => 'App\\Models\\SalePayment',
            'type' => 'credit',
            'amount' => number_format((float) $sale->total_amount, 2, '.', ''),
        ]);

        $this->assertDatabaseHas('journals', [
            'reference_type' => 'App\\Models\\SalePayment',
            'type' => 'payment_in',
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'business_id' => $business->id,
            'event' => 'payment_recorded',
            'auditable_id' => $saleId,
        ]);
    }

    public function test_sale_create_with_inline_payment_rolls_back_when_payment_fails(): void
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
            'quantity' => 6,
            'reserved_quantity' => 0,
        ]);

        $cashAccount = ChartOfAccount::withoutGlobalScopes()
            ->where('business_id', $business->id)
            ->where('code', '1110')
            ->firstOrFail();

        $paymentAccount = PaymentAccount::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'name' => 'Inactive Cash Drawer',
            'account_type' => 'cash',
            'opening_balance' => 0,
            'coa_account_id' => $cashAccount->id,
            'is_active' => false,
        ]);

        $user = User::factory()->for($business)->create();
        $user->assignRole('manager');
        $user->branches()->attach($branch->id);

        Sanctum::actingAs($user);

        $this->postJson('/api/v1/sales', [
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
            'payment_date' => now()->toDateString(),
            'payments' => [[
                'payment_account_id' => $paymentAccount->id,
                'amount' => 30,
                'method' => 'cash',
            ]],
        ])->assertStatus(422);

        $this->assertSame(0, Sale::withoutGlobalScopes()->where('business_id', $business->id)->count());
        $this->assertSame(0, SalePayment::withoutGlobalScopes()->where('business_id', $business->id)->count());
        $this->assertDatabaseHas('stock_levels', [
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'quantity' => '6.0000',
            'reserved_quantity' => '0.0000',
        ]);
    }

    public function test_completed_sale_can_record_split_payments(): void
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
            'quantity' => 6,
            'reserved_quantity' => 0,
        ]);

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
                'quantity' => 3,
                'unit_price' => 15,
                'unit_cost' => 4,
            ]],
        ])->assertCreated()->json('data.id');

        $this->postJson("/api/v1/sales/{$saleId}/confirm")->assertOk();
        $this->postJson("/api/v1/sales/{$saleId}/complete")->assertOk();
        $sale = Sale::withoutGlobalScopes()->findOrFail($saleId);
        $cashAmount = 20;
        $bankAmount = round((float) $sale->total_amount - $cashAmount, 2);

        $this->postJson("/api/v1/sales/{$saleId}/payments", [
            'payment_date' => now()->toDateString(),
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
            ->assertJsonPath('data.sale.payment_status', 'paid')
            ->assertJsonPath('data.sale.paid_amount', number_format((float) $sale->total_amount, 2, '.', ''))
            ->assertJsonCount(2, 'data.payments')
            ->assertJsonCount(2, 'data.journals');

        $this->assertSame(2, SalePayment::withoutGlobalScopes()->where('sale_id', $saleId)->count());

        $this->assertDatabaseHas('sale_payments', [
            'sale_id' => $saleId,
            'payment_account_id' => $cashPaymentAccount->id,
            'amount' => number_format($cashAmount, 2, '.', ''),
            'method' => 'cash',
            'reference' => 'CASH-001',
        ]);
        $this->assertDatabaseHas('sale_payments', [
            'sale_id' => $saleId,
            'payment_account_id' => $bankPaymentAccount->id,
            'amount' => number_format($bankAmount, 2, '.', ''),
            'method' => 'bank_transfer',
            'reference' => 'BANK-001',
        ]);
        $this->assertDatabaseHas('audit_logs', [
            'business_id' => $business->id,
            'event' => 'payment_recorded',
            'auditable_id' => $saleId,
        ]);
    }

    public function test_completed_sale_can_record_khr_payment_using_default_exchange_rate(): void
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
            'quantity' => 6,
            'reserved_quantity' => 0,
        ]);

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

        $exchangeRate = ExchangeRate::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'from_currency' => 'USD',
            'to_currency' => 'KHR',
            'rate' => 4100,
            'effective_date' => now()->toDateString(),
            'is_default' => true,
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
                'quantity' => 3,
                'unit_price' => 15,
                'unit_cost' => 4,
            ]],
        ])->assertCreated()->json('data.id');

        $this->postJson("/api/v1/sales/{$saleId}/confirm")->assertOk();
        $this->postJson("/api/v1/sales/{$saleId}/complete")->assertOk();
        $sale = Sale::withoutGlobalScopes()->findOrFail($saleId);
        $khrAmount = round((float) $sale->total_amount * 4100, 2);

        $this->postJson("/api/v1/sales/{$saleId}/payments", [
            'payment_date' => now()->toDateString(),
            'payments' => [
                [
                    'payment_account_id' => $paymentAccount->id,
                    'payment_currency' => 'KHR',
                    'payment_amount' => $khrAmount,
                    'exchange_rate_id' => $exchangeRate->id,
                    'method' => 'cash',
                    'reference' => 'KHR-001',
                ],
            ],
        ])->assertCreated()
            ->assertJsonPath('data.sale.payment_status', 'paid')
            ->assertJsonPath('data.payment.amount', number_format((float) $sale->total_amount, 2, '.', ''))
            ->assertJsonPath('data.payment.payment_currency', 'KHR')
            ->assertJsonPath('data.payment.payment_amount', number_format($khrAmount, 2, '.', ''))
            ->assertJsonPath('data.payment.exchange_rate', '4100.000000');

        $this->assertDatabaseHas('sale_payments', [
            'sale_id' => $saleId,
            'payment_account_id' => $paymentAccount->id,
            'amount' => number_format((float) $sale->total_amount, 2, '.', ''),
            'payment_currency' => 'KHR',
            'payment_amount' => number_format($khrAmount, 2, '.', ''),
            'exchange_rate_id' => $exchangeRate->id,
        ]);

        $this->assertDatabaseHas('account_transactions', [
            'payment_account_id' => $paymentAccount->id,
            'reference_type' => 'App\\Models\\SalePayment',
            'type' => 'credit',
            'amount' => number_format((float) $sale->total_amount, 2, '.', ''),
        ]);
    }

    public function test_completed_sale_payment_can_be_corrected_with_reversal_and_replacement(): void
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
            'quantity' => 6,
            'reserved_quantity' => 0,
        ]);

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

        $paymentResponse = $this->postJson("/api/v1/sales/{$saleId}/payments", [
            'payment_account_id' => $cashPaymentAccount->id,
            'amount' => 20,
            'method' => 'cash',
            'payment_date' => now()->toDateString(),
            'reference' => 'CASH-001',
        ])->assertCreated();

        $originalPaymentId = $paymentResponse->json('data.payment.id');

        $accountant = User::factory()->for($business)->create();
        $accountant->assignRole('accountant');
        $accountant->branches()->attach($branch->id);

        Sanctum::actingAs($accountant);

        $this->putJson("/api/v1/sales/{$saleId}/payments/{$originalPaymentId}", [
            'payment_account_id' => $bankPaymentAccount->id,
            'amount' => 20,
            'method' => 'bank_transfer',
            'payment_date' => now()->toDateString(),
            'reference' => 'BANK-001',
            'reason' => 'Wrong tender selected',
        ])->assertOk()
            ->assertJsonPath('data.reversed_payment.status', 'reversed')
            ->assertJsonPath('data.payment.replaces_payment_id', $originalPaymentId)
            ->assertJsonPath('data.payment.payment_account_id', $bankPaymentAccount->id)
            ->assertJsonPath('data.sale.payment_status', 'partial');

        $this->assertDatabaseHas('sale_payments', [
            'id' => $originalPaymentId,
            'status' => 'reversed',
            'reversal_reason' => 'Wrong tender selected',
        ]);
        $this->assertDatabaseHas('sale_payments', [
            'sale_id' => $saleId,
            'payment_account_id' => $bankPaymentAccount->id,
            'amount' => '20.00',
            'method' => 'bank_transfer',
            'reference' => 'BANK-001',
            'replaces_payment_id' => $originalPaymentId,
            'status' => 'completed',
        ]);
        $this->assertDatabaseHas('account_transactions', [
            'payment_account_id' => $cashPaymentAccount->id,
            'reference_type' => 'App\\Models\\SalePayment',
            'reference_id' => $originalPaymentId,
            'type' => 'debit',
            'amount' => '20.00',
        ]);
        $this->assertDatabaseHas('journals', [
            'type' => 'reversal',
            'reference_type' => 'App\\Models\\Journal',
        ]);
        $this->assertDatabaseHas('audit_logs', [
            'business_id' => $business->id,
            'event' => 'updated',
            'auditable_type' => 'App\\Models\\SalePayment',
            'auditable_id' => $originalPaymentId,
        ]);
    }

    public function test_completed_sale_payment_can_be_deleted_with_reversal(): void
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
            'quantity' => 6,
            'reserved_quantity' => 0,
        ]);

        $cashAccount = ChartOfAccount::withoutGlobalScopes()
            ->where('business_id', $business->id)
            ->where('code', '1110')
            ->firstOrFail();

        $cashPaymentAccount = PaymentAccount::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'name' => 'Main Cash Drawer',
            'account_type' => 'cash',
            'opening_balance' => 0,
            'coa_account_id' => $cashAccount->id,
            'is_active' => true,
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

        $paymentResponse = $this->postJson("/api/v1/sales/{$saleId}/payments", [
            'payment_account_id' => $cashPaymentAccount->id,
            'amount' => 20,
            'method' => 'cash',
            'payment_date' => now()->toDateString(),
            'reference' => 'CASH-DELETE',
        ])->assertCreated();

        $paymentId = $paymentResponse->json('data.payment.id');

        $accountant = User::factory()->for($business)->create();
        $accountant->assignRole('accountant');
        $accountant->branches()->attach($branch->id);

        Sanctum::actingAs($accountant);

        $this->deleteJson("/api/v1/sales/{$saleId}/payments/{$paymentId}", [
            'reason' => 'Customer changed tender',
        ])->assertOk()
            ->assertJsonPath('data.reversed_payment.status', 'reversed')
            ->assertJsonPath('data.sale.payment_status', 'unpaid')
            ->assertJsonPath('data.sale.paid_amount', '0.00');

        $this->assertDatabaseHas('sale_payments', [
            'id' => $paymentId,
            'status' => 'reversed',
            'reversal_reason' => 'Customer changed tender',
        ]);
        $this->assertDatabaseHas('account_transactions', [
            'payment_account_id' => $cashPaymentAccount->id,
            'reference_type' => 'App\\Models\\SalePayment',
            'reference_id' => $paymentId,
            'type' => 'debit',
            'amount' => '20.00',
        ]);
        $this->assertDatabaseHas('audit_logs', [
            'business_id' => $business->id,
            'event' => 'deleted',
            'auditable_type' => 'App\\Models\\SalePayment',
            'auditable_id' => $paymentId,
        ]);
    }

    public function test_sale_payment_cannot_exceed_outstanding_balance(): void
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
            'quantity' => 6,
            'reserved_quantity' => 0,
        ]);

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
        $sale = Sale::withoutGlobalScopes()->findOrFail($saleId);

        $this->postJson("/api/v1/sales/{$saleId}/payments", [
            'payment_account_id' => $paymentAccount->id,
            'amount' => round((float) $sale->total_amount + 5, 2),
            'method' => 'cash',
            'payment_date' => now()->toDateString(),
        ])->assertStatus(422);
    }

    public function test_lot_tracked_sale_with_sub_unit_deducts_base_quantity_from_stock(): void
    {
        $business = Business::factory()->create();
        $branch = Branch::factory()->create(['business_id' => $business->id]);
        $warehouse = Warehouse::factory()->forBranch($branch)->create();
        $unit = Unit::factory()->create(['business_id' => $business->id]);
        $subUnit = SubUnit::factory()->for($business)->for($unit, 'parentUnit')->create([
            'conversion_factor' => 12,
        ]);
        $product = Product::factory()->create([
            'business_id' => $business->id,
            'unit_id' => $unit->id,
            'sub_unit_id' => $subUnit->id,
            'track_inventory' => true,
            'stock_tracking' => 'lot',
            'selling_price' => 15,
            'minimum_selling_price' => 10,
            'purchase_price' => 4,
        ]);

        StockLevel::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'quantity' => 50,
            'reserved_quantity' => 0,
        ]);

        $lot = StockLot::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'lot_number' => 'LOT-SUB-001',
            'received_at' => now(),
            'unit_cost' => 4,
            'qty_received' => 50,
            'qty_on_hand' => 50,
            'qty_reserved' => 0,
            'status' => 'active',
        ]);

        $user = User::factory()->for($business)->create();
        $user->assignRole('manager');
        $user->branches()->attach($branch->id);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/v1/sales', [
            'branch_id' => $branch->id,
            'warehouse_id' => $warehouse->id,
            'type' => 'invoice',
            'sale_date' => now()->toDateString(),
            'items' => [[
                'product_id' => $product->id,
                'sub_unit_id' => $subUnit->id,
                'quantity' => 2,
                'unit_price' => 180,
                'unit_cost' => 48,
                'lot_allocations' => [
                    ['lot_id' => $lot->id, 'quantity' => 24],
                ],
            ]],
        ]);

        $response->assertCreated();

        $saleId = $response->json('data.id');

        $this->postJson("/api/v1/sales/{$saleId}/confirm")->assertOk();
        $this->postJson("/api/v1/sales/{$saleId}/complete")->assertOk();

        $this->assertDatabaseHas('stock_levels', [
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'quantity' => '26.0000',
        ]);

        $this->assertSame('26.0000', $lot->refresh()->qty_on_hand);
    }

    public function test_serial_tracked_sale_rejects_sub_unit(): void
    {
        $business = Business::factory()->create();
        $branch = Branch::factory()->create(['business_id' => $business->id]);
        $warehouse = Warehouse::factory()->forBranch($branch)->create();
        $unit = Unit::factory()->create(['business_id' => $business->id]);
        $subUnit = SubUnit::factory()->for($business)->for($unit, 'parentUnit')->create([
            'conversion_factor' => 1,
        ]);
        $product = Product::factory()->create([
            'business_id' => $business->id,
            'unit_id' => $unit->id,
            'sub_unit_id' => $subUnit->id,
            'track_inventory' => true,
            'stock_tracking' => 'serial',
            'selling_price' => 15,
        ]);

        $user = User::factory()->for($business)->create();
        $user->assignRole('manager');
        $user->branches()->attach($branch->id);

        Sanctum::actingAs($user);

        $this->postJson('/api/v1/sales', [
            'branch_id' => $branch->id,
            'warehouse_id' => $warehouse->id,
            'type' => 'invoice',
            'sale_date' => now()->toDateString(),
            'items' => [[
                'product_id' => $product->id,
                'sub_unit_id' => $subUnit->id,
                'quantity' => 1,
                'unit_price' => 15,
                'unit_cost' => 4,
            ]],
        ])->assertStatus(422);
    }

    protected function saleEditFixtures(float $stockQuantity = 6): array
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
            'quantity' => $stockQuantity,
            'reserved_quantity' => 0,
        ]);

        $user = User::factory()->for($business)->create();
        $user->assignRole('manager');
        $user->branches()->attach($branch->id);

        Sanctum::actingAs($user);

        return [$business, $branch, $warehouse, $product, $user];
    }

    protected function salePayload(
        Branch $branch,
        Warehouse $warehouse,
        Product $product,
        float $quantity = 2,
        ?string $saleDate = null,
    ): array {
        return [
            'branch_id' => $branch->id,
            'warehouse_id' => $warehouse->id,
            'type' => 'invoice',
            'sale_date' => $saleDate ?? now()->toDateString(),
            'items' => [[
                'product_id' => $product->id,
                'quantity' => $quantity,
                'unit_price' => 15,
                'unit_cost' => 4,
            ]],
        ];
    }
}
