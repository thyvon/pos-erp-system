<?php

namespace App\Repositories\Foundation;

use App\Models\Business;
use App\Repositories\BaseRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class BusinessRepository extends BaseRepository
{
    public function __construct(Business $model)
    {
        parent::__construct($model);
    }

    public function findWithUsage(string $businessId): ?Business
    {
        /** @var Business|null $business */
        $business = $this->query()
            ->withCount(['users', 'branches', 'warehouses'])
            ->with(['users' => fn ($query) => $query->withoutGlobalScopes()->orderBy('created_at')])
            ->find($businessId);

        return $business;
    }

    public function findWithUsageOrFail(string $businessId): Business
    {
        /** @var Business $business */
        $business = $this->query()
            ->withCount(['users', 'branches', 'warehouses'])
            ->with(['users' => fn ($query) => $query->withoutGlobalScopes()->orderBy('created_at')])
            ->findOrFail($businessId);

        return $business;
    }

    public function paginateFiltered(array $filters): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 15);
        $perPage = max(1, min($perPage, 100));

        return $this->query()
            ->withCount(['users', 'branches', 'warehouses'])
            ->with(['users' => fn ($query) => $query->withoutGlobalScopes()->orderBy('created_at')])
            ->when(
                filled($filters['search'] ?? null),
                function ($query) use ($filters): void {
                    $search = trim((string) $filters['search']);

                    $query->where(function ($businessQuery) use ($search): void {
                        $businessQuery
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('legal_name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('tax_id', 'like', "%{$search}%");
                    });
                }
            )
            ->when(
                filled($filters['status'] ?? null),
                fn ($query) => $query->where('status', $filters['status'])
            )
            ->when(
                filled($filters['tier'] ?? null),
                fn ($query) => $query->where('tier', $filters['tier'])
            )
            ->latest()
            ->paginate($perPage)
            ->withQueryString();
    }
}
