<?php

namespace Tests\Feature\Api\V1\Inventory;

use App\Models\Branch;
use App\Models\Business;
use App\Models\Product;
use App\Models\StockCount;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StockCountApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_branch_scoped_inventory_manager_can_start_count_only_in_allowed_branch(): void
    {
        $business = Business::factory()->create();
        $branchA = Branch::factory()->create(['business_id' => $business->id]);
        $branchB = Branch::factory()->create(['business_id' => $business->id]);
        $warehouseA = Warehouse::factory()->forBranch($branchA)->create();
        $warehouseB = Warehouse::factory()->forBranch($branchB)->create();
        $unit = Unit::factory()->create(['business_id' => $business->id]);
        $product = Product::factory()->create([
            'business_id' => $business->id,
            'unit_id' => $unit->id,
            'track_inventory' => true,
        ]);
        $user = User::factory()->for($business)->create();
        $user->assignRole('inventory_manager');
        $user->branches()->attach($branchA->id);

        Sanctum::actingAs($user);

        $this->postJson('/api/v1/inventory/counts', [
            'warehouse_id' => $warehouseA->id,
            'date' => now()->toDateString(),
        ])->assertCreated();

        $this->postJson('/api/v1/inventory/counts', [
            'warehouse_id' => $warehouseB->id,
            'date' => now()->toDateString(),
        ])->assertForbidden();
    }

    public function test_live_count_entries_accumulate_and_completion_creates_stock_count_correction_movement(): void
    {
        $business = Business::factory()->create();
        $branch = Branch::factory()->create(['business_id' => $business->id]);
        $warehouse = Warehouse::factory()->forBranch($branch)->create();
        $unit = Unit::factory()->create(['business_id' => $business->id]);
        $product = Product::factory()->create([
            'business_id' => $business->id,
            'unit_id' => $unit->id,
            'track_inventory' => true,
        ]);
        $user = User::factory()->for($business)->create();
        $user->assignRole('inventory_manager');
        $user->branches()->attach($branch->id);

        Sanctum::actingAs($user);

        $this->postJson('/api/v1/inventory/adjustments', [
            'warehouse_id' => $warehouse->id,
            'date' => now()->toDateString(),
            'reason' => 'Seed stock',
            'items' => [[
                'product_id' => $product->id,
                'direction' => 'in',
                'quantity' => 10,
                'unit_cost' => 2,
            ]],
        ])->assertCreated();

        $createCount = $this->postJson('/api/v1/inventory/counts', [
            'warehouse_id' => $warehouse->id,
            'date' => now()->toDateString(),
        ])->assertCreated();

        $countId = $createCount->json('data.id');

        $this->postJson("/api/v1/inventory/counts/{$countId}/entries", [
            'product_id' => $product->id,
            'quantity' => 5,
            'unit_cost' => 2,
        ])->assertOk();

        $entryResponse = $this->postJson("/api/v1/inventory/counts/{$countId}/entries", [
            'product_id' => $product->id,
            'quantity' => 3,
            'unit_cost' => 2,
        ])->assertOk();

        $entryResponse
            ->assertJsonPath('data.items.0.counted_quantity', '8.0000')
            ->assertJsonCount(1, 'data.items');

        $entriesResponse = $this->getJson("/api/v1/inventory/counts/{$countId}/entries")
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.quantity', '3.0000')
            ->assertJsonPath('data.1.quantity', '5.0000');

        $entryId = $entriesResponse->json('data.0.id');

        $this->putJson("/api/v1/inventory/counts/{$countId}/entries/{$entryId}", [
            'quantity' => 6,
        ])->assertOk()
            ->assertJsonPath('data.items.0.counted_quantity', '11.0000')
            ->assertJsonPath('data.items.0.difference', '1.0000');

        $this->getJson("/api/v1/inventory/counts/{$countId}/entries")
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.quantity', '6.0000')
            ->assertJsonPath('data.1.quantity', '5.0000');

        $completeResponse = $this->postJson("/api/v1/inventory/counts/{$countId}/complete", [])
            ->assertOk();

        $completeResponse
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.discrepancy_count', 1);

        $this->assertDatabaseHas('stock_counts', [
            'id' => $countId,
            'status' => 'completed',
        ]);

        $this->assertDatabaseHas('stock_movements', [
            'reference_type' => StockCount::class,
            'reference_id' => $countId,
            'type' => 'stock_count_correction',
            'quantity' => '1.0000',
        ]);
    }

    public function test_count_start_auto_creates_unique_items_from_current_stock_levels(): void
    {
        $business = Business::factory()->create();
        $branch = Branch::factory()->create(['business_id' => $business->id]);
        $warehouse = Warehouse::factory()->forBranch($branch)->create();
        $unit = Unit::factory()->create(['business_id' => $business->id]);
        $product = Product::factory()->create([
            'business_id' => $business->id,
            'unit_id' => $unit->id,
            'track_inventory' => true,
        ]);
        $user = User::factory()->for($business)->create();
        $user->assignRole('inventory_manager');
        $user->branches()->attach($branch->id);

        Sanctum::actingAs($user);

        $this->postJson('/api/v1/inventory/adjustments', [
            'warehouse_id' => $warehouse->id,
            'date' => now()->toDateString(),
            'reason' => 'Seed stock',
            'items' => [[
                'product_id' => $product->id,
                'direction' => 'in',
                'quantity' => 10,
                'unit_cost' => 2,
            ]],
        ])->assertCreated();

        $createCount = $this->postJson('/api/v1/inventory/counts', [
            'warehouse_id' => $warehouse->id,
            'date' => now()->toDateString(),
        ])->assertCreated();

        $createCount
            ->assertJsonCount(1, 'data.items')
            ->assertJsonPath('data.items.0.product_id', $product->id)
            ->assertJsonPath('data.items.0.system_quantity', '10.0000')
            ->assertJsonPath('data.items.0.ending_balance', '10.0000')
            ->assertJsonPath('data.items.0.counted_quantity', null);
    }

    public function test_live_count_item_can_be_edited_to_a_new_total(): void
    {
        $business = Business::factory()->create();
        $branch = Branch::factory()->create(['business_id' => $business->id]);
        $warehouse = Warehouse::factory()->forBranch($branch)->create();
        $unit = Unit::factory()->create(['business_id' => $business->id]);
        $product = Product::factory()->create([
            'business_id' => $business->id,
            'unit_id' => $unit->id,
            'track_inventory' => true,
        ]);
        $user = User::factory()->for($business)->create();
        $user->assignRole('inventory_manager');
        $user->branches()->attach($branch->id);

        Sanctum::actingAs($user);

        $createCount = $this->postJson('/api/v1/inventory/counts', [
            'warehouse_id' => $warehouse->id,
            'date' => now()->toDateString(),
        ])->assertCreated();

        $countId = $createCount->json('data.id');

        $entryResponse = $this->postJson("/api/v1/inventory/counts/{$countId}/entries", [
            'product_id' => $product->id,
            'quantity' => 5,
            'unit_cost' => 2,
        ])->assertOk();

        $itemId = $entryResponse->json('data.items.0.id');

        $updateResponse = $this->postJson("/api/v1/inventory/counts/{$countId}/items/{$itemId}", [
            'counted_quantity' => 9,
        ])->assertOk();

        $updateResponse->assertJsonPath('data.items.0.counted_quantity', '9.0000');

        $this->assertDatabaseHas('stock_count_items', [
            'id' => $itemId,
            'counted_quantity' => '9.0000',
        ]);

        $this->assertDatabaseHas('stock_count_entries', [
            'stock_count_id' => $countId,
            'stock_count_item_id' => $itemId,
            'quantity' => '4.0000',
        ]);
    }

    public function test_live_count_item_can_be_removed_while_count_is_in_progress(): void
    {
        $business = Business::factory()->create();
        $branch = Branch::factory()->create(['business_id' => $business->id]);
        $warehouse = Warehouse::factory()->forBranch($branch)->create();
        $unit = Unit::factory()->create(['business_id' => $business->id]);
        $product = Product::factory()->create([
            'business_id' => $business->id,
            'unit_id' => $unit->id,
            'track_inventory' => true,
        ]);
        $user = User::factory()->for($business)->create();
        $user->assignRole('inventory_manager');
        $user->branches()->attach($branch->id);

        Sanctum::actingAs($user);

        $createCount = $this->postJson('/api/v1/inventory/counts', [
            'warehouse_id' => $warehouse->id,
            'date' => now()->toDateString(),
        ])->assertCreated();

        $countId = $createCount->json('data.id');

        $entryResponse = $this->postJson("/api/v1/inventory/counts/{$countId}/entries", [
            'product_id' => $product->id,
            'quantity' => 5,
            'unit_cost' => 2,
        ])->assertOk();

        $itemId = $entryResponse->json('data.items.0.id');

        $this->deleteJson("/api/v1/inventory/counts/{$countId}/items/{$itemId}")
            ->assertOk()
            ->assertJsonPath('data.id', $countId);

        $this->assertDatabaseMissing('stock_count_items', [
            'id' => $itemId,
        ]);

        $this->assertDatabaseMissing('stock_count_entries', [
            'stock_count_item_id' => $itemId,
        ]);
    }

    public function test_seeded_count_items_do_not_zero_out_stock_until_a_quantity_is_recorded(): void
    {
        $business = Business::factory()->create();
        $branch = Branch::factory()->create(['business_id' => $business->id]);
        $warehouse = Warehouse::factory()->forBranch($branch)->create();
        $unit = Unit::factory()->create(['business_id' => $business->id]);
        $product = Product::factory()->create([
            'business_id' => $business->id,
            'unit_id' => $unit->id,
            'track_inventory' => true,
        ]);
        $user = User::factory()->for($business)->create();
        $user->assignRole('inventory_manager');
        $user->branches()->attach($branch->id);

        Sanctum::actingAs($user);

        $this->postJson('/api/v1/inventory/adjustments', [
            'warehouse_id' => $warehouse->id,
            'date' => now()->toDateString(),
            'reason' => 'Seed stock',
            'items' => [[
                'product_id' => $product->id,
                'direction' => 'in',
                'quantity' => 10,
                'unit_cost' => 2,
            ]],
        ])->assertCreated();

        $createCount = $this->postJson('/api/v1/inventory/counts', [
            'warehouse_id' => $warehouse->id,
            'date' => now()->toDateString(),
            'items' => [[
                'product_id' => $product->id,
                'unit_cost' => 2,
            ]],
        ])->assertCreated();

        $countId = $createCount->json('data.id');

        $this->postJson("/api/v1/inventory/counts/{$countId}/complete", [])
            ->assertOk()
            ->assertJsonPath('data.discrepancy_count', 0);

        $this->assertDatabaseMissing('stock_movements', [
            'reference_type' => StockCount::class,
            'reference_id' => $countId,
            'type' => 'stock_count_correction',
        ]);

        $this->assertDatabaseHas('stock_levels', [
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'quantity' => '10.0000',
        ]);
    }

    public function test_seeded_count_item_can_be_marked_as_zero_counted_quantity(): void
    {
        $business = Business::factory()->create();
        $branch = Branch::factory()->create(['business_id' => $business->id]);
        $warehouse = Warehouse::factory()->forBranch($branch)->create();
        $unit = Unit::factory()->create(['business_id' => $business->id]);
        $product = Product::factory()->create([
            'business_id' => $business->id,
            'unit_id' => $unit->id,
            'track_inventory' => true,
        ]);
        $user = User::factory()->for($business)->create();
        $user->assignRole('inventory_manager');
        $user->branches()->attach($branch->id);

        Sanctum::actingAs($user);

        $this->postJson('/api/v1/inventory/adjustments', [
            'warehouse_id' => $warehouse->id,
            'date' => now()->toDateString(),
            'reason' => 'Seed stock',
            'items' => [[
                'product_id' => $product->id,
                'direction' => 'in',
                'quantity' => 10,
                'unit_cost' => 2,
            ]],
        ])->assertCreated();

        $createCount = $this->postJson('/api/v1/inventory/counts', [
            'warehouse_id' => $warehouse->id,
            'date' => now()->toDateString(),
            'items' => [[
                'product_id' => $product->id,
                'unit_cost' => 2,
            ]],
        ])->assertCreated();

        $countId = $createCount->json('data.id');
        $itemId = $createCount->json('data.items.0.id');

        $this->postJson("/api/v1/inventory/counts/{$countId}/entries", [
            'product_id' => $product->id,
            'quantity' => 0,
            'unit_cost' => 2,
        ])->assertOk()
            ->assertJsonPath('data.items.0.counted_quantity', '0.0000')
            ->assertJsonPath('data.items.0.difference', '-10.0000');

        $this->assertDatabaseHas('stock_count_entries', [
            'stock_count_id' => $countId,
            'stock_count_item_id' => $itemId,
            'quantity' => '0.0000',
        ]);

        $this->postJson("/api/v1/inventory/counts/{$countId}/complete", [])
            ->assertOk()
            ->assertJsonPath('data.discrepancy_count', 1);

        $this->assertDatabaseHas('stock_levels', [
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'quantity' => '0.0000',
        ]);

        $this->assertDatabaseHas('stock_movements', [
            'reference_type' => StockCount::class,
            'reference_id' => $countId,
            'type' => 'stock_count_correction',
            'quantity' => '10.0000',
        ]);
    }

    public function test_completed_count_item_can_be_corrected_and_posts_only_the_delta(): void
    {
        $business = Business::factory()->create();
        $branch = Branch::factory()->create(['business_id' => $business->id]);
        $warehouse = Warehouse::factory()->forBranch($branch)->create();
        $unit = Unit::factory()->create(['business_id' => $business->id]);
        $product = Product::factory()->create([
            'business_id' => $business->id,
            'unit_id' => $unit->id,
            'track_inventory' => true,
        ]);
        $user = User::factory()->for($business)->create();
        $user->assignRole('inventory_manager');
        $user->branches()->attach($branch->id);

        Sanctum::actingAs($user);

        $this->postJson('/api/v1/inventory/adjustments', [
            'warehouse_id' => $warehouse->id,
            'date' => now()->toDateString(),
            'reason' => 'Seed stock',
            'items' => [[
                'product_id' => $product->id,
                'direction' => 'in',
                'quantity' => 10,
                'unit_cost' => 2,
            ]],
        ])->assertCreated();

        $createCount = $this->postJson('/api/v1/inventory/counts', [
            'warehouse_id' => $warehouse->id,
            'date' => now()->toDateString(),
        ])->assertCreated();

        $countId = $createCount->json('data.id');

        $entryResponse = $this->postJson("/api/v1/inventory/counts/{$countId}/entries", [
            'product_id' => $product->id,
            'quantity' => 8,
            'unit_cost' => 2,
        ])->assertOk();

        $itemId = $entryResponse->json('data.items.0.id');

        $this->postJson("/api/v1/inventory/counts/{$countId}/complete", [])
            ->assertOk()
            ->assertJsonPath('data.status', 'completed');

        $updateResponse = $this->postJson("/api/v1/inventory/counts/{$countId}/items/{$itemId}", [
            'counted_quantity' => 9,
        ])->assertOk();

        $updateResponse->assertJsonPath('data.items.0.counted_quantity', '9.0000');

        $this->assertDatabaseHas('stock_levels', [
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'quantity' => '9.0000',
        ]);

        $this->assertDatabaseHas('stock_movements', [
            'reference_type' => StockCount::class,
            'reference_id' => $countId,
            'type' => 'stock_count_correction',
            'quantity' => '1.0000',
            'notes' => 'Stock count post-completion correction',
        ]);
    }
}
