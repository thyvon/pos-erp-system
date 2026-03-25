<?php

namespace Tests\Feature\Api\V1;

use App\Models\Business;
use App\Models\Customer;
use App\Models\CustomerGroup;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CustomerApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_admin_can_create_customer_with_generated_code_and_custom_fields(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');
        $group = CustomerGroup::factory()->for($business)->create();

        DB::table('custom_field_definitions')->insert([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'business_id' => $business->id,
            'module' => 'customer',
            'field_name' => 'loyalty_tier',
            'field_label' => 'Loyalty Tier',
            'field_type' => 'text',
            'options' => null,
            'is_required' => false,
            'sort_order' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/customers', [
            'customer_group_id' => $group->id,
            'name' => 'Alice Retail',
            'type' => 'individual',
            'email' => 'alice@example.com',
            'phone' => '012345678',
            'mobile' => '098765432',
            'credit_limit' => 150,
            'custom_fields' => [
                'loyalty_tier' => 'gold',
            ],
            'documents' => [
                'https://example.com/docs/alice-id.pdf',
            ],
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.code', 'CUST-00001')
            ->assertJsonPath('data.customer_group.name', $group->name)
            ->assertJsonPath('data.custom_fields.loyalty_tier', 'gold')
            ->assertJsonPath('data.documents.0', 'https://example.com/docs/alice-id.pdf');
    }

    public function test_manager_can_create_customer(): void
    {
        $business = Business::factory()->create();
        $manager = User::factory()->for($business)->create();
        $manager->assignRole('manager');

        Sanctum::actingAs($manager);

        $response = $this->postJson('/api/v1/customers', [
            'name' => 'Beta Co',
            'type' => 'company',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.name', 'Beta Co');
    }

    public function test_search_returns_matching_customer(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');

        Customer::factory()->for($business)->create([
            'name' => 'Target Customer',
            'phone' => '012345678',
        ]);

        Customer::factory()->for($business)->create([
            'name' => 'Other Customer',
            'phone' => '099999999',
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/customers?search=012345678');

        $response
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonFragment(['name' => 'Target Customer'])
            ->assertJsonMissing(['name' => 'Other Customer']);
    }

    public function test_update_logs_credit_limit_change(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');
        $customer = Customer::factory()->for($business)->create([
            'credit_limit' => 100,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->putJson("/api/v1/customers/{$customer->id}", [
            'credit_limit' => 250,
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.credit_limit', 250);

        $auditLog = DB::table('audit_logs')
            ->where('event', 'credit_limit_changed')
            ->where('auditable_id', $customer->id)
            ->latest('created_at')
            ->first();

        $this->assertNotNull($auditLog);
        $this->assertSame($admin->id, $auditLog->user_id);
    }

    public function test_customer_group_from_other_business_is_rejected(): void
    {
        $business = Business::factory()->create();
        $otherBusiness = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');
        $otherGroup = CustomerGroup::factory()->for($otherBusiness)->create();

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/customers', [
            'name' => 'Cross Tenant',
            'type' => 'individual',
            'customer_group_id' => $otherGroup->id,
        ]);

        $response->assertStatus(422);
    }

    public function test_unknown_custom_field_is_rejected(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/customers', [
            'name' => 'Invalid Custom Field',
            'type' => 'individual',
            'custom_fields' => [
                'undefined_key' => 'value',
            ],
        ]);

        $response
            ->assertStatus(422)
            ->assertJsonPath('message', 'Custom field undefined_key is not defined for customers.');
    }
}
