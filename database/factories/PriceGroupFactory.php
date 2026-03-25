<?php

namespace Database\Factories;

use App\Models\Business;
use App\Models\PriceGroup;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PriceGroup>
 */
class PriceGroupFactory extends Factory
{
    protected $model = PriceGroup::class;

    public function definition(): array
    {
        return [
            'business_id' => Business::factory(),
            'name' => fake()->unique()->words(2, true),
            'description' => fake()->sentence(),
            'is_default' => false,
        ];
    }
}
