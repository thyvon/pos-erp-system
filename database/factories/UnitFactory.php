<?php

namespace Database\Factories;

use App\Models\Business;
use App\Models\Unit;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Unit>
 */
class UnitFactory extends Factory
{
    protected $model = Unit::class;

    public function definition(): array
    {
        return [
            'business_id' => Business::factory(),
            'name' => fake()->unique()->randomElement(['Piece', 'Box', 'Pack', 'Bottle', 'Case', 'Kg', 'Gram']),
            'short_name' => fake()->unique()->randomElement(['pc', 'box', 'pk', 'bt', 'cs', 'kg', 'g']),
            'allow_decimal' => fake()->boolean(),
        ];
    }
}
