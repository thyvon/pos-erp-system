<?php

namespace Tests\Feature\Api\V1;

use App\Models\Business;
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
}
