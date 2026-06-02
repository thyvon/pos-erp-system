<?php

namespace Tests\Feature\Api\V1;

use App\Models\Branch;
use App\Models\Business;
use App\Models\ChartOfAccount;
use App\Models\Expense;
use App\Models\Journal;
use App\Models\PaymentAccount;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ExpenseApiTest extends TestCase
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

    protected function makeExpenseContext(): array
    {
        $business = Business::factory()->create();
        $branch = Branch::factory()->for($business)->create();

        $expenseAccount = ChartOfAccount::withoutGlobalScopes()
            ->where('business_id', $business->id)
            ->where('code', '6100')
            ->firstOrFail();

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

        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');
        $admin->branches()->attach($branch->id);

        return [$business, $admin, $branch, $expenseAccount, $paymentAccount];
    }

    public function test_admin_can_create_expense(): void
    {
        [$business, $admin, $branch, $expenseAccount, $paymentAccount] = $this->makeExpenseContext();

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/expenses', [
            'branch_id' => $branch->id,
            'expense_account_id' => $expenseAccount->id,
            'payment_account_id' => $paymentAccount->id,
            'expense_date' => '2026-06-01',
            'description' => 'Office utilities',
            'amount' => 150.00,
            'payment_method' => 'cash',
            'notes' => 'Monthly utilities expense',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.description', 'Office utilities')
            ->assertJsonPath('data.amount', '150.00')
            ->assertJsonPath('data.payment_method', 'cash');

        $this->assertDatabaseHas('expenses', [
            'business_id' => $business->id,
            'branch_id' => $branch->id,
            'description' => 'Office utilities',
            'amount' => 150.00,
        ]);

        $this->assertDatabaseHas('journals', [
            'business_id' => $business->id,
            'type' => 'expense',
            'reference_type' => Expense::class,
        ]);

        $this->assertDatabaseHas('account_transactions', [
            'business_id' => $business->id,
            'payment_account_id' => $paymentAccount->id,
            'type' => 'debit',
            'amount' => 150.00,
        ]);
    }

    public function test_expense_list_is_paginated(): void
    {
        [$business, $admin, $branch, $expenseAccount, $paymentAccount] = $this->makeExpenseContext();

        Expense::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'branch_id' => $branch->id,
            'expense_account_id' => $expenseAccount->id,
            'payment_account_id' => $paymentAccount->id,
            'expense_date' => '2026-06-01',
            'description' => 'Expense 1',
            'amount' => 100,
            'created_by' => $admin->id,
        ]);

        Expense::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'branch_id' => $branch->id,
            'expense_account_id' => $expenseAccount->id,
            'payment_account_id' => $paymentAccount->id,
            'expense_date' => '2026-06-01',
            'description' => 'Expense 2',
            'amount' => 200,
            'created_by' => $admin->id,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/expenses');

        $response
            ->assertOk()
            ->assertJsonPath('meta.total', 2);
    }

    public function test_admin_can_view_expense_detail(): void
    {
        [$business, $admin, $branch, $expenseAccount, $paymentAccount] = $this->makeExpenseContext();

        $expense = Expense::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'branch_id' => $branch->id,
            'expense_account_id' => $expenseAccount->id,
            'payment_account_id' => $paymentAccount->id,
            'expense_date' => '2026-06-01',
            'description' => 'Office rent',
            'amount' => 500,
            'payment_method' => 'bank',
            'notes' => 'Monthly rent',
            'created_by' => $admin->id,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson("/api/v1/expenses/{$expense->id}");

        $response
            ->assertOk()
            ->assertJsonPath('data.description', 'Office rent')
            ->assertJsonPath('data.amount', '500.00')
            ->assertJsonPath('data.branch.id', $branch->id)
            ->assertJsonPath('data.expense_account.id', $expenseAccount->id)
            ->assertJsonPath('data.payment_account.id', $paymentAccount->id);
    }

    public function test_admin_can_update_expense(): void
    {
        [$business, $admin, $branch, $expenseAccount, $paymentAccount] = $this->makeExpenseContext();

        Sanctum::actingAs($admin);

        $createResponse = $this->postJson('/api/v1/expenses', [
            'branch_id' => $branch->id,
            'expense_account_id' => $expenseAccount->id,
            'payment_account_id' => $paymentAccount->id,
            'expense_date' => '2026-06-01',
            'description' => 'Original description',
            'amount' => 100,
        ])->assertCreated();

        $expenseId = $createResponse->json('data.id');

        $response = $this->putJson("/api/v1/expenses/{$expenseId}", [
            'branch_id' => $branch->id,
            'expense_account_id' => $expenseAccount->id,
            'payment_account_id' => $paymentAccount->id,
            'expense_date' => '2026-06-01',
            'description' => 'Updated description',
            'amount' => 200,
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.description', 'Updated description')
            ->assertJsonPath('data.amount', '200.00');

        $this->assertDatabaseHas('audit_logs', [
            'auditable_type' => Expense::class,
            'auditable_id' => $expenseId,
            'event' => 'updated',
        ]);

        $this->assertSame(2, Journal::withoutGlobalScopes()
            ->where('business_id', $business->id)
            ->where('type', 'expense')
            ->where('reference_type', Expense::class)
            ->where('reference_id', $expenseId)
            ->count());
        $this->assertSame(1, Journal::withoutGlobalScopes()
            ->where('business_id', $business->id)
            ->where('type', 'reversal')
            ->count());
        $this->assertDatabaseHas('account_transactions', [
            'business_id' => $business->id,
            'payment_account_id' => $paymentAccount->id,
            'reference_type' => Expense::class,
            'reference_id' => $expenseId,
            'type' => 'credit',
            'amount' => '100.00',
        ]);
        $this->assertDatabaseHas('account_transactions', [
            'business_id' => $business->id,
            'payment_account_id' => $paymentAccount->id,
            'reference_type' => Expense::class,
            'reference_id' => $expenseId,
            'type' => 'debit',
            'amount' => '200.00',
        ]);
    }

    public function test_admin_can_delete_expense(): void
    {
        [$business, $admin, $branch, $expenseAccount, $paymentAccount] = $this->makeExpenseContext();

        Sanctum::actingAs($admin);

        $createResponse = $this->postJson('/api/v1/expenses', [
            'branch_id' => $branch->id,
            'expense_account_id' => $expenseAccount->id,
            'payment_account_id' => $paymentAccount->id,
            'expense_date' => '2026-06-01',
            'description' => 'To be deleted',
            'amount' => 50,
        ])->assertCreated();

        $expenseId = $createResponse->json('data.id');

        $response = $this->deleteJson("/api/v1/expenses/{$expenseId}");

        $response->assertOk();

        $this->assertSoftDeleted('expenses', ['id' => $expenseId]);

        $this->assertDatabaseHas('audit_logs', [
            'auditable_type' => Expense::class,
            'auditable_id' => $expenseId,
            'event' => 'deleted',
        ]);

        $this->assertDatabaseHas('journals', [
            'business_id' => $business->id,
            'type' => 'reversal',
            'reference_type' => Journal::class,
        ]);
        $this->assertDatabaseHas('account_transactions', [
            'business_id' => $business->id,
            'payment_account_id' => $paymentAccount->id,
            'reference_type' => Expense::class,
            'reference_id' => $expenseId,
            'type' => 'credit',
            'amount' => '50.00',
        ]);
    }

    public function test_expense_creation_rejects_inactive_payment_account(): void
    {
        [$business, $admin, $branch, $expenseAccount, $paymentAccount] = $this->makeExpenseContext();
        $paymentAccount->forceFill(['is_active' => false])->save();

        Sanctum::actingAs($admin);

        $this->postJson('/api/v1/expenses', [
            'branch_id' => $branch->id,
            'expense_account_id' => $expenseAccount->id,
            'payment_account_id' => $paymentAccount->id,
            'expense_date' => '2026-06-01',
            'description' => 'Inactive payment account',
            'amount' => 100,
        ])->assertStatus(422);
    }

    public function test_user_without_expense_permission_cannot_create(): void
    {
        [$business, $admin, $branch, $expenseAccount, $paymentAccount] = $this->makeExpenseContext();

        $user = User::factory()->for($business)->create();
        $user->assignRole('cashier'); // cashier has no expense permissions
        $user->branches()->attach($branch->id);

        Sanctum::actingAs($user);

        $this->postJson('/api/v1/expenses', [
            'branch_id' => $branch->id,
            'expense_account_id' => $expenseAccount->id,
            'payment_account_id' => $paymentAccount->id,
            'expense_date' => '2026-06-01',
            'description' => 'Unauthorized',
            'amount' => 100,
        ])->assertForbidden();
    }

    public function test_expense_list_is_limited_to_assigned_branches(): void
    {
        [$business, $admin, $branch, $expenseAccount, $paymentAccount] = $this->makeExpenseContext();

        $otherBranch = Branch::factory()->for($business)->create();
        $otherPaymentAccount = PaymentAccount::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'name' => 'Other Cash',
            'account_type' => 'cash',
            'opening_balance' => 0,
            'coa_account_id' => $paymentAccount->coa_account_id,
            'is_active' => true,
        ]);

        $otherExpense = Expense::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'branch_id' => $otherBranch->id,
            'expense_account_id' => $expenseAccount->id,
            'payment_account_id' => $otherPaymentAccount->id,
            'expense_date' => '2026-06-01',
            'description' => 'Other branch expense',
            'amount' => 300,
            'created_by' => $admin->id,
        ]);

        $visibleExpense = Expense::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'branch_id' => $branch->id,
            'expense_account_id' => $expenseAccount->id,
            'payment_account_id' => $paymentAccount->id,
            'expense_date' => '2026-06-01',
            'description' => 'My branch expense',
            'amount' => 100,
            'created_by' => $admin->id,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/expenses');

        $response->assertOk();
        $response_data = $response->json('data');
        $ids = array_column($response_data, 'id');
        $this->assertContains($visibleExpense->id, $ids);
        $this->assertNotContains($otherExpense->id, $ids);
    }

    public function test_expense_creation_validates_expense_account_type(): void
    {
        [$business, $admin, $branch, $expenseAccount, $paymentAccount] = $this->makeExpenseContext();

        $revenueAccount = ChartOfAccount::withoutGlobalScopes()
            ->where('business_id', $business->id)
            ->where('code', '4100')
            ->firstOrFail();

        Sanctum::actingAs($admin);

        $this->postJson('/api/v1/expenses', [
            'branch_id' => $branch->id,
            'expense_account_id' => $revenueAccount->id, // revenue, not expense
            'payment_account_id' => $paymentAccount->id,
            'expense_date' => '2026-06-01',
            'description' => 'Wrong account type',
            'amount' => 100,
        ])->assertStatus(422);
    }
}
