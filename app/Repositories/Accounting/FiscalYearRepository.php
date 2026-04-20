<?php

namespace App\Repositories\Accounting;

use App\Models\FiscalYear;
use App\Repositories\BaseRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class FiscalYearRepository extends BaseRepository
{
    public function __construct(FiscalYear $model)
    {
        parent::__construct($model);
    }

    public function paginateFiltered(array $filters): LengthAwarePaginator
    {
        $perPage = max(1, min((int) ($filters['per_page'] ?? 15), 100));

        $query = $this->query()
            ->withCount('journals')
            ->when(
                filled($filters['search'] ?? null),
                fn ($query) => $query->where('name', 'like', '%'.trim((string) $filters['search']).'%')
            )
            ->when(
                filled($filters['status'] ?? null),
                fn ($query) => $query->where('status', $filters['status'])
            )
            ->orderByDesc('start_date');

        return $query->paginate($perPage)->withQueryString();
    }

    public function summary(): array
    {
        $totals = $this->query()
            ->selectRaw('COUNT(*) as total_years')
            ->selectRaw("SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_years")
            ->selectRaw("SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_years")
            ->first();

        return [
            'total_years' => (int) ($totals?->total_years ?? 0),
            'active_years' => (int) ($totals?->active_years ?? 0),
            'closed_years' => (int) ($totals?->closed_years ?? 0),
        ];
    }
}
