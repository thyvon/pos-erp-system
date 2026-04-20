<?php

namespace App\Repositories\Accounting;

use App\Models\Journal;
use App\Repositories\BaseRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class JournalRepository extends BaseRepository
{
    public function __construct(Journal $model)
    {
        parent::__construct($model);
    }

    public function paginateFiltered(array $filters): LengthAwarePaginator
    {
        $perPage = max(1, min((int) ($filters['per_page'] ?? 15), 100));

        $query = $this->query()
            ->with(['poster', 'reversedBy'])
            ->withCount('entries')
            ->when(
                filled($filters['search'] ?? null),
                function ($query) use ($filters): void {
                    $search = trim((string) $filters['search']);

                    $query->where(function ($inner) use ($search): void {
                        $inner
                            ->where('journal_number', 'like', "%{$search}%")
                            ->orWhere('description', 'like', "%{$search}%")
                            ->orWhere('reference_type', 'like', "%{$search}%");
                    });
                }
            )
            ->when(
                filled($filters['status'] ?? null),
                function ($query) use ($filters): void {
                    if ($filters['status'] === 'reversed') {
                        $query->whereNotNull('reversed_by_id');
                        return;
                    }

                    if ($filters['status'] === 'posted') {
                        $query->whereNull('reversed_by_id');
                    }
                }
            )
            ->when(
                filled($filters['journal_type'] ?? null),
                fn ($query) => $query->where('type', $filters['journal_type'])
            )
            ->orderByDesc('posted_at')
            ->orderByDesc('created_at');

        return $query->paginate($perPage)->withQueryString();
    }

    public function summary(): array
    {
        $totals = $this->query()
            ->selectRaw('COUNT(*) as total_journals')
            ->selectRaw('SUM(CASE WHEN reversed_by_id IS NULL THEN 1 ELSE 0 END) as posted_journals')
            ->selectRaw('SUM(CASE WHEN reversed_by_id IS NOT NULL THEN 1 ELSE 0 END) as reversed_journals')
            ->selectRaw('COALESCE(SUM(CASE WHEN reversed_by_id IS NULL THEN total_amount ELSE 0 END), 0) as posted_volume')
            ->first();

        return [
            'total_journals' => (int) ($totals?->total_journals ?? 0),
            'posted_journals' => (int) ($totals?->posted_journals ?? 0),
            'reversed_journals' => (int) ($totals?->reversed_journals ?? 0),
            'posted_volume' => round((float) ($totals?->posted_volume ?? 0), 2),
        ];
    }
}
