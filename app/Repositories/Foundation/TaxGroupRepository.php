<?php

namespace App\Repositories\Foundation;

use App\Models\TaxGroup;
use App\Repositories\BaseRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class TaxGroupRepository extends BaseRepository
{
    public function __construct(TaxGroup $model)
    {
        parent::__construct($model);
    }

    public function paginateFiltered(array $filters): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 15);
        $perPage = max(1, min($perPage, 100));

        return $this->query()
            ->with(['taxRates:id,name,type,rate'])
            ->when(
                filled($filters['search'] ?? null),
                function ($query) use ($filters): void {
                    $search = trim((string) $filters['search']);

                    $query->where('name', 'like', "%{$search}%");
                }
            )
            ->when(
                array_key_exists('is_active', $filters) && $filters['is_active'] !== '' && $filters['is_active'] !== null,
                fn ($query) => $query->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? (bool) $filters['is_active'])
            )
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();
    }
}
