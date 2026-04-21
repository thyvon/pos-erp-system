<?php

namespace App\Repositories\Sales;

use App\Models\CashRegister;
use App\Repositories\BaseRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class CashRegisterRepository extends BaseRepository
{
    public function __construct(CashRegister $model)
    {
        parent::__construct($model);
    }

    public function paginateFiltered(array $filters): LengthAwarePaginator
    {
        $perPage = max(1, min((int) ($filters['per_page'] ?? 15), 100));

        $query = $this->query()
            ->with([
                'branch',
                'sessions.user',
            ])
            ->withCount('sessions')
            ->when(
                filled($filters['search'] ?? null),
                function ($query) use ($filters): void {
                    $search = trim((string) $filters['search']);

                    $query->where(function ($builder) use ($search): void {
                        $builder
                            ->where('name', 'like', "%{$search}%")
                            ->orWhereHas('branch', fn ($branchQuery) => $branchQuery->where('name', 'like', "%{$search}%"));
                    });
                }
            )
            ->when(
                filled($filters['branch_id'] ?? null),
                fn ($query) => $query->where('branch_id', $filters['branch_id'])
            )
            ->when(
                filled($filters['status'] ?? null),
                fn ($query) => $query->where('is_active', $filters['status'] === 'active')
            )
            ->orderBy('name');

        return $query->paginate($perPage)->withQueryString();
    }
}
