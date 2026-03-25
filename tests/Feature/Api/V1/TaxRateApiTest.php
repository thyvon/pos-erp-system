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

class TaxRateApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_admin_can_create_tax_rate(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/tax-rates', [
            'name' => 'VAT 10%',
            'rate' => 10,
            'type' => 'percentage',
            'is_default' => true,
            'is_active' => true,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.name', 'VAT 10%')
            ->assertJsonPath('data.is_default', true);
    }

    public function test_manager_cannot_create_tax_rate(): void
    {
        $business = Business::factory()->create();
        $manager = User::factory()->for($business)->create();
        $manager->assignRole('manager');

        Sanctum::actingAs($manager);

        $response = $this->postJson('/api/v1/tax-rates', [
            'name' => 'VAT 10%',
            'rate' => 10,
            'type' => 'percentage',
        ]);

        $response->assertForbidden();
    }

    public function test_first_tax_rate_becomes_default_automatically(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/tax-rates', [
            'name' => 'VAT 5%',
            'rate' => 5,
            'type' => 'percentage',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.is_default', true);
    }

    public function test_updating_default_tax_rate_clears_other_defaults(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');
        $first = TaxRate::factory()->for($business)->create([
            'name' => 'VAT 5%',
            'is_default' => true,
        ]);
        $second = TaxRate::factory()->for($business)->create([
            'name' => 'VAT 10%',
            'is_default' => false,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->putJson("/api/v1/tax-rates/{$second->id}", [
            'is_default' => true,
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.is_default', true);

        $this->assertFalse($first->fresh()->is_default);
        $this->assertTrue($second->fresh()->is_default);
    }

    public function test_index_returns_only_current_business_tax_rates(): void
    {
        $business = Business::factory()->create();
        $otherBusiness = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');

        TaxRate::factory()->for($business)->create(['name' => 'Visible VAT']);
        TaxRate::withoutGlobalScopes()->create([
            'id' => (string) Str::uuid(),
            'business_id' => $otherBusiness->id,
            'name' => 'Hidden VAT',
            'rate' => 7,
            'type' => 'percentage',
            'is_default' => true,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/tax-rates');

        $response
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonFragment(['name' => 'Visible VAT'])
            ->assertJsonMissing(['name' => 'Hidden VAT']);
    }

    public function test_tax_rate_delete_is_blocked_when_products_use_it(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');
        $taxRate = TaxRate::factory()->for($business)->create();

        Schema::create('products', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('business_id');
            $table->uuid('tax_rate_id')->nullable();
        });

        try {
            DB::table('products')->insert([
                'id' => (string) Str::uuid(),
                'business_id' => $business->id,
                'tax_rate_id' => $taxRate->id,
            ]);

            Sanctum::actingAs($admin);

            $response = $this->deleteJson("/api/v1/tax-rates/{$taxRate->id}");

            $response
                ->assertStatus(422)
                ->assertJsonPath('message', 'Tax rate cannot be deleted because it is still assigned to products.');
        } finally {
            Schema::dropIfExists('products');
        }
    }

    public function test_tax_rate_delete_is_blocked_when_tax_group_uses_it(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');
        $taxRate = TaxRate::factory()->for($business)->create();
        $taxGroup = TaxGroup::factory()->for($business)->create();

        DB::table('tax_group_items')->insert([
            'id' => (string) Str::uuid(),
            'tax_group_id' => $taxGroup->id,
            'tax_rate_id' => $taxRate->id,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->deleteJson("/api/v1/tax-rates/{$taxRate->id}");

        $response
            ->assertStatus(422)
            ->assertJsonPath('message', 'Tax rate cannot be deleted because it is still used by tax groups.');
    }
}
