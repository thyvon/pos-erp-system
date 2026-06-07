<?php

namespace Tests\Feature\Api\V1\Reports;

use App\Models\Branch;
use App\Models\Business;
use App\Models\BusinessModule;
use App\Models\Purchase;
use App\Models\Supplier;
use App\Models\User;
use App\Models\Warehouse;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PurchasesReportApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_purchases_report_returns_filtered_rows_and_summary_totals(): void
    {
        $business = Business::factory()->create();
        $branch = Branch::factory()->for($business)->create(['name' => 'Central']);
        $warehouse = Warehouse::factory()->forBranch($branch)->create();
        $supplier = Supplier::factory()->for($business)->create(['name' => 'Supply Co']);
        $user = $this->reportUser($business, [$branch->id]);

        $this->purchase($business, $branch, $warehouse, $supplier, [
            'purchase_number' => 'PO-2026-00001',
            'supplier_invoice_no' => 'SUP-1001',
            'purchase_date' => '2026-06-01',
            'status' => 'received',
            'payment_status' => 'partial',
            'total_amount' => 200,
            'paid_amount' => 75,
            'tax_amount' => 20,
            'discount_amount' => 5,
            'shipping_charges' => 8,
        ]);
        $this->purchase($business, $branch, $warehouse, $supplier, [
            'purchase_number' => 'PO-2026-00002',
            'purchase_date' => '2026-06-03',
            'status' => 'received',
            'payment_status' => 'paid',
            'total_amount' => 150,
            'paid_amount' => 150,
            'tax_amount' => 15,
        ]);
        $this->purchase($business, $branch, $warehouse, $supplier, [
            'purchase_number' => 'PO-2026-OLD',
            'purchase_date' => '2026-05-20',
            'status' => 'draft',
            'total_amount' => 99,
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/reports/purchases?status=received&date_from=2026-06-01&date_to=2026-06-30');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.summary.count', 2)
            ->assertJsonPath('data.summary.total_amount', '350.00')
            ->assertJsonPath('data.summary.paid_amount', '225.00')
            ->assertJsonPath('data.summary.due_amount', '125.00')
            ->assertJsonPath('data.summary.tax_amount', '35.00')
            ->assertJsonPath('data.summary.discount_amount', '5.00')
            ->assertJsonPath('data.summary.shipping_charges', '8.00')
            ->assertJsonPath('data.meta.total', 2)
            ->assertJsonFragment(['purchase_number' => 'PO-2026-00001'])
            ->assertJsonFragment(['purchase_number' => 'PO-2026-00002'])
            ->assertJsonMissing(['purchase_number' => 'PO-2026-OLD']);
    }

    public function test_purchases_report_filters_by_supplier(): void
    {
        $business = Business::factory()->create();
        $branch = Branch::factory()->for($business)->create();
        $warehouse = Warehouse::factory()->forBranch($branch)->create();
        $supplierA = Supplier::factory()->for($business)->create(['name' => 'Visible Supplier']);
        $supplierB = Supplier::factory()->for($business)->create(['name' => 'Other Supplier']);
        $user = $this->reportUser($business, [$branch->id]);

        $this->purchase($business, $branch, $warehouse, $supplierA, [
            'purchase_number' => 'PO-VISIBLE',
            'total_amount' => 40,
        ]);
        $this->purchase($business, $branch, $warehouse, $supplierB, [
            'purchase_number' => 'PO-HIDDEN',
            'total_amount' => 400,
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson("/api/v1/reports/purchases?supplier_id={$supplierA->id}");

        $response
            ->assertOk()
            ->assertJsonPath('data.summary.count', 1)
            ->assertJsonPath('data.summary.total_amount', '40.00')
            ->assertJsonFragment(['purchase_number' => 'PO-VISIBLE'])
            ->assertJsonMissing(['purchase_number' => 'PO-HIDDEN']);
    }

    public function test_branch_scoped_user_only_sees_allowed_branch_purchases_in_report(): void
    {
        $business = Business::factory()->create();
        $branchA = Branch::factory()->for($business)->create();
        $branchB = Branch::factory()->for($business)->create();
        $warehouseA = Warehouse::factory()->forBranch($branchA)->create();
        $warehouseB = Warehouse::factory()->forBranch($branchB)->create();
        $supplier = Supplier::factory()->for($business)->create();
        $user = $this->reportUser($business, [$branchA->id]);

        $this->purchase($business, $branchA, $warehouseA, $supplier, [
            'purchase_number' => 'VISIBLE-PO',
            'total_amount' => 60,
            'paid_amount' => 20,
        ]);
        $this->purchase($business, $branchB, $warehouseB, $supplier, [
            'purchase_number' => 'HIDDEN-PO',
            'total_amount' => 600,
            'paid_amount' => 600,
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/reports/purchases');

        $response
            ->assertOk()
            ->assertJsonPath('data.summary.count', 1)
            ->assertJsonPath('data.summary.total_amount', '60.00')
            ->assertJsonPath('data.summary.due_amount', '40.00')
            ->assertJsonFragment(['purchase_number' => 'VISIBLE-PO'])
            ->assertJsonMissing(['purchase_number' => 'HIDDEN-PO']);
    }

    public function test_purchases_report_requires_reports_module(): void
    {
        $business = Business::factory()->create();
        $branch = Branch::factory()->for($business)->create();
        $user = User::factory()->for($business)->create();
        $user->assignRole('manager');
        $user->branches()->attach($branch->id);

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/reports/purchases')
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
            'payment_status' => 'unpaid',
            'purchase_date' => '2026-06-01',
            'subtotal' => 0,
            'discount_amount' => 0,
            'tax_amount' => 0,
            'shipping_charges' => 0,
            'total_amount' => 0,
            'paid_amount' => 0,
        ], $attributes));
    }
}
