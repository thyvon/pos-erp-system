<?php

namespace Database\Factories;

use App\Models\Business;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Business>
 */
class BusinessFactory extends Factory
{
    protected $model = Business::class;

    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'legal_name' => fake()->company().' LLC',
            'email' => fake()->unique()->companyEmail(),
            'phone' => fake()->phoneNumber(),
            'currency' => 'USD',
            'country' => 'KH',
            'timezone' => 'UTC',
            'locale' => 'en',
            'address' => [
                'line1' => fake()->streetAddress(),
                'city' => fake()->city(),
                'country' => 'KH',
            ],
            'tier' => 'standard',
            'status' => 'active',
            'max_users' => 25,
            'max_branches' => 5,
            'financial_year' => [
                'start_month' => 1,
            ],
            'settings_cache' => [],
        ];
    }
}
