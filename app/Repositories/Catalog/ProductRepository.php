<?php

namespace App\Repositories\Catalog;

use App\Models\Product;
use App\Repositories\BaseRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class ProductRepository extends BaseRepository
{
    public function __construct(Product $model)
    {
        parent::__construct($model);
    }

    public function paginateFiltered(array $filters): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 15);
        $perPage = max(1, min($perPage, 100));

        $query = $this->query()
            ->with([
                'category:id,name',
                'brand:id,name',
                'unit:id,name,short_name',
                'subUnit:id,parent_unit_id,name,short_name,conversion_factor',
                'variationTemplate:id,name',
                'priceGroup:id,name,is_default',
                'variations:id,product_id,name,sku,selling_price,purchase_price',
            ])
            ->withCount(['variations', 'comboItems', 'packagingOptions'])
            ->when(
                filled($filters['type'] ?? null),
                fn (Builder $builder) => $builder->where('type', $filters['type'])
            )
            ->when(
                filled($filters['stock_tracking'] ?? null),
                fn (Builder $builder) => $builder->where('stock_tracking', $filters['stock_tracking'])
            )
            ->when(
                $filters['is_active'] !== '' && $filters['is_active'] !== null,
                fn (Builder $builder) => $builder->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOL))
            )
            ->when(
                filled($filters['category_id'] ?? null),
                fn (Builder $builder) => $builder->where('category_id', $filters['category_id'])
            )
            ->when(
                filled($filters['brand_id'] ?? null),
                fn (Builder $builder) => $builder->where('brand_id', $filters['brand_id'])
            );

        $this->applySearch($query, trim((string) ($filters['search'] ?? '')));

        return $query
            ->orderByDesc('is_active')
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
                    'MATCH(name,sku,barcode) AGAINST (? IN BOOLEAN MODE)',
                    [$booleanTerms]
                );

                if (preg_match('/^[0-9A-Za-z+\\-\\s]+$/', $search) === 1) {
                    $builder
                        ->orWhere('sku', 'like', $search.'%')
                        ->orWhere('barcode', 'like', $search.'%');
                }
            });

            return;
        }

        // SQLite test fallback. Production should use the FULLTEXT branch above.
        $query->where(function (Builder $builder) use ($search): void {
            $builder
                ->where('name', 'like', "%{$search}%")
                ->orWhere('sku', 'like', "%{$search}%")
                ->orWhere('barcode', 'like', "%{$search}%");
        });
    }
}
