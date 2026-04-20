<?php

namespace Tests\Feature\Api\V1\Accounting;

use App\Models\Business;
use App\Models\ChartOfAccount;
use App\Models\PaymentAccount;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AccountingApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_accountant_can_view_seeded_chart_of_accounts_and_cannot_edit_system_account(): void
    {
        $business = Business::factory()->create();
        $user = User::factory()->for($business)->create();
        $user->assignRole('accountant');

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/accounting/chart-of-accounts');
        $response->assertOk();
        $response->assertJsonFragment(['code' => '1110']);

        $systemAccount = ChartOfAccount::withoutGlobalScopes()
            ->where('business_id', $business->id)
            ->where('code', '1110')
            ->firstOrFail();

        $this->putJson("/api/v1/accounting/chart-of-accounts/{$systemAccount->id}", [
            'name' => 'Edited system account',
        ])->assertForbidden();
    }

    public function test_accountant_can_post_and_reverse_manual_journal(): void
    {
        $business = Business::factory()->create();
        $user = User::factory()->for($business)->create();
        $user->assignRole('accountant');

        $cash = ChartOfAccount::withoutGlobalScopes()
            ->where('business_id', $business->id)
            ->where('code', '1110')
            ->firstOrFail();

        $capital = ChartOfAccount::withoutGlobalScopes()
            ->where('business_id', $business->id)
            ->where('code', '3100')
            ->firstOrFail();

        Sanctum::actingAs($user);

        $create = $this->postJson('/api/v1/accounting/journals', [
            'description' => 'Owner opening cash contribution',
            'entries' => [
                ['account_id' => $cash->id, 'type' => 'debit', 'amount' => 150],
                ['account_id' => $capital->id, 'type' => 'credit', 'amount' => 150],
            ],
        ])->assertCreated()
            ->assertJsonPath('data.status', 'posted');

        $journalId = $create->json('data.id');

        $this->assertDatabaseHas('audit_logs', [
            'business_id' => $business->id,
            'event' => 'journal_posted',
            'auditable_id' => $journalId,
        ]);

        $this->postJson("/api/v1/accounting/journals/{$journalId}/reverse", [
            'reason' => 'Posted with wrong amount source',
        ])->assertOk()
            ->assertJsonPath('data.journal_type', 'reversal');

        $this->assertDatabaseHas('journals', [
            'id' => $journalId,
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'business_id' => $business->id,
            'event' => 'journal_reversed',
            'auditable_id' => $journalId,
        ]);
    }

    public function test_payment_account_transfer_creates_transactions_and_audit_log(): void
    {
        $business = Business::factory()->create();
        $user = User::factory()->for($business)->create();
        $user->assignRole('accountant');

        $cash = ChartOfAccount::withoutGlobalScopes()
            ->where('business_id', $business->id)
            ->where('code', '1110')
            ->firstOrFail();

        $bank = ChartOfAccount::withoutGlobalScopes()
            ->where('business_id', $business->id)
            ->where('code', '1120')
            ->firstOrFail();

        $fromAccount = PaymentAccount::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'name' => 'Main Cash',
            'account_type' => 'cash',
            'opening_balance' => 500,
            'coa_account_id' => $cash->id,
            'is_active' => true,
        ]);

        $toAccount = PaymentAccount::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'name' => 'Main Bank',
            'account_type' => 'bank',
            'opening_balance' => 0,
            'coa_account_id' => $bank->id,
            'is_active' => true,
        ]);

        Sanctum::actingAs($user);

        $this->postJson('/api/v1/accounting/payment-accounts/transfer', [
            'from_payment_account_id' => $fromAccount->id,
            'to_payment_account_id' => $toAccount->id,
            'amount' => 120,
            'transaction_date' => now()->toDateString(),
            'note' => 'Move branch cash to bank',
        ])->assertOk();

        $this->assertDatabaseHas('account_transactions', [
            'payment_account_id' => $fromAccount->id,
            'type' => 'debit',
            'amount' => '120.00',
        ]);

        $this->assertDatabaseHas('account_transactions', [
            'payment_account_id' => $toAccount->id,
            'type' => 'credit',
            'amount' => '120.00',
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'business_id' => $business->id,
            'event' => 'payment_account_transfer',
            'auditable_id' => $fromAccount->id,
        ]);
    }

    public function test_only_one_active_fiscal_year_is_allowed(): void
    {
        $business = Business::factory()->create();
        $user = User::factory()->for($business)->create();
        $user->assignRole('accountant');

        Sanctum::actingAs($user);

        $this->postJson('/api/v1/accounting/fiscal-years', [
            'name' => 'FY 2026',
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
            'status' => 'active',
        ])->assertCreated();

        $this->postJson('/api/v1/accounting/fiscal-years', [
            'name' => 'FY 2027',
            'start_date' => '2027-01-01',
            'end_date' => '2027-12-31',
            'status' => 'active',
        ])->assertStatus(422);
    }
}
