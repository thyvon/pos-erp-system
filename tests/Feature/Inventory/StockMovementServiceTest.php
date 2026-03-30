<?php

namespace Tests\Feature\Inventory;

use App\Exceptions\Domain\DomainException;
use App\Models\Branch;
use App\Models\Business;
use App\Models\Product;
use App\Models\ProductVariation;
use App\Models\StockLevel;
use App\Models\StockMovement;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use App\Services\Inventory\StockMovementService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StockMovementServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_opening_stock_creates_movement_and_increases_stock_level(): void
    {
        [$business, $user, $warehouse, $product] = $this->makeInventoryContext();

        $movement = app(StockMovementService::class)->record($business->id, [
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'type' => 'opening_stock',
            'quantity' => 24,
            'unit_cost' => 1.75,
            'reference_type' => 'manual_seed',
            'reference_id' => (string) fake()->uuid(),
        ], $user);

        $this->assertInstanceOf(StockMovement::class, $movement);
        $this->assertSame('opening_stock', $movement->type);
        $this->assertSame('24.0000', $movement->quantity);

        $level = StockLevel::query()->firstOrFail();

        $this->assertSame($product->id, $level->product_id);
        $this->assertSame($warehouse->id, $level->warehouse_id);
        $this->assertSame('24.0000', $level->quantity);
        $this->assertSame('0.0000', $level->reserved_quantity);
    }

    public function test_reserved_stock_can_be_released_and_consumed_on_completion(): void
    {
        [$business, $user, $warehouse, $product] = $this->makeInventoryContext();
        $service = app(StockMovementService::class);

        $service->record($business->id, [
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'type' => 'opening_stock',
            'quantity' => 10,
        ], $user);

        $service->reserve($business->id, [
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'quantity' => 4,
        ]);

        $service->release($business->id, [
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'quantity' => 1,
        ]);

        $movement = $service->consumeReserved($business->id, [
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'type' => 'sale',
            'quantity' => 2,
        ], $user);

        $level = StockLevel::query()->firstOrFail();

        $this->assertSame('sale', $movement->type);
        $this->assertSame('8.0000', $level->quantity);
        $this->assertSame('1.0000', $level->reserved_quantity);
    }

    public function test_outbound_movement_is_blocked_when_negative_stock_is_not_allowed(): void
    {
        [$business, $user, $warehouse, $product] = $this->makeInventoryContext(false);

        $this->expectException(DomainException::class);
        $this->expectExceptionMessage('does not allow negative stock');

        app(StockMovementService::class)->record($business->id, [
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'type' => 'sale',
            'quantity' => 1,
        ], $user);
    }

    public function test_variation_stock_is_tracked_separately_from_parent_product(): void
    {
        [$business, $user, $warehouse, $product] = $this->makeInventoryContext();
        $variation = ProductVariation::factory()->create([
            'business_id' => $business->id,
            'product_id' => $product->id,
        ]);
        $service = app(StockMovementService::class);

        $service->record($business->id, [
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'type' => 'opening_stock',
            'quantity' => 50,
        ], $user);

        $service->record($business->id, [
            'product_id' => $product->id,
            'variation_id' => $variation->id,
            'warehouse_id' => $warehouse->id,
            'type' => 'opening_stock',
            'quantity' => 12,
        ], $user);

        $parentLevel = StockLevel::query()
            ->where('product_id', $product->id)
            ->whereNull('variation_id')
            ->firstOrFail();

        $variationLevel = StockLevel::query()
            ->where('product_id', $product->id)
            ->where('variation_id', $variation->id)
            ->firstOrFail();

        $this->assertSame('50.0000', $parentLevel->quantity);
        $this->assertSame('12.0000', $variationLevel->quantity);
    }

    protected function makeInventoryContext(bool $allowNegativeStock = false): array
    {
        $business = Business::factory()->create();
        $branch = Branch::factory()->create([
            'business_id' => $business->id,
        ]);
        $user = User::factory()->for($business)->create();
        $unit = Unit::factory()->create([
            'business_id' => $business->id,
        ]);
        $warehouse = Warehouse::factory()->forBranch($branch)->create([
            'allow_negative_stock' => $allowNegativeStock,
        ]);
        $product = Product::factory()->create([
            'business_id' => $business->id,
            'unit_id' => $unit->id,
            'type' => 'single',
            'track_inventory' => true,
        ]);

        return [$business, $user, $warehouse, $product];
    }
}
