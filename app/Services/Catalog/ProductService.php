<?php

namespace App\Services\Catalog;

use App\Exceptions\Domain\DomainException;
use App\Models\Brand;
use App\Models\Category;
use App\Models\ComboItem;
use App\Models\CustomFieldDefinition;
use App\Models\PriceGroup;
use App\Models\Product;
use App\Models\ProductPackaging;
use App\Models\ProductVariation;
use App\Models\RackLocation;
use App\Models\SubUnit;
use App\Models\TaxRate;
use App\Models\Unit;
use App\Models\User;
use App\Models\VariationTemplate;
use App\Models\VariationValue;
use App\Repositories\Catalog\ProductRepository;
use App\Services\Foundation\SettingsService;
use App\Support\Audit\AuditLogger;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class ProductService
{
    public function __construct(
        protected ProductRepository $products,
        protected SettingsService $settings,
        protected AuditLogger $auditLogger,
    ) {
    }

    public function paginate(array $filters): LengthAwarePaginator
    {
        return $this->products->paginateFiltered($filters);
    }

    public function formOptions(User $user): array
    {
        $rackLocationsEnabled = false;

        try {
            $rackLocationsEnabled = (bool) ($this->settings->getGroup('stock')['enable_rack_location'] ?? false);
        } catch (\Throwable) {
            $rackLocationsEnabled = false;
        }

        return [
            'categories' => Category::query()->with('parent:id,name')->orderBy('sort_order')->orderBy('name')->get(),
            'brands' => Brand::query()->orderBy('name')->get(),
            'units' => Unit::query()->with('subUnits')->orderBy('name')->get(),
            'tax_rates' => TaxRate::query()->where('is_active', true)->orderByDesc('is_default')->orderBy('name')->get(),
            'price_groups' => PriceGroup::query()->orderByDesc('is_default')->orderBy('name')->get(),
            'variation_templates' => VariationTemplate::query()->with('values')->orderBy('name')->get(),
            'rack_locations_enabled' => $rackLocationsEnabled,
            'rack_locations' => $rackLocationsEnabled
                ? RackLocation::query()->with('warehouse:id,name')->orderBy('name')->get()
                : collect(),
            'custom_fields' => CustomFieldDefinition::query()
                ->where('module', 'products')
                ->orderBy('sort_order')
                ->orderBy('field_label')
                ->get(),
            'combo_products' => Product::query()
                ->with('variations')
                ->where('type', '!=', 'combo')
                ->orderBy('name')
                ->get(),
        ];
    }

    public function loadDetails(Product $product): Product
    {
        return $product->refresh()->load([
            'category:id,name',
            'brand:id,name',
            'unit:id,name,short_name',
            'subUnit:id,parent_unit_id,name,short_name,conversion_factor',
            'taxRate',
            'rackLocation:id,warehouse_id,name,code',
            'rackLocation.warehouse:id,name',
            'variationTemplate:id,business_id,name',
            'variationTemplate.values:id,business_id,variation_template_id,name,sort_order',
            'priceGroup:id,name,is_default',
            'variations',
            'comboItems',
            'comboItems.childProduct:id,name,sku,type',
            'comboItems.childVariation:id,product_id,name,sku',
            'packagingOptions',
        ])->loadCount(['variations', 'comboItems', 'packagingOptions']);
    }

    public function create(string $businessId, array $data, ?User $actor = null): Product
    {
        return DB::transaction(function () use ($businessId, $data, $actor): Product {
            $payload = $this->normalizeProductPayload($businessId, $data);
            $this->validateProductPayload($businessId, $payload, null);

            /** @var Product $product */
            $product = $this->products->create($payload);

            $this->syncVariations($businessId, $product, $data['variations'] ?? []);
            $this->syncComboItems($businessId, $product, $data['combo_items'] ?? []);
            $this->syncPackagings($businessId, $product, $data['packagings'] ?? []);
            $this->syncDerivedPricing($product);

            $product = $this->loadDetails($product);

            $this->auditLogger->log(
                'created',
                Product::class,
                $product->id,
                $actor,
                $businessId,
                null,
                $this->auditPayload($product)
            );

            return $product;
        });
    }

    public function update(string $businessId, Product $product, array $data, ?User $actor = null): Product
    {
        return DB::transaction(function () use ($businessId, $product, $data, $actor): Product {
            $this->ensureBelongsToBusiness($businessId, $product);

            $loaded = $this->loadDetails($product);
            $before = $this->auditPayload($loaded);
            $previousSellingPrice = (string) $loaded->selling_price;
            $previousMinimumSellingPrice = $loaded->minimum_selling_price !== null ? (string) $loaded->minimum_selling_price : null;

            $payload = $this->normalizeProductPayload($businessId, $data, $product);
            $this->ensureStockTrackingCanChange($product, $payload['stock_tracking']);
            $this->validateProductPayload($businessId, $payload, $product);

            /** @var Product $updatedProduct */
            $updatedProduct = $this->products->update($product, $payload);

            $this->syncVariations($businessId, $updatedProduct, $data['variations'] ?? []);
            $this->syncComboItems($businessId, $updatedProduct, $data['combo_items'] ?? []);
            $this->syncPackagings($businessId, $updatedProduct, $data['packagings'] ?? []);
            $this->syncDerivedPricing($updatedProduct);

            $updatedProduct = $this->loadDetails($updatedProduct);

            $this->auditLogger->log(
                'updated',
                Product::class,
                $updatedProduct->id,
                $actor,
                $businessId,
                $before,
                $this->auditPayload($updatedProduct)
            );

            $currentSellingPrice = (string) $updatedProduct->selling_price;
            $currentMinimumSellingPrice = $updatedProduct->minimum_selling_price !== null ? (string) $updatedProduct->minimum_selling_price : null;

            if ($previousSellingPrice !== $currentSellingPrice || $previousMinimumSellingPrice !== $currentMinimumSellingPrice) {
                $this->auditLogger->log(
                    'price_changed',
                    Product::class,
                    $updatedProduct->id,
                    $actor,
                    $businessId,
                    [
                        'selling_price' => $previousSellingPrice,
                        'minimum_selling_price' => $previousMinimumSellingPrice,
                    ],
                    [
                        'selling_price' => $currentSellingPrice,
                        'minimum_selling_price' => $currentMinimumSellingPrice,
                    ]
                );
            }

            return $updatedProduct;
        });
    }

    public function delete(string $businessId, Product $product, ?User $actor = null): void
    {
        DB::transaction(function () use ($businessId, $product, $actor): void {
            $this->ensureBelongsToBusiness($businessId, $product);
            $loaded = $this->loadDetails($product);
            $this->ensureProductCanBeDeleted($loaded);
            $before = $this->auditPayload($loaded);

            $this->products->delete($product);

            $this->auditLogger->log(
                'deleted',
                Product::class,
                $product->id,
                $actor,
                $businessId,
                $before,
                null
            );
        });
    }

    protected function normalizeProductPayload(string $businessId, array $data, ?Product $product = null): array
    {
        $type = $data['type'] ?? $product?->type ?? 'single';
        $variationTemplateIds = $this->resolveVariationTemplateIds($data, $product, $type);
        $trackInventory = array_key_exists('track_inventory', $data)
            ? (bool) $data['track_inventory']
            : (bool) ($product?->track_inventory ?? true);
        $stockTracking = $data['stock_tracking'] ?? $product?->stock_tracking ?? 'none';

        if (in_array($type, ['combo', 'service'], true) || $trackInventory === false) {
            $trackInventory = false;
            $stockTracking = 'none';
        }

        return [
            'business_id' => $businessId,
            'category_id' => $this->nullableString($data['category_id'] ?? $product?->category_id),
            'brand_id' => $this->nullableString($data['brand_id'] ?? $product?->brand_id),
            'unit_id' => $this->nullableString($data['unit_id'] ?? $product?->unit_id),
            'sub_unit_id' => $this->nullableString($data['sub_unit_id'] ?? $product?->sub_unit_id),
            'tax_rate_id' => $this->nullableString($data['tax_rate_id'] ?? $product?->tax_rate_id),
            'rack_location_id' => $this->nullableString($data['rack_location_id'] ?? $product?->rack_location_id),
            'variation_template_id' => $type === 'variable' ? ($variationTemplateIds[0] ?? null) : null,
            'variation_template_ids' => $type === 'variable' ? $variationTemplateIds : [],
            'price_group_id' => $this->nullableString($data['price_group_id'] ?? $product?->price_group_id),
            'name' => $data['name'] ?? $product?->name,
            'description' => array_key_exists('description', $data) ? $data['description'] : $product?->description,
            'sku' => $this->resolveProductSku($businessId, $data, $product),
            'barcode' => array_key_exists('barcode', $data) ? $data['barcode'] : $product?->barcode,
            'barcode_type' => $data['barcode_type'] ?? $product?->barcode_type ?? 'C128',
            'type' => $type,
            'stock_tracking' => $stockTracking,
            'has_expiry' => in_array($type, ['combo', 'service'], true)
                ? false
                : (array_key_exists('has_expiry', $data) ? (bool) $data['has_expiry'] : (bool) ($product?->has_expiry ?? false)),
            'selling_price' => $type === 'variable'
                ? $this->decimalOrDefault($product?->selling_price ?? 0)
                : $this->decimalOrDefault($data['selling_price'] ?? $product?->selling_price ?? 0),
            'purchase_price' => $type === 'variable'
                ? $this->decimalOrDefault($product?->purchase_price ?? 0)
                : $this->decimalOrDefault($data['purchase_price'] ?? $product?->purchase_price ?? 0),
            'minimum_selling_price' => $type === 'variable'
                ? $this->nullableDecimal($product?->minimum_selling_price)
                : $this->nullableDecimal($data['minimum_selling_price'] ?? $product?->minimum_selling_price),
            'profit_margin' => $this->nullableDecimal($data['profit_margin'] ?? $product?->profit_margin),
            'tax_type' => $data['tax_type'] ?? $product?->tax_type ?? 'exclusive',
            'track_inventory' => $trackInventory,
            'alert_quantity' => $this->nullableDecimal($data['alert_quantity'] ?? $product?->alert_quantity, 3),
            'max_stock_level' => $this->nullableDecimal($data['max_stock_level'] ?? $product?->max_stock_level, 3),
            'is_for_selling' => array_key_exists('is_for_selling', $data)
                ? (bool) $data['is_for_selling']
                : (bool) ($product?->is_for_selling ?? true),
            'is_active' => array_key_exists('is_active', $data)
                ? (bool) $data['is_active']
                : (bool) ($product?->is_active ?? true),
            'weight' => $this->nullableDecimal($data['weight'] ?? $product?->weight, 3),
            'image_url' => array_key_exists('image_url', $data) ? $data['image_url'] : $product?->image_url,
            'custom_fields' => array_key_exists('custom_fields', $data) ? ($data['custom_fields'] ?? []) : ($product?->custom_fields ?? []),
        ];
    }

    protected function validateProductPayload(string $businessId, array $payload, ?Product $product = null): void
    {
        $unitId = $payload['unit_id'];
        $subUnitId = $payload['sub_unit_id'];
        $type = $payload['type'];
        $variationTemplateIds = array_values($payload['variation_template_ids'] ?? []);

        if ($type !== 'variable' && $payload['minimum_selling_price'] !== null && (float) $payload['minimum_selling_price'] > (float) $payload['selling_price']) {
            throw new DomainException('Minimum selling price cannot be greater than selling price.', 422);
        }

        $this->ensureReferenceExists($businessId, Category::class, $payload['category_id'], 'Selected category is invalid for this business.');
        $this->ensureReferenceExists($businessId, Brand::class, $payload['brand_id'], 'Selected brand is invalid for this business.');
        $this->ensureReferenceExists($businessId, Unit::class, $unitId, 'Selected unit is invalid for this business.');
        $this->ensureReferenceExists($businessId, TaxRate::class, $payload['tax_rate_id'], 'Selected tax rate is invalid for this business.');
        $this->ensureReferenceExists($businessId, PriceGroup::class, $payload['price_group_id'], 'Selected price group is invalid for this business.');

        foreach ($variationTemplateIds as $variationTemplateId) {
            $this->ensureReferenceExists($businessId, VariationTemplate::class, $variationTemplateId, 'Selected variation template is invalid for this business.');
        }

        if ($payload['rack_location_id'] !== null) {
            $this->ensureRackLocationsEnabled();
            $this->ensureReferenceExists($businessId, RackLocation::class, $payload['rack_location_id'], 'Selected rack location is invalid for this business.');
        }

        if ($subUnitId !== null) {
            /** @var SubUnit|null $subUnit */
            $subUnit = SubUnit::withoutGlobalScopes()
                ->where('business_id', $businessId)
                ->where('id', $subUnitId)
                ->whereNull('deleted_at')
                ->first();

            if (! $subUnit) {
                throw new DomainException('Selected sub unit is invalid for this business.', 422);
            }

            if ($unitId === null || (string) $subUnit->parent_unit_id !== (string) $unitId) {
                throw new DomainException('Selected sub unit does not belong to the chosen unit.', 422);
            }
        }

        if ($type === 'variable' && $variationTemplateIds === []) {
            throw new DomainException('Variable products require at least one variation template.', 422);
        }

        if ($type !== 'variable' && $variationTemplateIds !== []) {
            throw new DomainException('Only variable products can use variation templates.', 422);
        }

        if ($type === 'service' && $unitId === null) {
            return;
        }
    }

    protected function syncVariations(string $businessId, Product $product, array $variations): void
    {
        if ($product->type !== 'variable') {
            $product->variations()->delete();
            return;
        }

        $templateIds = array_values($product->variation_template_ids ?? array_filter([$product->variation_template_id]));

        if ($templateIds === []) {
            throw new DomainException('Selected variation templates are invalid for this business.', 422);
        }

        $existing = $product->variations()->get()->keyBy('id');
        $seenIds = [];
        $seenNames = [];
        $seenCombinations = [];
        $seenSkus = [];

        foreach ($variations as $variationData) {
            $variationId = $variationData['id'] ?? null;
            $normalizedIds = $this->normalizeVariationValueIds(
                $businessId,
                $templateIds,
                $variationData['variation_value_ids'] ?? []
            );
            $combinationKey = implode('|', $normalizedIds);
            $nameKey = Str::lower(trim((string) ($variationData['name'] ?? '')));
            $skuKey = Str::lower(trim((string) ($variationData['sku'] ?? '')));

            if ($nameKey === '' || in_array($nameKey, $seenNames, true)) {
                throw new DomainException('Variation names must be unique within the same product.', 422);
            }

            if (in_array($combinationKey, $seenCombinations, true)) {
                throw new DomainException('Each variation must use a unique combination of variation values.', 422);
            }

            if ($skuKey === '' || in_array($skuKey, $seenSkus, true)) {
                throw new DomainException('Variation SKUs must be unique within the same product.', 422);
            }

            $this->ensureVariationSkuIsUnique($businessId, (string) $variationData['sku'], $variationId);

            if (
                array_key_exists('minimum_selling_price', $variationData)
                && filled($variationData['minimum_selling_price'])
                && (float) $variationData['minimum_selling_price'] > (float) $variationData['selling_price']
            ) {
                throw new DomainException('Variation minimum selling price cannot be greater than selling price.', 422);
            }

            $payload = [
                'business_id' => $businessId,
                'product_id' => $product->id,
                'name' => $variationData['name'],
                'variation_value_ids' => $normalizedIds,
                'sku' => $variationData['sku'],
                'barcode' => $variationData['barcode'] ?? null,
                'selling_price' => $this->decimalOrDefault($variationData['selling_price']),
                'purchase_price' => $this->decimalOrDefault($variationData['purchase_price']),
                'minimum_selling_price' => $this->nullableDecimal($variationData['minimum_selling_price'] ?? null),
                'is_active' => array_key_exists('is_active', $variationData) ? (bool) $variationData['is_active'] : true,
            ];

            if ($variationId !== null) {
                /** @var ProductVariation|null $existingVariation */
                $existingVariation = $existing->get($variationId);

                if (! $existingVariation) {
                    throw new DomainException('Selected product variation is invalid for this product.', 422);
                }

                $existingVariation->fill($payload);
                $existingVariation->save();
                $seenIds[] = $existingVariation->id;
            } else {
                $created = $product->variations()->create($payload);
                $seenIds[] = $created->id;
            }

            $seenNames[] = $nameKey;
            $seenCombinations[] = $combinationKey;
            $seenSkus[] = $skuKey;
        }

        $deleteIds = $existing->keys()->diff($seenIds)->values();

        if ($deleteIds->isNotEmpty()) {
            $this->ensureVariationsCanBeDeleted($deleteIds->all());
            $product->variations()->whereIn('id', $deleteIds)->delete();
        }
    }

    protected function syncComboItems(string $businessId, Product $product, array $comboItems): void
    {
        if ($product->type !== 'combo') {
            $product->comboItems()->delete();
            return;
        }

        $existing = $product->comboItems()->get()->keyBy('id');
        $seenIds = [];
        $seenPairs = [];

        foreach ($comboItems as $comboItemData) {
            $comboItemId = $comboItemData['id'] ?? null;
            $childProductId = (string) $comboItemData['child_product_id'];
            $childVariationId = $this->nullableString($comboItemData['child_variation_id'] ?? null);
            $pairKey = $childProductId.'|'.($childVariationId ?? 'none');

            if (in_array($pairKey, $seenPairs, true)) {
                throw new DomainException('Each combo component can only appear once in the same combo product.', 422);
            }

            if ($childProductId === $product->id) {
                throw new DomainException('A combo product cannot contain itself as a component.', 422);
            }

            /** @var Product|null $childProduct */
            $childProduct = Product::withoutGlobalScopes()
                ->where('business_id', $businessId)
                ->where('id', $childProductId)
                ->whereNull('deleted_at')
                ->first();

            if (! $childProduct) {
                throw new DomainException('Selected combo component product is invalid for this business.', 422);
            }

            if ($childProduct->type === 'combo') {
                throw new DomainException('Combo products cannot be nested inside another combo product.', 422);
            }

            if ($childVariationId !== null) {
                /** @var ProductVariation|null $childVariation */
                $childVariation = ProductVariation::withoutGlobalScopes()
                    ->where('business_id', $businessId)
                    ->where('id', $childVariationId)
                    ->where('product_id', $childProductId)
                    ->whereNull('deleted_at')
                    ->first();

                if (! $childVariation) {
                    throw new DomainException('Selected combo component variation is invalid for the chosen product.', 422);
                }
            }

            $payload = [
                'business_id' => $businessId,
                'product_id' => $product->id,
                'child_product_id' => $childProductId,
                'child_variation_id' => $childVariationId,
                'quantity' => number_format((float) $comboItemData['quantity'], 4, '.', ''),
            ];

            if ($comboItemId !== null) {
                /** @var ComboItem|null $existingItem */
                $existingItem = $existing->get($comboItemId);

                if (! $existingItem) {
                    throw new DomainException('Selected combo item is invalid for this product.', 422);
                }

                $existingItem->fill($payload);
                $existingItem->save();
                $seenIds[] = $existingItem->id;
            } else {
                $created = $product->comboItems()->create($payload);
                $seenIds[] = $created->id;
            }

            $seenPairs[] = $pairKey;
        }

        $deleteIds = $existing->keys()->diff($seenIds)->values();

        if ($deleteIds->isNotEmpty()) {
            $product->comboItems()->whereIn('id', $deleteIds)->delete();
        }
    }

    protected function syncPackagings(string $businessId, Product $product, array $packagings): void
    {
        $existing = $product->packagingOptions()->get()->keyBy('id');
        $seenIds = [];
        $seenNames = [];
        $seenSkus = [];

        foreach ($packagings as $packagingData) {
            $packagingId = $packagingData['id'] ?? null;
            $nameKey = Str::lower(trim((string) ($packagingData['name'] ?? '')));
            $skuKey = Str::lower(trim((string) ($packagingData['sku'] ?? '')));

            if ($nameKey === '' || in_array($nameKey, $seenNames, true)) {
                throw new DomainException('Packaging names must be unique within the same product.', 422);
            }

            if ($skuKey !== '') {
                if (in_array($skuKey, $seenSkus, true)) {
                    throw new DomainException('Packaging SKUs must be unique within the same product.', 422);
                }

                $this->ensurePackagingSkuIsUnique($businessId, (string) $packagingData['sku'], $packagingId);
                $seenSkus[] = $skuKey;
            }

            $payload = [
                'business_id' => $businessId,
                'product_id' => $product->id,
                'name' => $packagingData['name'],
                'short_name' => $packagingData['short_name'] ?? null,
                'conversion_factor' => number_format((float) $packagingData['conversion_factor'], 4, '.', ''),
                'sku' => $packagingData['sku'] ?? null,
                'barcode' => $packagingData['barcode'] ?? null,
                'selling_price' => $this->nullableDecimal($packagingData['selling_price'] ?? null),
                'purchase_price' => $this->nullableDecimal($packagingData['purchase_price'] ?? null),
                'is_default' => array_key_exists('is_default', $packagingData) ? (bool) $packagingData['is_default'] : false,
                'is_active' => array_key_exists('is_active', $packagingData) ? (bool) $packagingData['is_active'] : true,
            ];

            if ($payload['selling_price'] !== null && $payload['purchase_price'] !== null && (float) $payload['selling_price'] < 0) {
                throw new DomainException('Packaging selling price is invalid.', 422);
            }

            if ($packagingId !== null) {
                /** @var ProductPackaging|null $existingPackaging */
                $existingPackaging = $existing->get($packagingId);

                if (! $existingPackaging) {
                    throw new DomainException('Selected packaging option is invalid for this product.', 422);
                }

                $existingPackaging->fill($payload);
                $existingPackaging->save();
                $seenIds[] = $existingPackaging->id;
            } else {
                $created = $product->packagingOptions()->create($payload);
                $seenIds[] = $created->id;
            }

            $seenNames[] = $nameKey;
        }

        $deleteIds = $existing->keys()->diff($seenIds)->values();

        if ($deleteIds->isNotEmpty()) {
            $product->packagingOptions()->whereIn('id', $deleteIds)->delete();
        }

        $this->ensureProductHasDefaultPackaging($product);
    }

    protected function ensureBelongsToBusiness(string $businessId, Product $product): void
    {
        if ((string) $product->business_id !== $businessId) {
            throw new DomainException('Product does not belong to the current business.', 422);
        }
    }

    protected function ensureReferenceExists(string $businessId, string $modelClass, ?string $id, string $message): void
    {
        if ($id === null) {
            return;
        }

        $exists = $modelClass::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->where('id', $id)
            ->whereNull('deleted_at')
            ->exists();

        if (! $exists) {
            throw new DomainException($message, 422);
        }
    }

    protected function resolveProductSku(string $businessId, array $data, ?Product $product = null): string
    {
        if (array_key_exists('sku', $data) && filled($data['sku'])) {
            return (string) $data['sku'];
        }

        if ($product !== null && ! array_key_exists('sku', $data) && filled($product->sku)) {
            return (string) $product->sku;
        }

        return $this->generateProductSku(
            $businessId,
            (string) ($data['name'] ?? $product?->name ?? 'Product')
        );
    }

    protected function generateProductSku(string $businessId, string $name): string
    {
        $prefix = Str::upper(Str::substr(preg_replace('/[^A-Za-z0-9]/', '', $name) ?: 'PRD', 0, 6));
        $prefix = $prefix !== '' ? $prefix : 'PRD';

        do {
            $candidate = $prefix.'-'.Str::upper(Str::random(6));
        } while (
            Product::withoutGlobalScopes()
                ->where('business_id', $businessId)
                ->where('sku', $candidate)
                ->whereNull('deleted_at')
                ->exists()
        );

        return $candidate;
    }

    protected function normalizeVariationValueIds(string $businessId, array $templateIds, array $valueIds): array
    {
        $normalizedIds = collect($valueIds)
            ->filter(fn ($valueId) => filled($valueId))
            ->map(fn ($valueId) => (string) $valueId)
            ->unique()
            ->values()
            ->all();

        if ($normalizedIds === []) {
            throw new DomainException('Each variation must include at least one variation value.', 422);
        }

        $values = VariationValue::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->whereIn('id', $normalizedIds)
            ->whereNull('deleted_at')
            ->get(['id', 'variation_template_id']);

        if ($values->count() !== count($normalizedIds)) {
            throw new DomainException('One or more variation values are invalid for this business.', 422);
        }

        $templateOrder = array_values($templateIds);
        $valuesByTemplate = [];

        foreach ($values as $value) {
            $templateId = (string) $value->variation_template_id;

            if (! in_array($templateId, $templateOrder, true)) {
                throw new DomainException('One or more variation values do not belong to the selected variation templates.', 422);
            }

            $valuesByTemplate[$templateId] ??= [];
            $valuesByTemplate[$templateId][] = (string) $value->id;
        }

        foreach ($templateOrder as $templateId) {
            $count = count($valuesByTemplate[$templateId] ?? []);

            if ($count !== 1) {
                throw new DomainException('Each variation must contain exactly one value from every selected variation template.', 422);
            }
        }

        return collect($templateOrder)
            ->map(fn (string $templateId) => $valuesByTemplate[$templateId][0])
            ->values()
            ->all();
    }

    protected function resolveVariationTemplateIds(array $data, ?Product $product, string $type): array
    {
        if ($type !== 'variable') {
            return [];
        }

        $raw = $data['variation_template_ids']
            ?? ($product?->variation_template_ids ?? [])
            ?? [];

        if ($raw === [] && array_key_exists('variation_template_id', $data) && filled($data['variation_template_id'])) {
            $raw = [$data['variation_template_id']];
        }

        if ($raw === [] && $product?->variation_template_id) {
            $raw = [$product->variation_template_id];
        }

        return collect(is_array($raw) ? $raw : [$raw])
            ->filter(fn ($value) => filled($value))
            ->map(fn ($value) => (string) $value)
            ->unique()
            ->values()
            ->all();
    }

    protected function ensureVariationSkuIsUnique(string $businessId, string $sku, ?string $ignoreId = null): void
    {
        $query = ProductVariation::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->where('sku', $sku)
            ->whereNull('deleted_at');

        if ($ignoreId !== null) {
            $query->where('id', '!=', $ignoreId);
        }

        if ($query->exists()) {
            throw new DomainException('Variation SKU must be unique within the current business.', 422);
        }
    }

    protected function ensurePackagingSkuIsUnique(string $businessId, string $sku, ?string $ignoreId = null): void
    {
        $query = ProductPackaging::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->where('sku', $sku)
            ->whereNull('deleted_at');

        if ($ignoreId !== null) {
            $query->where('id', '!=', $ignoreId);
        }

        if ($query->exists()) {
            throw new DomainException('Packaging SKU must be unique within the current business.', 422);
        }
    }

    protected function ensureVariationsCanBeDeleted(array $variationIds): void
    {
        if (
            empty($variationIds)
            || ! Schema::hasTable('stock_movements')
            || ! Schema::hasColumn('stock_movements', 'variation_id')
        ) {
            return;
        }

        if (DB::table('stock_movements')->whereIn('variation_id', $variationIds)->exists()) {
            throw new DomainException('A product variation cannot be removed because stock movements already exist for it.', 422);
        }
    }

    protected function ensureStockTrackingCanChange(Product $product, string $nextStockTracking): void
    {
        if ($product->stock_tracking === $nextStockTracking) {
            return;
        }

        if (
            Schema::hasTable('stock_movements')
            && Schema::hasColumn('stock_movements', 'product_id')
            && DB::table('stock_movements')->where('product_id', $product->id)->exists()
        ) {
            throw new DomainException('Stock tracking cannot be changed after stock movements already exist.', 422);
        }
    }

    protected function ensureProductCanBeDeleted(Product $product): void
    {
        if (
            Schema::hasTable('stock_movements')
            && Schema::hasColumn('stock_movements', 'product_id')
            && DB::table('stock_movements')->where('product_id', $product->id)->exists()
        ) {
            throw new DomainException('Product cannot be deleted because stock movements already exist.', 422);
        }

        if (
            Schema::hasTable('combo_items')
            && Schema::hasColumn('combo_items', 'child_product_id')
            && DB::table('combo_items')->where('child_product_id', $product->id)->exists()
        ) {
            throw new DomainException('Product cannot be deleted because it is still used inside a combo product.', 422);
        }
    }

    protected function ensureProductHasDefaultPackaging(Product $product): void
    {
        $baseQuery = $product->packagingOptions();

        if (! $baseQuery->exists()) {
            return;
        }

        if ($product->packagingOptions()->where('is_default', true)->count() > 1) {
            throw new DomainException('Only one packaging option can be marked as default.', 422);
        }

        if (! $product->packagingOptions()->where('is_default', true)->exists()) {
            $firstId = $product->packagingOptions()->orderBy('name')->value('id');

            if ($firstId !== null) {
                $product->packagingOptions()->where('id', $firstId)->update(['is_default' => true]);
            }
        }
    }

    protected function syncDerivedPricing(Product $product): void
    {
        if ($product->type !== 'variable') {
            return;
        }

        $variations = $product->variations()->get();

        if ($variations->isEmpty()) {
            return;
        }

        $sellingPrice = $variations->min(fn (ProductVariation $variation) => (float) $variation->selling_price);
        $purchasePrice = $variations->min(fn (ProductVariation $variation) => (float) $variation->purchase_price);
        $minimumSellingPrice = $variations
            ->filter(fn (ProductVariation $variation) => $variation->minimum_selling_price !== null)
            ->min(fn (ProductVariation $variation) => (float) $variation->minimum_selling_price);

        $product->forceFill([
            'selling_price' => $this->decimalOrDefault($sellingPrice ?? 0),
            'purchase_price' => $this->decimalOrDefault($purchasePrice ?? 0),
            'minimum_selling_price' => $minimumSellingPrice !== null ? $this->decimalOrDefault($minimumSellingPrice) : null,
        ])->save();
    }

    protected function ensureRackLocationsEnabled(): void
    {
        try {
            $enabled = (bool) ($this->settings->getGroup('stock')['enable_rack_location'] ?? false);
        } catch (\Throwable) {
            $enabled = false;
        }

        if (! $enabled) {
            throw new DomainException('Rack locations are disabled in stock settings.', 422);
        }
    }

    protected function decimalOrDefault(mixed $value, int $scale = 2): string
    {
        return number_format((float) $value, $scale, '.', '');
    }

    protected function nullableDecimal(mixed $value, int $scale = 2): ?string
    {
        if (! filled($value)) {
            return null;
        }

        return number_format((float) $value, $scale, '.', '');
    }

    protected function nullableString(mixed $value): ?string
    {
        return filled($value) ? (string) $value : null;
    }

    protected function auditPayload(Product $product): array
    {
        return [
            'id' => $product->id,
            'business_id' => $product->business_id,
            'name' => $product->name,
            'sku' => $product->sku,
            'barcode' => $product->barcode,
            'type' => $product->type,
            'stock_tracking' => $product->stock_tracking,
            'selling_price' => $product->selling_price !== null ? (string) $product->selling_price : null,
            'purchase_price' => $product->purchase_price !== null ? (string) $product->purchase_price : null,
            'minimum_selling_price' => $product->minimum_selling_price !== null ? (string) $product->minimum_selling_price : null,
            'track_inventory' => (bool) $product->track_inventory,
            'is_active' => (bool) $product->is_active,
            'category_id' => $product->category_id,
            'brand_id' => $product->brand_id,
            'unit_id' => $product->unit_id,
            'sub_unit_id' => $product->sub_unit_id,
            'tax_rate_id' => $product->tax_rate_id,
            'rack_location_id' => $product->rack_location_id,
            'variation_template_id' => $product->variation_template_id,
            'variation_template_ids' => array_values($product->variation_template_ids ?? array_filter([$product->variation_template_id])),
            'price_group_id' => $product->price_group_id,
            'variations' => $product->variations->map(fn (ProductVariation $variation) => [
                'id' => $variation->id,
                'name' => $variation->name,
                'variation_value_ids' => array_values($variation->variation_value_ids ?? []),
                'sku' => $variation->sku,
                'selling_price' => $variation->selling_price !== null ? (string) $variation->selling_price : null,
            ])->values()->all(),
            'combo_items' => $product->comboItems->map(fn (ComboItem $comboItem) => [
                'id' => $comboItem->id,
                'child_product_id' => $comboItem->child_product_id,
                'child_variation_id' => $comboItem->child_variation_id,
                'quantity' => $comboItem->quantity !== null ? (string) $comboItem->quantity : null,
            ])->values()->all(),
            'packagings' => $product->packagingOptions->map(fn (ProductPackaging $packaging) => [
                'id' => $packaging->id,
                'name' => $packaging->name,
                'conversion_factor' => $packaging->conversion_factor !== null ? (string) $packaging->conversion_factor : null,
                'sku' => $packaging->sku,
                'is_default' => (bool) $packaging->is_default,
                'is_active' => (bool) $packaging->is_active,
            ])->values()->all(),
        ];
    }
}
