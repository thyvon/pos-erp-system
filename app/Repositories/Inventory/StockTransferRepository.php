<?php

namespace App\Repositories\Inventory;

use App\Models\StockTransfer;
use App\Models\User;
use App\Repositories\BaseRepository;
use App\Support\BranchAccess;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class StockTransferRepository extends BaseRepository
{
    public function __construct(StockTransfer $model)
    {
        parent::__construct($model);
    }

    public function paginateFiltered(array $filters, ?User $user = null): LengthAwarePaginator
    {
        $perPage = max(1, min((int) ($filters['per_page'] ?? 15), 100));

        $query = $this->query()
            ->with(['fromWarehouse.branch', 'toWarehouse.branch', 'creator'])
            ->when(
                filled($filters['search'] ?? null),
                function ($query) use ($filters): void {
                    $search = trim((string) $filters['search']);

                    $query->where(function ($inner) use ($search): void {
                        $inner
                            ->where('reference_no', 'like', "%{$search}%")
                            ->orWhere('notes', 'like', "%{$search}%");
                    });
                }
            )
            ->when(
                filled($filters['from_warehouse_id'] ?? null),
                fn ($query) => $query->where('from_warehouse_id', $filters['from_warehouse_id'])
            )
            ->when(
                filled($filters['to_warehouse_id'] ?? null),
                fn ($query) => $query->where('to_warehouse_id', $filters['to_warehouse_id'])
            )
            ->when(
                filled($filters['date_from'] ?? null),
                fn ($query) => $query->whereDate('date', '>=', $filters['date_from'])
            )
            ->when(
                filled($filters['date_to'] ?? null),
                fn ($query) => $query->whereDate('date', '<=', $filters['date_to'])
            )
            ->when($user && ! $user->hasRole('super_admin'), function ($query) use ($user): void {
                $branchIds = $user->accessibleBranchIds();

                $query->where(function ($transferQuery) use ($branchIds): void {
                    $transferQuery
                        ->whereHas('fromWarehouse', fn ($warehouseQuery) => BranchAccess::scopeBranchQuery($warehouseQuery, $branchIds, 'branch_id'))
                        ->orWhereHas('toWarehouse', fn ($warehouseQuery) => BranchAccess::scopeBranchQuery($warehouseQuery, $branchIds, 'branch_id'));
                });
            })
            ->orderByDesc('date')
            ->orderByDesc('created_at');

        return $query->paginate($perPage)->withQueryString();
    }
}
