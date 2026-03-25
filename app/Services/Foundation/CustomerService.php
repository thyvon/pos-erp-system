<?php

namespace App\Services\Foundation;

use App\Exceptions\Domain\DomainException;
use App\Models\Customer;
use App\Models\CustomerGroup;
use App\Models\User;
use App\Repositories\Foundation\CustomerRepository;
use App\Support\Audit\AuditLogger;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CustomerService
{
    public function __construct(
        protected CustomerRepository $customers,
        protected AuditLogger $auditLogger,
    ) {
    }

    public function paginate(array $filters): LengthAwarePaginator
    {
        return $this->customers->paginateFiltered($filters);
    }

    public function create(string $businessId, array $data, ?User $actor = null): Customer
    {
        return DB::transaction(function () use ($businessId, $data, $actor): Customer {
            $payload = $this->normalizePayload($businessId, $data);
            $payload['code'] = $this->generateCode($businessId);

            /** @var Customer $customer */
            $customer = $this->customers->create($payload);
            $customer = $this->loadCustomer($customer);

            $this->auditLogger->log(
                'created',
                Customer::class,
                $customer->id,
                $actor,
                $businessId,
                null,
                $this->auditPayload($customer)
            );

            if (($payload['credit_limit'] ?? 0) > 0) {
                $this->auditLogger->log(
                    'credit_limit_changed',
                    Customer::class,
                    $customer->id,
                    $actor,
                    $businessId,
                    ['credit_limit' => 0],
                    ['credit_limit' => (string) $payload['credit_limit']]
                );
            }

            return $customer;
        });
    }

    public function update(string $businessId, Customer $customer, array $data, ?User $actor = null): Customer
    {
        return DB::transaction(function () use ($businessId, $customer, $data, $actor): Customer {
            $this->ensureBelongsToBusiness($businessId, $customer);
            $before = $this->auditPayload($customer);
            $previousCreditLimit = (string) $customer->credit_limit;
            $payload = $this->normalizePayload($businessId, $data, $customer);

            /** @var Customer $updatedCustomer */
            $updatedCustomer = $this->customers->update($customer, $payload);
            $updatedCustomer = $this->loadCustomer($updatedCustomer);

            $this->auditLogger->log(
                'updated',
                Customer::class,
                $updatedCustomer->id,
                $actor,
                $businessId,
                $before,
                $this->auditPayload($updatedCustomer)
            );

            if ($previousCreditLimit !== (string) $updatedCustomer->credit_limit) {
                $this->auditLogger->log(
                    'credit_limit_changed',
                    Customer::class,
                    $updatedCustomer->id,
                    $actor,
                    $businessId,
                    ['credit_limit' => $previousCreditLimit],
                    ['credit_limit' => (string) $updatedCustomer->credit_limit]
                );
            }

            return $updatedCustomer;
        });
    }

    public function delete(string $businessId, Customer $customer, ?User $actor = null): void
    {
        $this->ensureBelongsToBusiness($businessId, $customer);
        $before = $this->auditPayload($customer);

        $this->customers->delete($customer);

        $this->auditLogger->log(
            'deleted',
            Customer::class,
            $customer->id,
            $actor,
            $businessId,
            $before,
            null
        );
    }

    protected function normalizePayload(string $businessId, array $data, ?Customer $customer = null): array
    {
        $customerGroupId = array_key_exists('customer_group_id', $data)
            ? $data['customer_group_id']
            : $customer?->customer_group_id;

        $this->ensureCustomerGroupIsValid($businessId, $customerGroupId);
        $customFields = array_key_exists('custom_fields', $data)
            ? $this->validateCustomFields($data['custom_fields'])
            : ($customer?->custom_fields ?? []);

        return [
            'business_id' => $businessId,
            'customer_group_id' => filled($customerGroupId) ? (string) $customerGroupId : null,
            'code' => $customer?->code,
            'name' => $data['name'] ?? $customer?->name,
            'type' => $data['type'] ?? $customer?->type ?? 'individual',
            'email' => $data['email'] ?? $customer?->email,
            'phone' => $data['phone'] ?? $customer?->phone,
            'mobile' => $data['mobile'] ?? $customer?->mobile,
            'tax_id' => $data['tax_id'] ?? $customer?->tax_id,
            'date_of_birth' => $data['date_of_birth'] ?? $customer?->date_of_birth,
            'address' => $data['address'] ?? $customer?->address,
            'credit_limit' => array_key_exists('credit_limit', $data)
                ? round((float) $data['credit_limit'], 2)
                : $customer?->credit_limit ?? 0,
            'pay_term' => array_key_exists('pay_term', $data)
                ? (int) $data['pay_term']
                : $customer?->pay_term ?? 0,
            'opening_balance' => array_key_exists('opening_balance', $data)
                ? round((float) $data['opening_balance'], 2)
                : $customer?->opening_balance ?? 0,
            'status' => $data['status'] ?? $customer?->status ?? 'active',
            'notes' => $data['notes'] ?? $customer?->notes,
            'custom_fields' => $customFields,
            'documents' => $this->normalizeDocuments($data['documents'] ?? ($customer?->documents ?? [])),
        ];
    }

    protected function ensureBelongsToBusiness(string $businessId, Customer $customer): void
    {
        if ((string) $customer->business_id !== $businessId) {
            throw new DomainException('Customer does not belong to the current business.', 422);
        }
    }

    protected function ensureCustomerGroupIsValid(string $businessId, mixed $customerGroupId): void
    {
        if (! filled($customerGroupId)) {
            return;
        }

        $exists = CustomerGroup::query()
            ->where('business_id', $businessId)
            ->whereKey($customerGroupId)
            ->exists();

        if (! $exists) {
            throw new DomainException('Selected customer group is invalid for this business.', 422);
        }
    }

    protected function validateCustomFields(array $customFields): array
    {
        if (! Schema::hasTable('custom_field_definitions')) {
            return $customFields;
        }

        $definitions = DB::table('custom_field_definitions')
            ->where('module', 'customer')
            ->pluck('field_type', 'field_name');

        foreach ($customFields as $key => $value) {
            if (! $definitions->has($key)) {
                throw new DomainException("Custom field {$key} is not defined for customers.", 422);
            }

            if ($definitions[$key] === 'checkbox' && ! is_bool($value)) {
                throw new DomainException("Custom field {$key} must be a boolean value.", 422);
            }
        }

        return $customFields;
    }

    protected function normalizeDocuments(array $documents): array
    {
        return collect($documents)
            ->filter(fn ($document) => filled($document))
            ->map(fn ($document) => is_string($document) ? trim($document) : null)
            ->filter()
            ->values()
            ->all();
    }

    protected function generateCode(string $businessId): string
    {
        $lastCode = $this->customerQueryForBusiness($businessId)
            ->where('code', 'like', 'CUST-%')
            ->lockForUpdate()
            ->orderByDesc('code')
            ->value('code');

        $nextNumber = $lastCode === null
            ? 1
            : ((int) substr($lastCode, 5)) + 1;

        return sprintf('CUST-%05d', $nextNumber);
    }

    protected function customerQueryForBusiness(string $businessId): Builder
    {
        return Customer::withoutGlobalScopes()->where('business_id', $businessId);
    }

    protected function loadCustomer(Customer $customer): Customer
    {
        $loadedCustomer = $customer->load(['customerGroup:id,name']);

        if (Schema::hasTable('sales')) {
            $loadedCustomer->setAttribute(
                'balance',
                (float) DB::table('sales')
                    ->where('customer_id', $customer->id)
                    ->whereIn('status', ['confirmed', 'completed'])
                    ->whereNull('deleted_at')
                    ->selectRaw('COALESCE(SUM(total_amount - paid_amount), 0) as balance')
                    ->value('balance')
            );
        } else {
            $loadedCustomer->setAttribute('balance', 0);
        }

        if (Schema::hasTable('loyalty_transactions')) {
            $loadedCustomer->setAttribute(
                'reward_points_balance',
                (float) DB::table('loyalty_transactions')
                    ->where('customer_id', $customer->id)
                    ->selectRaw('COALESCE(SUM(points), 0) as reward_points_balance')
                    ->value('reward_points_balance')
            );
        } else {
            $loadedCustomer->setAttribute('reward_points_balance', 0);
        }

        return $loadedCustomer;
    }

    protected function auditPayload(Customer $customer): array
    {
        return [
            'id' => $customer->id,
            'business_id' => $customer->business_id,
            'customer_group_id' => $customer->customer_group_id,
            'code' => $customer->code,
            'name' => $customer->name,
            'type' => $customer->type,
            'email' => $customer->email,
            'phone' => $customer->phone,
            'mobile' => $customer->mobile,
            'credit_limit' => (string) $customer->credit_limit,
            'opening_balance' => (string) $customer->opening_balance,
            'status' => $customer->status,
        ];
    }
}
