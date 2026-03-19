<?php

namespace App\Services\Foundation;

use App\Exceptions\Domain\DomainException;
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

    public function paginate(array $filters): LengthAwarePaginator
    {
        return $this->warehouses->paginateFiltered($filters);
    }

    public function create(array $data): Warehouse
    {
        return DB::transaction(function () use ($data): Warehouse {
            if (($data['is_default'] ?? false) === true) {
                $this->clearDefaultWarehouses();
            }

            /** @var Warehouse $warehouse */
            $warehouse = $this->warehouses->create($data);

            return $warehouse->load(['branch']);
        });
    }

    public function update(Warehouse $warehouse, array $data): Warehouse
    {
        return DB::transaction(function () use ($warehouse, $data): Warehouse {
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
}
