<?php

namespace Database\Factories;

use App\Models\Business;
use App\Models\VariationTemplate;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\VariationTemplate>
 */
class VariationTemplateFactory extends Factory
{
    protected $model = VariationTemplate::class;

    public function definition(): array
    {
        return [
            'business_id' => Business::factory(),
            'name' => fake()->unique()->randomElement(['Size', 'Color', 'Flavor', 'Capacity']),
        ];
    }
}
