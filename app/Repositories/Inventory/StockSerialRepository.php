<?php

namespace App\Repositories\Inventory;

use App\Models\StockSerial;
use App\Models\User;
use App\Repositories\BaseRepository;
use App\Support\BranchAccess;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class StockSerialRepository extends BaseRepository
{
    public function __construct(StockSerial $model)
    {
        parent::__construct($model);
    }

    public function paginateFiltered(array $filters, ?User $user = null): LengthAwarePaginator
    {
        $perPage = max(1, min((int) ($filters['per_page'] ?? 15), 100));

        $query = $this->query()
            ->with(['product', 'variation', 'warehouse.branch', 'supplier'])
            ->when(
                filled($filters['search'] ?? null),
                function ($query) use ($filters): void {
                    $search = trim((string) $filters['search']);

                    $query->where(function ($inner) use ($search): void {
                        $inner
                            ->where('serial_number', 'like', "%{$search}%")
                            ->orWhereHas('product', fn ($productQuery) => $productQuery->where('name', 'like', "%{$search}%")->orWhere('sku', 'like', "%{$search}%"));
                    });
                }
            )
            ->when(filled($filters['warehouse_id'] ?? null), fn ($query) => $query->where('warehouse_id', $filters['warehouse_id']))
            ->when(filled($filters['product_id'] ?? null), fn ($query) => $query->where('product_id', $filters['product_id']))
            ->when(filled($filters['status'] ?? null), fn ($query) => $query->where('status', $filters['status']))
            ->when($user && ! $user->hasRole('super_admin'), function ($query) use ($user): void {
                $query->whereHas('warehouse', function ($warehouseQuery) use ($user): void {
                    BranchAccess::scopeBranchQuery($warehouseQuery, $user, 'branch_id');
                });
            })
            ->orderBy('serial_number');

        return $query->paginate($perPage)->withQueryString();
    }
}
