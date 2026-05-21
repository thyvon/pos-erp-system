<?php

namespace Tests\Feature\Api\V1;

use App\Models\Business;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CambodiaAddressApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
        Cache::flush();
    }

    public function test_authenticated_user_can_fetch_cambodia_provinces(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');
        $this->assignBranchAccess($admin);

        Http::fake([
            'pumi.onrender.com/pumi/provinces*' => Http::response([
                [
                    'id' => 12,
                    'name_en' => 'Phnom Penh',
                    'name_km' => 'ភ្នំពេញ',
                ],
            ]),
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/locations/cambodia/provinces');

        $response
            ->assertOk()
            ->assertJsonPath('data.0.id', '12')
            ->assertJsonPath('data.0.name_en', 'Phnom Penh')
            ->assertJsonPath('data.0.name_km', 'ភ្នំពេញ');
    }

    public function test_districts_are_filtered_by_province_id(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');
        $this->assignBranchAccess($admin);

        Http::fake([
            'pumi.onrender.com/pumi/districts*' => Http::response([
                [
                    'id' => 1201,
                    'province_id' => 12,
                    'name_en' => 'Chamkar Mon',
                    'name_km' => 'ចំការមន',
                ],
            ]),
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/locations/cambodia/districts?province_id=12');

        $response
            ->assertOk()
            ->assertJsonPath('data.0.id', '1201')
            ->assertJsonPath('data.0.province_id', '12');

        Http::assertSent(fn ($request) => $request->url() === 'https://pumi.onrender.com/pumi/districts?province_id=12');
    }
}
