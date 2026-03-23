<?php

namespace Database\Factories;

use App\Models\Branch;
use App\Models\Business;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Branch>
 */
class BranchFactory extends Factory
{
    protected $model = Branch::class;

    public function definition(): array
    {
        return [
            'business_id' => Business::factory(),
            'name' => fake()->company().' Branch',
            'code' => sprintf('BR-%03d', fake()->unique()->numberBetween(1, 999)),
            'type' => 'retail',
            'phone' => fake()->phoneNumber(),
            'email' => fake()->companyEmail(),
            'address' => [
                'line1' => fake()->streetAddress(),
                'city' => fake()->city(),
            ],
            'is_default' => false,
            'is_active' => true,
            'business_hours' => ['mon' => '08:00-17:00'],
            'invoice_settings' => ['prefix' => 'INV'],
        ];
    }
}
