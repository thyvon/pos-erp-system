<?php

namespace Tests\Feature\Api\V1;

use App\Models\Branch;
use App\Models\Business;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_login_and_logout_write_audit_logs(): void
    {
        $business = Business::factory()->create();
        $branch = Branch::factory()->create(['business_id' => $business->id]);
        $user = User::factory()->for($business)->create([
            'email' => 'manager@example.com',
        ]);
        $user->assignRole('manager');
        $user->branches()->attach($branch->id);

        DB::table('settings')
            ->where('business_id', $business->id)
            ->where('group', 'general')
            ->where('key', 'date_format')
            ->update(['value' => 'd/m/Y']);

        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'email' => 'manager@example.com',
            'password' => 'password',
        ]);

        $loginResponse
            ->assertOk()
            ->assertJsonPath('data.user.id', $user->id)
            ->assertJsonPath('data.user.business.date_format', 'd/m/Y');

        $this->assertDatabaseHas('audit_logs', [
            'business_id' => $business->id,
            'user_id' => $user->id,
            'event' => 'login',
            'auditable_id' => $user->id,
        ]);

        $token = $loginResponse->json('data.token');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.business.date_format', 'd/m/Y');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/v1/auth/logout')
            ->assertOk();

        $this->assertDatabaseHas('audit_logs', [
            'business_id' => $business->id,
            'user_id' => $user->id,
            'event' => 'logout',
            'auditable_id' => $user->id,
        ]);
    }

    public function test_failed_login_for_existing_user_writes_audit_log(): void
    {
        $business = Business::factory()->create();
        $branch = Branch::factory()->create(['business_id' => $business->id]);
        $user = User::factory()->for($business)->create([
            'email' => 'cashier@example.com',
        ]);
        $user->assignRole('cashier');
        $user->branches()->attach($branch->id);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'cashier@example.com',
            'password' => 'wrong-password',
        ])->assertStatus(401);

        $this->assertDatabaseHas('audit_logs', [
            'business_id' => $business->id,
            'user_id' => $user->id,
            'event' => 'login_failed',
            'auditable_id' => $user->id,
        ]);
    }

    public function test_authenticated_user_without_branch_access_is_blocked(): void
    {
        $business = Business::factory()->create();
        $user = User::factory()->for($business)->create();
        $user->assignRole('inventory_manager');

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/auth/me')
            ->assertStatus(403)
            ->assertJsonPath('message', 'No branch access assigned. Contact your administrator.');
    }
}
