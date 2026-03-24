<?php

namespace App\Repositories\Foundation;

use App\Models\Warehouse;
use App\Models\User;
use App\Repositories\BaseRepository;
use App\Support\BranchAccess;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class WarehouseRepository extends BaseRepository
{
    public function __construct(Warehouse $model)
    {
        parent::__construct($model);
    }

    public function paginateFiltered(array $filters, User|array|null $branchAccessScope = null): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 15);
        $perPage = max(1, min($perPage, 100));

        $query = $this->query()
            ->with(['branch'])
            ->when(
                filled($filters['search'] ?? null),
                function ($query) use ($filters): void {
                    $search = trim((string) $filters['search']);

                    $query->where(function ($warehouseQuery) use ($search): void {
                        $warehouseQuery
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('code', 'like', "%{$search}%");
                    });
                }
            )
            ->when(
                filled($filters['type'] ?? null),
                fn ($query) => $query->where('type', $filters['type'])
            )
            ->when(
                filled($filters['branch_id'] ?? null),
                fn ($query) => $query->where('branch_id', $filters['branch_id'])
            )
            ->orderByDesc('is_default')
            ->orderBy('name');

        BranchAccess::scopeBranchQuery($query, $branchAccessScope, 'branch_id');

        return $query->paginate($perPage)->withQueryString();
    }
}
