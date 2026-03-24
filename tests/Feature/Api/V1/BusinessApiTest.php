<?php

namespace Tests\Feature\Api\V1;

use App\Models\Business;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BusinessApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_show_returns_current_business_profile_with_usage_data(): void
    {
        $business = Business::factory()->create([
            'max_users' => 10,
            'max_branches' => 4,
        ]);
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');
        User::factory()->for($business)->count(2)->create();

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/business');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $business->id)
            ->assertJsonPath('data.usage.users_count', 3)
            ->assertJsonPath('data.usage.remaining_users', 7);
    }

    public function test_update_persists_business_profile_changes(): void
    {
        $business = Business::factory()->create([
            'name' => 'Old Name',
            'currency' => 'USD',
            'timezone' => 'UTC',
        ]);
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');

        Sanctum::actingAs($admin);

        $response = $this->putJson('/api/v1/business', [
            'name' => 'Vun Retail Group',
            'legal_name' => 'Vun Retail Group Co., Ltd.',
            'currency' => 'KHR',
            'timezone' => 'Asia/Phnom_Penh',
            'phone' => '012345678',
            'address' => [
                'line1' => '123 Riverside',
                'city' => 'Phnom Penh',
                'country' => 'KH',
            ],
            'financial_year' => [
                'start_month' => 4,
                'start_day' => 1,
            ],
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.name', 'Vun Retail Group')
            ->assertJsonPath('data.currency', 'KHR')
            ->assertJsonPath('data.timezone', 'Asia/Phnom_Penh')
            ->assertJsonPath('data.financial_year.start_month', 4);
    }

    public function test_update_returns_forbidden_without_business_edit_permission(): void
    {
        $business = Business::factory()->create();
        $cashier = User::factory()->for($business)->create();
        $cashier->assignRole('cashier');

        Sanctum::actingAs($cashier);

        $response = $this->putJson('/api/v1/business', [
            'name' => 'Blocked Update',
        ]);

        $response
            ->assertForbidden()
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'You do not have permission.');
    }
}
