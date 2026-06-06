<?php

namespace Tests\Feature\Api\V1;

use App\Models\Branch;
use App\Models\Business;
use App\Models\BusinessModule;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ModuleAccessApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_auth_payload_includes_enabled_business_modules(): void
    {
        $business = Business::factory()->create();
        $user = User::factory()->for($business)->create();
        $user->assignRole('admin');
        $this->assignBranchAccess($user);

        BusinessModule::query()->updateOrCreate([
            'business_id' => $business->id,
            'module_key' => 'sales',
        ], [
            'status' => 'disabled',
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/auth/me');

        $response
            ->assertOk()
            ->assertJsonPath('success', true);

        $enabledModules = $response->json('data.enabled_modules');

        $this->assertContains('core', $enabledModules);
        $this->assertContains('catalog', $enabledModules);
        $this->assertNotContains('sales', $enabledModules);
    }

    public function test_disabled_module_blocks_module_routes_before_permission_success(): void
    {
        $business = Business::factory()->create();
        $user = User::factory()->for($business)->create();
        $user->assignRole('admin');
        $this->assignBranchAccess($user);

        BusinessModule::query()->updateOrCreate([
            'business_id' => $business->id,
            'module_key' => 'catalog',
        ], [
            'status' => 'disabled',
        ]);

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/categories')
            ->assertStatus(403)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'The Catalog module is not enabled for this business.');
    }

    public function test_default_enabled_modules_keep_existing_tenants_working(): void
    {
        $business = Business::factory()->create();
        $user = User::factory()->for($business)->create();
        $user->assignRole('admin');
        $branch = Branch::factory()->for($business)->create();
        $user->branches()->sync([$branch->id]);
        $user->forceFill(['default_branch_id' => $branch->id])->save();

        BusinessModule::query()
            ->where('business_id', $business->id)
            ->where('module_key', 'catalog')
            ->delete();

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/categories')
            ->assertOk()
            ->assertJsonPath('success', true);
    }
}
