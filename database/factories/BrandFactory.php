<?php

namespace Database\Factories;

use App\Models\Brand;
use App\Models\Business;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Brand>
 */
class BrandFactory extends Factory
{
    protected $model = Brand::class;

    public function definition(): array
    {
        return [
            'business_id' => Business::factory(),
            'name' => fake()->unique()->company(),
            'description' => fake()->sentence(),
            'image_url' => fake()->optional()->imageUrl(600, 600, 'business', true),
        ];
    }
}
