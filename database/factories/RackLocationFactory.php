<?php

namespace Database\Factories;

use App\Models\RackLocation;
use App\Models\Warehouse;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\RackLocation>
 */
class RackLocationFactory extends Factory
{
    protected $model = RackLocation::class;

    public function definition(): array
    {
        return [
            'business_id' => null,
            'warehouse_id' => Warehouse::factory(),
            'name' => fake()->randomElement(['Aisle A', 'Bin B1', 'Shelf C2', 'Zone D']),
            'code' => fake()->unique()->bothify('RK-###'),
            'description' => fake()->sentence(),
        ];
    }

    public function configure(): static
    {
        return $this
            ->afterMaking(function (RackLocation $rackLocation): void {
                if ($rackLocation->warehouse) {
                    $rackLocation->business_id = $rackLocation->warehouse->business_id;
                }
            })
            ->afterCreating(function (RackLocation $rackLocation): void {
                if ($rackLocation->warehouse && $rackLocation->business_id !== $rackLocation->warehouse->business_id) {
                    $rackLocation->forceFill([
                        'business_id' => $rackLocation->warehouse->business_id,
                    ])->saveQuietly();
                }
            });
    }
}
