<?php

namespace App\Services\Catalog;

use App\Exceptions\Domain\DomainException;
use App\Models\SubUnit;
use App\Models\Unit;
use App\Models\User;
use App\Repositories\Catalog\UnitRepository;
use App\Support\Audit\AuditLogger;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class UnitService
{
    public function __construct(
        protected UnitRepository $units,
        protected AuditLogger $auditLogger,
    ) {
    }

    public function paginate(array $filters): LengthAwarePaginator
    {
        return $this->units->paginateFiltered($filters);
    }

    public function options(): Collection
    {
        return $this->units->options();
    }

    public function create(string $businessId, array $data, ?User $actor = null): Unit
    {
        return DB::transaction(function () use ($businessId, $data, $actor): Unit {
            $this->ensureUniqueSubUnitNames($data['sub_units'] ?? []);

            /** @var Unit $unit */
            $unit = $this->units->create($this->normalizeUnitPayload($businessId, $data));
            $this->syncSubUnits($businessId, $unit, $data['sub_units'] ?? [], $actor);
            $unit = $unit->refresh()->load(['subUnits'])->loadCount('subUnits');

            $this->auditLogger->log(
                'created',
                Unit::class,
                $unit->id,
                $actor,
                $businessId,
                null,
                $this->auditPayload($unit)
            );

            return $unit;
        });
    }

    public function update(string $businessId, Unit $unit, array $data, ?User $actor = null): Unit
    {
        return DB::transaction(function () use ($businessId, $unit, $data, $actor): Unit {
            $this->ensureBelongsToBusiness($businessId, $unit);
            $this->ensureUniqueSubUnitNames($data['sub_units'] ?? []);
            $before = $this->auditPayload($unit->load(['subUnits'])->loadCount('subUnits'));

            /** @var Unit $updatedUnit */
            $updatedUnit = $this->units->update($unit, $this->normalizeUnitPayload($businessId, $data, $unit));
            $this->syncSubUnits($businessId, $updatedUnit, $data['sub_units'] ?? [], $actor);
            $updatedUnit = $updatedUnit->refresh()->load(['subUnits'])->loadCount('subUnits');

            $this->auditLogger->log(
                'updated',
                Unit::class,
                $updatedUnit->id,
                $actor,
                $businessId,
                $before,
                $this->auditPayload($updatedUnit)
            );

            return $updatedUnit;
        });
    }

    public function delete(string $businessId, Unit $unit, ?User $actor = null): void
    {
        DB::transaction(function () use ($businessId, $unit, $actor): void {
            $this->ensureBelongsToBusiness($businessId, $unit);
            $unit = $unit->load(['subUnits'])->loadCount('subUnits');
            $this->ensureUnitCanBeDeleted($unit);
            $before = $this->auditPayload($unit);

            $this->units->delete($unit);

            $this->auditLogger->log(
                'deleted',
                Unit::class,
                $unit->id,
                $actor,
                $businessId,
                $before,
                null
            );
        });
    }

    protected function normalizeUnitPayload(string $businessId, array $data, ?Unit $unit = null): array
    {
        return [
            'business_id' => $businessId,
            'name' => $data['name'] ?? $unit?->name,
            'short_name' => $data['short_name'] ?? $unit?->short_name,
            'allow_decimal' => array_key_exists('allow_decimal', $data)
                ? (bool) $data['allow_decimal']
                : (bool) ($unit?->allow_decimal ?? false),
        ];
    }

    protected function syncSubUnits(string $businessId, Unit $unit, array $subUnits, ?User $actor = null): void
    {
        $existing = $unit->subUnits()->get()->keyBy('id');
        $seenIds = [];

        foreach ($subUnits as $subUnitData) {
            $subUnitId = $subUnitData['id'] ?? null;

            if ($subUnitId !== null) {
                /** @var SubUnit|null $subUnit */
                $subUnit = $existing->get($subUnitId);

                if (! $subUnit) {
                    throw new DomainException('Selected sub unit is invalid for this unit.', 422);
                }

                $subUnit->fill($this->normalizeSubUnitPayload($businessId, $unit, $subUnitData, $subUnit));
                $subUnit->save();
                $seenIds[] = $subUnit->id;
                continue;
            }

            $created = $this->units->newSubUnitQuery()->create(
                $this->normalizeSubUnitPayload($businessId, $unit, $subUnitData)
            );

            $seenIds[] = $created->id;
        }

        $deleteIds = $existing->keys()->diff($seenIds)->values();

        if ($deleteIds->isNotEmpty()) {
            $this->ensureSubUnitsCanBeDeleted($deleteIds->all());
            $this->units->newSubUnitQuery()->whereIn('id', $deleteIds)->delete();
        }
    }

    protected function normalizeSubUnitPayload(
        string $businessId,
        Unit $unit,
        array $data,
        ?SubUnit $subUnit = null,
    ): array {
        return [
            'business_id' => $businessId,
            'parent_unit_id' => $unit->id,
            'name' => $data['name'] ?? $subUnit?->name,
            'short_name' => $data['short_name'] ?? $subUnit?->short_name,
            'conversion_factor' => number_format((float) ($data['conversion_factor'] ?? $subUnit?->conversion_factor ?? 1), 4, '.', ''),
        ];
    }

    protected function ensureBelongsToBusiness(string $businessId, Unit $unit): void
    {
        if ((string) $unit->business_id !== $businessId) {
            throw new DomainException('Unit does not belong to the current business.', 422);
        }
    }

    protected function ensureUniqueSubUnitNames(array $subUnits): void
    {
        $names = [];

        foreach ($subUnits as $subUnit) {
            $normalized = Str::lower(trim((string) ($subUnit['name'] ?? '')));

            if ($normalized === '') {
                continue;
            }

            if (in_array($normalized, $names, true)) {
                throw new DomainException('Sub unit names must be unique within the same unit.', 422);
            }

            $names[] = $normalized;
        }
    }

    protected function ensureUnitCanBeDeleted(Unit $unit): void
    {
        if (
            Schema::hasTable('products')
            && Schema::hasColumn('products', 'unit_id')
            && DB::table('products')->where('unit_id', $unit->id)->exists()
        ) {
            throw new DomainException('Unit cannot be deleted because it is still assigned to products.', 422);
        }

        $subUnitIds = $unit->subUnits->pluck('id')->all();

        if (
            ! empty($subUnitIds)
            && Schema::hasTable('products')
            && Schema::hasColumn('products', 'sub_unit_id')
            && DB::table('products')->whereIn('sub_unit_id', $subUnitIds)->exists()
        ) {
            throw new DomainException('Unit cannot be deleted because one of its sub units is still assigned to products.', 422);
        }

        if (
            ! empty($subUnitIds)
            && Schema::hasTable('product_variations')
            && Schema::hasColumn('product_variations', 'sub_unit_id')
            && DB::table('product_variations')->whereIn('sub_unit_id', $subUnitIds)->exists()
        ) {
            throw new DomainException('Unit cannot be deleted because one of its sub units is still assigned to product variations.', 422);
        }
    }

    protected function ensureSubUnitsCanBeDeleted(array $subUnitIds): void
    {
        if (
            ! empty($subUnitIds)
            && Schema::hasTable('products')
            && Schema::hasColumn('products', 'sub_unit_id')
            && DB::table('products')->whereIn('sub_unit_id', $subUnitIds)->exists()
        ) {
            throw new DomainException('A sub unit cannot be removed because it is still assigned to products.', 422);
        }

        if (
            ! empty($subUnitIds)
            && Schema::hasTable('product_variations')
            && Schema::hasColumn('product_variations', 'sub_unit_id')
            && DB::table('product_variations')->whereIn('sub_unit_id', $subUnitIds)->exists()
        ) {
            throw new DomainException('A sub unit cannot be removed because it is still assigned to product variations.', 422);
        }
    }

    protected function auditPayload(Unit $unit): array
    {
        return [
            'id' => $unit->id,
            'business_id' => $unit->business_id,
            'name' => $unit->name,
            'short_name' => $unit->short_name,
            'allow_decimal' => (bool) $unit->allow_decimal,
            'sub_units_count' => (int) ($unit->sub_units_count ?? $unit->subUnits->count()),
            'sub_units' => $unit->subUnits->map(fn (SubUnit $subUnit) => [
                'id' => $subUnit->id,
                'name' => $subUnit->name,
                'short_name' => $subUnit->short_name,
                'conversion_factor' => (string) $subUnit->conversion_factor,
            ])->values()->all(),
        ];
    }
}
