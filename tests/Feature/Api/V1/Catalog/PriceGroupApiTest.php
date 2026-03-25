<?php

namespace Tests\Feature\Api\V1\Catalog;

use App\Models\Business;
use App\Models\CustomerGroup;
use App\Models\PriceGroup;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PriceGroupApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_admin_can_create_price_group(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/price-groups', [
            'name' => 'Wholesale',
            'description' => 'Tier for wholesale pricing.',
            'is_default' => true,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.name', 'Wholesale')
            ->assertJsonPath('data.is_default', true);
    }

    public function test_manager_can_create_price_group(): void
    {
        $business = Business::factory()->create();
        $manager = User::factory()->for($business)->create();
        $manager->assignRole('manager');

        Sanctum::actingAs($manager);

        $response = $this->postJson('/api/v1/price-groups', [
            'name' => 'Retail Premium',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.name', 'Retail Premium');
    }

    public function test_first_price_group_becomes_default_automatically(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/price-groups', [
            'name' => 'Retail',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.is_default', true);
    }

    public function test_updating_default_price_group_clears_other_defaults(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');
        $first = PriceGroup::factory()->for($business)->create([
            'name' => 'Retail',
            'is_default' => true,
        ]);
        $second = PriceGroup::factory()->for($business)->create([
            'name' => 'VIP',
            'is_default' => false,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->putJson("/api/v1/price-groups/{$second->id}", [
            'is_default' => true,
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.is_default', true);

        $this->assertFalse($first->fresh()->is_default);
        $this->assertTrue($second->fresh()->is_default);
    }

    public function test_unchecking_current_default_promotes_another_price_group(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');
        $default = PriceGroup::factory()->for($business)->create([
            'name' => 'Default Group',
            'is_default' => true,
        ]);
        $other = PriceGroup::factory()->for($business)->create([
            'name' => 'Backup Group',
            'is_default' => false,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->putJson("/api/v1/price-groups/{$default->id}", [
            'is_default' => false,
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.id', $default->id)
            ->assertJsonPath('data.is_default', false);

        $this->assertFalse($default->fresh()->is_default);
        $this->assertTrue($other->fresh()->is_default);
    }

    public function test_index_returns_only_current_business_price_groups(): void
    {
        $business = Business::factory()->create();
        $otherBusiness = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');

        PriceGroup::factory()->for($business)->create(['name' => 'Visible Group']);
        PriceGroup::withoutGlobalScopes()->create([
            'business_id' => $otherBusiness->id,
            'name' => 'Hidden Group',
            'description' => null,
            'is_default' => true,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/price-groups');

        $response
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonFragment(['name' => 'Visible Group'])
            ->assertJsonMissing(['name' => 'Hidden Group']);
    }

    public function test_price_group_delete_is_blocked_when_customer_group_uses_it(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');
        $priceGroup = PriceGroup::factory()->for($business)->create();
        CustomerGroup::factory()->for($business)->create([
            'price_group_id' => $priceGroup->id,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->deleteJson("/api/v1/price-groups/{$priceGroup->id}");

        $response
            ->assertStatus(422)
            ->assertJsonPath('message', 'Price group cannot be deleted because it is still assigned to customer groups.');
    }
}
