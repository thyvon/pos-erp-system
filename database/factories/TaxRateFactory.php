<?php

namespace Database\Factories;

use App\Models\Business;
use App\Models\TaxRate;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TaxRate>
 */
class TaxRateFactory extends Factory
{
    protected $model = TaxRate::class;

    public function definition(): array
    {
        return [
            'business_id' => Business::factory(),
            'name' => 'VAT '.fake()->unique()->numberBetween(1, 999),
            'rate' => fake()->randomFloat(2, 0, 15),
            'type' => fake()->randomElement(['percentage', 'fixed']),
            'is_default' => false,
            'is_active' => true,
        ];
    }
}
