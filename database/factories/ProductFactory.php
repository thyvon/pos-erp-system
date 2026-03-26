<?php

namespace Database\Factories;

use App\Models\Brand;
use App\Models\Business;
use App\Models\Category;
use App\Models\PriceGroup;
use App\Models\Product;
use App\Models\TaxRate;
use App\Models\Unit;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        return [
            'business_id' => Business::factory(),
            'category_id' => Category::factory(),
            'brand_id' => Brand::factory(),
            'unit_id' => Unit::factory(),
            'tax_rate_id' => TaxRate::factory(),
            'price_group_id' => PriceGroup::factory(),
            'name' => fake()->unique()->words(3, true),
            'description' => fake()->sentence(),
            'sku' => strtoupper(fake()->unique()->bothify('PRD-####')),
            'barcode_type' => 'C128',
            'type' => 'single',
            'stock_tracking' => 'none',
            'has_expiry' => false,
            'selling_price' => fake()->randomFloat(2, 1, 200),
            'purchase_price' => fake()->randomFloat(2, 1, 150),
            'minimum_selling_price' => null,
            'profit_margin' => null,
            'tax_type' => 'exclusive',
            'track_inventory' => true,
            'alert_quantity' => fake()->randomFloat(3, 0, 20),
            'max_stock_level' => null,
            'is_for_selling' => true,
            'is_active' => true,
            'weight' => null,
            'custom_fields' => [],
        ];
    }

    public function configure(): static
    {
        return $this
            ->afterMaking(function (Product $product): void {
                $this->alignBusiness($product);
            })
            ->afterCreating(function (Product $product): void {
                $this->alignBusiness($product);
                $product->save();
            });
    }

    protected function alignBusiness(Product $product): void
    {
        $businessId = (string) $product->business_id;

        if ($product->category && (string) $product->category->business_id !== $businessId) {
            $product->category()->associate(Category::factory()->create(['business_id' => $businessId]));
        }

        if ($product->brand && (string) $product->brand->business_id !== $businessId) {
            $product->brand()->associate(Brand::factory()->create(['business_id' => $businessId]));
        }

        if ($product->unit && (string) $product->unit->business_id !== $businessId) {
            $product->unit()->associate(Unit::factory()->create(['business_id' => $businessId]));
        }

        if ($product->taxRate && (string) $product->taxRate->business_id !== $businessId) {
            $product->taxRate()->associate(TaxRate::factory()->create(['business_id' => $businessId]));
        }

        if ($product->priceGroup && (string) $product->priceGroup->business_id !== $businessId) {
            $product->priceGroup()->associate(PriceGroup::factory()->create(['business_id' => $businessId]));
        }
    }
}
