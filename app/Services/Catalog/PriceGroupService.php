<?php

namespace App\Services\Catalog;

use App\Exceptions\Domain\DomainException;
use App\Models\PriceGroup;
use App\Models\User;
use App\Repositories\Catalog\PriceGroupRepository;
use App\Support\Audit\AuditLogger;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class PriceGroupService
{
    public function __construct(
        protected PriceGroupRepository $priceGroups,
        protected AuditLogger $auditLogger,
    ) {
    }

    public function paginate(array $filters): LengthAwarePaginator
    {
        return $this->priceGroups->paginateFiltered($filters);
    }

    public function create(string $businessId, array $data, ?User $actor = null): PriceGroup
    {
        return DB::transaction(function () use ($businessId, $data, $actor): PriceGroup {
            $query = $this->priceGroupQueryForBusiness($businessId)->lockForUpdate();
            $payload = $this->normalizePayload($businessId, $data);

            if (($payload['is_default'] ?? false) === true) {
                $query->where('is_default', true)->update(['is_default' => false]);
            } elseif (! $query->exists()) {
                $payload['is_default'] = true;
            }

            /** @var PriceGroup $priceGroup */
            $priceGroup = $this->priceGroups->create($payload);

            $this->ensureDefaultExists($businessId, $priceGroup->id);
            $priceGroup = $priceGroup->refresh()->loadCount('customerGroups');

            $this->auditLogger->log(
                'created',
                PriceGroup::class,
                $priceGroup->id,
                $actor,
                $businessId,
                null,
                $this->auditPayload($priceGroup)
            );

            return $priceGroup;
        });
    }

    public function update(string $businessId, PriceGroup $priceGroup, array $data, ?User $actor = null): PriceGroup
    {
        return DB::transaction(function () use ($businessId, $priceGroup, $data, $actor): PriceGroup {
            $this->ensureBelongsToBusiness($businessId, $priceGroup);
            $before = $this->auditPayload($priceGroup);
            $payload = $this->normalizePayload($businessId, $data, $priceGroup);
            $wasDefault = (bool) $priceGroup->is_default;

            if (($payload['is_default'] ?? false) === true) {
                $this->priceGroupQueryForBusiness($businessId)
                    ->lockForUpdate()
                    ->where('id', '!=', $priceGroup->id)
                    ->where('is_default', true)
                    ->update(['is_default' => false]);
            }

            /** @var PriceGroup $updatedPriceGroup */
            $updatedPriceGroup = $this->priceGroups->update($priceGroup, $payload);
            $replacementId = null;

            if ($wasDefault && ($payload['is_default'] ?? false) === false) {
                $replacementId = $this->priceGroupQueryForBusiness($businessId)
                    ->lockForUpdate()
                    ->where('id', '!=', $updatedPriceGroup->id)
                    ->orderBy('name')
                    ->value('id');
            }

            $this->ensureDefaultExists($businessId, $replacementId ?: $updatedPriceGroup->id);
            $updatedPriceGroup = $updatedPriceGroup->refresh()->loadCount('customerGroups');

            $this->auditLogger->log(
                'updated',
                PriceGroup::class,
                $updatedPriceGroup->id,
                $actor,
                $businessId,
                $before,
                $this->auditPayload($updatedPriceGroup)
            );

            return $updatedPriceGroup;
        });
    }

    public function delete(string $businessId, PriceGroup $priceGroup, ?User $actor = null): void
    {
        DB::transaction(function () use ($businessId, $priceGroup, $actor): void {
            $this->ensureBelongsToBusiness($businessId, $priceGroup);
            $this->ensurePriceGroupCanBeDeleted($priceGroup);
            $before = $this->auditPayload($priceGroup);
            $wasDefault = (bool) $priceGroup->is_default;

            $this->priceGroups->delete($priceGroup);

            if ($wasDefault) {
                $replacementId = $this->priceGroupQueryForBusiness($businessId)
                    ->lockForUpdate()
                    ->orderBy('name')
                    ->value('id');

                if ($replacementId !== null) {
                    $this->ensureDefaultExists($businessId, $replacementId);
                }
            }

            $this->auditLogger->log(
                'deleted',
                PriceGroup::class,
                $priceGroup->id,
                $actor,
                $businessId,
                $before,
                null
            );
        });
    }

    protected function normalizePayload(string $businessId, array $data, ?PriceGroup $priceGroup = null): array
    {
        return [
            'business_id' => $businessId,
            'name' => $data['name'] ?? $priceGroup?->name,
            'description' => array_key_exists('description', $data)
                ? $data['description']
                : $priceGroup?->description,
            'is_default' => array_key_exists('is_default', $data)
                ? (bool) $data['is_default']
                : (bool) ($priceGroup?->is_default ?? false),
        ];
    }

    protected function ensureBelongsToBusiness(string $businessId, PriceGroup $priceGroup): void
    {
        if ((string) $priceGroup->business_id !== $businessId) {
            throw new DomainException('Price group does not belong to the current business.', 422);
        }
    }

    protected function ensurePriceGroupCanBeDeleted(PriceGroup $priceGroup): void
    {
        if (
            Schema::hasTable('customer_groups')
            && Schema::hasColumn('customer_groups', 'price_group_id')
            && DB::table('customer_groups')->where('price_group_id', $priceGroup->id)->exists()
        ) {
            throw new DomainException('Price group cannot be deleted because it is still assigned to customer groups.', 422);
        }

        if (
            Schema::hasTable('products')
            && Schema::hasColumn('products', 'price_group_id')
            && DB::table('products')->where('price_group_id', $priceGroup->id)->exists()
        ) {
            throw new DomainException('Price group cannot be deleted because it is still assigned to products.', 422);
        }
    }

    protected function ensureDefaultExists(string $businessId, ?string $preferredId = null): void
    {
        $query = $this->priceGroupQueryForBusiness($businessId)->lockForUpdate();

        if ($query->where('is_default', true)->exists()) {
            return;
        }

        $targetId = $preferredId ?: $this->priceGroupQueryForBusiness($businessId)
            ->orderBy('name')
            ->value('id');

        if ($targetId !== null) {
            $this->priceGroupQueryForBusiness($businessId)
                ->where('id', $targetId)
                ->update(['is_default' => true]);
        }
    }

    protected function priceGroupQueryForBusiness(string $businessId): Builder
    {
        return PriceGroup::withoutGlobalScopes()->where('business_id', $businessId);
    }

    protected function auditPayload(PriceGroup $priceGroup): array
    {
        return [
            'id' => $priceGroup->id,
            'business_id' => $priceGroup->business_id,
            'name' => $priceGroup->name,
            'description' => $priceGroup->description,
            'is_default' => (bool) $priceGroup->is_default,
            'customer_groups_count' => (int) ($priceGroup->customer_groups_count ?? 0),
        ];
    }
}
