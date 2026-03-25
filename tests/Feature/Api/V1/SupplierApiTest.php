<?php

namespace Tests\Feature\Api\V1;

use App\Models\Business;
use App\Models\Supplier;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SupplierApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_admin_can_create_supplier_with_generated_code_and_custom_fields(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');

        DB::table('custom_field_definitions')->insert([
            'id' => (string) Str::uuid(),
            'business_id' => $business->id,
            'module' => 'supplier',
            'field_name' => 'payment_method',
            'field_label' => 'Payment Method',
            'field_type' => 'text',
            'options' => null,
            'is_required' => false,
            'sort_order' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/suppliers', [
            'name' => 'Global Vendor',
            'company' => 'Global Vendor Co',
            'email' => 'vendor@example.com',
            'phone' => '012345678',
            'pay_term' => 30,
            'opening_balance' => 125.5,
            'custom_fields' => [
                'payment_method' => 'bank-transfer',
            ],
            'documents' => [
                'https://example.com/docs/vendor-profile.pdf',
            ],
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.code', 'SUPP-00001')
            ->assertJsonPath('data.name', 'Global Vendor')
            ->assertJsonPath('data.custom_fields.payment_method', 'bank-transfer')
            ->assertJsonPath('data.documents.0', 'https://example.com/docs/vendor-profile.pdf');
    }

    public function test_manager_can_create_supplier(): void
    {
        $business = Business::factory()->create();
        $manager = User::factory()->for($business)->create();
        $manager->assignRole('manager');

        Sanctum::actingAs($manager);

        $response = $this->postJson('/api/v1/suppliers', [
            'name' => 'Manager Supplier',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.name', 'Manager Supplier');
    }

    public function test_inventory_manager_can_create_supplier(): void
    {
        $business = Business::factory()->create();
        $inventoryManager = User::factory()->for($business)->create();
        $inventoryManager->assignRole('inventory_manager');

        Sanctum::actingAs($inventoryManager);

        $response = $this->postJson('/api/v1/suppliers', [
            'name' => 'Warehouse Vendor',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.name', 'Warehouse Vendor');
    }

    public function test_search_returns_matching_supplier_for_current_business_only(): void
    {
        $business = Business::factory()->create();
        $otherBusiness = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');

        Supplier::factory()->for($business)->create([
            'name' => 'Target Supplier',
            'phone' => '012345678',
        ]);

        Supplier::withoutGlobalScopes()->create([
            'business_id' => $otherBusiness->id,
            'code' => 'SUPP-90001',
            'name' => 'Hidden Supplier',
            'company' => 'Other Business Co',
            'email' => 'hidden@example.com',
            'phone' => '012345678',
            'mobile' => '099999999',
            'tax_id' => 'TAX-HIDDEN',
            'address' => ['line1' => 'Other'],
            'pay_term' => 0,
            'opening_balance' => 0,
            'status' => 'active',
            'custom_fields' => [],
            'documents' => [],
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/suppliers?search=012345678');

        $response
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonFragment(['name' => 'Target Supplier'])
            ->assertJsonMissing(['name' => 'Hidden Supplier']);
    }

    public function test_unknown_supplier_custom_field_is_rejected(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/suppliers', [
            'name' => 'Invalid Supplier',
            'custom_fields' => [
                'undefined_key' => 'value',
            ],
        ]);

        $response
            ->assertStatus(422)
            ->assertJsonPath('message', 'Custom field undefined_key is not defined for suppliers.');
    }

    public function test_manager_cannot_delete_supplier(): void
    {
        $business = Business::factory()->create();
        $manager = User::factory()->for($business)->create();
        $manager->assignRole('manager');
        $supplier = Supplier::factory()->for($business)->create();

        Sanctum::actingAs($manager);

        $response = $this->deleteJson("/api/v1/suppliers/{$supplier->id}");

        $response->assertForbidden();
    }
}
