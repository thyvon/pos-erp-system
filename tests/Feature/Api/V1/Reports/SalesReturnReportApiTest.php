<?php

namespace Tests\Feature\Api\V1\Reports;

use App\Models\Branch;
use App\Models\Business;
use App\Models\BusinessModule;
use App\Models\Customer;
use App\Models\Sale;
use App\Models\SaleReturn;
use App\Models\User;
use App\Models\Warehouse;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SalesReturnReportApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_sales_return_report_returns_filtered_rows_and_summary_totals(): void
    {
        $business = Business::factory()->create();
        $branch = Branch::factory()->for($business)->create(['name' => 'Central']);
        $warehouse = Warehouse::factory()->forBranch($branch)->create();
        $customer = Customer::factory()->for($business)->create(['name' => 'Acme Mart']);
        $user = $this->reportUser($business, [$branch->id]);
        $sale = $this->sale($business, $branch, $warehouse, [
            'customer_id' => $customer->id,
            'sale_number' => 'INV-2026-00001',
        ]);

        $this->saleReturn($business, $branch, $warehouse, $sale, [
            'return_number' => 'SR-2026-00001',
            'return_date' => '2026-06-05',
            'status' => 'completed',
            'refund_method' => 'cash',
            'total_amount' => 30,
        ]);
        $this->saleReturn($business, $branch, $warehouse, $sale, [
            'return_number' => 'SR-2026-00002',
            'return_date' => '2026-06-10',
            'status' => 'completed',
            'refund_method' => 'credit_note',
            'total_amount' => 15,
        ]);
        $this->saleReturn($business, $branch, $warehouse, $sale, [
            'return_number' => 'SR-2026-OLD',
            'return_date' => '2026-05-20',
            'status' => 'draft',
            'total_amount' => 99,
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/reports/sales-returns?status=completed&date_from=2026-06-01&date_to=2026-06-30');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.summary.count', 2)
            ->assertJsonPath('data.summary.total_amount', '45.00')
            ->assertJsonPath('data.meta.total', 2)
            ->assertJsonFragment(['return_number' => 'SR-2026-00001'])
            ->assertJsonFragment(['return_number' => 'SR-2026-00002'])
            ->assertJsonMissing(['return_number' => 'SR-2026-OLD']);
    }

    public function test_sales_return_report_filters_by_customer_through_original_sale(): void
    {
        $business = Business::factory()->create();
        $branch = Branch::factory()->for($business)->create();
        $warehouse = Warehouse::factory()->forBranch($branch)->create();
        $customerA = Customer::factory()->for($business)->create(['name' => 'Visible Customer']);
        $customerB = Customer::factory()->for($business)->create(['name' => 'Other Customer']);
        $user = $this->reportUser($business, [$branch->id]);
        $saleA = $this->sale($business, $branch, $warehouse, ['customer_id' => $customerA->id]);
        $saleB = $this->sale($business, $branch, $warehouse, ['customer_id' => $customerB->id]);

        $this->saleReturn($business, $branch, $warehouse, $saleA, [
            'return_number' => 'SR-VISIBLE',
            'total_amount' => 20,
        ]);
        $this->saleReturn($business, $branch, $warehouse, $saleB, [
            'return_number' => 'SR-HIDDEN',
            'total_amount' => 200,
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson("/api/v1/reports/sales-returns?customer_id={$customerA->id}");

        $response
            ->assertOk()
            ->assertJsonPath('data.summary.count', 1)
            ->assertJsonPath('data.summary.total_amount', '20.00')
            ->assertJsonFragment(['return_number' => 'SR-VISIBLE'])
            ->assertJsonMissing(['return_number' => 'SR-HIDDEN']);
    }

    public function test_branch_scoped_user_only_sees_allowed_branch_sales_returns_in_report(): void
    {
        $business = Business::factory()->create();
        $branchA = Branch::factory()->for($business)->create();
        $branchB = Branch::factory()->for($business)->create();
        $warehouseA = Warehouse::factory()->forBranch($branchA)->create();
        $warehouseB = Warehouse::factory()->forBranch($branchB)->create();
        $user = $this->reportUser($business, [$branchA->id]);
        $saleA = $this->sale($business, $branchA, $warehouseA);
        $saleB = $this->sale($business, $branchB, $warehouseB);

        $this->saleReturn($business, $branchA, $warehouseA, $saleA, [
            'return_number' => 'VISIBLE-RETURN',
            'total_amount' => 12,
        ]);
        $this->saleReturn($business, $branchB, $warehouseB, $saleB, [
            'return_number' => 'HIDDEN-RETURN',
            'total_amount' => 120,
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/reports/sales-returns');

        $response
            ->assertOk()
            ->assertJsonPath('data.summary.count', 1)
            ->assertJsonPath('data.summary.total_amount', '12.00')
            ->assertJsonFragment(['return_number' => 'VISIBLE-RETURN'])
            ->assertJsonMissing(['return_number' => 'HIDDEN-RETURN']);
    }

    public function test_sales_return_report_requires_reports_module(): void
    {
        $business = Business::factory()->create();
        $branch = Branch::factory()->for($business)->create();
        $user = User::factory()->for($business)->create();
        $user->assignRole('manager');
        $user->branches()->attach($branch->id);

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/reports/sales-returns')
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

    protected function sale(Business $business, Branch $branch, Warehouse $warehouse, array $attributes = []): Sale
    {
        return Sale::withoutGlobalScopes()->create(array_merge([
            'business_id' => $business->id,
            'branch_id' => $branch->id,
            'warehouse_id' => $warehouse->id,
            'sale_number' => fake()->unique()->bothify('INV-####-????'),
            'type' => 'invoice',
            'status' => 'completed',
            'payment_status' => 'paid',
            'sale_date' => '2026-06-01',
            'subtotal' => 100,
            'discount_amount' => 0,
            'tax_amount' => 0,
            'shipping_charges' => 0,
            'total_amount' => 100,
            'paid_amount' => 100,
            'change_amount' => 0,
        ], $attributes));
    }

    protected function saleReturn(
        Business $business,
        Branch $branch,
        Warehouse $warehouse,
        Sale $sale,
        array $attributes = []
    ): SaleReturn {
        return SaleReturn::withoutGlobalScopes()->create(array_merge([
            'business_id' => $business->id,
            'sale_id' => $sale->id,
            'branch_id' => $branch->id,
            'warehouse_id' => $warehouse->id,
            'return_number' => fake()->unique()->bothify('SR-####-????'),
            'status' => 'completed',
            'return_date' => '2026-06-01',
            'total_amount' => 0,
            'refund_method' => 'cash',
        ], $attributes));
    }
}
