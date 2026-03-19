<?php

namespace Database\Factories;

use App\Models\Branch;
use App\Models\Business;
use App\Models\Warehouse;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Warehouse>
 */
class WarehouseFactory extends Factory
{
    protected $model = Warehouse::class;

    public function definition(): array
    {
        return [
            'business_id' => Business::factory(),
            'branch_id' => null,
            'name' => fake()->company().' Warehouse',
            'code' => strtoupper(fake()->unique()->bothify('WH###')),
            'type' => 'main',
            'is_active' => true,
            'is_default' => false,
            'allow_negative_stock' => false,
        ];
    }

    public function forBranch(?Branch $branch = null): static
    {
        return $this->state(function () use ($branch): array {
            $branch ??= Branch::factory()->create();

            return [
                'business_id' => $branch->business_id,
                'branch_id' => $branch->id,
            ];
        });
    }
}
