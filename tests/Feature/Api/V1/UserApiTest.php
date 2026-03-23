<?php

namespace Tests\Feature\Api\V1;

use App\Models\Business;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_index_returns_paginated_users_for_authenticated_business(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');

        User::factory()->for($business)->count(3)->create();

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/users');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(4, 'data')
            ->assertJsonStructure([
                'data',
                'meta' => ['current_page', 'per_page', 'total', 'last_page', 'from', 'to'],
            ]);
    }

    public function test_users_index_returns_json_unauthorized_when_no_token_is_sent(): void
    {
        $response = $this->getJson('/api/v1/users');

        $response
            ->assertUnauthorized()
            ->assertJson([
                'success' => false,
                'message' => 'Unauthenticated.',
            ]);
    }

    public function test_store_creates_user_and_assigns_role(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/users', [
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'email' => 'jane@example.com',
            'password' => 'secret123',
            'role' => 'manager',
            'status' => 'active',
            'max_discount' => 10,
            'commission_percentage' => 5,
            'sales_target_amount' => 2500,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.email', 'jane@example.com');

        $this->assertDatabaseHas('users', [
            'business_id' => $business->id,
            'email' => 'jane@example.com',
            'status' => 'active',
            'commission_percentage' => 5.00,
            'sales_target_amount' => 2500.00,
        ]);

        $this->assertSame(['manager'], User::where('email', 'jane@example.com')->firstOrFail()->getRoleNames()->all());
    }

    public function test_destroy_soft_deletes_the_user(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');
        $targetUser = User::factory()->for($business)->create();
        $targetUser->assignRole('cashier');

        Sanctum::actingAs($admin);

        $response = $this->deleteJson("/api/v1/users/{$targetUser->id}");

        $response
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertSoftDeleted('users', [
            'id' => $targetUser->id,
            'status' => 'inactive',
        ]);
    }

    public function test_destroy_rejects_deleting_the_last_active_admin(): void
    {
        $business = Business::factory()->create();
        $actor = User::factory()->for($business)->create();
        $actor->assignRole('manager');
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');

        Sanctum::actingAs($actor);

        $response = $this->deleteJson("/api/v1/users/{$admin->id}");

        $response
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }
}
