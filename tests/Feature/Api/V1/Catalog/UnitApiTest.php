<?php

namespace Tests\Feature\Api\V1\Catalog;

use App\Models\Business;
use App\Models\Unit;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UnitApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_admin_can_create_unit_with_sub_units(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/units', [
            'name' => 'Bottle',
            'short_name' => 'bt',
            'allow_decimal' => false,
            'sub_units' => [
                [
                    'name' => 'Case',
                    'short_name' => 'cs',
                    'conversion_factor' => 24,
                ],
            ],
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.name', 'Bottle')
            ->assertJsonPath('data.sub_units.0.name', 'Case');
    }

    public function test_manager_can_create_unit(): void
    {
        $business = Business::factory()->create();
        $manager = User::factory()->for($business)->create();
        $manager->assignRole('manager');

        Sanctum::actingAs($manager);

        $response = $this->postJson('/api/v1/units', [
            'name' => 'Piece',
            'short_name' => 'pc',
            'allow_decimal' => false,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.name', 'Piece');
    }

    public function test_index_returns_only_current_business_units(): void
    {
        $business = Business::factory()->create();
        $otherBusiness = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');

        Unit::factory()->for($business)->create(['name' => 'Visible Unit']);
        Unit::withoutGlobalScopes()->create([
            'business_id' => $otherBusiness->id,
            'name' => 'Hidden Unit',
            'short_name' => 'hu',
            'allow_decimal' => false,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/units');

        $response
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonFragment(['name' => 'Visible Unit'])
            ->assertJsonMissing(['name' => 'Hidden Unit']);
    }

    public function test_unit_options_return_current_business_only(): void
    {
        $business = Business::factory()->create();
        $otherBusiness = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');

        Unit::factory()->for($business)->create(['name' => 'Visible Unit']);
        Unit::withoutGlobalScopes()->create([
            'business_id' => $otherBusiness->id,
            'name' => 'Hidden Unit',
            'short_name' => 'hu',
            'allow_decimal' => false,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/units/options');

        $response
            ->assertOk()
            ->assertJsonFragment(['name' => 'Visible Unit'])
            ->assertJsonMissing(['name' => 'Hidden Unit']);
    }

    public function test_unit_can_be_deleted_when_unused(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');
        $unit = Unit::factory()->for($business)->create();

        Sanctum::actingAs($admin);

        $response = $this->deleteJson("/api/v1/units/{$unit->id}");

        $response->assertOk();
        $this->assertSoftDeleted('units', ['id' => $unit->id]);
    }
}
