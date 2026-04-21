<?php

namespace App\Repositories\Sales;

use App\Models\Sale;
use App\Repositories\BaseRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class SaleRepository extends BaseRepository
{
    public function __construct(Sale $model)
    {
        parent::__construct($model);
    }

    public function paginateFiltered(array $filters): LengthAwarePaginator
    {
        $perPage = max(1, min((int) ($filters['per_page'] ?? 15), 100));

        $query = $this->query()
            ->with([
                'branch',
                'warehouse',
                'customer',
                'cashRegisterSession.cashRegister',
                'creator',
            ])
            ->when(
                filled($filters['search'] ?? null),
                function ($query) use ($filters): void {
                    $search = trim((string) $filters['search']);

                    $query->where(function ($builder) use ($search): void {
                        $builder
                            ->where('sale_number', 'like', "%{$search}%")
                            ->orWhere('notes', 'like', "%{$search}%")
                            ->orWhereHas('customer', fn ($customerQuery) => $customerQuery->where('name', 'like', "%{$search}%"));
                    });
                }
            )
            ->when(
                filled($filters['status'] ?? null),
                fn ($query) => $query->where('status', $filters['status'])
            )
            ->when(
                filled($filters['type'] ?? null),
                fn ($query) => $query->where('type', $filters['type'])
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
                filled($filters['customer_id'] ?? null),
                fn ($query) => $query->where('customer_id', $filters['customer_id'])
            )
            ->when(
                filled($filters['date_from'] ?? null),
                fn ($query) => $query->whereDate('sale_date', '>=', $filters['date_from'])
            )
            ->when(
                filled($filters['date_to'] ?? null),
                fn ($query) => $query->whereDate('sale_date', '<=', $filters['date_to'])
            )
            ->orderByDesc('sale_date')
            ->orderByDesc('created_at');

        return $query->paginate($perPage)->withQueryString();
    }
}
