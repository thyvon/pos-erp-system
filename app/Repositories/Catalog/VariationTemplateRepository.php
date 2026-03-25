<?php

namespace App\Repositories\Catalog;

use App\Models\VariationTemplate;
use App\Models\VariationValue;
use App\Repositories\BaseRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class VariationTemplateRepository extends BaseRepository
{
    public function __construct(VariationTemplate $model)
    {
        parent::__construct($model);
    }

    public function paginateFiltered(array $filters): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 15);
        $perPage = max(1, min($perPage, 100));

        return $this->query()
            ->with(['values'])
            ->withCount('values')
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

    public function options(): Collection
    {
        return $this->query()
            ->with(['values'])
            ->orderBy('name')
            ->get();
    }

    public function newValueQuery()
    {
        return (new VariationValue())->newQuery();
    }
}
