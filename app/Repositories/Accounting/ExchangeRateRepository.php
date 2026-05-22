<?php

namespace App\Repositories\Accounting;

use App\Models\ExchangeRate;
use App\Repositories\BaseRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ExchangeRateRepository extends BaseRepository
{
    public function __construct(ExchangeRate $model)
    {
        parent::__construct($model);
    }

    public function paginateFiltered(array $filters): LengthAwarePaginator
    {
        $perPage = max(1, min((int) ($filters['per_page'] ?? 15), 100));

        $query = $this->query()
            ->when(
                filled($filters['search'] ?? null),
                function ($query) use ($filters): void {
                    $search = trim((string) $filters['search']);

                    $query->where(function ($query) use ($search): void {
                        $query->where('from_currency', 'like', "%{$search}%")
                            ->orWhere('to_currency', 'like', "%{$search}%")
                            ->orWhere('note', 'like', "%{$search}%");
                    });
                }
            )
            ->when(
                filled($filters['from_currency'] ?? null),
                fn ($query) => $query->where('from_currency', strtoupper((string) $filters['from_currency']))
            )
            ->when(
                filled($filters['to_currency'] ?? null),
                fn ($query) => $query->where('to_currency', strtoupper((string) $filters['to_currency']))
            )
            ->when(
                array_key_exists('is_default', $filters) && $filters['is_default'] !== null && $filters['is_default'] !== '',
                fn ($query) => $query->where('is_default', filter_var($filters['is_default'], FILTER_VALIDATE_BOOLEAN))
            )
            ->orderByDesc('is_default')
            ->orderByDesc('effective_date')
            ->orderByDesc('created_at');

        return $query->paginate($perPage)->withQueryString();
    }

    public function summary(): array
    {
        $totals = $this->query()
            ->selectRaw('COUNT(*) as total_rates')
            ->selectRaw("SUM(CASE WHEN is_default = 1 THEN 1 ELSE 0 END) as default_rates")
            ->first();

        return [
            'total_rates' => (int) ($totals?->total_rates ?? 0),
            'default_rates' => (int) ($totals?->default_rates ?? 0),
        ];
    }
}
