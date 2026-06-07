<?php

namespace Tests\Feature\Api\V1\Reports;

use App\Models\Branch;
use App\Models\Business;
use App\Models\BusinessModule;
use App\Models\ChartOfAccount;
use App\Models\Expense;
use App\Models\PaymentAccount;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ExpensesReportApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_expenses_report_returns_filtered_rows_and_summary_totals(): void
    {
        $business = Business::factory()->create();
        $branch = Branch::factory()->for($business)->create(['name' => 'Central']);
        $expenseAccount = $this->expenseAccount($business);
        $otherExpenseAccount = $this->expenseAccount($business, ['name' => 'Rent Expense', 'code' => '6288']);
        $paymentAccount = $this->paymentAccount($business, ['name' => 'Main Cash']);
        $cashier = User::factory()->for($business)->create(['first_name' => 'Mina']);
        $user = $this->reportUser($business, [$branch->id]);

        $this->expense($business, $branch, $expenseAccount, $paymentAccount, $cashier, [
            'reference_no' => 'EXP-UTIL-001',
            'description' => 'Utilities bill',
            'expense_date' => '2026-06-05',
            'amount' => 75,
            'payment_method' => 'cash',
        ]);
        $this->expense($business, $branch, $expenseAccount, $paymentAccount, $cashier, [
            'reference_no' => 'EXP-UTIL-002',
            'description' => 'Utilities bill second',
            'expense_date' => '2026-06-12',
            'amount' => 125,
            'payment_method' => 'cash',
        ]);
        $this->expense($business, $branch, $otherExpenseAccount, $paymentAccount, $cashier, [
            'reference_no' => 'EXP-RENT-001',
            'description' => 'Office rent',
            'expense_date' => '2026-06-15',
            'amount' => 900,
            'payment_method' => 'bank',
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson("/api/v1/reports/expenses?expense_account_id={$expenseAccount->id}&payment_method=cash&date_from=2026-06-01&date_to=2026-06-30");

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.summary.count', 2)
            ->assertJsonPath('data.summary.total_amount', '200.00')
            ->assertJsonPath('data.meta.total', 2)
            ->assertJsonFragment(['reference_no' => 'EXP-UTIL-001'])
            ->assertJsonFragment(['reference_no' => 'EXP-UTIL-002'])
            ->assertJsonMissing(['reference_no' => 'EXP-RENT-001']);
    }

    public function test_expenses_report_filters_by_payment_account_cashier_and_search(): void
    {
        $business = Business::factory()->create();
        $branch = Branch::factory()->for($business)->create();
        $expenseAccount = $this->expenseAccount($business);
        $accountA = $this->paymentAccount($business, ['name' => 'Main Bank', 'account_type' => 'bank']);
        $accountB = $this->paymentAccount($business, ['name' => 'Petty Cash']);
        $cashierA = User::factory()->for($business)->create(['first_name' => 'Visible']);
        $cashierB = User::factory()->for($business)->create(['first_name' => 'Hidden']);
        $user = $this->reportUser($business, [$branch->id]);

        $this->expense($business, $branch, $expenseAccount, $accountA, $cashierA, [
            'reference_no' => 'VISIBLE-EXPENSE',
            'description' => 'Team internet bill',
            'amount' => 80,
        ]);
        $this->expense($business, $branch, $expenseAccount, $accountB, $cashierA, [
            'reference_no' => 'HIDDEN-ACCOUNT',
            'description' => 'Team internet bill',
            'amount' => 120,
        ]);
        $this->expense($business, $branch, $expenseAccount, $accountA, $cashierB, [
            'reference_no' => 'HIDDEN-CASHIER',
            'description' => 'Team internet bill',
            'amount' => 160,
        ]);
        $this->expense($business, $branch, $expenseAccount, $accountA, $cashierA, [
            'reference_no' => 'HIDDEN-SEARCH',
            'description' => 'Office snacks',
            'amount' => 200,
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson("/api/v1/reports/expenses?payment_account_id={$accountA->id}&cashier_id={$cashierA->id}&search=internet");

        $response
            ->assertOk()
            ->assertJsonPath('data.summary.count', 1)
            ->assertJsonPath('data.summary.total_amount', '80.00')
            ->assertJsonFragment(['reference_no' => 'VISIBLE-EXPENSE'])
            ->assertJsonMissing(['reference_no' => 'HIDDEN-ACCOUNT'])
            ->assertJsonMissing(['reference_no' => 'HIDDEN-CASHIER'])
            ->assertJsonMissing(['reference_no' => 'HIDDEN-SEARCH']);
    }

    public function test_branch_scoped_user_only_sees_allowed_branch_expenses_in_report(): void
    {
        $business = Business::factory()->create();
        $branchA = Branch::factory()->for($business)->create();
        $branchB = Branch::factory()->for($business)->create();
        $expenseAccount = $this->expenseAccount($business);
        $paymentAccount = $this->paymentAccount($business);
        $cashier = User::factory()->for($business)->create();
        $user = $this->reportUser($business, [$branchA->id]);

        $this->expense($business, $branchA, $expenseAccount, $paymentAccount, $cashier, [
            'reference_no' => 'VISIBLE-EXPENSE',
            'amount' => 44,
        ]);
        $this->expense($business, $branchB, $expenseAccount, $paymentAccount, $cashier, [
            'reference_no' => 'HIDDEN-EXPENSE',
            'amount' => 440,
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/reports/expenses');

        $response
            ->assertOk()
            ->assertJsonPath('data.summary.count', 1)
            ->assertJsonPath('data.summary.total_amount', '44.00')
            ->assertJsonFragment(['reference_no' => 'VISIBLE-EXPENSE'])
            ->assertJsonMissing(['reference_no' => 'HIDDEN-EXPENSE']);
    }

    public function test_expenses_report_requires_reports_module(): void
    {
        $business = Business::factory()->create();
        $branch = Branch::factory()->for($business)->create();
        $user = User::factory()->for($business)->create();
        $user->assignRole('manager');
        $user->branches()->attach($branch->id);

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/reports/expenses')
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

    protected function expenseAccount(Business $business, array $attributes = []): ChartOfAccount
    {
        return ChartOfAccount::withoutGlobalScopes()->create(array_merge([
            'business_id' => $business->id,
            'code' => fake()->unique()->numerify('61##'),
            'name' => 'Utilities Expense',
            'type' => 'expense',
            'sub_type' => 'utilities',
            'normal_balance' => 'debit',
            'is_active' => true,
            'is_system' => false,
        ], $attributes));
    }

    protected function paymentAccount(Business $business, array $attributes = []): PaymentAccount
    {
        $cashAccount = ChartOfAccount::withoutGlobalScopes()
            ->where('business_id', $business->id)
            ->where('code', '1110')
            ->first();

        return PaymentAccount::withoutGlobalScopes()->create(array_merge([
            'business_id' => $business->id,
            'name' => fake()->unique()->word().' Account',
            'account_type' => 'cash',
            'opening_balance' => 0,
            'coa_account_id' => $cashAccount?->id,
            'is_active' => true,
        ], $attributes));
    }

    protected function expense(
        Business $business,
        Branch $branch,
        ChartOfAccount $expenseAccount,
        PaymentAccount $paymentAccount,
        User $cashier,
        array $attributes = []
    ): Expense {
        return Expense::withoutGlobalScopes()->create(array_merge([
            'business_id' => $business->id,
            'branch_id' => $branch->id,
            'expense_account_id' => $expenseAccount->id,
            'payment_account_id' => $paymentAccount->id,
            'expense_date' => '2026-06-01',
            'reference_no' => fake()->unique()->bothify('EXP-####-????'),
            'description' => 'General expense',
            'amount' => 100,
            'payment_method' => 'cash',
            'notes' => null,
            'created_by' => $cashier->id,
        ], $attributes));
    }
}
