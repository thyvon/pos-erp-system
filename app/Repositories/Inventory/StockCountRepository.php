<?php

namespace App\Repositories\Inventory;

use App\Models\StockCount;
use App\Models\User;
use App\Repositories\BaseRepository;
use App\Support\BranchAccess;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class StockCountRepository extends BaseRepository
{
    public function __construct(StockCount $model)
    {
        parent::__construct($model);
    }

    public function paginateFiltered(array $filters, ?User $user = null): LengthAwarePaginator
    {
        $perPage = max(1, min((int) ($filters['per_page'] ?? 15), 100));

        $query = $this->query()
            ->with(['warehouse.branch', 'creator', 'completer'])
            ->when(
                filled($filters['search'] ?? null),
                function ($query) use ($filters): void {
                    $search = trim((string) $filters['search']);

                    $query->where(function ($inner) use ($search): void {
                        $inner
                            ->whereLike('reference_no', "%{$search}%")
                            ->orWhereLike('notes', "%{$search}%");
                    });
                }
            )
            ->when(
                filled($filters['warehouse_id'] ?? null),
                fn ($query) => $query->where('warehouse_id', $filters['warehouse_id'])
            )
            ->when(
                filled($filters['status'] ?? null),
                fn ($query) => $query->where('status', $filters['status'])
            )
            ->when(
                filled($filters['date_from'] ?? null),
                fn ($query) => $query->whereDate('date', '>=', $filters['date_from'])
            )
            ->when(
                filled($filters['date_to'] ?? null),
                fn ($query) => $query->whereDate('date', '<=', $filters['date_to'])
            )
            ->whereHas('warehouse', function ($warehouseQuery) use ($user): void {
                BranchAccess::scopeBranchQuery($warehouseQuery, $user, 'branch_id');
            })
            ->orderByDesc('date')
            ->orderByDesc('created_at');

        return $query->paginate($perPage)->withQueryString();
    }

    public function paginateItems(StockCount $count, array $filters): LengthAwarePaginator
    {
        $perPage = max(1, min((int) ($filters['per_page'] ?? 25), 100));
        $search = trim((string) ($filters['search'] ?? ''));

        $query = $count->items()
            ->with(['product', 'variation', 'lot'])
            ->orderByRaw('case when counted_quantity is null then 0 else 1 end')
            ->orderBy('product_id')
            ->orderBy('variation_id')
            ->orderBy('lot_id');

        if ($search !== '') {
            $query->where(function ($builder) use ($search): void {
                $builder
                    ->whereHas('product', function ($productQuery) use ($search): void {
                        $productQuery
                            ->whereLike('name', "%{$search}%")
                            ->orWhereLike('sku', "%{$search}%");
                    })
                    ->orWhereHas('variation', function ($variationQuery) use ($search): void {
                        $variationQuery
                            ->whereLike('name', "%{$search}%")
                            ->orWhereLike('sku', "%{$search}%");
                    })
                    ->orWhereHas('lot', function ($lotQuery) use ($search): void {
                        $lotQuery->whereLike('lot_number', "%{$search}%");
                    });
            });
        }

        return $query->paginate($perPage)->withQueryString();
    }

    public function paginateEntries(StockCount $count, array $filters): LengthAwarePaginator
    {
        $perPage = max(1, min((int) ($filters['per_page'] ?? 25), 100));
        $search = trim((string) ($filters['search'] ?? ''));

        $query = $count->entries()
            ->with(['product', 'variation', 'stockCountItem.lot', 'creator'])
            ->orderByDesc('created_at')
            ->orderByDesc('id');

        if ($search !== '') {
            $query->where(function ($builder) use ($search): void {
                $builder
                    ->whereHas('product', function ($productQuery) use ($search): void {
                        $productQuery
                            ->whereLike('name', "%{$search}%")
                            ->orWhereLike('sku', "%{$search}%");
                    })
                    ->orWhereHas('variation', function ($variationQuery) use ($search): void {
                        $variationQuery
                            ->whereLike('name', "%{$search}%")
                            ->orWhereLike('sku', "%{$search}%");
                    })
                    ->orWhereHas('stockCountItem.lot', function ($lotQuery) use ($search): void {
                        $lotQuery->whereLike('lot_number', "%{$search}%");
                    })
                    ->orWhereHas('creator', function ($creatorQuery) use ($search): void {
                        $creatorQuery
                            ->whereLike('first_name', "%{$search}%")
                            ->orWhereLike('last_name', "%{$search}%");
                    });
            });
        }

        return $query->paginate($perPage)->withQueryString();
    }
}
