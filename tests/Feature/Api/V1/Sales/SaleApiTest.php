<?php

namespace Tests\Feature\Api\V1\Sales;

use App\Models\Branch;
use App\Models\Business;
use App\Models\ChartOfAccount;
use App\Models\PaymentAccount;
use App\Models\Product;
use App\Models\Sale;
use App\Models\StockLevel;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SaleApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

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

        $this->postJson("/api/v1/sales/{$saleId}/payments", [
            'payment_account_id' => $paymentAccount->id,
            'amount' => 35,
            'method' => 'cash',
            'payment_date' => now()->toDateString(),
        ])->assertStatus(422);
    }
}
