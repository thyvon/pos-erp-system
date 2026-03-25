<?php

namespace Tests\Feature\Api\V1;

use App\Models\Branch;
use App\Models\Business;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
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
        $branch = Branch::factory()->for($business)->create();
        $admin->branches()->sync([$branch->id]);
        $admin->forceFill(['default_branch_id' => $branch->id])->save();

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

    public function test_index_never_returns_super_admin_users(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create([
            'email' => 'admin@tenant.test',
        ]);
        $admin->assignRole('admin');
        $branch = Branch::factory()->for($business)->create();
        $admin->branches()->sync([$branch->id]);
        $admin->forceFill(['default_branch_id' => $branch->id])->save();

        $superAdmin = User::factory()->for($business)->create([
            'email' => 'super-admin@tenant.test',
        ]);
        $superAdmin->assignRole('super_admin');

        $visibleUser = User::factory()->for($business)->create([
            'email' => 'staff@tenant.test',
        ]);
        $visibleUser->assignRole('manager');

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/users');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonMissing(['email' => 'super-admin@tenant.test'])
            ->assertJsonFragment(['email' => 'admin@tenant.test'])
            ->assertJsonFragment(['email' => 'staff@tenant.test'])
            ->assertJsonPath('meta.total', 2);
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
        $branchA = Branch::factory()->for($business)->create(['name' => 'Branch A']);
        $branchB = Branch::factory()->for($business)->create(['name' => 'Branch B']);
        $admin->branches()->sync([$branchA->id, $branchB->id]);
        $admin->forceFill(['default_branch_id' => $branchA->id])->save();
        Permission::findOrCreate('reports.financial', 'web');

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
            'direct_permissions' => ['reports.financial'],
            'branch_ids' => [$branchA->id, $branchB->id],
            'default_branch_id' => $branchB->id,
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
            'default_branch_id' => $branchB->id,
        ]);

        $createdUser = User::where('email', 'jane@example.com')->firstOrFail();

        $this->assertSame(['manager'], $createdUser->getRoleNames()->all());
        $this->assertEqualsCanonicalizing(
            [$branchA->id, $branchB->id],
            $createdUser->branches()->pluck('branches.id')->all()
        );
        $this->assertSame(['reports.financial'], $createdUser->permissions()->pluck('name')->all());
    }

    public function test_store_allows_creating_branch_scoped_user_with_zero_branches(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');
        $branch = Branch::factory()->for($business)->create();
        $admin->branches()->sync([$branch->id]);
        $admin->forceFill(['default_branch_id' => $branch->id])->save();

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/users', [
            'first_name' => 'No',
            'last_name' => 'Branch',
            'email' => 'no-branch@example.com',
            'password' => 'secret123',
            'role' => 'cashier',
            'status' => 'active',
            'branch_ids' => [],
            'default_branch_id' => null,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.email', 'no-branch@example.com')
            ->assertJsonPath('data.branch_ids', [])
            ->assertJsonPath('data.default_branch_id', null);
    }

    public function test_admin_cannot_assign_branch_access_to_admin_role(): void
    {
        $business = Business::factory()->create();
        $actor = User::factory()->for($business)->create();
        $actor->assignRole('admin');
        $branch = Branch::factory()->for($business)->create();
        $actor->branches()->sync([$branch->id]);
        $actor->forceFill(['default_branch_id' => $branch->id])->save();

        Sanctum::actingAs($actor);

        $response = $this->postJson('/api/v1/users', [
            'first_name' => 'Another',
            'last_name' => 'Admin',
            'email' => 'another-admin@example.com',
            'password' => 'secret123',
            'role' => 'admin',
            'status' => 'active',
            'branch_ids' => [$branch->id],
            'default_branch_id' => $branch->id,
        ]);

        $response
            ->assertForbidden()
            ->assertJsonPath('success', false);
    }

    public function test_admin_can_assign_branch_access_to_accountant_role(): void
    {
        $business = Business::factory()->create();
        $actor = User::factory()->for($business)->create();
        $actor->assignRole('admin');
        $branch = Branch::factory()->for($business)->create();
        $actor->branches()->sync([$branch->id]);
        $actor->forceFill(['default_branch_id' => $branch->id])->save();

        Sanctum::actingAs($actor);

        $response = $this->postJson('/api/v1/users', [
            'first_name' => 'Branch',
            'last_name' => 'Accountant',
            'email' => 'branch-accountant@example.com',
            'password' => 'secret123',
            'role' => 'accountant',
            'status' => 'active',
            'branch_ids' => [$branch->id],
            'default_branch_id' => $branch->id,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.roles.0', 'accountant')
            ->assertJsonPath('data.branch_ids.0', $branch->id)
            ->assertJsonPath('data.default_branch_id', $branch->id);
    }

    public function test_update_to_admin_role_clears_existing_branch_access(): void
    {
        $business = Business::factory()->create();
        $actor = User::factory()->for($business)->create();
        $actor->assignRole('admin');
        $branch = Branch::factory()->for($business)->create();
        $actor->branches()->sync([$branch->id]);
        $actor->forceFill(['default_branch_id' => $branch->id])->save();

        $target = User::factory()->for($business)->create();
        $target->assignRole('manager');
        $target->branches()->sync([$branch->id]);
        $target->forceFill(['default_branch_id' => $branch->id])->save();

        Sanctum::actingAs($actor);

        $response = $this->putJson("/api/v1/users/{$target->id}", [
            'role' => 'admin',
            'status' => 'active',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.roles.0', 'admin')
            ->assertJsonPath('data.branch_ids', [])
            ->assertJsonPath('data.default_branch_id', null);
    }

    public function test_user_create_update_and_delete_write_phase_four_audit_events(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');
        $branchA = Branch::factory()->for($business)->create(['name' => 'Branch A']);
        $branchB = Branch::factory()->for($business)->create(['name' => 'Branch B']);
        $admin->branches()->sync([$branchA->id, $branchB->id]);
        $admin->forceFill(['default_branch_id' => $branchA->id])->save();

        Sanctum::actingAs($admin);

        $createResponse = $this->postJson('/api/v1/users', [
            'first_name' => 'Audit',
            'last_name' => 'Target',
            'email' => 'audit-target@example.com',
            'password' => 'secret123',
            'role' => 'manager',
            'status' => 'active',
            'branch_ids' => [$branchA->id],
            'default_branch_id' => $branchA->id,
        ]);

        $createResponse->assertCreated();
        $createdId = $createResponse->json('data.id');

        $this->assertTrue(DB::table('audit_logs')->where('event', 'user_created')->where('auditable_id', $createdId)->exists());
        $this->assertTrue(DB::table('audit_logs')->where('event', 'role_assigned')->where('auditable_id', $createdId)->exists());
        $this->assertTrue(DB::table('audit_logs')->where('event', 'branch_access_changed')->where('auditable_id', $createdId)->exists());

        $updateResponse = $this->putJson("/api/v1/users/{$createdId}", [
            'status' => 'inactive',
            'branch_ids' => [$branchB->id],
            'default_branch_id' => $branchB->id,
        ]);

        $updateResponse->assertOk();

        $this->assertTrue(DB::table('audit_logs')->where('event', 'user_updated')->where('auditable_id', $createdId)->exists());
        $this->assertTrue(DB::table('audit_logs')->where('event', 'status_changed')->where('auditable_id', $createdId)->exists());

        $deleteResponse = $this->deleteJson("/api/v1/users/{$createdId}");

        $deleteResponse->assertOk();
        $this->assertTrue(DB::table('audit_logs')->where('event', 'user_deleted')->where('auditable_id', $createdId)->exists());
    }

    public function test_destroy_soft_deletes_the_user(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');
        $branch = Branch::factory()->for($business)->create();
        $admin->branches()->sync([$branch->id]);
        $admin->forceFill(['default_branch_id' => $branch->id])->save();
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

    public function test_store_returns_forbidden_when_user_lacks_users_create_permission(): void
    {
        $business = Business::factory()->create();
        $cashier = User::factory()->for($business)->create();
        $cashier->assignRole('cashier');
        $branch = Branch::factory()->for($business)->create();
        $cashier->branches()->sync([$branch->id]);
        $cashier->forceFill(['default_branch_id' => $branch->id])->save();

        Sanctum::actingAs($cashier);

        $response = $this->postJson('/api/v1/users', [
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'email' => 'cashier-blocked@example.com',
            'password' => 'secret123',
            'role' => 'manager',
            'status' => 'active',
            'max_discount' => 10,
            'branch_ids' => [$branch->id],
            'default_branch_id' => $branch->id,
        ]);

        $response
            ->assertForbidden()
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'You do not have permission.');
    }

    public function test_admin_cannot_create_user_with_super_admin_role(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');
        $branch = Branch::factory()->for($business)->create();
        $admin->branches()->sync([$branch->id]);
        $admin->forceFill(['default_branch_id' => $branch->id])->save();

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/users', [
            'first_name' => 'Platform',
            'last_name' => 'Admin',
            'email' => 'platform-admin@example.com',
            'password' => 'secret123',
            'role' => 'super_admin',
            'status' => 'active',
            'branch_ids' => [$branch->id],
            'default_branch_id' => $branch->id,
        ]);

        $response
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_destroy_rejects_deleting_the_last_active_admin(): void
    {
        $business = Business::factory()->create();
        $actor = User::factory()->for($business)->create();
        $actor->assignRole('manager');
        $branch = Branch::factory()->for($business)->create();
        $actor->branches()->sync([$branch->id]);
        $actor->forceFill(['default_branch_id' => $branch->id])->save();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');

        Sanctum::actingAs($actor);

        $response = $this->deleteJson("/api/v1/users/{$admin->id}");

        $response
            ->assertStatus(403)
            ->assertJsonPath('success', false);
    }

    public function test_options_returns_roles_permissions_and_branches_for_user_management(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');
        $branch = Branch::factory()->for($business)->create();
        $admin->branches()->sync([$branch->id]);
        $admin->forceFill(['default_branch_id' => $branch->id])->save();

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/users/options');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'roles',
                    'permissions',
                    'branches',
                ],
            ])
            ->assertJsonFragment([
                'id' => $branch->id,
                'name' => $branch->name,
            ]);
    }
}
