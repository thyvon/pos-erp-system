<?php

namespace Tests\Feature\Api\V1\Reports;

use App\Models\Branch;
use App\Models\Business;
use App\Models\BusinessModule;
use App\Models\Category;
use App\Models\Product;
use App\Models\StockLevel;
use App\Models\StockLot;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StockReportApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_stock_report_returns_filtered_rows_summary_and_lot_breakdown(): void
    {
        $business = Business::factory()->create();
        $branch = Branch::factory()->for($business)->create(['name' => 'Central']);
        $warehouse = Warehouse::factory()->forBranch($branch)->create(['name' => 'Main Warehouse']);
        $unit = Unit::factory()->for($business)->create();
        $category = Category::factory()->for($business)->create(['name' => 'Medicine']);
        $otherCategory = Category::factory()->for($business)->create(['name' => 'Snacks']);
        $user = $this->reportUser($business, [$branch->id]);
        $lotProduct = Product::factory()->create([
            'business_id' => $business->id,
            'category_id' => $category->id,
            'unit_id' => $unit->id,
            'name' => 'Tracked Syrup',
            'sku' => 'MED-001',
            'stock_tracking' => 'lot',
            'track_inventory' => true,
            'alert_quantity' => 5,
        ]);
        $otherProduct = Product::factory()->create([
            'business_id' => $business->id,
            'category_id' => $otherCategory->id,
            'unit_id' => $unit->id,
            'name' => 'Hidden Chips',
            'sku' => 'SNK-001',
            'stock_tracking' => 'none',
            'track_inventory' => true,
            'alert_quantity' => 3,
        ]);

        $this->stockLevel($business, $warehouse, $lotProduct, [
            'quantity' => 12,
            'reserved_quantity' => 2,
        ]);
        $this->stockLevel($business, $warehouse, $otherProduct, [
            'quantity' => 9,
            'reserved_quantity' => 1,
        ]);
        $this->stockLot($business, $warehouse, $lotProduct, [
            'lot_number' => 'LOT-A',
            'qty_on_hand' => 7,
            'qty_reserved' => 1,
            'expiry_date' => '2026-12-31',
        ]);
        $this->stockLot($business, $warehouse, $lotProduct, [
            'lot_number' => 'LOT-B',
            'qty_on_hand' => 5,
            'qty_reserved' => 1,
            'expiry_date' => '2027-01-15',
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson("/api/v1/reports/stock?category_id={$category->id}&include_lots=1");

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.summary.count', 1)
            ->assertJsonPath('data.summary.on_hand_quantity', '12.0000')
            ->assertJsonPath('data.summary.reserved_quantity', '2.0000')
            ->assertJsonPath('data.summary.available_quantity', '10.0000')
            ->assertJsonPath('data.rows.0.product.name', 'Tracked Syrup')
            ->assertJsonPath('data.rows.0.lots.0.lot_number', 'LOT-A')
            ->assertJsonPath('data.rows.0.lots.1.lot_number', 'LOT-B')
            ->assertJsonMissing(['name' => 'Hidden Chips']);
    }

    public function test_stock_report_filters_low_stock_mode(): void
    {
        $business = Business::factory()->create();
        $branch = Branch::factory()->for($business)->create();
        $warehouse = Warehouse::factory()->forBranch($branch)->create();
        $unit = Unit::factory()->for($business)->create();
        $user = $this->reportUser($business, [$branch->id]);
        $lowProduct = Product::factory()->create([
            'business_id' => $business->id,
            'unit_id' => $unit->id,
            'name' => 'Low Stock Item',
            'track_inventory' => true,
            'alert_quantity' => 10,
        ]);
        $okProduct = Product::factory()->create([
            'business_id' => $business->id,
            'unit_id' => $unit->id,
            'name' => 'Healthy Stock Item',
            'track_inventory' => true,
            'alert_quantity' => 10,
        ]);

        $this->stockLevel($business, $warehouse, $lowProduct, [
            'quantity' => 7,
            'reserved_quantity' => 1,
        ]);
        $this->stockLevel($business, $warehouse, $okProduct, [
            'quantity' => 20,
            'reserved_quantity' => 0,
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/reports/stock?mode=low');

        $response
            ->assertOk()
            ->assertJsonPath('data.summary.count', 1)
            ->assertJsonPath('data.summary.low_stock_count', 1)
            ->assertJsonFragment(['name' => 'Low Stock Item'])
            ->assertJsonMissing(['name' => 'Healthy Stock Item']);
    }

    public function test_branch_scoped_user_only_sees_allowed_branch_stock_in_report(): void
    {
        $business = Business::factory()->create();
        $branchA = Branch::factory()->for($business)->create();
        $branchB = Branch::factory()->for($business)->create();
        $warehouseA = Warehouse::factory()->forBranch($branchA)->create();
        $warehouseB = Warehouse::factory()->forBranch($branchB)->create();
        $unit = Unit::factory()->for($business)->create();
        $productA = Product::factory()->create([
            'business_id' => $business->id,
            'unit_id' => $unit->id,
            'name' => 'Visible Stock',
            'track_inventory' => true,
        ]);
        $productB = Product::factory()->create([
            'business_id' => $business->id,
            'unit_id' => $unit->id,
            'name' => 'Hidden Stock',
            'track_inventory' => true,
        ]);
        $user = $this->reportUser($business, [$branchA->id]);

        $this->stockLevel($business, $warehouseA, $productA, ['quantity' => 4]);
        $this->stockLevel($business, $warehouseB, $productB, ['quantity' => 40]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/reports/stock');

        $response
            ->assertOk()
            ->assertJsonPath('data.summary.count', 1)
            ->assertJsonPath('data.summary.on_hand_quantity', '4.0000')
            ->assertJsonFragment(['name' => 'Visible Stock'])
            ->assertJsonMissing(['name' => 'Hidden Stock']);
    }

    public function test_stock_report_requires_reports_module(): void
    {
        $business = Business::factory()->create();
        $branch = Branch::factory()->for($business)->create();
        $user = User::factory()->for($business)->create();
        $user->assignRole('manager');
        $user->branches()->attach($branch->id);

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/reports/stock')
            ->assertStatus(403)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'The Reports module is not enabled for this business.');
    }

    protected function reportUser(Business $business, array $branchIds): User
    {
        BusinessModule::query()->create([
            'business_id' => $business->id,
            'module_key' => 'reports',
            'status' => 'active',
        ]);

        $user = User::factory()->for($business)->create();
        $user->assignRole('manager');
        $user->branches()->sync($branchIds);

        return $user;
    }

    protected function stockLevel(Business $business, Warehouse $warehouse, Product $product, array $attributes = []): StockLevel
    {
        return StockLevel::withoutGlobalScopes()->create(array_merge([
            'business_id' => $business->id,
            'product_id' => $product->id,
            'variation_id' => null,
            'warehouse_id' => $warehouse->id,
            'quantity' => 0,
            'reserved_quantity' => 0,
        ], $attributes));
    }

    protected function stockLot(Business $business, Warehouse $warehouse, Product $product, array $attributes = []): StockLot
    {
        return StockLot::withoutGlobalScopes()->create(array_merge([
            'business_id' => $business->id,
            'product_id' => $product->id,
            'variation_id' => null,
            'warehouse_id' => $warehouse->id,
            'lot_number' => fake()->unique()->bothify('LOT-####'),
            'unit_cost' => 1,
            'qty_received' => 0,
            'qty_on_hand' => 0,
            'qty_reserved' => 0,
            'status' => 'active',
        ], $attributes));
    }
}
