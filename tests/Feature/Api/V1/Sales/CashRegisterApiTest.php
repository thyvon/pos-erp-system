<?php

namespace Tests\Feature\Api\V1\Sales;

use App\Models\Branch;
use App\Models\Business;
use App\Models\CashRegister;
use App\Models\PaymentAccount;
use App\Models\Sale;
use App\Models\SalePayment;
use App\Models\User;
use App\Models\Warehouse;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CashRegisterApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_manager_can_create_register_and_cashier_can_open_and_close_session(): void
    {
        $business = Business::factory()->create();
        $branch = Branch::factory()->create(['business_id' => $business->id]);

        $manager = User::factory()->for($business)->create();
        $manager->assignRole('manager');
        $manager->branches()->attach($branch->id);

        Sanctum::actingAs($manager);

        $registerId = $this->postJson('/api/v1/cash-registers', [
            'branch_id' => $branch->id,
            'name' => 'Front Counter',
        ])->assertCreated()
            ->json('data.id');

        $cashier = User::factory()->for($business)->create();
        $cashier->assignRole('cashier');
        $cashier->branches()->attach($branch->id);

        Sanctum::actingAs($cashier);

        $sessionId = $this->postJson("/api/v1/cash-registers/{$registerId}/open-session", [
            'opening_float' => 100,
        ])->assertCreated()
            ->assertJsonPath('data.status', 'open')
            ->json('data.id');

        $this->postJson("/api/v1/cash-register-sessions/{$sessionId}/close", [
            'closing_float' => 125,
            'denominations_at_close' => [
                ['label' => '20', 'count' => 5],
                ['label' => '5', 'count' => 5],
            ],
        ])->assertOk()
            ->assertJsonPath('data.status', 'closed');

        $this->assertDatabaseHas('cash_register_sessions', [
            'id' => $sessionId,
            'status' => 'closed',
            'opening_float' => '100.00',
            'closing_float' => '125.00',
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'business_id' => $business->id,
            'event' => 'session_opened',
            'auditable_id' => $sessionId,
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'business_id' => $business->id,
            'event' => 'session_closed',
            'auditable_id' => $sessionId,
        ]);
    }

    public function test_user_cannot_open_second_cash_register_session_while_one_is_already_open(): void
    {
        $business = Business::factory()->create();
        $branch = Branch::factory()->create(['business_id' => $business->id]);
        $registerA = CashRegister::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'branch_id' => $branch->id,
            'name' => 'A',
            'is_active' => true,
        ]);
        $registerB = CashRegister::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'branch_id' => $branch->id,
            'name' => 'B',
            'is_active' => true,
        ]);

        $cashier = User::factory()->for($business)->create();
        $cashier->assignRole('cashier');
        $cashier->branches()->attach($branch->id);

        Sanctum::actingAs($cashier);

        $this->postJson("/api/v1/cash-registers/{$registerA->id}/open-session", [
            'opening_float' => 50,
        ])->assertCreated();

        $this->postJson("/api/v1/cash-registers/{$registerB->id}/open-session", [
            'opening_float' => 30,
        ])->assertStatus(422);
    }

    public function test_branch_scoped_manager_cannot_create_register_for_unallowed_branch(): void
    {
        $business = Business::factory()->create();
        $branchA = Branch::factory()->create(['business_id' => $business->id]);
        $branchB = Branch::factory()->create(['business_id' => $business->id]);

        $manager = User::factory()->for($business)->create();
        $manager->assignRole('manager');
        $manager->branches()->attach($branchA->id);

        Sanctum::actingAs($manager);

        $this->postJson('/api/v1/cash-registers', [
            'branch_id' => $branchB->id,
            'name' => 'Blocked Register',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['branch_id']);
    }

    public function test_cashier_can_view_dual_currency_session_report_and_close_with_actual_cash_counts(): void
    {
        $business = Business::factory()->create();
        $branch = Branch::factory()->create(['business_id' => $business->id]);
        $warehouse = Warehouse::factory()->forBranch($branch)->create();
        $register = CashRegister::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'branch_id' => $branch->id,
            'name' => 'POS Counter',
            'is_active' => true,
        ]);
        $cashier = User::factory()->for($business)->create();
        $cashier->assignRole('cashier');
        $cashier->branches()->attach($branch->id);

        Sanctum::actingAs($cashier);

        $sessionId = $this->postJson("/api/v1/cash-registers/{$register->id}/open-session", [
            'opening_float' => 100,
        ])->assertCreated()->json('data.id');

        $sale = Sale::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'branch_id' => $branch->id,
            'warehouse_id' => $warehouse->id,
            'cash_register_session_id' => $sessionId,
            'sale_number' => 'POS-REPORT-001',
            'type' => 'pos_sale',
            'status' => 'completed',
            'payment_status' => 'paid',
            'sale_date' => now()->toDateString(),
            'subtotal' => 200,
            'discount_amount' => 0,
            'tax_amount' => 0,
            'shipping_charges' => 0,
            'total_amount' => 200,
            'paid_amount' => 200,
            'change_amount' => 0,
        ]);
        $paymentAccount = PaymentAccount::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'name' => 'Drawer',
            'account_type' => 'cash',
            'opening_balance' => 0,
            'is_active' => true,
        ]);

        foreach ([
            ['method' => 'cash', 'amount' => 80, 'payment_currency' => 'USD', 'payment_amount' => 80, 'exchange_rate' => 1],
            ['method' => 'cash', 'amount' => 100, 'payment_currency' => 'KHR', 'payment_amount' => 410000, 'exchange_rate' => 4100],
            ['method' => 'card', 'amount' => 20, 'payment_currency' => 'USD', 'payment_amount' => 20, 'exchange_rate' => 1],
        ] as $index => $payment) {
            SalePayment::withoutGlobalScopes()->create([
                'business_id' => $business->id,
                'sale_id' => $sale->id,
                'payment_account_id' => $paymentAccount->id,
                'reference' => "PAY-REPORT-{$index}",
                'payment_date' => now()->toDateString(),
                'status' => 'completed',
                'created_by' => $cashier->id,
                ...$payment,
            ]);
        }

        $this->getJson("/api/v1/cash-register-sessions/{$sessionId}/report")
            ->assertOk()
            ->assertJsonPath('data.summary.opening_cash_usd', '100.00')
            ->assertJsonPath('data.summary.cash_sales_usd', '80.00')
            ->assertJsonPath('data.summary.cash_sales_khr', '410000.00')
            ->assertJsonPath('data.summary.expected_cash_usd', '180.00')
            ->assertJsonPath('data.summary.expected_cash_khr', '410000.00')
            ->assertJsonPath('data.summary.gross_sales_usd', '200.00')
            ->assertJsonPath('data.summary.sales_count', 1)
            ->assertJsonPath('data.summary.payment_count', 3);

        $this->postJson("/api/v1/cash-register-sessions/{$sessionId}/close", [
            'closing_cash_usd' => 181,
            'closing_cash_khr' => 409000,
            'notes' => 'Counted at shift end',
        ])->assertOk()
            ->assertJsonPath('data.status', 'closed')
            ->assertJsonPath('data.expected_cash_usd', '180.00')
            ->assertJsonPath('data.expected_cash_khr', '410000.00')
            ->assertJsonPath('data.closing_cash_usd', '181.00')
            ->assertJsonPath('data.closing_cash_khr', '409000.00')
            ->assertJsonPath('data.difference_usd', '1.00')
            ->assertJsonPath('data.difference_khr', '-1000.00');

        $this->assertDatabaseHas('cash_register_sessions', [
            'id' => $sessionId,
            'closing_float' => '181.00',
            'expected_cash_usd' => '180.00',
            'expected_cash_khr' => '410000.00',
            'closing_cash_usd' => '181.00',
            'closing_cash_khr' => '409000.00',
            'difference_usd' => '1.00',
            'difference_khr' => '-1000.00',
        ]);
    }
}
