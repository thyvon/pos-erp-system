<?php

namespace App\Repositories\Sales;

use App\Models\SaleReturn;
use App\Repositories\BaseRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class SaleReturnRepository extends BaseRepository
{
    public function __construct(SaleReturn $model)
    {
        parent::__construct($model);
    }

    public function paginateFiltered(array $filters): LengthAwarePaginator
    {
        $perPage = max(1, min((int) ($filters['per_page'] ?? 15), 100));

        $query = $this->query()
            ->with(['sale', 'branch', 'warehouse', 'creator'])
            ->withCount('items')
            ->when(
                filled($filters['search'] ?? null),
                function ($query) use ($filters): void {
                    $search = trim((string) $filters['search']);

                    $query->where(function ($builder) use ($search): void {
                        $builder
                            ->where('return_number', 'like', "%{$search}%")
                            ->orWhere('notes', 'like', "%{$search}%")
                            ->orWhereHas('sale', fn ($saleQuery) => $saleQuery->where('sale_number', 'like', "%{$search}%"));
                    });
                }
            )
            ->when(
                filled($filters['sale_id'] ?? null),
                fn ($query) => $query->where('sale_id', $filters['sale_id'])
            )
            ->when(
                filled($filters['branch_id'] ?? null),
                fn ($query) => $query->where('branch_id', $filters['branch_id'])
            )
            ->when(
                filled($filters['warehouse_id'] ?? null),
                fn ($query) => $query->where('warehouse_id', $filters['warehouse_id'])
            )
            ->when(
                filled($filters['date_from'] ?? null),
                fn ($query) => $query->whereDate('return_date', '>=', $filters['date_from'])
            )
            ->when(
                filled($filters['date_to'] ?? null),
                fn ($query) => $query->whereDate('return_date', '<=', $filters['date_to'])
            )
            ->orderByDesc('return_date')
            ->orderByDesc('created_at');

        return $query->paginate($perPage)->withQueryString();
    }
}
