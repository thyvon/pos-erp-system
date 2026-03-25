<?php

namespace Tests\Feature\Api\V1\Catalog;

use App\Models\Business;
use App\Models\User;
use App\Models\VariationTemplate;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class VariationTemplateApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_admin_can_create_variation_template_with_values(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/variation-templates', [
            'name' => 'Size',
            'values' => [
                ['name' => 'Small', 'sort_order' => 10],
                ['name' => 'Medium', 'sort_order' => 20],
                ['name' => 'Large', 'sort_order' => 30],
            ],
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.name', 'Size')
            ->assertJsonPath('data.values.0.name', 'Small');
    }

    public function test_manager_can_create_variation_template(): void
    {
        $business = Business::factory()->create();
        $manager = User::factory()->for($business)->create();
        $manager->assignRole('manager');

        Sanctum::actingAs($manager);

        $response = $this->postJson('/api/v1/variation-templates', [
            'name' => 'Color',
            'values' => [
                ['name' => 'Red', 'sort_order' => 10],
                ['name' => 'Blue', 'sort_order' => 20],
            ],
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.name', 'Color');
    }

    public function test_index_returns_only_current_business_templates(): void
    {
        $business = Business::factory()->create();
        $otherBusiness = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');

        VariationTemplate::factory()->for($business)->create(['name' => 'Visible Template']);
        VariationTemplate::withoutGlobalScopes()->create([
            'business_id' => $otherBusiness->id,
            'name' => 'Hidden Template',
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/variation-templates');

        $response
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonFragment(['name' => 'Visible Template'])
            ->assertJsonMissing(['name' => 'Hidden Template']);
    }

    public function test_template_options_return_current_business_only(): void
    {
        $business = Business::factory()->create();
        $otherBusiness = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');

        VariationTemplate::factory()->for($business)->create(['name' => 'Visible Template']);
        VariationTemplate::withoutGlobalScopes()->create([
            'business_id' => $otherBusiness->id,
            'name' => 'Hidden Template',
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/variation-templates/options');

        $response
            ->assertOk()
            ->assertJsonFragment(['name' => 'Visible Template'])
            ->assertJsonMissing(['name' => 'Hidden Template']);
    }

    public function test_template_can_be_deleted_when_unused(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');
        $template = VariationTemplate::factory()->for($business)->create();

        Sanctum::actingAs($admin);

        $response = $this->deleteJson("/api/v1/variation-templates/{$template->id}");

        $response->assertOk();
        $this->assertSoftDeleted('variation_templates', ['id' => $template->id]);
    }
}
