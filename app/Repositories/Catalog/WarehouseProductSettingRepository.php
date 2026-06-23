<?php

namespace App\Repositories\Catalog;

use App\Models\WarehouseProductSetting;
use App\Repositories\BaseRepository;
use App\Support\WarehouseAccess;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class WarehouseProductSettingRepository extends BaseRepository
{
    public function __construct(WarehouseProductSetting $model)
    {
        parent::__construct($model);
    }

    public function paginateFiltered(array $filters, $warehouseAccessScope = null): LengthAwarePaginator
    {
        $perPage = max(1, min((int) ($filters['per_page'] ?? 15), 100));

        $query = $this->query()
            ->with([
                'warehouse.branch',
                'product',
                'variation',
                'rackLocation',
                'preferredSupplier',
            ])
            ->when(
                filled($filters['search'] ?? null),
                function ($query) use ($filters): void {
                    $search = trim((string) $filters['search']);

                    $query->where(function ($builder) use ($search): void {
                        $builder
                            ->whereLike('notes', "%{$search}%")
                            ->orWhereHas('product', fn ($productQuery) => $productQuery
                                ->whereLike('name', "%{$search}%")
                                ->orWhereLike('sku', "%{$search}%"))
                            ->orWhereHas('variation', fn ($variationQuery) => $variationQuery
                                ->whereLike('name', "%{$search}%")
                                ->orWhereLike('sku', "%{$search}%"))
                            ->orWhereHas('warehouse', fn ($warehouseQuery) => $warehouseQuery
                                ->whereLike('name', "%{$search}%")
                                ->orWhereLike('code', "%{$search}%"))
                            ->orWhereHas('rackLocation', fn ($rackQuery) => $rackQuery
                                ->whereLike('name', "%{$search}%")
                                ->orWhereLike('code', "%{$search}%"));
                    });
                }
            )
            ->when(
                filled($filters['warehouse_id'] ?? null),
                fn ($query) => $query->where('warehouse_id', $filters['warehouse_id'])
            )
            ->when(
                filled($filters['product_id'] ?? null),
                fn ($query) => $query->where('product_id', $filters['product_id'])
            )
            ->when(
                filled($filters['variation_id'] ?? null),
                fn ($query) => $query->where('variation_id', $filters['variation_id'])
            )
            ->when(
                filled($filters['rack_location_id'] ?? null),
                fn ($query) => $query->where('rack_location_id', $filters['rack_location_id'])
            )
            ->when(
                filled($filters['preferred_supplier_id'] ?? null),
                fn ($query) => $query->where('preferred_supplier_id', $filters['preferred_supplier_id'])
            )
            ->when(
                array_key_exists('is_active', $filters) && $filters['is_active'] !== null && $filters['is_active'] !== '',
                fn ($query) => $query->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOL))
            )
            ->orderBy('warehouse_id')
            ->orderBy('product_id')
            ->orderBy('variation_id');

        WarehouseAccess::scopeWarehouseQuery($query, $warehouseAccessScope, 'warehouse_id');

        return $query->paginate($perPage)->withQueryString();
    }

    public function options($warehouseAccessScope = null): Collection
    {
        $query = $this->query()
            ->with(['warehouse', 'product', 'variation'])
            ->where('is_active', true)
            ->orderBy('warehouse_id')
            ->orderBy('product_id');

        WarehouseAccess::scopeWarehouseQuery($query, $warehouseAccessScope, 'warehouse_id');

        return $query->get();
    }
}
