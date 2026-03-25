<?php

namespace App\Services\Foundation;

use App\Exceptions\Domain\DomainException;
use App\Models\CustomerGroup;
use App\Models\PriceGroup;
use App\Models\User;
use App\Repositories\Foundation\CustomerGroupRepository;
use App\Support\Audit\AuditLogger;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CustomerGroupService
{
    public function __construct(
        protected CustomerGroupRepository $customerGroups,
        protected AuditLogger $auditLogger,
    ) {
    }

    public function paginate(array $filters): LengthAwarePaginator
    {
        return $this->customerGroups->paginateFiltered($filters);
    }

    public function create(string $businessId, array $data, ?User $actor = null): CustomerGroup
    {
        $payload = $this->normalizePayload($businessId, $data);

        /** @var CustomerGroup $customerGroup */
        $customerGroup = $this->customerGroups->create($payload);

        $this->auditLogger->log(
            'created',
            CustomerGroup::class,
            $customerGroup->id,
            $actor,
            $businessId,
            null,
            $this->auditPayload($customerGroup)
        );

        return $customerGroup;
    }

    public function update(string $businessId, CustomerGroup $customerGroup, array $data, ?User $actor = null): CustomerGroup
    {
        $this->ensureBelongsToBusiness($businessId, $customerGroup);
        $before = $this->auditPayload($customerGroup);
        $payload = $this->normalizePayload($businessId, $data, $customerGroup);

        /** @var CustomerGroup $updatedCustomerGroup */
        $updatedCustomerGroup = $this->customerGroups->update($customerGroup, $payload);

        $this->auditLogger->log(
            'updated',
            CustomerGroup::class,
            $updatedCustomerGroup->id,
            $actor,
            $businessId,
            $before,
            $this->auditPayload($updatedCustomerGroup)
        );

        return $updatedCustomerGroup;
    }

    public function delete(string $businessId, CustomerGroup $customerGroup, ?User $actor = null): void
    {
        $this->ensureBelongsToBusiness($businessId, $customerGroup);
        $this->ensureCustomerGroupCanBeDeleted($customerGroup);
        $before = $this->auditPayload($customerGroup);

        $this->customerGroups->delete($customerGroup);

        $this->auditLogger->log(
            'deleted',
            CustomerGroup::class,
            $customerGroup->id,
            $actor,
            $businessId,
            $before,
            null
        );
    }

    protected function normalizePayload(string $businessId, array $data, ?CustomerGroup $customerGroup = null): array
    {
        $priceGroupId = array_key_exists('price_group_id', $data)
            ? $data['price_group_id']
            : $customerGroup?->price_group_id;

        $this->ensurePriceGroupIsValid($businessId, $priceGroupId);

        return [
            'business_id' => $businessId,
            'name' => $data['name'] ?? $customerGroup?->name,
            'discount' => array_key_exists('discount', $data)
                ? round((float) $data['discount'], 2)
                : $customerGroup?->discount,
            'price_group_id' => filled($priceGroupId) ? (string) $priceGroupId : null,
        ];
    }

    protected function ensureBelongsToBusiness(string $businessId, CustomerGroup $customerGroup): void
    {
        if ((string) $customerGroup->business_id !== $businessId) {
            throw new DomainException('Customer group does not belong to the current business.', 422);
        }
    }

    protected function ensurePriceGroupIsValid(string $businessId, mixed $priceGroupId): void
    {
        if (! filled($priceGroupId)) {
            return;
        }

        if (! PriceGroup::withoutGlobalScopes()->where('business_id', $businessId)->where('id', $priceGroupId)->exists()) {
            throw new DomainException('Selected price group is invalid for this business.', 422);
        }
    }

    protected function ensureCustomerGroupCanBeDeleted(CustomerGroup $customerGroup): void
    {
        if (
            Schema::hasTable('customers')
            && Schema::hasColumn('customers', 'customer_group_id')
            && DB::table('customers')->where('customer_group_id', $customerGroup->id)->exists()
        ) {
            throw new DomainException('Customer group cannot be deleted because it is still assigned to customers.', 422);
        }
    }

    protected function auditPayload(CustomerGroup $customerGroup): array
    {
        return [
            'id' => $customerGroup->id,
            'business_id' => $customerGroup->business_id,
            'name' => $customerGroup->name,
            'discount' => (string) $customerGroup->discount,
            'price_group_id' => $customerGroup->price_group_id,
        ];
    }
}
