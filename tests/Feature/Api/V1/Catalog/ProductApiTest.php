<?php

namespace Tests\Feature\Api\V1\Catalog;

use App\Models\Brand;
use App\Models\Business;
use App\Models\Category;
use App\Models\PriceGroup;
use App\Models\Product;
use App\Models\TaxRate;
use App\Models\Unit;
use App\Models\User;
use App\Models\VariationTemplate;
use App\Models\VariationValue;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProductApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_admin_can_create_single_product(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');
        $category = Category::factory()->create(['business_id' => $business->id]);
        $brand = Brand::factory()->create(['business_id' => $business->id]);
        $unit = Unit::factory()->create(['business_id' => $business->id]);
        $taxRate = TaxRate::factory()->create(['business_id' => $business->id]);
        $priceGroup = PriceGroup::factory()->create(['business_id' => $business->id]);

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/products', [
            'category_id' => $category->id,
            'brand_id' => $brand->id,
            'unit_id' => $unit->id,
            'tax_rate_id' => $taxRate->id,
            'price_group_id' => $priceGroup->id,
            'name' => 'Sparkling Water',
            'sku' => 'SPARK-001',
            'barcode_type' => 'C128',
            'type' => 'single',
            'stock_tracking' => 'none',
            'selling_price' => 12.5,
            'purchase_price' => 8.5,
            'tax_type' => 'exclusive',
            'track_inventory' => true,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.name', 'Sparkling Water')
            ->assertJsonPath('data.type', 'single')
            ->assertJsonPath('data.track_inventory', true);
    }

    public function test_admin_can_create_variable_product_with_variations(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');
        $category = Category::factory()->create(['business_id' => $business->id]);
        $unit = Unit::factory()->create(['business_id' => $business->id]);
        $template = VariationTemplate::factory()->create(['business_id' => $business->id]);
        $small = VariationValue::factory()->create([
            'business_id' => $business->id,
            'variation_template_id' => $template->id,
            'name' => 'Small',
        ]);
        $large = VariationValue::factory()->create([
            'business_id' => $business->id,
            'variation_template_id' => $template->id,
            'name' => 'Large',
        ]);

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/products', [
            'category_id' => $category->id,
            'unit_id' => $unit->id,
            'name' => 'Coffee',
            'sku' => 'COFFEE-BASE',
            'barcode_type' => 'C128',
            'type' => 'variable',
            'variation_template_id' => $template->id,
            'variation_template_ids' => [$template->id],
            'stock_tracking' => 'none',
            'selling_price' => 2,
            'purchase_price' => 1,
            'tax_type' => 'exclusive',
            'track_inventory' => true,
            'variations' => [
                [
                    'name' => 'Coffee Small',
                    'variation_value_ids' => [$small->id],
                    'sku' => 'COFFEE-S',
                    'selling_price' => 2,
                    'purchase_price' => 1,
                    'is_active' => true,
                ],
                [
                    'name' => 'Coffee Large',
                    'variation_value_ids' => [$large->id],
                    'sku' => 'COFFEE-L',
                    'selling_price' => 3,
                    'purchase_price' => 1.5,
                    'is_active' => true,
                ],
            ],
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.type', 'variable')
            ->assertJsonCount(2, 'data.variations');
    }

    public function test_combo_product_forces_non_tracked_inventory(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');
        $unit = Unit::factory()->create(['business_id' => $business->id]);
        $childProduct = Product::factory()->create([
            'business_id' => $business->id,
            'unit_id' => $unit->id,
            'type' => 'single',
            'track_inventory' => true,
            'stock_tracking' => 'none',
        ]);

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/products', [
            'name' => 'Lunch Combo',
            'sku' => 'COMBO-001',
            'unit_id' => $unit->id,
            'barcode_type' => 'C128',
            'type' => 'combo',
            'stock_tracking' => 'serial',
            'selling_price' => 10,
            'purchase_price' => 7,
            'tax_type' => 'exclusive',
            'track_inventory' => true,
            'combo_items' => [
                [
                    'child_product_id' => $childProduct->id,
                    'quantity' => 1,
                ],
            ],
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.type', 'combo')
            ->assertJsonPath('data.track_inventory', false)
            ->assertJsonPath('data.stock_tracking', 'none');
    }

    public function test_index_does_not_require_status_filter(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');

        Product::factory()->create([
            'business_id' => $business->id,
            'name' => 'Visible Product',
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/products');

        $response
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonFragment(['name' => 'Visible Product']);
    }

    public function test_soft_deleted_product_sku_can_be_reused(): void
    {
        $business = Business::factory()->create();
        $admin = User::factory()->for($business)->create();
        $admin->assignRole('admin');
        $unit = Unit::factory()->create(['business_id' => $business->id]);

        Sanctum::actingAs($admin);

        $createResponse = $this->postJson('/api/v1/products', [
            'unit_id' => $unit->id,
            'name' => 'Reusable SKU Product',
            'sku' => 'REUSE-001',
            'barcode_type' => 'C128',
            'type' => 'single',
            'stock_tracking' => 'none',
            'selling_price' => 25,
            'purchase_price' => 10,
            'tax_type' => 'exclusive',
            'track_inventory' => true,
        ]);

        $productId = $createResponse->json('data.id');

        $this->deleteJson("/api/v1/products/{$productId}")
            ->assertOk();

        $this->postJson('/api/v1/products', [
            'unit_id' => $unit->id,
            'name' => 'Reusable SKU Product Again',
            'sku' => 'REUSE-001',
            'barcode_type' => 'C128',
            'type' => 'single',
            'stock_tracking' => 'none',
            'selling_price' => 30,
            'purchase_price' => 12,
            'tax_type' => 'exclusive',
            'track_inventory' => true,
        ])->assertCreated();
    }
}
