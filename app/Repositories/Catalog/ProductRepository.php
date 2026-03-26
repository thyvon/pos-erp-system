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
        $isActive = $filters['is_active'] ?? null;

        $query = $this->query()
            ->with([
                'category:id,name',
                'brand:id,name',
                'conversionSubUnit:id,name,short_name',
                'primaryImage',
            ])
            ->withCount(['variations', 'comboItems'])
            ->addSelect([
                'variable_selling_price_min' => DB::table('product_variations')
                    ->selectRaw('min(selling_price)')
                    ->whereColumn('product_variations.product_id', 'products.id')
                    ->whereNull('product_variations.deleted_at'),
                'variable_selling_price_max' => DB::table('product_variations')
                    ->selectRaw('max(selling_price)')
                    ->whereColumn('product_variations.product_id', 'products.id')
                    ->whereNull('product_variations.deleted_at'),
                'variable_purchase_price_min' => DB::table('product_variations')
                    ->selectRaw('min(purchase_price)')
                    ->whereColumn('product_variations.product_id', 'products.id')
                    ->whereNull('product_variations.deleted_at'),
                'variable_purchase_price_max' => DB::table('product_variations')
                    ->selectRaw('max(purchase_price)')
                    ->whereColumn('product_variations.product_id', 'products.id')
                    ->whereNull('product_variations.deleted_at'),
            ])
            ->when(
                filled($filters['type'] ?? null),
                fn (Builder $builder) => $builder->where('type', $filters['type'])
            )
            ->when(
                filled($filters['stock_tracking'] ?? null),
                fn (Builder $builder) => $builder->where('stock_tracking', $filters['stock_tracking'])
            )
            ->when(
                $isActive !== '' && $isActive !== null,
                fn (Builder $builder) => $builder->where('is_active', filter_var($isActive, FILTER_VALIDATE_BOOL))
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
            $query->where(function (Builder $builder) use ($search): void {
                $builder
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%");
            });

            return;
        }

        // SQLite test fallback. Production should use the FULLTEXT branch above.
        $query->where(function (Builder $builder) use ($search): void {
            $builder
                ->where('name', 'like', "%{$search}%")
                ->orWhere('sku', 'like', "%{$search}%");
        });
    }
}
