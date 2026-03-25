<?php

namespace App\Repositories\Catalog;

use App\Models\Brand;
use App\Repositories\BaseRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class BrandRepository extends BaseRepository
{
    public function __construct(Brand $model)
    {
        parent::__construct($model);
    }

    public function paginateFiltered(array $filters): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 15);
        $perPage = max(1, min($perPage, 100));

        $query = $this->query()
            ->when(
                filled($filters['search'] ?? null),
                function ($query) use ($filters): void {
                    $search = trim((string) $filters['search']);

                    $query->where(function ($builder) use ($search): void {
                        $builder
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('description', 'like', "%{$search}%");
                    });
                }
            )
            ->orderBy('name');

        if (Schema::hasTable('products') && Schema::hasColumn('products', 'brand_id')) {
            $query->addSelect([
                'products_count' => DB::table('products')
                    ->selectRaw('count(*)')
                    ->whereColumn('products.brand_id', 'brands.id'),
            ]);
        }

        return $query->paginate($perPage)->withQueryString();
    }

    public function options(): Collection
    {
        return $this->query()
            ->orderBy('name')
            ->get();
    }
}
