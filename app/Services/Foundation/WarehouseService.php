<?php

namespace App\Services\Foundation;

use App\Exceptions\Domain\DomainException;
use App\Models\Business;
use App\Models\User;
use App\Models\Warehouse;
use App\Repositories\Foundation\WarehouseRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class WarehouseService
{
    public function __construct(protected WarehouseRepository $warehouses)
    {
    }

    public function paginate(array $filters, User|array|null $branchAccessScope = null): LengthAwarePaginator
    {
        return $this->warehouses->paginateFiltered($filters, $branchAccessScope);
    }

    public function create(array $data): Warehouse
    {
        return DB::transaction(function () use ($data): Warehouse {
            $this->resolveBusiness();
            $this->ensureUserCanAccessBranch($data['branch_id']);

            if (blank($data['code'] ?? null)) {
                $data['code'] = $this->generateCode();
            }

            if (($data['is_default'] ?? false) === true) {
                $this->clearDefaultWarehouses();
            } elseif (! Warehouse::query()->exists()) {
                $data['is_default'] = true;
            }

            /** @var Warehouse $warehouse */
            $warehouse = $this->warehouses->create($data);

            return $warehouse->load(['branch']);
        });
    }

    public function update(Warehouse $warehouse, array $data): Warehouse
    {
        return DB::transaction(function () use ($warehouse, $data): Warehouse {
            if (array_key_exists('branch_id', $data) && $data['branch_id'] !== null) {
                $this->ensureUserCanAccessBranch($data['branch_id']);
            }

            if (array_key_exists('code', $data) && blank($data['code'])) {
                $data['code'] = $warehouse->code;
            }

            if (($data['is_default'] ?? false) === true) {
                $this->clearDefaultWarehouses($warehouse->id);
            }

            /** @var Warehouse $updatedWarehouse */
            $updatedWarehouse = $this->warehouses->update($warehouse, $data);

            return $updatedWarehouse->load(['branch']);
        });
    }

    public function delete(Warehouse $warehouse): void
    {
        if ($this->hasStockMovements($warehouse)) {
            throw new DomainException('Warehouse cannot be deleted because it has stock movements.', 422);
        }

        $this->warehouses->delete($warehouse);
    }

    protected function resolveBusiness(): Business
    {
        $business = app()->bound('tenant')
            ? app('tenant')
            : auth()->user()?->business;

        if (! $business instanceof Business) {
            throw new DomainException('Tenant context is required to manage warehouses.', 422);
        }

        return $business;
    }

    protected function clearDefaultWarehouses(?string $exceptId = null): void
    {
        $query = Warehouse::query()->where('is_default', true);

        if ($exceptId !== null) {
            $query->whereKeyNot($exceptId);
        }

        $query->update(['is_default' => false]);
    }

    protected function hasStockMovements(Warehouse $warehouse): bool
    {
        if (! Schema::hasTable('stock_movements')) {
            return false;
        }

        return DB::table('stock_movements')
            ->where('warehouse_id', $warehouse->id)
            ->exists();
    }

    protected function generateCode(): string
    {
        $lastCode = Warehouse::query()
            ->where('code', 'like', 'WH-%')
            ->orderByDesc('code')
            ->value('code');

        $nextNumber = $lastCode === null
            ? 1
            : ((int) substr($lastCode, 3)) + 1;

        return sprintf('WH-%03d', $nextNumber);
    }

    protected function ensureUserCanAccessBranch(string $branchId): void
    {
        $user = auth()->user();

        if ($user instanceof \App\Models\User && ! $user->hasRole('super_admin') && ! $user->hasBranchAccess($branchId)) {
            throw new DomainException('You cannot manage warehouse data outside your assigned branches.', 403);
        }
    }
}
