<?php

namespace App\Repositories\Foundation;

use App\Models\Branch;
use App\Models\User;
use App\Repositories\BaseRepository;
use App\Support\BranchAccess;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class BranchRepository extends BaseRepository
{
    public function __construct(Branch $model)
    {
        parent::__construct($model);
    }

    public function paginateFiltered(array $filters, User|array|null $branchAccessScope = null): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 15);
        $perPage = max(1, min($perPage, 100));

        $query = $this->query()
            ->with(['manager'])
            ->when(
                filled($filters['search'] ?? null),
                function ($query) use ($filters): void {
                    $search = trim((string) $filters['search']);

                    $query->where(function ($branchQuery) use ($search): void {
                        $branchQuery
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('code', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    });
                }
            )
            ->when(
                filled($filters['is_active'] ?? null),
                fn ($query) => $query->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? $filters['is_active'])
            )
            ->orderByDesc('is_default')
            ->orderBy('name');

        BranchAccess::scopeBranchQuery($query, $branchAccessScope);

        return $query->paginate($perPage)->withQueryString();
    }
}
