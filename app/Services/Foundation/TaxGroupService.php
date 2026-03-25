<?php

namespace App\Services\Foundation;

use App\Exceptions\Domain\DomainException;
use App\Models\TaxGroup;
use App\Models\TaxRate;
use App\Models\User;
use App\Repositories\Foundation\TaxGroupRepository;
use App\Support\Audit\AuditLogger;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class TaxGroupService
{
    public function __construct(
        protected TaxGroupRepository $taxGroups,
        protected AuditLogger $auditLogger,
    ) {
    }

    public function paginate(array $filters): LengthAwarePaginator
    {
        return $this->taxGroups->paginateFiltered($filters);
    }

    public function create(string $businessId, array $data, ?User $actor = null): TaxGroup
    {
        return DB::transaction(function () use ($businessId, $data, $actor): TaxGroup {
            $taxRates = $this->resolveTaxRates($businessId, $data['tax_rate_ids'] ?? []);

            /** @var TaxGroup $taxGroup */
            $taxGroup = $this->taxGroups->create([
                'business_id' => $businessId,
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'is_active' => (bool) ($data['is_active'] ?? true),
            ]);

            $this->syncTaxRates($taxGroup->id, $taxRates);
            $taxGroup = $this->loadTaxGroup($taxGroup);

            $this->auditLogger->log(
                'created',
                TaxGroup::class,
                $taxGroup->id,
                $actor,
                $businessId,
                null,
                $this->auditPayload($taxGroup)
            );

            return $taxGroup;
        });
    }

    public function update(string $businessId, TaxGroup $taxGroup, array $data, ?User $actor = null): TaxGroup
    {
        return DB::transaction(function () use ($businessId, $taxGroup, $data, $actor): TaxGroup {
            $this->ensureBelongsToBusiness($businessId, $taxGroup);
            $before = $this->auditPayload($this->loadTaxGroup($taxGroup));

            /** @var TaxGroup $updatedTaxGroup */
            $updatedTaxGroup = $this->taxGroups->update($taxGroup, [
                'name' => $data['name'] ?? $taxGroup->name,
                'description' => array_key_exists('description', $data) ? $data['description'] : $taxGroup->description,
                'is_active' => array_key_exists('is_active', $data) ? (bool) $data['is_active'] : $taxGroup->is_active,
            ]);

            if (array_key_exists('tax_rate_ids', $data)) {
                $taxRates = $this->resolveTaxRates($businessId, $data['tax_rate_ids']);
                $this->syncTaxRates($updatedTaxGroup->id, $taxRates);
            }

            $updatedTaxGroup = $this->loadTaxGroup($updatedTaxGroup);

            $this->auditLogger->log(
                'updated',
                TaxGroup::class,
                $updatedTaxGroup->id,
                $actor,
                $businessId,
                $before,
                $this->auditPayload($updatedTaxGroup)
            );

            return $updatedTaxGroup;
        });
    }

    public function delete(string $businessId, TaxGroup $taxGroup, ?User $actor = null): void
    {
        DB::transaction(function () use ($businessId, $taxGroup, $actor): void {
            $this->ensureBelongsToBusiness($businessId, $taxGroup);
            $this->ensureTaxGroupCanBeDeleted($taxGroup);
            $before = $this->auditPayload($this->loadTaxGroup($taxGroup));

            DB::table('tax_group_items')->where('tax_group_id', $taxGroup->id)->delete();
            $this->taxGroups->delete($taxGroup);

            $this->auditLogger->log(
                'deleted',
                TaxGroup::class,
                $taxGroup->id,
                $actor,
                $businessId,
                $before,
                null
            );
        });
    }

    protected function resolveTaxRates(string $businessId, array $taxRateIds): Collection
    {
        $orderedIds = collect($taxRateIds)
            ->filter(fn ($taxRateId) => filled($taxRateId))
            ->map(fn ($taxRateId) => (string) $taxRateId)
            ->unique()
            ->values();

        if ($orderedIds->isEmpty()) {
            throw new DomainException('Tax group must include at least one tax rate.', 422);
        }

        $taxRates = TaxRate::query()
            ->where('business_id', $businessId)
            ->whereIn('id', $orderedIds->all())
            ->get(['id', 'business_id', 'name', 'type', 'rate']);

        if ($taxRates->count() !== $orderedIds->count()) {
            throw new DomainException('One or more selected tax rates are invalid for this business.', 422);
        }

        return $orderedIds
            ->map(fn (string $taxRateId) => $taxRates->firstWhere('id', $taxRateId))
            ->filter()
            ->values();
    }

    protected function syncTaxRates(string $taxGroupId, Collection $taxRates): void
    {
        DB::table('tax_group_items')->where('tax_group_id', $taxGroupId)->delete();

        DB::table('tax_group_items')->insert(
            $taxRates->map(fn (TaxRate $taxRate) => [
                'id' => (string) Str::uuid(),
                'tax_group_id' => $taxGroupId,
                'tax_rate_id' => $taxRate->id,
            ])->all()
        );
    }

    protected function ensureBelongsToBusiness(string $businessId, TaxGroup $taxGroup): void
    {
        if ((string) $taxGroup->business_id !== $businessId) {
            throw new DomainException('Tax group does not belong to the current business.', 422);
        }
    }

    protected function ensureTaxGroupCanBeDeleted(TaxGroup $taxGroup): void
    {
        if (
            Schema::hasTable('products')
            && Schema::hasColumn('products', 'tax_group_id')
            && DB::table('products')->where('tax_group_id', $taxGroup->id)->exists()
        ) {
            throw new DomainException('Tax group cannot be deleted because it is still assigned to products.', 422);
        }
    }

    protected function loadTaxGroup(TaxGroup $taxGroup): TaxGroup
    {
        return $taxGroup->load(['taxRates:id,name,type,rate']);
    }

    protected function auditPayload(TaxGroup $taxGroup): array
    {
        return [
            'id' => $taxGroup->id,
            'business_id' => $taxGroup->business_id,
            'name' => $taxGroup->name,
            'description' => $taxGroup->description,
            'is_active' => (bool) $taxGroup->is_active,
            'tax_rate_ids' => $taxGroup->taxRates->pluck('id')->values()->all(),
        ];
    }
}
