<?php

namespace Database\Factories;

use App\Models\Business;
use App\Models\TaxGroup;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TaxGroup>
 */
class TaxGroupFactory extends Factory
{
    protected $model = TaxGroup::class;

    public function definition(): array
    {
        return [
            'business_id' => Business::factory(),
            'name' => 'Compound Tax '.fake()->unique()->numberBetween(1, 999),
            'description' => fake()->sentence(),
            'is_active' => true,
        ];
    }
}
