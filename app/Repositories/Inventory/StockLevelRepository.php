<?php

namespace App\Repositories\Inventory;

use App\Models\StockLevel;
use App\Models\User;
use App\Repositories\BaseRepository;
use App\Support\BranchAccess;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class StockLevelRepository extends BaseRepository
{
    public function __construct(StockLevel $model)
    {
        parent::__construct($model);
    }

    public function paginateFiltered(array $filters, ?User $user = null): LengthAwarePaginator
    {
        $perPage = max(1, min((int) ($filters['per_page'] ?? 15), 100));

        $query = $this->query()
            ->with(['product', 'variation', 'warehouse.branch'])
            ->when(
                filled($filters['search'] ?? null),
                function ($query) use ($filters): void {
                    $search = trim((string) $filters['search']);

                    $query->where(function ($inner) use ($search): void {
                        $inner
                            ->whereHas('product', fn ($productQuery) => $productQuery
                                ->whereLike('name', "%{$search}%")
                                ->orWhereLike('sku', "%{$search}%"))
                            ->orWhereHas('variation', fn ($variationQuery) => $variationQuery
                                ->whereLike('name', "%{$search}%")
                                ->orWhereLike('sku', "%{$search}%"))
                            ->orWhereHas('warehouse', fn ($warehouseQuery) => $warehouseQuery
                                ->whereLike('name', "%{$search}%")
                                ->orWhereLike('code', "%{$search}%"));
                    });
                }
            )
            ->when(filled($filters['warehouse_id'] ?? null), fn ($query) => $query->where('warehouse_id', $filters['warehouse_id']))
            ->when(filled($filters['product_id'] ?? null), fn ($query) => $query->where('product_id', $filters['product_id']))
            ->when(filled($filters['variation_id'] ?? null), fn ($query) => $query->where('variation_id', $filters['variation_id']))
            ->whereHas('warehouse', function ($warehouseQuery) use ($user): void {
                BranchAccess::scopeBranchQuery($warehouseQuery, $user, 'branch_id');
            })
            ->orderByDesc('updated_at')
            ->orderBy('product_id');

        return $query->paginate($perPage)->withQueryString();
    }
}
