<?php

namespace App\Repositories\Foundation;

use App\Models\CustomerGroup;
use App\Repositories\BaseRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class CustomerGroupRepository extends BaseRepository
{
    public function __construct(CustomerGroup $model)
    {
        parent::__construct($model);
    }

    public function paginateFiltered(array $filters): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 15);
        $perPage = max(1, min($perPage, 100));

        return $this->query()
            ->with('priceGroup:id,name')
            ->when(
                filled($filters['search'] ?? null),
                function ($query) use ($filters): void {
                    $search = trim((string) $filters['search']);

                    $query->where('name', 'like', "%{$search}%");
                }
            )
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();
    }
}
