<?php

namespace Database\Factories;

use App\Models\VariationTemplate;
use App\Models\VariationValue;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\VariationValue>
 */
class VariationValueFactory extends Factory
{
    protected $model = VariationValue::class;

    public function definition(): array
    {
        return [
            'business_id' => null,
            'variation_template_id' => VariationTemplate::factory(),
            'name' => fake()->unique()->randomElement(['Small', 'Medium', 'Large', 'Red', 'Blue']),
            'sort_order' => fake()->numberBetween(0, 100),
        ];
    }

    public function configure(): static
    {
        return $this
            ->afterMaking(function (VariationValue $value): void {
                if ($value->template) {
                    $value->business_id = $value->template->business_id;
                }
            })
            ->afterCreating(function (VariationValue $value): void {
                if ($value->template && $value->business_id !== $value->template->business_id) {
                    $value->forceFill([
                        'business_id' => $value->template->business_id,
                    ])->saveQuietly();
                }
            });
    }
}
