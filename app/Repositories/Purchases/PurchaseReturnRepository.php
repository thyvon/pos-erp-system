<?php

namespace App\Repositories\Purchases;

use App\Models\PurchaseReturn;
use App\Models\User;
use App\Repositories\BaseRepository;
use App\Support\BranchAccess;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class PurchaseReturnRepository extends BaseRepository
{
    public function __construct(PurchaseReturn $model)
    {
        parent::__construct($model);
    }

    public function paginateFiltered(array $filters, ?User $user = null): LengthAwarePaginator
    {
        $perPage = max(1, min((int) ($filters['per_page'] ?? 15), 100));

        $query = $this->query()
            ->with(['purchase', 'branch', 'warehouse', 'creator'])
            ->withCount('items')
            ->when(
                filled($filters['search'] ?? null),
                function ($query) use ($filters): void {
                    $search = trim((string) $filters['search']);

                    $query->where(function ($builder) use ($search): void {
                        $builder
                            ->whereLike('return_number', "%{$search}%")
                            ->orWhereLike('notes', "%{$search}%")
                            ->orWhereHas('purchase', fn ($purchaseQuery) => $purchaseQuery->whereLike('purchase_number', "%{$search}%"));
                    });
                }
            )
            ->when(
                filled($filters['purchase_id'] ?? null),
                fn ($query) => $query->where('purchase_id', $filters['purchase_id'])
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
            ->where(function ($query) use ($user): void {
                BranchAccess::scopeBranchQuery($query, $user, 'branch_id');
            })
            ->orderByDesc('return_date')
            ->orderByDesc('created_at');

        return $query->paginate($perPage)->withQueryString();
    }
}
