<?php

namespace App\Repositories\Foundation;

use App\Models\Customer;
use App\Repositories\BaseRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CustomerRepository extends BaseRepository
{
    public function __construct(Customer $model)
    {
        parent::__construct($model);
    }

    public function paginateFiltered(array $filters): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 15);
        $perPage = max(1, min($perPage, 100));

        $query = $this->query()
            ->select('customers.*')
            ->with(['customerGroup:id,name'])
            ->when(
                filled($filters['status'] ?? null),
                fn (Builder $builder) => $builder->where('status', $filters['status'])
            )
            ->when(
                filled($filters['customer_group_id'] ?? null),
                fn (Builder $builder) => $builder->where('customer_group_id', $filters['customer_group_id'])
            );

        $this->applySearch($query, trim((string) ($filters['search'] ?? '')));
        $this->applyComputedColumns($query);

        return $query
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();
    }

    protected function applySearch(Builder $query, string $search): void
    {
        if ($search === '') {
            return;
        }

        $driver = DB::getDriverName();

        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            $booleanTerms = collect(preg_split('/\s+/', $search) ?: [])
                ->filter(fn (?string $term) => filled($term))
                ->map(fn (string $term) => '+'.$term.'*')
                ->implode(' ');

            $query->where(function (Builder $builder) use ($booleanTerms, $search): void {
                $builder->whereRaw(
                    "MATCH(name,email,phone,mobile) AGAINST (? IN BOOLEAN MODE)",
                    [$booleanTerms]
                );

                if (preg_match('/^[0-9+\\-\\s]+$/', $search) === 1) {
                    $builder
                        ->orWhere('phone', 'like', $search.'%')
                        ->orWhere('mobile', 'like', $search.'%');
                }
            });

            return;
        }

        // SQLite test fallback. Production should use the FULLTEXT branch above.
        $query->where(function (Builder $builder) use ($search): void {
            $builder
                ->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")
                ->orWhere('phone', 'like', "%{$search}%")
                ->orWhere('mobile', 'like', "%{$search}%");
        });
    }

    protected function applyComputedColumns(Builder $query): void
    {
        if (Schema::hasTable('sales')) {
            $query->selectSub(
                DB::table('sales')
                    ->selectRaw('COALESCE(SUM(total_amount - paid_amount), 0)')
                    ->whereColumn('customer_id', 'customers.id')
                    ->whereIn('status', ['confirmed', 'completed'])
                    ->whereNull('deleted_at'),
                'balance'
            );
        } else {
            $query->selectRaw('0 as balance');
        }

        if (Schema::hasTable('loyalty_transactions')) {
            $query->selectSub(
                DB::table('loyalty_transactions')
                    ->selectRaw('COALESCE(SUM(points), 0)')
                    ->whereColumn('customer_id', 'customers.id'),
                'reward_points_balance'
            );
        } else {
            $query->selectRaw('0 as reward_points_balance');
        }
    }
}
