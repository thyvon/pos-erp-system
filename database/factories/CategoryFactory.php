<?php

namespace Database\Factories;

use App\Models\Business;
use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Category>
 */
class CategoryFactory extends Factory
{
    protected $model = Category::class;

    public function definition(): array
    {
        return [
            'business_id' => Business::factory(),
            'parent_id' => null,
            'name' => fake()->unique()->words(2, true),
            'code' => strtoupper(fake()->bothify('CAT-###')),
            'short_code' => strtoupper(fake()->lexify('???')),
            'image_url' => fake()->imageUrl(),
            'sort_order' => fake()->numberBetween(0, 50),
        ];
    }
}
