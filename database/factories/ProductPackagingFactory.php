<?php

namespace Database\Factories;

use App\Models\Business;
use App\Models\Product;
use App\Models\ProductPackaging;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ProductPackaging>
 */
class ProductPackagingFactory extends Factory
{
    protected $model = ProductPackaging::class;

    public function definition(): array
    {
        return [
            'business_id' => Business::factory(),
            'product_id' => Product::factory(),
            'name' => fake()->randomElement(['Case', 'Box', 'Pack']),
            'short_name' => fake()->lexify('??'),
            'conversion_factor' => fake()->randomFloat(4, 1, 50),
            'sku' => strtoupper(fake()->unique()->bothify('PK-####')),
            'barcode' => fake()->unique()->ean13(),
            'selling_price' => fake()->randomFloat(2, 1, 200),
            'purchase_price' => fake()->randomFloat(2, 1, 150),
            'is_default' => false,
            'is_active' => true,
        ];
    }

    public function configure(): static
    {
        return $this
            ->afterMaking(function (ProductPackaging $packaging): void {
                if ($packaging->product && (string) $packaging->business_id !== (string) $packaging->product->business_id) {
                    $packaging->business_id = $packaging->product->business_id;
                }
            })
            ->afterCreating(function (ProductPackaging $packaging): void {
                if ($packaging->product && (string) $packaging->business_id !== (string) $packaging->product->business_id) {
                    $packaging->business_id = $packaging->product->business_id;
                    $packaging->save();
                }
            });
    }
}
