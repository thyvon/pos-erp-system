<?php

namespace Tests\Feature\Api\V1\Reports;

use App\Models\Branch;
use App\Models\Business;
use App\Models\BusinessModule;
use App\Models\CashRegister;
use App\Models\CashRegisterSession;
use App\Models\Sale;
use App\Models\User;
use App\Models\Warehouse;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CashRegistersReportApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_cash_register_report_returns_filtered_sessions_and_summary_totals(): void
    {
        $business = Business::factory()->create();
        $branch = Branch::factory()->for($business)->create(['name' => 'Central']);
        $warehouse = Warehouse::factory()->forBranch($branch)->create();
        $register = $this->cashRegister($business, $branch, ['name' => 'Front Counter']);
        $otherRegister = $this->cashRegister($business, $branch, ['name' => 'Back Counter']);
        $cashier = User::factory()->for($business)->create(['first_name' => 'Mina']);
        $user = $this->reportUser($business, [$branch->id]);

        $visibleSession = $this->cashRegisterSession($register, $cashier, [
            'status' => 'closed',
            'opening_float' => 100,
            'closing_float' => 355,
            'total_sales' => 250,
            'opened_at' => '2026-06-05 08:00:00',
            'closed_at' => '2026-06-05 18:00:00',
            'notes' => 'Morning shift',
        ]);
        $this->sale($business, $branch, $warehouse, $visibleSession, ['sale_number' => 'POS-001', 'total_amount' => 150]);
        $this->sale($business, $branch, $warehouse, $visibleSession, ['sale_number' => 'POS-002', 'total_amount' => 100]);
        $this->cashRegisterSession($register, $cashier, [
            'status' => 'open',
            'opening_float' => 50,
            'total_sales' => 75,
            'opened_at' => '2026-06-06 08:00:00',
        ]);
        $this->cashRegisterSession($otherRegister, $cashier, [
            'status' => 'closed',
            'opening_float' => 20,
            'closing_float' => 120,
            'total_sales' => 100,
            'opened_at' => '2026-06-07 08:00:00',
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson("/api/v1/reports/cash-registers?cash_register_id={$register->id}&status=closed&date_from=2026-06-01&date_to=2026-06-30");

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.summary.count', 1)
            ->assertJsonPath('data.summary.closed_count', 1)
            ->assertJsonPath('data.summary.open_count', 0)
            ->assertJsonPath('data.summary.opening_float', '100.00')
            ->assertJsonPath('data.summary.closing_float', '355.00')
            ->assertJsonPath('data.summary.total_sales', '250.00')
            ->assertJsonPath('data.summary.expected_cash', '350.00')
            ->assertJsonPath('data.summary.difference', '5.00')
            ->assertJsonPath('data.rows.0.sales_count', 2)
            ->assertJsonPath('data.rows.0.cash_register.name', 'Front Counter')
            ->assertJsonPath('data.rows.0.difference', '5.00')
            ->assertJsonMissing(['name' => 'Back Counter']);
    }

    public function test_cash_register_report_filters_by_cashier_and_search(): void
    {
        $business = Business::factory()->create();
        $branch = Branch::factory()->for($business)->create();
        $register = $this->cashRegister($business, $branch, ['name' => 'Main Drawer']);
        $cashierA = User::factory()->for($business)->create(['first_name' => 'Visible', 'last_name' => 'Cashier']);
        $cashierB = User::factory()->for($business)->create(['first_name' => 'Hidden', 'last_name' => 'Cashier']);
        $user = $this->reportUser($business, [$branch->id]);

        $this->cashRegisterSession($register, $cashierA, [
            'notes' => 'Evening shift',
            'total_sales' => 80,
        ]);
        $this->cashRegisterSession($register, $cashierB, [
            'notes' => 'Evening shift',
            'total_sales' => 120,
        ]);
        $this->cashRegisterSession($register, $cashierA, [
            'notes' => 'Morning shift',
            'total_sales' => 160,
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson("/api/v1/reports/cash-registers?cashier_id={$cashierA->id}&search=Evening");

        $response
            ->assertOk()
            ->assertJsonPath('data.summary.count', 1)
            ->assertJsonPath('data.summary.total_sales', '80.00')
            ->assertJsonFragment(['notes' => 'Evening shift'])
            ->assertJsonMissing(['id' => $cashierB->id])
            ->assertJsonMissing(['notes' => 'Morning shift']);
    }

    public function test_branch_scoped_user_only_sees_allowed_branch_cash_register_sessions_in_report(): void
    {
        $business = Business::factory()->create();
        $branchA = Branch::factory()->for($business)->create();
        $branchB = Branch::factory()->for($business)->create();
        $registerA = $this->cashRegister($business, $branchA, ['name' => 'Visible Register']);
        $registerB = $this->cashRegister($business, $branchB, ['name' => 'Hidden Register']);
        $cashier = User::factory()->for($business)->create();
        $user = $this->reportUser($business, [$branchA->id]);

        $this->cashRegisterSession($registerA, $cashier, ['total_sales' => 44]);
        $this->cashRegisterSession($registerB, $cashier, ['total_sales' => 440]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/reports/cash-registers');

        $response
            ->assertOk()
            ->assertJsonPath('data.summary.count', 1)
            ->assertJsonPath('data.summary.total_sales', '44.00')
            ->assertJsonFragment(['name' => 'Visible Register'])
            ->assertJsonMissing(['name' => 'Hidden Register']);
    }

    public function test_cash_register_report_requires_reports_module(): void
    {
        $business = Business::factory()->create();
        $branch = Branch::factory()->for($business)->create();
        $user = User::factory()->for($business)->create();
        $user->assignRole('manager');
        $user->branches()->attach($branch->id);

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/reports/cash-registers')
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

    protected function cashRegister(Business $business, Branch $branch, array $attributes = []): CashRegister
    {
        return CashRegister::withoutGlobalScopes()->create(array_merge([
            'business_id' => $business->id,
            'branch_id' => $branch->id,
            'name' => fake()->unique()->words(2, true),
            'is_active' => true,
        ], $attributes));
    }

    protected function cashRegisterSession(CashRegister $register, User $cashier, array $attributes = []): CashRegisterSession
    {
        return CashRegisterSession::query()->create(array_merge([
            'cash_register_id' => $register->id,
            'user_id' => $cashier->id,
            'opening_float' => 0,
            'closing_float' => null,
            'denominations_at_close' => null,
            'total_sales' => 0,
            'status' => 'open',
            'opened_at' => '2026-06-01 08:00:00',
            'closed_at' => null,
            'notes' => null,
        ], $attributes));
    }

    protected function sale(
        Business $business,
        Branch $branch,
        Warehouse $warehouse,
        CashRegisterSession $session,
        array $attributes = []
    ): Sale {
        return Sale::withoutGlobalScopes()->create(array_merge([
            'business_id' => $business->id,
            'branch_id' => $branch->id,
            'warehouse_id' => $warehouse->id,
            'cash_register_session_id' => $session->id,
            'sale_number' => fake()->unique()->bothify('POS-####-????'),
            'type' => 'pos_sale',
            'status' => 'completed',
            'payment_status' => 'paid',
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
