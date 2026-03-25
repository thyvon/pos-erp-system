<?php

namespace App\Repositories\Catalog;

use App\Models\RackLocation;
use App\Repositories\BaseRepository;
use App\Support\BranchAccess;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class RackLocationRepository extends BaseRepository
{
    public function __construct(RackLocation $model)
    {
        parent::__construct($model);
    }

    public function paginateFiltered(array $filters, $branchAccessScope = null): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 15);
        $perPage = max(1, min($perPage, 100));

        $query = $this->query()
            ->with(['warehouse.branch'])
            ->when(
                filled($filters['search'] ?? null),
                function ($query) use ($filters): void {
                    $search = trim((string) $filters['search']);

                    $query->where(function ($builder) use ($search): void {
                        $builder
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('code', 'like', "%{$search}%")
                            ->orWhere('description', 'like', "%{$search}%");
                    });
                }
            )
            ->when(
                filled($filters['warehouse_id'] ?? null),
                fn ($query) => $query->where('warehouse_id', $filters['warehouse_id'])
            )
            ->orderBy('name');

        if ($branchAccessScope !== null) {
            $query->whereHas('warehouse', fn ($warehouseQuery) => BranchAccess::scopeBranchQuery($warehouseQuery, $branchAccessScope, 'branch_id'));
        }

        return $query->paginate($perPage)->withQueryString();
    }

    public function options($branchAccessScope = null): Collection
    {
        $query = $this->query()
            ->with(['warehouse'])
            ->orderBy('name');

        if ($branchAccessScope !== null) {
            $query->whereHas('warehouse', fn ($warehouseQuery) => BranchAccess::scopeBranchQuery($warehouseQuery, $branchAccessScope, 'branch_id'));
        }

        return $query->get();
    }
}
