<?php

namespace Database\Factories;

use App\Models\Business;
use App\Models\Supplier;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Supplier>
 */
class SupplierFactory extends Factory
{
    protected $model = Supplier::class;

    public function definition(): array
    {
        return [
            'business_id' => Business::factory(),
            'code' => 'SUPP-'.str_pad((string) fake()->unique()->numberBetween(1, 99999), 5, '0', STR_PAD_LEFT),
            'name' => fake()->company(),
            'company' => fake()->company(),
            'email' => fake()->companyEmail(),
            'phone' => fake()->phoneNumber(),
            'mobile' => fake()->phoneNumber(),
            'tax_id' => fake()->numerify('SUPP####'),
            'address' => [
                'line1' => fake()->streetAddress(),
                'city' => fake()->city(),
                'country' => fake()->countryCode(),
            ],
            'pay_term' => fake()->numberBetween(0, 60),
            'opening_balance' => fake()->randomFloat(2, 0, 1000),
            'status' => 'active',
            'notes' => fake()->sentence(),
            'custom_fields' => [],
            'documents' => [],
        ];
    }
}
