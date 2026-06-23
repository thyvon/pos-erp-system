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
            ->with(['owner'])
            ->find($businessId);

        return $business;
    }

    public function findWithUsageOrFail(string $businessId): Business
    {
        /** @var Business $business */
        $business = $this->query()
            ->withCount(['users', 'branches', 'warehouses'])
            ->with(['owner'])
            ->findOrFail($businessId);

        return $business;
    }

    public function paginateFiltered(array $filters): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 15);
        $perPage = max(1, min($perPage, 100));

        return $this->query()
            ->withCount(['users', 'branches', 'warehouses'])
            ->with(['owner'])
            ->when(
                filled($filters['search'] ?? null),
                function ($query) use ($filters): void {
                    $search = trim((string) $filters['search']);

                    $query->where(function ($businessQuery) use ($search): void {
                        $businessQuery
                            ->whereLike('name', "%{$search}%")
                            ->orWhereLike('legal_name', "%{$search}%")
                            ->orWhereLike('email', "%{$search}%")
                            ->orWhereLike('tax_id', "%{$search}%");
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
