<?php

namespace App\Services\Catalog;

use App\Exceptions\Domain\DomainException;
use App\Models\Product;
use App\Models\ProductVariation;
use App\Models\RackLocation;
use App\Models\Supplier;
use App\Models\User;
use App\Models\Warehouse;
use App\Models\WarehouseProductSetting;
use App\Repositories\Catalog\WarehouseProductSettingRepository;
use App\Support\Audit\AuditLogger;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class WarehouseProductSettingService
{
    public function __construct(
        protected WarehouseProductSettingRepository $settings,
        protected AuditLogger $auditLogger,
    ) {
    }

    public function paginate(array $filters, ?User $actor = null): LengthAwarePaginator
    {
        return $this->settings->paginateFiltered($filters, $actor);
    }

    public function options(?User $actor = null): Collection
    {
        return $this->settings->options($actor);
    }

    public function create(string $businessId, array $data, ?User $actor = null): WarehouseProductSetting
    {
        return DB::transaction(function () use ($businessId, $data, $actor): WarehouseProductSetting {
            $context = $this->resolveContext($businessId, $data, $actor);
            $this->ensureUniqueSetting($businessId, $context['warehouse'], $context['product'], $context['variation']);
            $this->validateQuantitySettings($data);

            /** @var WarehouseProductSetting $setting */
            $setting = $this->settings->create($this->normalizePayload($businessId, $data, $context));
            $setting = $this->loadSetting($setting->refresh());

            $this->auditLogger->log(
                'created',
                WarehouseProductSetting::class,
                $setting->id,
                $actor,
                $businessId,
                null,
                $this->auditPayload($setting)
            );

            return $setting;
        });
    }

    public function update(
        string $businessId,
        WarehouseProductSetting $setting,
        array $data,
        ?User $actor = null
    ): WarehouseProductSetting {
        return DB::transaction(function () use ($businessId, $setting, $data, $actor): WarehouseProductSetting {
            $this->ensureBelongsToBusiness($businessId, $setting);
            $current = $this->loadSetting($setting);
            $before = $this->auditPayload($current);
            $merged = array_merge([
                'warehouse_id' => $setting->warehouse_id,
                'product_id' => $setting->product_id,
                'variation_id' => $setting->variation_id,
                'rack_location_id' => $setting->rack_location_id,
                'preferred_supplier_id' => $setting->preferred_supplier_id,
                'min_stock_alert' => $setting->min_stock_alert,
                'max_stock_level' => $setting->max_stock_level,
                'reorder_point' => $setting->reorder_point,
                'reorder_quantity' => $setting->reorder_quantity,
                'is_active' => $setting->is_active,
                'notes' => $setting->notes,
            ], $data);

            $context = $this->resolveContext($businessId, $merged, $actor);
            $this->ensureUniqueSetting($businessId, $context['warehouse'], $context['product'], $context['variation'], $setting);
            $this->validateQuantitySettings($merged);

            /** @var WarehouseProductSetting $updated */
            $updated = $this->settings->update($setting, $this->normalizePayload($businessId, $merged, $context));
            $updated = $this->loadSetting($updated->refresh());

            $this->auditLogger->log(
                'updated',
                WarehouseProductSetting::class,
                $updated->id,
                $actor,
                $businessId,
                $before,
                $this->auditPayload($updated)
            );

            return $updated;
        });
    }

    public function delete(string $businessId, WarehouseProductSetting $setting, ?User $actor = null): void
    {
        DB::transaction(function () use ($businessId, $setting, $actor): void {
            $this->ensureBelongsToBusiness($businessId, $setting);
            $setting = $this->loadSetting($setting);
            $before = $this->auditPayload($setting);

            $this->settings->delete($setting);

            $this->auditLogger->log(
                'deleted',
                WarehouseProductSetting::class,
                $setting->id,
                $actor,
                $businessId,
                $before,
                null
            );
        });
    }

    protected function resolveContext(string $businessId, array $data, ?User $actor = null): array
    {
        $warehouse = $this->resolveWarehouse($businessId, (string) $data['warehouse_id'], $actor);
        $product = $this->resolveProduct($businessId, (string) $data['product_id']);
        $variation = $this->resolveVariation($businessId, $product, $data['variation_id'] ?? null);
        $rackLocation = $this->resolveRackLocation($businessId, $warehouse, $data['rack_location_id'] ?? null);
        $preferredSupplier = $this->resolveSupplier($businessId, $data['preferred_supplier_id'] ?? null);

        return compact('warehouse', 'product', 'variation', 'rackLocation', 'preferredSupplier');
    }

    protected function resolveWarehouse(string $businessId, string $warehouseId, ?User $actor = null): Warehouse
    {
        /** @var Warehouse|null $warehouse */
        $warehouse = Warehouse::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->find($warehouseId);

        if (! $warehouse) {
            throw new DomainException('Selected warehouse is invalid for this business.', 422);
        }

        if ($actor && ! $actor->hasWarehouseAccess($warehouse->id)) {
            throw new DomainException('You do not have warehouse access to the selected warehouse.', 403);
        }

        return $warehouse;
    }

    protected function resolveProduct(string $businessId, string $productId): Product
    {
        /** @var Product|null $product */
        $product = Product::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->find($productId);

        if (! $product) {
            throw new DomainException('Selected product is invalid for this business.', 422);
        }

        return $product;
    }

    protected function resolveVariation(string $businessId, Product $product, ?string $variationId): ?ProductVariation
    {
        if (! filled($variationId)) {
            return null;
        }

        /** @var ProductVariation|null $variation */
        $variation = ProductVariation::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->where('product_id', $product->id)
            ->find($variationId);

        if (! $variation) {
            throw new DomainException('Selected variation is invalid for this product.', 422);
        }

        return $variation;
    }

    protected function resolveRackLocation(string $businessId, Warehouse $warehouse, ?string $rackLocationId): ?RackLocation
    {
        if (! filled($rackLocationId)) {
            return null;
        }

        /** @var RackLocation|null $rackLocation */
        $rackLocation = RackLocation::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->find($rackLocationId);

        if (! $rackLocation) {
            throw new DomainException('Selected rack location is invalid for this business.', 422);
        }

        if ((string) $rackLocation->warehouse_id !== (string) $warehouse->id) {
            throw new DomainException('Selected rack location does not belong to the selected warehouse.', 422);
        }

        return $rackLocation;
    }

    protected function resolveSupplier(string $businessId, ?string $supplierId): ?Supplier
    {
        if (! filled($supplierId)) {
            return null;
        }

        /** @var Supplier|null $supplier */
        $supplier = Supplier::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->find($supplierId);

        if (! $supplier) {
            throw new DomainException('Selected supplier is invalid for this business.', 422);
        }

        return $supplier;
    }

    protected function ensureUniqueSetting(
        string $businessId,
        Warehouse $warehouse,
        Product $product,
        ?ProductVariation $variation,
        ?WarehouseProductSetting $except = null
    ): void {
        $query = WarehouseProductSetting::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->where('warehouse_id', $warehouse->id)
            ->where('product_id', $product->id)
            ->whereNull('deleted_at');

        $variation
            ? $query->where('variation_id', $variation->id)
            : $query->whereNull('variation_id');

        if ($except) {
            $query->whereKeyNot($except->id);
        }

        if ($query->lockForUpdate()->exists()) {
            throw new DomainException('This product already has warehouse settings for the selected warehouse and variation.', 422);
        }
    }

    protected function validateQuantitySettings(array $data): void
    {
        $minStock = $this->nullableFloat($data['min_stock_alert'] ?? null);
        $maxStock = $this->nullableFloat($data['max_stock_level'] ?? null);
        $reorderPoint = $this->nullableFloat($data['reorder_point'] ?? null);
        $reorderQuantity = $this->nullableFloat($data['reorder_quantity'] ?? null);

        if ($minStock !== null && $maxStock !== null && $maxStock < $minStock) {
            throw new DomainException('Maximum stock level must be greater than or equal to the minimum stock alert.', 422);
        }

        if ($reorderPoint !== null && $maxStock !== null && $reorderPoint > $maxStock) {
            throw new DomainException('Reorder point cannot be greater than the maximum stock level.', 422);
        }

        if ($reorderPoint !== null && $reorderQuantity === null) {
            throw new DomainException('Reorder quantity is required when a reorder point is set.', 422);
        }
    }

    protected function normalizePayload(string $businessId, array $data, array $context): array
    {
        return [
            'business_id' => $businessId,
            'warehouse_id' => $context['warehouse']->id,
            'product_id' => $context['product']->id,
            'variation_id' => $context['variation']?->id,
            'rack_location_id' => $context['rackLocation']?->id,
            'preferred_supplier_id' => $context['preferredSupplier']?->id,
            'min_stock_alert' => $this->nullableFloat($data['min_stock_alert'] ?? null),
            'max_stock_level' => $this->nullableFloat($data['max_stock_level'] ?? null),
            'reorder_point' => $this->nullableFloat($data['reorder_point'] ?? null),
            'reorder_quantity' => $this->nullableFloat($data['reorder_quantity'] ?? null),
            'is_active' => array_key_exists('is_active', $data) ? (bool) $data['is_active'] : true,
            'notes' => $data['notes'] ?? null,
        ];
    }

    protected function nullableFloat(mixed $value): ?float
    {
        if ($value === null || $value === '') {
            return null;
        }

        return round((float) $value, 4);
    }

    protected function ensureBelongsToBusiness(string $businessId, WarehouseProductSetting $setting): void
    {
        if ((string) $setting->business_id !== $businessId) {
            throw new DomainException('Warehouse product setting does not belong to the current business.', 422);
        }
    }

    protected function loadSetting(WarehouseProductSetting $setting): WarehouseProductSetting
    {
        return $setting->load([
            'warehouse.branch',
            'product',
            'variation',
            'rackLocation',
            'preferredSupplier',
        ]);
    }

    protected function auditPayload(WarehouseProductSetting $setting): array
    {
        return [
            'id' => $setting->id,
            'business_id' => $setting->business_id,
            'warehouse_id' => $setting->warehouse_id,
            'warehouse_name' => $setting->warehouse?->name,
            'product_id' => $setting->product_id,
            'product_name' => $setting->product?->name,
            'variation_id' => $setting->variation_id,
            'variation_name' => $setting->variation?->name,
            'rack_location_id' => $setting->rack_location_id,
            'preferred_supplier_id' => $setting->preferred_supplier_id,
            'min_stock_alert' => $setting->min_stock_alert,
            'max_stock_level' => $setting->max_stock_level,
            'reorder_point' => $setting->reorder_point,
            'reorder_quantity' => $setting->reorder_quantity,
            'is_active' => $setting->is_active,
        ];
    }
}
