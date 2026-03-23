<?php

namespace App\Repositories\Foundation;

use App\Models\CustomFieldDefinition;
use App\Repositories\BaseRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class CustomFieldDefinitionRepository extends BaseRepository
{
    public function __construct(CustomFieldDefinition $model)
    {
        parent::__construct($model);
    }

    public function paginateFiltered(array $filters): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 15);
        $perPage = max(1, min($perPage, 100));

        return $this->query()
            ->when(
                filled($filters['search'] ?? null),
                function ($query) use ($filters): void {
                    $search = trim((string) $filters['search']);

                    $query->where(function ($fieldQuery) use ($search): void {
                        $fieldQuery
                            ->where('field_name', 'like', "%{$search}%")
                            ->orWhere('field_label', 'like', "%{$search}%");
                    });
                }
            )
            ->when(
                filled($filters['module'] ?? null),
                fn ($query) => $query->where('module', $filters['module'])
            )
            ->orderBy('module')
            ->orderBy('sort_order')
            ->orderBy('field_label')
            ->paginate($perPage)
            ->withQueryString();
    }
}
