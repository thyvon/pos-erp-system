<?php

namespace Tests\Feature\Api\V1\Catalog;

use App\Models\Brand;
use App\Models\Business;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BrandApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_admin_can_create_brand(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/brands', [
            'name' => 'Coca-Cola',
            'description' => 'Global beverage brand.',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.name', 'Coca-Cola');
    }

    public function test_manager_can_create_brand(): void
    {
        $business = Business::factory()->create();
        $manager = User::factory()->for($business)->create();
        $manager->assignRole('manager');

        Sanctum::actingAs($manager);

        $response = $this->postJson('/api/v1/brands', [
            'name' => 'Pepsi',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.name', 'Pepsi');
    }

    public function test_index_returns_only_current_business_brands(): void
    {
        $business = Business::factory()->create();
        $otherBusiness = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');

        Brand::factory()->for($business)->create(['name' => 'Visible Brand']);
        Brand::withoutGlobalScopes()->create([
            'business_id' => $otherBusiness->id,
            'name' => 'Hidden Brand',
            'description' => null,
            'image_url' => null,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/brands');

        $response
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonFragment(['name' => 'Visible Brand'])
            ->assertJsonMissing(['name' => 'Hidden Brand']);
    }

    public function test_brand_options_return_current_business_only(): void
    {
        $business = Business::factory()->create();
        $otherBusiness = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');

        Brand::factory()->for($business)->create(['name' => 'Visible Brand']);
        Brand::withoutGlobalScopes()->create([
            'business_id' => $otherBusiness->id,
            'name' => 'Hidden Brand',
            'description' => null,
            'image_url' => null,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/brands/options');

        $response
            ->assertOk()
            ->assertJsonFragment(['name' => 'Visible Brand'])
            ->assertJsonMissing(['name' => 'Hidden Brand']);
    }

    public function test_brand_can_be_deleted_when_unused(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');
        $brand = Brand::factory()->for($business)->create();

        Sanctum::actingAs($admin);

        $response = $this->deleteJson("/api/v1/brands/{$brand->id}");

        $response->assertOk();
        $this->assertSoftDeleted('brands', ['id' => $brand->id]);
    }
}
