<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\ProductVariation;
use App\Models\VariationTemplate;
use App\Models\VariationValue;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ProductVariation>
 */
class ProductVariationFactory extends Factory
{
    protected $model = ProductVariation::class;

    public function definition(): array
    {
        return [
            'business_id' => null,
            'product_id' => Product::factory()->state([
                'type' => 'variable',
            ]),
            'name' => fake()->words(2, true),
            'variation_value_ids' => [],
            'sku' => strtoupper(fake()->unique()->bothify('VAR-####')),
            'barcode' => fake()->unique()->ean13(),
            'selling_price' => fake()->randomFloat(2, 1, 200),
            'purchase_price' => fake()->randomFloat(2, 1, 150),
            'minimum_selling_price' => null,
            'is_active' => true,
        ];
    }

    public function configure(): static
    {
        return $this
            ->afterMaking(function (ProductVariation $variation): void {
                $this->alignVariation($variation);
            })
            ->afterCreating(function (ProductVariation $variation): void {
                $this->alignVariation($variation);
                $variation->save();
            });
    }

    protected function alignVariation(ProductVariation $variation): void
    {
        if (! $variation->product) {
            return;
        }

        $product = $variation->product;
        $variation->business_id = $product->business_id;

        if (! $product->variation_template_id) {
            $template = VariationTemplate::factory()->create([
                'business_id' => $product->business_id,
            ]);

            $product->variation_template_id = $template->id;
            $product->type = 'variable';
            $product->save();
            $product->refresh();
        }

        $template = VariationTemplate::find($product->variation_template_id);

        if ($template && ! $template->values()->exists()) {
            VariationValue::factory()->create([
                'business_id' => $template->business_id,
                'variation_template_id' => $template->id,
            ]);
        }

        if ($template) {
            $variation->variation_value_ids = $template->values()->pluck('id')->take(1)->values()->all();
        }
    }
}
