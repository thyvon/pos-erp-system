<?php

namespace App\Repositories\Catalog;

use App\Models\SubUnit;
use App\Models\Unit;
use App\Repositories\BaseRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class UnitRepository extends BaseRepository
{
    public function __construct(Unit $model)
    {
        parent::__construct($model);
    }

    public function paginateFiltered(array $filters): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 15);
        $perPage = max(1, min($perPage, 100));

        return $this->query()
            ->with(['subUnits'])
            ->withCount('subUnits')
            ->when(
                filled($filters['search'] ?? null),
                function ($query) use ($filters): void {
                    $search = trim((string) $filters['search']);

                    $query->where(function ($builder) use ($search): void {
                        $builder
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('short_name', 'like', "%{$search}%");
                    });
                }
            )
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function options(): Collection
    {
        return $this->query()
            ->with(['subUnits'])
            ->orderBy('name')
            ->get();
    }

    public function newSubUnitQuery()
    {
        return (new SubUnit())->newQuery();
    }
}
