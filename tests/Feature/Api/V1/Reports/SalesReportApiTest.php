<?php

namespace Tests\Feature\Api\V1\Reports;

use App\Models\Branch;
use App\Models\Business;
use App\Models\BusinessModule;
use App\Models\Customer;
use App\Models\Sale;
use App\Models\User;
use App\Models\Warehouse;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SalesReportApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_sales_report_returns_filtered_rows_and_summary_totals(): void
    {
        $business = Business::factory()->create();
        $branch = Branch::factory()->for($business)->create(['name' => 'Central']);
        $warehouse = Warehouse::factory()->forBranch($branch)->create();
        $customer = Customer::factory()->for($business)->create(['name' => 'Acme Mart']);
        $user = $this->reportUser($business, [$branch->id]);

        $this->sale($business, $branch, $warehouse, [
            'customer_id' => $customer->id,
            'sale_number' => 'INV-2026-00001',
            'sale_date' => '2026-06-01',
            'status' => 'completed',
            'payment_status' => 'partial',
            'total_amount' => 100,
            'paid_amount' => 40,
            'tax_amount' => 10,
            'discount_amount' => 5,
            'shipping_charges' => 2,
        ]);
        $this->sale($business, $branch, $warehouse, [
            'sale_number' => 'INV-2026-00002',
            'sale_date' => '2026-06-03',
            'status' => 'completed',
            'payment_status' => 'paid',
            'total_amount' => 50,
            'paid_amount' => 50,
            'tax_amount' => 5,
        ]);
        $this->sale($business, $branch, $warehouse, [
            'sale_number' => 'DRAFT-2026-00001',
            'sale_date' => '2026-05-30',
            'status' => 'draft',
            'total_amount' => 80,
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/reports/sales?status=completed&date_from=2026-06-01&date_to=2026-06-30');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.summary.count', 2)
            ->assertJsonPath('data.summary.total_amount', '150.00')
            ->assertJsonPath('data.summary.paid_amount', '90.00')
            ->assertJsonPath('data.summary.due_amount', '60.00')
            ->assertJsonPath('data.summary.tax_amount', '15.00')
            ->assertJsonPath('data.summary.discount_amount', '5.00')
            ->assertJsonPath('data.summary.shipping_charges', '2.00')
            ->assertJsonPath('data.meta.total', 2)
            ->assertJsonFragment(['sale_number' => 'INV-2026-00001'])
            ->assertJsonFragment(['sale_number' => 'INV-2026-00002'])
            ->assertJsonMissing(['sale_number' => 'DRAFT-2026-00001']);
    }

    public function test_branch_scoped_user_only_sees_allowed_branch_sales_in_report(): void
    {
        $business = Business::factory()->create();
        $branchA = Branch::factory()->for($business)->create();
        $branchB = Branch::factory()->for($business)->create();
        $warehouseA = Warehouse::factory()->forBranch($branchA)->create();
        $warehouseB = Warehouse::factory()->forBranch($branchB)->create();
        $user = $this->reportUser($business, [$branchA->id]);

        $this->sale($business, $branchA, $warehouseA, [
            'sale_number' => 'VISIBLE-001',
            'total_amount' => 25,
            'paid_amount' => 25,
        ]);
        $this->sale($business, $branchB, $warehouseB, [
            'sale_number' => 'HIDDEN-001',
            'total_amount' => 500,
            'paid_amount' => 500,
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/reports/sales');

        $response
            ->assertOk()
            ->assertJsonPath('data.summary.count', 1)
            ->assertJsonPath('data.summary.total_amount', '25.00')
            ->assertJsonFragment(['sale_number' => 'VISIBLE-001'])
            ->assertJsonMissing(['sale_number' => 'HIDDEN-001']);
    }

    public function test_sales_report_requires_reports_module(): void
    {
        $business = Business::factory()->create();
        $branch = Branch::factory()->for($business)->create();
        $user = User::factory()->for($business)->create();
        $user->assignRole('manager');
        $user->branches()->attach($branch->id);

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/reports/sales')
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
            'payment_status' => 'unpaid',
            'sale_date' => '2026-06-01',
            'subtotal' => 0,
            'discount_amount' => 0,
            'tax_amount' => 0,
            'shipping_charges' => 0,
            'total_amount' => 0,
            'paid_amount' => 0,
            'change_amount' => 0,
        ], $attributes));
    }
}
