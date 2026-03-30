<?php

namespace App\Repositories\Inventory;

use App\Models\StockAdjustment;
use App\Models\User;
use App\Repositories\BaseRepository;
use App\Support\BranchAccess;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class StockAdjustmentRepository extends BaseRepository
{
    public function __construct(StockAdjustment $model)
    {
        parent::__construct($model);
    }

    public function paginateFiltered(array $filters, ?User $user = null): LengthAwarePaginator
    {
        $perPage = max(1, min((int) ($filters['per_page'] ?? 15), 100));

        $query = $this->query()
            ->with(['warehouse.branch', 'creator'])
            ->when(
                filled($filters['search'] ?? null),
                function ($query) use ($filters): void {
                    $search = trim((string) $filters['search']);

                    $query->where(function ($inner) use ($search): void {
                        $inner
                            ->where('reference_no', 'like', "%{$search}%")
                            ->orWhere('reason', 'like', "%{$search}%")
                            ->orWhere('notes', 'like', "%{$search}%");
                    });
                }
            )
            ->when(
                filled($filters['warehouse_id'] ?? null),
                fn ($query) => $query->where('warehouse_id', $filters['warehouse_id'])
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
}
