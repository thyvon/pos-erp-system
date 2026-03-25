<?php

namespace Tests\Feature\Api\V1;

use App\Models\Business;
use App\Models\Customer;
use App\Models\CustomerGroup;
use App\Models\PriceGroup;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CustomerGroupApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_admin_can_create_customer_group(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/customer-groups', [
            'name' => 'VIP',
            'discount' => 7.5,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.name', 'VIP')
            ->assertJsonPath('data.discount', 7.5);
    }

    public function test_manager_cannot_create_customer_group(): void
    {
        $business = Business::factory()->create();
        $manager = User::factory()->for($business)->create();
        $manager->assignRole('manager');

        Sanctum::actingAs($manager);

        $response = $this->postJson('/api/v1/customer-groups', [
            'name' => 'Retail',
            'discount' => 3,
        ]);

        $response->assertForbidden();
    }

    public function test_index_returns_only_current_business_customer_groups(): void
    {
        $business = Business::factory()->create();
        $otherBusiness = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');

        CustomerGroup::factory()->for($business)->create(['name' => 'Visible Group']);
        CustomerGroup::withoutGlobalScopes()->create([
            'business_id' => $otherBusiness->id,
            'name' => 'Hidden Group',
            'discount' => 5,
            'price_group_id' => null,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/customer-groups');

        $response
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonFragment(['name' => 'Visible Group'])
            ->assertJsonMissing(['name' => 'Hidden Group']);
    }

    public function test_delete_is_blocked_when_customers_use_customer_group(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');
        $customerGroup = CustomerGroup::factory()->for($business)->create();
        Customer::factory()->for($business)->create([
            'customer_group_id' => $customerGroup->id,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->deleteJson("/api/v1/customer-groups/{$customerGroup->id}");

        $response
            ->assertStatus(422)
            ->assertJsonPath('message', 'Customer group cannot be deleted because it is still assigned to customers.');
    }

    public function test_customer_group_can_link_to_price_group_in_same_business(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');
        $priceGroup = PriceGroup::factory()->for($business)->create();

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/customer-groups', [
            'name' => 'Wholesale',
            'discount' => 10,
            'price_group_id' => $priceGroup->id,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.price_group_id', $priceGroup->id)
            ->assertJsonPath('data.price_group.name', $priceGroup->name);
    }

    public function test_price_group_from_other_business_is_rejected(): void
    {
        $business = Business::factory()->create();
        $otherBusiness = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');
        $otherPriceGroup = PriceGroup::factory()->for($otherBusiness)->create();

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/customer-groups', [
            'name' => 'Wholesale',
            'discount' => 10,
            'price_group_id' => $otherPriceGroup->id,
        ]);

        $response
            ->assertStatus(422)
            ->assertJsonPath('message', 'Selected price group is invalid for this business.');
    }
}
