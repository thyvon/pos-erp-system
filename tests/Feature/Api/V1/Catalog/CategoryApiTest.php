<?php

namespace Tests\Feature\Api\V1\Catalog;

use App\Models\Business;
use App\Models\Category;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CategoryApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_admin_can_create_root_category(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/categories', [
            'name' => 'Beverages',
            'code' => 'BEV',
            'short_code' => 'BEV',
            'sort_order' => 10,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.name', 'Beverages')
            ->assertJsonPath('data.parent_id', null)
            ->assertJsonPath('data.sort_order', 10);
    }

    public function test_manager_can_create_child_category_up_to_second_level(): void
    {
        $business = Business::factory()->create();
        $manager = User::factory()->for($business)->create();
        $manager->assignRole('manager');
        $parent = Category::factory()->for($business)->create([
            'name' => 'Beverages',
            'parent_id' => null,
        ]);

        Sanctum::actingAs($manager);

        $response = $this->postJson('/api/v1/categories', [
            'name' => 'Soft Drinks',
            'parent_id' => $parent->id,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.parent_id', $parent->id)
            ->assertJsonPath('data.parent.name', 'Beverages');
    }

    public function test_third_level_category_is_rejected(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');
        $root = Category::factory()->for($business)->create([
            'name' => 'Beverages',
            'parent_id' => null,
        ]);
        $child = Category::factory()->for($business)->create([
            'name' => 'Soft Drinks',
            'parent_id' => $root->id,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/categories', [
            'name' => 'Cola',
            'parent_id' => $child->id,
        ]);

        $response
            ->assertStatus(400)
            ->assertJsonPath('message', 'Categories support a maximum depth of two levels.');
    }

    public function test_index_returns_only_current_business_categories(): void
    {
        $business = Business::factory()->create();
        $otherBusiness = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');

        Category::factory()->for($business)->create(['name' => 'Visible Category']);
        Category::withoutGlobalScopes()->create([
            'business_id' => $otherBusiness->id,
            'name' => 'Hidden Category',
            'parent_id' => null,
            'code' => null,
            'short_code' => null,
            'image_url' => null,
            'sort_order' => 0,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/categories');

        $response
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonFragment(['name' => 'Visible Category'])
            ->assertJsonMissing(['name' => 'Hidden Category']);
    }

    public function test_category_cannot_be_deleted_when_it_has_child_categories(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');
        $parent = Category::factory()->for($business)->create([
            'name' => 'Beverages',
            'parent_id' => null,
        ]);
        Category::factory()->for($business)->create([
            'name' => 'Soft Drinks',
            'parent_id' => $parent->id,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->deleteJson("/api/v1/categories/{$parent->id}");

        $response
            ->assertStatus(400)
            ->assertJsonPath('message', 'Category cannot be deleted because it still has child categories.');
    }
}
