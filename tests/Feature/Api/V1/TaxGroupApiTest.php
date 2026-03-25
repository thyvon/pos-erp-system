<?php

namespace Tests\Feature\Api\V1;

use App\Models\Business;
use App\Models\TaxGroup;
use App\Models\TaxRate;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TaxGroupApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_admin_can_create_tax_group(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');
        $rateA = TaxRate::factory()->for($business)->create(['name' => 'VAT 10']);
        $rateB = TaxRate::factory()->for($business)->create(['name' => 'Service 2']);

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/tax-groups', [
            'name' => 'VAT + Service',
            'description' => 'Compound tax',
            'tax_rate_ids' => [$rateA->id, $rateB->id],
            'is_active' => true,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.name', 'VAT + Service')
            ->assertJsonCount(2, 'data.tax_rates');
    }

    public function test_manager_cannot_create_tax_group(): void
    {
        $business = Business::factory()->create();
        $manager = User::factory()->for($business)->create();
        $manager->assignRole('manager');
        $rate = TaxRate::factory()->for($business)->create();

        Sanctum::actingAs($manager);

        $response = $this->postJson('/api/v1/tax-groups', [
            'name' => 'Blocked Group',
            'tax_rate_ids' => [$rate->id],
        ]);

        $response->assertForbidden();
    }

    public function test_index_returns_only_current_business_tax_groups(): void
    {
        $business = Business::factory()->create();
        $otherBusiness = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');
        $rate = TaxRate::factory()->for($business)->create();
        $otherRate = TaxRate::factory()->for($otherBusiness)->create();

        $group = TaxGroup::factory()->for($business)->create(['name' => 'Visible Group']);
        DB::table('tax_group_items')->insert([
            'id' => (string) Str::uuid(),
            'tax_group_id' => $group->id,
            'tax_rate_id' => $rate->id,
        ]);

        $otherGroup = TaxGroup::withoutGlobalScopes()->create([
            'id' => (string) Str::uuid(),
            'business_id' => $otherBusiness->id,
            'name' => 'Hidden Group',
            'description' => null,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('tax_group_items')->insert([
            'id' => (string) Str::uuid(),
            'tax_group_id' => $otherGroup->id,
            'tax_rate_id' => $otherRate->id,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/tax-groups');

        $response
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonFragment(['name' => 'Visible Group'])
            ->assertJsonMissing(['name' => 'Hidden Group']);
    }

    public function test_update_syncs_tax_rates(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');
        $rateA = TaxRate::factory()->for($business)->create(['name' => 'VAT 10']);
        $rateB = TaxRate::factory()->for($business)->create(['name' => 'City 1']);
        $rateC = TaxRate::factory()->for($business)->create(['name' => 'Service 2']);
        $group = TaxGroup::factory()->for($business)->create(['name' => 'Old Group']);

        DB::table('tax_group_items')->insert([
            'id' => (string) Str::uuid(),
            'tax_group_id' => $group->id,
            'tax_rate_id' => $rateA->id,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->putJson("/api/v1/tax-groups/{$group->id}", [
            'name' => 'Updated Group',
            'tax_rate_ids' => [$rateB->id, $rateC->id],
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.name', 'Updated Group')
            ->assertJsonCount(2, 'data.tax_rates');

        $this->assertEqualsCanonicalizing(
            [$rateB->id, $rateC->id],
            DB::table('tax_group_items')->where('tax_group_id', $group->id)->pluck('tax_rate_id')->all()
        );
    }

    public function test_tax_group_delete_is_blocked_when_products_use_it(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');
        $rate = TaxRate::factory()->for($business)->create();
        $group = TaxGroup::factory()->for($business)->create();

        DB::table('tax_group_items')->insert([
            'id' => (string) Str::uuid(),
            'tax_group_id' => $group->id,
            'tax_rate_id' => $rate->id,
        ]);

        Schema::create('products', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('business_id');
            $table->uuid('tax_group_id')->nullable();
        });

        try {
            DB::table('products')->insert([
                'id' => (string) Str::uuid(),
                'business_id' => $business->id,
                'tax_group_id' => $group->id,
            ]);

            Sanctum::actingAs($admin);

            $response = $this->deleteJson("/api/v1/tax-groups/{$group->id}");

            $response
                ->assertStatus(422)
                ->assertJsonPath('message', 'Tax group cannot be deleted because it is still assigned to products.');
        } finally {
            Schema::dropIfExists('products');
        }
    }

    public function test_create_rejects_tax_rate_from_other_business(): void
    {
        $business = Business::factory()->create();
        $otherBusiness = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');
        $otherRate = TaxRate::factory()->for($otherBusiness)->create();

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/tax-groups', [
            'name' => 'Invalid Group',
            'tax_rate_ids' => [$otherRate->id],
        ]);

        $response->assertStatus(422);
    }
}
