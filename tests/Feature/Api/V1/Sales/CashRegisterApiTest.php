<?php

namespace Tests\Feature\Api\V1\Sales;

use App\Models\Branch;
use App\Models\Business;
use App\Models\CashRegister;
use App\Models\User;
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
}
