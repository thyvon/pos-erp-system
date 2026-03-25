<?php

namespace App\Repositories\Foundation;

use App\Models\Supplier;
use App\Repositories\BaseRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SupplierRepository extends BaseRepository
{
    public function __construct(Supplier $model)
    {
        parent::__construct($model);
    }

    public function paginateFiltered(array $filters): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 15);
        $perPage = max(1, min($perPage, 100));

        $query = $this->query()
            ->select('suppliers.*')
            ->when(
                filled($filters['status'] ?? null),
                fn (Builder $builder) => $builder->where('status', $filters['status'])
            );

        if (filled($filters['search'] ?? null)) {
            $search = trim((string) $filters['search']);
            $query->where(function (Builder $builder) use ($search): void {
                $builder
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('company', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('mobile', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if (Schema::hasTable('purchases')) {
            $query->selectSub(
                DB::table('purchases')
                    ->selectRaw('COALESCE(SUM(total_amount - paid_amount), 0)')
                    ->whereColumn('supplier_id', 'suppliers.id')
                    ->whereIn('status', ['confirmed', 'received'])
                    ->whereNull('deleted_at'),
                'balance'
            );
        } else {
            $query->selectRaw('0 as balance');
        }

        return $query
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();
    }
}
