<?php

namespace Tests\Feature\Api\V1\Reports;

use App\Models\Branch;
use App\Models\Business;
use App\Models\BusinessModule;
use App\Models\PaymentAccount;
use App\Models\Purchase;
use App\Models\PurchasePayment;
use App\Models\Supplier;
use App\Models\User;
use App\Models\Warehouse;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PurchasePaymentsReportApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_purchase_payments_report_returns_completed_rows_and_summary_totals_by_default(): void
    {
        $business = Business::factory()->create();
        $branch = Branch::factory()->for($business)->create(['name' => 'Central']);
        $warehouse = Warehouse::factory()->forBranch($branch)->create();
        $supplier = Supplier::factory()->for($business)->create(['name' => 'Supply Co']);
        $account = $this->paymentAccount($business, ['name' => 'Main Cash']);
        $cashier = User::factory()->for($business)->create(['first_name' => 'Mina']);
        $user = $this->reportUser($business, [$branch->id]);
        $purchase = $this->purchase($business, $branch, $warehouse, $supplier, [
            'purchase_number' => 'PO-2026-00001',
        ]);

        $this->payment($business, $purchase, $account, $cashier, [
            'reference' => 'PP-CASH-001',
            'payment_date' => '2026-06-05',
            'amount' => 100,
            'method' => 'cash',
            'status' => 'completed',
        ]);
        $this->payment($business, $purchase, $account, $cashier, [
            'reference' => 'PP-CARD-001',
            'payment_date' => '2026-06-12',
            'amount' => 50,
            'method' => 'card',
            'status' => 'completed',
        ]);
        $this->payment($business, $purchase, $account, $cashier, [
            'reference' => 'PP-REVERSED',
            'payment_date' => '2026-06-15',
            'amount' => 500,
            'method' => 'cash',
            'status' => 'reversed',
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/reports/purchase-payments?date_from=2026-06-01&date_to=2026-06-30');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.summary.count', 2)
            ->assertJsonPath('data.summary.total_amount', '150.00')
            ->assertJsonPath('data.meta.total', 2)
            ->assertJsonFragment(['reference' => 'PP-CASH-001'])
            ->assertJsonFragment(['reference' => 'PP-CARD-001'])
            ->assertJsonMissing(['reference' => 'PP-REVERSED']);
    }

    public function test_purchase_payments_report_filters_by_account_cashier_and_method(): void
    {
        $business = Business::factory()->create();
        $branch = Branch::factory()->for($business)->create();
        $warehouse = Warehouse::factory()->forBranch($branch)->create();
        $supplier = Supplier::factory()->for($business)->create();
        $accountA = $this->paymentAccount($business, ['name' => 'Main Bank', 'account_type' => 'bank']);
        $accountB = $this->paymentAccount($business, ['name' => 'Petty Cash']);
        $cashierA = User::factory()->for($business)->create(['first_name' => 'Visible']);
        $cashierB = User::factory()->for($business)->create(['first_name' => 'Hidden']);
        $user = $this->reportUser($business, [$branch->id]);
        $purchase = $this->purchase($business, $branch, $warehouse, $supplier);

        $this->payment($business, $purchase, $accountA, $cashierA, [
            'reference' => 'VISIBLE-PURCHASE-PAYMENT',
            'amount' => 80,
            'method' => 'bank_transfer',
        ]);
        $this->payment($business, $purchase, $accountB, $cashierA, [
            'reference' => 'HIDDEN-ACCOUNT',
            'amount' => 120,
            'method' => 'bank_transfer',
        ]);
        $this->payment($business, $purchase, $accountA, $cashierB, [
            'reference' => 'HIDDEN-CASHIER',
            'amount' => 160,
            'method' => 'bank_transfer',
        ]);
        $this->payment($business, $purchase, $accountA, $cashierA, [
            'reference' => 'HIDDEN-METHOD',
            'amount' => 200,
            'method' => 'cash',
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson("/api/v1/reports/purchase-payments?payment_account_id={$accountA->id}&cashier_id={$cashierA->id}&method=bank_transfer");

        $response
            ->assertOk()
            ->assertJsonPath('data.summary.count', 1)
            ->assertJsonPath('data.summary.total_amount', '80.00')
            ->assertJsonFragment(['reference' => 'VISIBLE-PURCHASE-PAYMENT'])
            ->assertJsonMissing(['reference' => 'HIDDEN-ACCOUNT'])
            ->assertJsonMissing(['reference' => 'HIDDEN-CASHIER'])
            ->assertJsonMissing(['reference' => 'HIDDEN-METHOD']);
    }

    public function test_branch_scoped_user_only_sees_allowed_branch_purchase_payments_in_report(): void
    {
        $business = Business::factory()->create();
        $branchA = Branch::factory()->for($business)->create();
        $branchB = Branch::factory()->for($business)->create();
        $warehouseA = Warehouse::factory()->forBranch($branchA)->create();
        $warehouseB = Warehouse::factory()->forBranch($branchB)->create();
        $supplier = Supplier::factory()->for($business)->create();
        $account = $this->paymentAccount($business);
        $cashier = User::factory()->for($business)->create();
        $user = $this->reportUser($business, [$branchA->id]);
        $purchaseA = $this->purchase($business, $branchA, $warehouseA, $supplier, ['purchase_number' => 'VISIBLE-PO']);
        $purchaseB = $this->purchase($business, $branchB, $warehouseB, $supplier, ['purchase_number' => 'HIDDEN-PO']);

        $this->payment($business, $purchaseA, $account, $cashier, [
            'reference' => 'VISIBLE-PURCHASE-PAYMENT',
            'amount' => 44,
        ]);
        $this->payment($business, $purchaseB, $account, $cashier, [
            'reference' => 'HIDDEN-PURCHASE-PAYMENT',
            'amount' => 440,
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/reports/purchase-payments');

        $response
            ->assertOk()
            ->assertJsonPath('data.summary.count', 1)
            ->assertJsonPath('data.summary.total_amount', '44.00')
            ->assertJsonFragment(['reference' => 'VISIBLE-PURCHASE-PAYMENT'])
            ->assertJsonMissing(['reference' => 'HIDDEN-PURCHASE-PAYMENT']);
    }

    public function test_purchase_payments_report_requires_reports_module(): void
    {
        $business = Business::factory()->create();
        $branch = Branch::factory()->for($business)->create();
        $user = User::factory()->for($business)->create();
        $user->assignRole('manager');
        $user->branches()->attach($branch->id);

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/reports/purchase-payments')
            ->assertStatus(403)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'The Reports module is not enabled for this business.');
    }

    protected function reportUser(Business $business, array $branchIds): User
    {
        BusinessModule::query()->create([
            'business_id' => $business->id,
            'module_key' => 'reports',
            'status' => 'active',
        ]);

        $user = User::factory()->for($business)->create();
        $user->assignRole('manager');
        $user->branches()->sync($branchIds);

        return $user;
    }

    protected function purchase(
        Business $business,
        Branch $branch,
        Warehouse $warehouse,
        Supplier $supplier,
        array $attributes = []
    ): Purchase {
        return Purchase::withoutGlobalScopes()->create(array_merge([
            'business_id' => $business->id,
            'branch_id' => $branch->id,
            'warehouse_id' => $warehouse->id,
            'supplier_id' => $supplier->id,
            'purchase_number' => fake()->unique()->bothify('PO-####-????'),
            'status' => 'received',
            'payment_status' => 'paid',
            'purchase_date' => '2026-06-01',
            'subtotal' => 100,
            'discount_amount' => 0,
            'tax_amount' => 0,
            'shipping_charges' => 0,
            'total_amount' => 100,
            'paid_amount' => 100,
        ], $attributes));
    }

    protected function paymentAccount(Business $business, array $attributes = []): PaymentAccount
    {
        return PaymentAccount::query()->create(array_merge([
            'business_id' => $business->id,
            'name' => fake()->unique()->word().' Account',
            'account_type' => 'cash',
            'opening_balance' => 0,
            'is_active' => true,
        ], $attributes));
    }

    protected function payment(
        Business $business,
        Purchase $purchase,
        PaymentAccount $account,
        User $cashier,
        array $attributes = []
    ): PurchasePayment {
        return PurchasePayment::withoutGlobalScopes()->create(array_merge([
            'business_id' => $business->id,
            'purchase_id' => $purchase->id,
            'payment_account_id' => $account->id,
            'amount' => 100,
            'payment_currency' => 'USD',
            'payment_amount' => 100,
            'exchange_rate' => 1,
            'method' => 'cash',
            'reference' => fake()->unique()->bothify('PP-####-????'),
            'payment_date' => '2026-06-01',
            'status' => 'completed',
            'created_by' => $cashier->id,
        ], $attributes));
    }
}
