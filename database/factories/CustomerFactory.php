<?php

namespace Database\Factories;

use App\Models\Business;
use App\Models\Customer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Customer>
 */
class CustomerFactory extends Factory
{
    protected $model = Customer::class;

    public function definition(): array
    {
        return [
            'business_id' => Business::factory(),
            'customer_group_id' => null,
            'code' => 'CUST-'.str_pad((string) fake()->unique()->numberBetween(1, 99999), 5, '0', STR_PAD_LEFT),
            'name' => fake()->name(),
            'type' => fake()->randomElement(['individual', 'company']),
            'email' => fake()->safeEmail(),
            'phone' => fake()->phoneNumber(),
            'mobile' => fake()->phoneNumber(),
            'tax_id' => fake()->numerify('TAX####'),
            'date_of_birth' => fake()->date(),
            'address' => [
                'line1' => fake()->streetAddress(),
                'city' => fake()->city(),
                'country' => fake()->countryCode(),
            ],
            'credit_limit' => fake()->randomFloat(2, 0, 1000),
            'pay_term' => fake()->numberBetween(0, 60),
            'opening_balance' => fake()->randomFloat(2, 0, 500),
            'status' => 'active',
            'notes' => fake()->sentence(),
            'custom_fields' => [],
            'documents' => [],
        ];
    }
}
