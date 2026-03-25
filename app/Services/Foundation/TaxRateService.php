<?php

namespace App\Services\Foundation;

use App\Exceptions\Domain\DomainException;
use App\Models\TaxRate;
use App\Models\User;
use App\Repositories\Foundation\TaxRateRepository;
use App\Support\Audit\AuditLogger;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class TaxRateService
{
    public function __construct(
        protected TaxRateRepository $taxRates,
        protected AuditLogger $auditLogger,
    ) {
    }

    public function paginate(array $filters): LengthAwarePaginator
    {
        return $this->taxRates->paginateFiltered($filters);
    }

    public function create(string $businessId, array $data, ?User $actor = null): TaxRate
    {
        return DB::transaction(function () use ($businessId, $data, $actor): TaxRate {
            $query = $this->taxRateQueryForBusiness($businessId)->lockForUpdate();
            $data['business_id'] = $businessId;

            if (($data['is_default'] ?? false) === true) {
                $query->where('is_default', true)->update(['is_default' => false]);
            } elseif (! $query->exists()) {
                $data['is_default'] = true;
            }

            /** @var TaxRate $taxRate */
            $taxRate = $this->taxRates->create([
                'business_id' => $businessId,
                'name' => $data['name'],
                'rate' => $data['rate'],
                'type' => $data['type'],
                'is_default' => (bool) ($data['is_default'] ?? false),
                'is_active' => (bool) ($data['is_active'] ?? true),
            ]);

            $this->ensureDefaultExists($businessId, $taxRate->id);
            $taxRate = $taxRate->refresh();

            $this->auditLogger->log(
                'created',
                TaxRate::class,
                $taxRate->id,
                $actor,
                $businessId,
                null,
                $this->auditPayload($taxRate)
            );

            return $taxRate;
        });
    }

    public function update(string $businessId, TaxRate $taxRate, array $data, ?User $actor = null): TaxRate
    {
        return DB::transaction(function () use ($businessId, $taxRate, $data, $actor): TaxRate {
            $this->ensureBelongsToBusiness($businessId, $taxRate);
            $before = $this->auditPayload($taxRate);

            if (($data['is_default'] ?? false) === true) {
                $this->taxRateQueryForBusiness($businessId)
                    ->where('is_default', true)
                    ->whereKeyNot($taxRate->id)
                    ->lockForUpdate()
                    ->update(['is_default' => false]);
            }

            /** @var TaxRate $updatedTaxRate */
            $updatedTaxRate = $this->taxRates->update($taxRate, [
                'name' => $data['name'] ?? $taxRate->name,
                'rate' => $data['rate'] ?? $taxRate->rate,
                'type' => $data['type'] ?? $taxRate->type,
                'is_default' => array_key_exists('is_default', $data) ? (bool) $data['is_default'] : $taxRate->is_default,
                'is_active' => array_key_exists('is_active', $data) ? (bool) $data['is_active'] : $taxRate->is_active,
            ]);

            $this->ensureDefaultExists($businessId, $updatedTaxRate->id);
            $updatedTaxRate = $updatedTaxRate->refresh();

            $this->auditLogger->log(
                'updated',
                TaxRate::class,
                $updatedTaxRate->id,
                $actor,
                $businessId,
                $before,
                $this->auditPayload($updatedTaxRate)
            );

            return $updatedTaxRate;
        });
    }

    public function delete(string $businessId, TaxRate $taxRate, ?User $actor = null): void
    {
        DB::transaction(function () use ($businessId, $taxRate, $actor): void {
            $this->ensureBelongsToBusiness($businessId, $taxRate);
            $this->ensureTaxRateCanBeDeleted($taxRate);
            $before = $this->auditPayload($taxRate);
            $wasDefault = $taxRate->is_default;

            $this->taxRates->delete($taxRate);

            if ($wasDefault) {
                $this->ensureDefaultExists($businessId);
            }

            $this->auditLogger->log(
                'deleted',
                TaxRate::class,
                $taxRate->id,
                $actor,
                $businessId,
                $before,
                null
            );
        });
    }

    protected function ensureBelongsToBusiness(string $businessId, TaxRate $taxRate): void
    {
        if ((string) $taxRate->business_id !== $businessId) {
            throw new DomainException('Tax rate does not belong to the current business.', 422);
        }
    }

    protected function ensureDefaultExists(string $businessId, ?string $preferredId = null): void
    {
        $query = $this->taxRateQueryForBusiness($businessId)->lockForUpdate();

        if (! $query->exists() || $query->where('is_default', true)->exists()) {
            return;
        }

        $fallback = $preferredId !== null
            ? $this->taxRateQueryForBusiness($businessId)->whereKey($preferredId)->first()
            : null;

        if (! $fallback instanceof TaxRate) {
            $fallback = $this->taxRateQueryForBusiness($businessId)
                ->orderBy('created_at')
                ->first();
        }

        if ($fallback instanceof TaxRate) {
            $fallback->forceFill(['is_default' => true])->save();
        }
    }

    protected function ensureTaxRateCanBeDeleted(TaxRate $taxRate): void
    {
        if (
            Schema::hasTable('products')
            && Schema::hasColumn('products', 'tax_rate_id')
            && DB::table('products')->where('tax_rate_id', $taxRate->id)->exists()
        ) {
            throw new DomainException('Tax rate cannot be deleted because it is still assigned to products.', 422);
        }

        if (
            Schema::hasTable('tax_group_items')
            && Schema::hasColumn('tax_group_items', 'tax_rate_id')
            && DB::table('tax_group_items')->where('tax_rate_id', $taxRate->id)->exists()
        ) {
            throw new DomainException('Tax rate cannot be deleted because it is still used by tax groups.', 422);
        }
    }

    protected function taxRateQueryForBusiness(string $businessId)
    {
        return TaxRate::withoutGlobalScopes()->where('business_id', $businessId);
    }

    protected function auditPayload(TaxRate $taxRate): array
    {
        return [
            'id' => $taxRate->id,
            'business_id' => $taxRate->business_id,
            'name' => $taxRate->name,
            'rate' => (string) $taxRate->rate,
            'type' => $taxRate->type,
            'is_default' => (bool) $taxRate->is_default,
            'is_active' => (bool) $taxRate->is_active,
        ];
    }
}
