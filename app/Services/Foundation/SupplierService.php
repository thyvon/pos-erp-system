<?php

namespace App\Services\Foundation;

use App\Exceptions\Domain\DomainException;
use App\Models\Supplier;
use App\Models\User;
use App\Repositories\Foundation\SupplierRepository;
use App\Support\Audit\AuditLogger;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SupplierService
{
    public function __construct(
        protected SupplierRepository $suppliers,
        protected AuditLogger $auditLogger,
    ) {
    }

    public function paginate(array $filters): LengthAwarePaginator
    {
        return $this->suppliers->paginateFiltered($filters);
    }

    public function create(string $businessId, array $data, ?User $actor = null): Supplier
    {
        return DB::transaction(function () use ($businessId, $data, $actor): Supplier {
            $payload = $this->normalizePayload($data);
            $payload['business_id'] = $businessId;
            $payload['code'] = $this->generateCode($businessId);

            /** @var Supplier $supplier */
            $supplier = $this->suppliers->create($payload);
            $supplier = $this->loadSupplier($supplier);

            $this->auditLogger->log(
                'created',
                Supplier::class,
                $supplier->id,
                $actor,
                $businessId,
                null,
                $this->auditPayload($supplier)
            );

            return $supplier;
        });
    }

    public function update(string $businessId, Supplier $supplier, array $data, ?User $actor = null): Supplier
    {
        return DB::transaction(function () use ($businessId, $supplier, $data, $actor): Supplier {
            $this->ensureBelongsToBusiness($businessId, $supplier);
            $before = $this->auditPayload($supplier);
            $payload = $this->normalizePayload($data, $supplier);

            /** @var Supplier $updatedSupplier */
            $updatedSupplier = $this->suppliers->update($supplier, $payload);
            $updatedSupplier = $this->loadSupplier($updatedSupplier);

            $this->auditLogger->log(
                'updated',
                Supplier::class,
                $updatedSupplier->id,
                $actor,
                $businessId,
                $before,
                $this->auditPayload($updatedSupplier)
            );

            return $updatedSupplier;
        });
    }

    public function delete(string $businessId, Supplier $supplier, ?User $actor = null): void
    {
        $this->ensureBelongsToBusiness($businessId, $supplier);
        $before = $this->auditPayload($supplier);

        $this->suppliers->delete($supplier);

        $this->auditLogger->log(
            'deleted',
            Supplier::class,
            $supplier->id,
            $actor,
            $businessId,
            $before,
            null
        );
    }

    protected function normalizePayload(array $data, ?Supplier $supplier = null): array
    {
        $customFields = array_key_exists('custom_fields', $data)
            ? $this->validateCustomFields($data['custom_fields'])
            : ($supplier?->custom_fields ?? []);

        return [
            'name' => $data['name'] ?? $supplier?->name,
            'company' => $data['company'] ?? $supplier?->company,
            'email' => $data['email'] ?? $supplier?->email,
            'phone' => $data['phone'] ?? $supplier?->phone,
            'mobile' => $data['mobile'] ?? $supplier?->mobile,
            'tax_id' => $data['tax_id'] ?? $supplier?->tax_id,
            'address' => $data['address'] ?? $supplier?->address,
            'pay_term' => array_key_exists('pay_term', $data)
                ? (int) $data['pay_term']
                : $supplier?->pay_term ?? 0,
            'opening_balance' => array_key_exists('opening_balance', $data)
                ? round((float) $data['opening_balance'], 2)
                : $supplier?->opening_balance ?? 0,
            'status' => $data['status'] ?? $supplier?->status ?? 'active',
            'notes' => $data['notes'] ?? $supplier?->notes,
            'custom_fields' => $customFields,
            'documents' => $this->normalizeDocuments($data['documents'] ?? ($supplier?->documents ?? [])),
        ];
    }

    protected function ensureBelongsToBusiness(string $businessId, Supplier $supplier): void
    {
        if ((string) $supplier->business_id !== $businessId) {
            throw new DomainException('Supplier does not belong to the current business.', 422);
        }
    }

    protected function validateCustomFields(array $customFields): array
    {
        if (! Schema::hasTable('custom_field_definitions')) {
            return $customFields;
        }

        $definitions = DB::table('custom_field_definitions')
            ->where('module', 'supplier')
            ->pluck('field_type', 'field_name');

        foreach ($customFields as $key => $value) {
            if (! $definitions->has($key)) {
                throw new DomainException("Custom field {$key} is not defined for suppliers.", 422);
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
        $lastCode = $this->supplierQueryForBusiness($businessId)
            ->where('code', 'like', 'SUPP-%')
            ->lockForUpdate()
            ->orderByDesc('code')
            ->value('code');

        $nextNumber = $lastCode === null
            ? 1
            : ((int) substr($lastCode, 5)) + 1;

        return sprintf('SUPP-%05d', $nextNumber);
    }

    protected function supplierQueryForBusiness(string $businessId): Builder
    {
        return Supplier::withoutGlobalScopes()->where('business_id', $businessId);
    }

    protected function loadSupplier(Supplier $supplier): Supplier
    {
        if (Schema::hasTable('purchases')) {
            $supplier->setAttribute(
                'balance',
                (float) DB::table('purchases')
                    ->where('supplier_id', $supplier->id)
                    ->whereIn('status', ['confirmed', 'received'])
                    ->whereNull('deleted_at')
                    ->selectRaw('COALESCE(SUM(total_amount - paid_amount), 0) as balance')
                    ->value('balance')
            );
        } else {
            $supplier->setAttribute('balance', 0);
        }

        return $supplier;
    }

    protected function auditPayload(Supplier $supplier): array
    {
        return [
            'id' => $supplier->id,
            'business_id' => $supplier->business_id,
            'code' => $supplier->code,
            'name' => $supplier->name,
            'company' => $supplier->company,
            'email' => $supplier->email,
            'phone' => $supplier->phone,
            'mobile' => $supplier->mobile,
            'opening_balance' => (string) $supplier->opening_balance,
            'status' => $supplier->status,
        ];
    }
}
