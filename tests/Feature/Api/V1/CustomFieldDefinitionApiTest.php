<?php

namespace Tests\Feature\Api\V1;

use App\Models\Business;
use App\Models\CustomFieldDefinition;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CustomFieldDefinitionApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_admin_can_create_custom_field_definition(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/custom-field-definitions', [
            'module' => 'product',
            'field_name' => 'origin_country',
            'field_label' => 'Origin Country',
            'field_type' => 'select',
            'options' => ['KH', 'TH'],
            'is_required' => true,
            'sort_order' => 10,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.field_name', 'origin_country');
    }

    public function test_manager_cannot_create_custom_field_definition(): void
    {
        $business = Business::factory()->create();
        $manager = User::factory()->for($business)->create();
        $manager->assignRole('manager');

        Sanctum::actingAs($manager);

        $response = $this->postJson('/api/v1/custom-field-definitions', [
            'module' => 'customer',
            'field_name' => 'vip_code',
            'field_label' => 'VIP Code',
            'field_type' => 'text',
        ]);

        $response->assertForbidden();
    }

    public function test_index_returns_only_current_business_definitions(): void
    {
        $business = Business::factory()->create();
        $otherBusiness = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');

        CustomFieldDefinition::query()->create([
            'business_id' => $business->id,
            'module' => 'product',
            'field_name' => 'origin_country',
            'field_label' => 'Origin Country',
            'field_type' => 'text',
            'options' => null,
            'is_required' => false,
            'sort_order' => 1,
        ]);

        CustomFieldDefinition::withoutGlobalScopes()->create([
            'business_id' => $otherBusiness->id,
            'module' => 'customer',
            'field_name' => 'vip_code',
            'field_label' => 'VIP Code',
            'field_type' => 'text',
            'options' => null,
            'is_required' => false,
            'sort_order' => 1,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/custom-field-definitions');

        $response
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonFragment(['field_name' => 'origin_country'])
            ->assertJsonMissing(['field_name' => 'vip_code']);
    }
}
