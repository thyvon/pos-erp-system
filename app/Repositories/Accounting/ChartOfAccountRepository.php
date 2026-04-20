<?php

namespace App\Repositories\Accounting;

use App\Models\ChartOfAccount;
use App\Repositories\BaseRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class ChartOfAccountRepository extends BaseRepository
{
    public function __construct(ChartOfAccount $model)
    {
        parent::__construct($model);
    }

    public function paginateFiltered(array $filters): LengthAwarePaginator
    {
        $perPage = max(1, min((int) ($filters['per_page'] ?? 15), 100));

        $query = $this->query()
            ->with(['parent'])
            ->withCount(['children', 'journalEntries', 'paymentAccounts'])
            ->when(
                filled($filters['search'] ?? null),
                function ($query) use ($filters): void {
                    $search = trim((string) $filters['search']);

                    $query->where(function ($inner) use ($search): void {
                        $inner
                            ->where('code', 'like', "%{$search}%")
                            ->orWhere('name', 'like', "%{$search}%")
                            ->orWhere('sub_type', 'like', "%{$search}%");
                    });
                }
            )
            ->when(
                filled($filters['type'] ?? null),
                fn ($query) => $query->where('type', $filters['type'])
            )
            ->when(
                filled($filters['status'] ?? null),
                fn ($query) => $query->where('is_active', $filters['status'] === 'active')
            )
            ->orderBy('code');

        return $query->paginate($perPage)->withQueryString();
    }

    public function summary(): array
    {
        $totals = $this->query()
            ->selectRaw('COUNT(*) as total_accounts')
            ->selectRaw('SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_accounts')
            ->selectRaw('SUM(CASE WHEN is_system = 1 THEN 1 ELSE 0 END) as system_accounts')
            ->first();

        $postableAccounts = $this->query()
            ->whereNotExists(function ($query): void {
                $query->select(DB::raw(1))
                    ->from('chart_of_accounts as children')
                    ->whereColumn('children.parent_id', 'chart_of_accounts.id');
            })
            ->count();

        return [
            'total_accounts' => (int) ($totals?->total_accounts ?? 0),
            'postable_accounts' => (int) $postableAccounts,
            'system_accounts' => (int) ($totals?->system_accounts ?? 0),
            'active_accounts' => (int) ($totals?->active_accounts ?? 0),
        ];
    }
}
