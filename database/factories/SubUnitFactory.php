<?php

namespace Database\Factories;

use App\Models\Business;
use App\Models\SubUnit;
use App\Models\Unit;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\SubUnit>
 */
class SubUnitFactory extends Factory
{
    protected $model = SubUnit::class;

    public function definition(): array
    {
        return [
            'business_id' => Business::factory(),
            'parent_unit_id' => Unit::factory(),
            'name' => fake()->unique()->randomElement(['Carton', 'Tray', 'Bundle', 'Dozen']),
            'short_name' => fake()->unique()->randomElement(['ctn', 'try', 'bdl', 'dz']),
            'conversion_factor' => fake()->randomFloat(4, 0.1, 100),
        ];
    }

    public function configure(): static
    {
        return $this
            ->afterMaking(function (SubUnit $subUnit): void {
                if ($subUnit->parentUnit) {
                    $subUnit->business_id = $subUnit->parentUnit->business_id;
                }
            })
            ->afterCreating(function (SubUnit $subUnit): void {
                if ($subUnit->parentUnit && $subUnit->business_id !== $subUnit->parentUnit->business_id) {
                    $subUnit->forceFill([
                        'business_id' => $subUnit->parentUnit->business_id,
                    ])->saveQuietly();
                }
            });
    }
}
