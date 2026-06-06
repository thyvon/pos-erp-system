<?php

namespace Tests\Feature\Api\V1;

use App\Models\Business;
use App\Models\BusinessModule;
use App\Models\User;
use Tests\TestCase;
use Laravel\Sanctum\Sanctum;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

class AdminBusinessApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_super_admin_can_list_businesses(): void
    {
        $platformBusiness = Business::factory()->create();
        $superAdmin = User::factory()->for($platformBusiness)->create();
        $superAdmin->assignRole('super_admin');

        Business::factory()->count(3)->create();

        Sanctum::actingAs($superAdmin);

        $response = $this->getJson('/api/v1/admin/businesses');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('meta.total', 4);
    }

    public function test_super_admin_can_register_new_business_with_owner(): void
    {
        $platformBusiness = Business::factory()->create();
        $superAdmin = User::factory()->for($platformBusiness)->create();
        $superAdmin->assignRole('super_admin');

        Sanctum::actingAs($superAdmin);

        $response = $this->postJson('/api/v1/admin/businesses', [
            'name' => 'North Star Retail',
            'email' => 'hello@northstar.test',
            'currency' => 'USD',
            'timezone' => 'Asia/Phnom_Penh',
            'tier' => 'standard',
            'status' => 'active',
            'max_users' => 20,
            'max_branches' => 5,
            'owner' => [
                'first_name' => 'Dara',
                'last_name' => 'Sok',
                'email' => 'dara@northstar.test',
                'password' => 'password123',
            ],
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.name', 'North Star Retail');
    }

    public function test_non_super_admin_cannot_access_admin_business_registry(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/admin/businesses');

        $response->assertForbidden();
    }

    public function test_super_admin_can_view_business_module_states(): void
    {
        $platformBusiness = Business::factory()->create();
        $superAdmin = User::factory()->for($platformBusiness)->create();
        $superAdmin->assignRole('super_admin');
        $business = Business::factory()->create();

        BusinessModule::query()->updateOrCreate([
            'business_id' => $business->id,
            'module_key' => 'hrm',
        ], [
            'status' => 'trial',
            'limits' => ['employees' => 25],
        ]);

        Sanctum::actingAs($superAdmin);

        $response = $this->getJson("/api/v1/admin/businesses/{$business->id}/modules");

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonFragment([
                'module_key' => 'hrm',
                'status' => 'trial',
            ])
            ->assertJsonFragment([
                'module_key' => 'core',
                'status' => 'active',
            ]);
    }

    public function test_super_admin_can_update_business_modules(): void
    {
        $platformBusiness = Business::factory()->create();
        $superAdmin = User::factory()->for($platformBusiness)->create();
        $superAdmin->assignRole('super_admin');
        $business = Business::factory()->create();

        Sanctum::actingAs($superAdmin);

        $response = $this->putJson("/api/v1/admin/businesses/{$business->id}/modules", [
            'modules' => [
                [
                    'module_key' => 'core',
                    'status' => 'active',
                ],
                [
                    'module_key' => 'hrm',
                    'status' => 'trial',
                    'starts_at' => '2026-06-01',
                    'ends_at' => '2026-07-01',
                    'limits' => [
                        'employees' => 25,
                    ],
                    'settings' => [
                        'payroll' => false,
                    ],
                ],
                [
                    'module_key' => 'sales',
                    'status' => 'disabled',
                ],
            ],
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonFragment([
                'module_key' => 'hrm',
                'status' => 'trial',
            ])
            ->assertJsonFragment([
                'module_key' => 'sales',
                'status' => 'disabled',
            ]);

        $this->assertDatabaseHas('business_modules', [
            'business_id' => $business->id,
            'module_key' => 'hrm',
            'status' => 'trial',
        ]);

        $this->assertDatabaseHas('business_modules', [
            'business_id' => $business->id,
            'module_key' => 'sales',
            'status' => 'disabled',
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'business_id' => $business->id,
            'user_id' => $superAdmin->id,
            'event' => 'business_modules_updated',
            'auditable_id' => $business->id,
        ]);
    }

    public function test_core_module_cannot_be_disabled(): void
    {
        $platformBusiness = Business::factory()->create();
        $superAdmin = User::factory()->for($platformBusiness)->create();
        $superAdmin->assignRole('super_admin');
        $business = Business::factory()->create();

        Sanctum::actingAs($superAdmin);

        $this->putJson("/api/v1/admin/businesses/{$business->id}/modules", [
            'modules' => [
                [
                    'module_key' => 'core',
                    'status' => 'disabled',
                ],
            ],
        ])->assertStatus(422);
    }

    public function test_non_super_admin_cannot_manage_business_modules(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');

        Sanctum::actingAs($admin);

        $this->getJson("/api/v1/admin/businesses/{$business->id}/modules")
            ->assertForbidden();
    }
}
