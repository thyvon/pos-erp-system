<?php

namespace App\Imports;

use App\Models\Brand;
use App\Models\Business;
use App\Models\Category;
use App\Models\CustomFieldDefinition;
use App\Models\PriceGroup;
use App\Models\Product;
use App\Models\ProductVariation;
use App\Models\RackLocation;
use App\Models\SubUnit;
use App\Models\TaxRate;
use App\Models\Unit;
use App\Models\User;
use App\Models\VariationTemplate;
use App\Models\VariationValue;
use App\Services\Catalog\ProductService;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use InvalidArgumentException;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class ProductImport implements ToCollection, WithHeadingRow, SkipsEmptyRows
{
    private int $imported = 0;
    private int $skipped = 0;

    public function __construct(
        private readonly Business $business,
        private readonly ProductService $productService,
        private readonly ?User $actor = null,
    ) {
    }

    public function collection(Collection $rows): void
    {
        $context = $this->buildContext();

        foreach ($rows as $row) {
            try {
                $payload = $this->payloadFromRow($row, $context);
                $product = $this->productService->create((string) $this->business->id, $payload, $this->actor);
                $this->addProductToContext($context, $product);
                $this->imported++;
            } catch (\Throwable) {
                $this->skipped++;
            }
        }
    }

    public function getImportedCount(): int
    {
        return $this->imported;
    }

    public function getSkippedCount(): int
    {
        return $this->skipped;
    }

    private function buildContext(): array
    {
        $businessId = (string) $this->business->id;
        $templates = VariationTemplate::withoutGlobalScopes()
            ->with('values:id,business_id,variation_template_id,name,sort_order')
            ->where('business_id', $businessId)
            ->whereNull('deleted_at')
            ->get();

        return [
            'units' => $this->lookup(
                Unit::withoutGlobalScopes()->where('business_id', $businessId)->whereNull('deleted_at')->get(),
                ['id', 'name', 'short_name']
            ),
            'categories' => $this->lookup(
                Category::withoutGlobalScopes()->where('business_id', $businessId)->whereNull('deleted_at')->get(),
                ['id', 'name', 'code', 'short_code']
            ),
            'brands' => $this->lookup(
                Brand::withoutGlobalScopes()->where('business_id', $businessId)->whereNull('deleted_at')->get(),
                ['id', 'name']
            ),
            'tax_rates' => $this->lookup(
                TaxRate::withoutGlobalScopes()->where('business_id', $businessId)->whereNull('deleted_at')->get(),
                ['id', 'name']
            ),
            'price_groups' => $this->lookup(
                PriceGroup::withoutGlobalScopes()->where('business_id', $businessId)->whereNull('deleted_at')->get(),
                ['id', 'name']
            ),
            'rack_locations' => $this->lookup(
                RackLocation::withoutGlobalScopes()->where('business_id', $businessId)->whereNull('deleted_at')->get(),
                ['id', 'name', 'code']
            ),
            'sub_units' => $this->lookup(
                SubUnit::withoutGlobalScopes()->where('business_id', $businessId)->whereNull('deleted_at')->get(),
                ['id', 'name', 'short_name']
            ),
            'variation_templates' => $this->lookup($templates, ['id', 'name']),
            'variation_values' => $templates
                ->flatMap(fn (VariationTemplate $template) => $template->values)
                ->groupBy(fn (VariationValue $value) => (string) $value->variation_template_id)
                ->map(fn (Collection $values) => $this->lookup($values, ['id', 'name']))
                ->all(),
            'products' => $this->lookup(
                Product::withoutGlobalScopes()->where('business_id', $businessId)->whereNull('deleted_at')->get(),
                ['id', 'sku', 'name']
            ),
            'variations' => $this->lookup(
                ProductVariation::withoutGlobalScopes()->where('business_id', $businessId)->whereNull('deleted_at')->get(),
                ['id', 'sku', 'name']
            ),
            'custom_fields' => CustomFieldDefinition::query()
                ->where('business_id', $businessId)
                ->where('module', 'product')
                ->get()
                ->keyBy('field_name'),
        ];
    }

    private function payloadFromRow(Collection|array $row, array $context): array
    {
        $name = $this->text($row, 'name');

        if ($name === null) {
            throw new InvalidArgumentException('Product name is required.');
        }

        $type = $this->enum($this->text($row, 'type') ?? 'single', ['single', 'variable', 'service', 'combo'], 'type');
        $trackInventory = $this->boolean($this->value($row, 'track_inventory'), true);

        $payload = [
            'name' => $name,
            'type' => $type,
            'sku' => $this->text($row, 'sku'),
            'barcode_type' => $this->enum($this->text($row, 'barcode_type') ?? 'C128', ['C128', 'EAN13', 'QR'], 'barcode_type', true),
            'category_id' => $this->resolve($this->text($row, 'category'), $context['categories']),
            'brand_id' => $this->resolve($this->text($row, 'brand'), $context['brands']),
            'unit_id' => $this->resolve($this->text($row, 'unit'), $context['units']),
            'sub_unit_id' => $this->resolve($this->text($row, 'sub_unit'), $context['sub_units']),
            'tax_rate_id' => $this->resolve($this->text($row, 'tax_rate'), $context['tax_rates']),
            'rack_location_id' => $this->resolve($this->text($row, 'rack_location'), $context['rack_locations']),
            'price_group_id' => $this->resolve($this->text($row, 'price_group'), $context['price_groups']),
            'description' => $this->text($row, 'description'),
            'stock_tracking' => $this->enum($this->text($row, 'stock_tracking') ?? 'none', ['none', 'lot', 'serial'], 'stock_tracking'),
            'has_expiry' => $this->boolean($this->value($row, 'has_expiry'), false),
            'tax_type' => $this->enum($this->text($row, 'tax_type') ?? 'exclusive', ['inclusive', 'exclusive'], 'tax_type'),
            'track_inventory' => $trackInventory,
            'alert_quantity' => $this->decimal($this->value($row, 'alert_quantity')),
            'max_stock_level' => $this->decimal($this->value($row, 'max_stock_level')),
            'sub_unit_selling_price' => $this->decimal($this->value($row, 'sub_unit_selling_price')),
            'sub_unit_purchase_price' => $this->decimal($this->value($row, 'sub_unit_purchase_price')),
            'minimum_selling_price' => $this->decimal($this->value($row, 'minimum_selling_price')),
            'profit_margin' => $this->decimal($this->value($row, 'profit_margin')),
            'is_for_selling' => $this->boolean($this->value($row, 'is_for_selling'), true),
            'is_active' => $this->boolean($this->value($row, 'is_active'), true),
            'weight' => $this->decimal($this->value($row, 'weight')),
            'custom_fields' => $this->customFields($row, $context['custom_fields']),
        ];

        if ($type !== 'variable') {
            $payload['selling_price'] = $this->requiredDecimal($this->value($row, 'selling_price'), 'selling_price');
            $payload['purchase_price'] = $this->requiredDecimal($this->value($row, 'purchase_price'), 'purchase_price');
        }

        if ($type !== 'service' && $payload['unit_id'] === null) {
            throw new InvalidArgumentException('Unit is required for this product type.');
        }

        if (in_array($type, ['service', 'combo'], true) || $trackInventory === false) {
            $payload['stock_tracking'] = 'none';
            $payload['track_inventory'] = false;
        }

        if ($type === 'variable') {
            $templateIds = $this->templateIds($row, $context['variation_templates']);
            $payload['variation_template_id'] = $templateIds[0] ?? null;
            $payload['variation_template_ids'] = $templateIds;
            $payload['variations'] = $this->variations($row, $templateIds, $context);
        }

        if ($type === 'combo') {
            $payload['combo_items'] = $this->comboItems($row, $context);
        }

        return $payload;
    }

    private function lookup(Collection $items, array $keys): array
    {
        $lookup = [];

        foreach ($items as $item) {
            foreach ($keys as $key) {
                $value = $item->{$key} ?? null;
                if ($value === null || $value === '') {
                    continue;
                }
                $lookup[$this->normalizeKey((string) $value)] = (string) $item->id;
            }
        }

        return $lookup;
    }

    private function addProductToContext(array &$context, Product $product): void
    {
        foreach (['id', 'sku', 'name'] as $key) {
            $value = $product->{$key} ?? null;

            if ($value !== null && $value !== '') {
                $context['products'][$this->normalizeKey((string) $value)] = (string) $product->id;
            }
        }

        foreach ($product->variations as $variation) {
            foreach (['id', 'sku', 'name'] as $key) {
                $value = $variation->{$key} ?? null;

                if ($value !== null && $value !== '') {
                    $context['variations'][$this->normalizeKey((string) $value)] = (string) $variation->id;
                }
            }
        }
    }

    private function resolve(?string $value, array $lookup, bool $required = false): ?string
    {
        if ($value === null) {
            if ($required) {
                throw new InvalidArgumentException('Lookup value is required.');
            }

            return null;
        }

        $id = $lookup[$this->normalizeKey($value)] ?? null;

        if ($id === null) {
            throw new InvalidArgumentException("Lookup value [{$value}] was not found.");
        }

        return $id;
    }

    private function templateIds(Collection|array $row, array $templateLookup): array
    {
        $raw = $this->value($row, 'variation_templates') ?? $this->value($row, 'variation_template_ids');
        $values = $this->listValues($raw);

        if ($values === []) {
            throw new InvalidArgumentException('Variable products require variation templates.');
        }

        return collect($values)
            ->map(fn (string $value) => $this->resolve($value, $templateLookup, true))
            ->unique()
            ->values()
            ->all();
    }

    private function variations(Collection|array $row, array $templateIds, array $context): array
    {
        $items = $this->structuredList($this->value($row, 'variations'));

        if ($templateIds === [] || $items === []) {
            throw new InvalidArgumentException('Variable products require at least one variation.');
        }

        return collect($items)->map(function (array $item) use ($templateIds, $context): array {
            $rawValues = $item['variation_value_ids']
                ?? $item['variation_values']
                ?? $item['values']
                ?? null;
            $valueIds = $this->variationValueIds($rawValues, $templateIds, $context['variation_values']);

            return [
                'name' => $this->textFrom($item['name'] ?? null) ?? implode('-', $this->variationValueLabels($rawValues)),
                'variation_value_ids' => $valueIds,
                'sku' => $this->textFrom($item['sku'] ?? null),
                'sub_unit_id' => $this->resolve($this->textFrom($item['sub_unit'] ?? $item['sub_unit_id'] ?? null), $context['sub_units']),
                'selling_price' => $this->requiredDecimal($item['selling_price'] ?? null, 'variation selling_price'),
                'purchase_price' => $this->requiredDecimal($item['purchase_price'] ?? null, 'variation purchase_price'),
                'sub_unit_selling_price' => $this->decimal($item['sub_unit_selling_price'] ?? null),
                'sub_unit_purchase_price' => $this->decimal($item['sub_unit_purchase_price'] ?? null),
                'minimum_selling_price' => $this->decimal($item['minimum_selling_price'] ?? null),
                'profit_margin' => $this->decimal($item['profit_margin'] ?? null),
                'is_active' => $this->boolean($item['is_active'] ?? null, true),
            ];
        })->all();
    }

    private function variationValueIds(mixed $rawValues, array $templateIds, array $valuesByTemplate): array
    {
        if ($rawValues === null || $rawValues === '') {
            throw new InvalidArgumentException('Variation values are required.');
        }

        $values = is_array($rawValues) ? $rawValues : $this->listValues($rawValues);

        if (array_is_list($values)) {
            if (count($values) !== count($templateIds)) {
                throw new InvalidArgumentException('Each variation must contain one value for each template.');
            }

            return collect($templateIds)
                ->map(fn (string $templateId, int $index) => $this->resolve((string) $values[$index], $valuesByTemplate[$templateId] ?? [], true))
                ->all();
        }

        return collect($templateIds)
            ->map(function (string $templateId) use ($values, $valuesByTemplate): string {
                $templateValue = $values[$templateId] ?? null;

                if ($templateValue === null) {
                    throw new InvalidArgumentException('Variation value map is missing a selected template value.');
                }

                return $this->resolve((string) $templateValue, $valuesByTemplate[$templateId] ?? [], true);
            })
            ->all();
    }

    private function variationValueLabels(mixed $rawValues): array
    {
        if (is_array($rawValues)) {
            return array_is_list($rawValues) ? array_map('strval', $rawValues) : array_map('strval', array_values($rawValues));
        }

        return $this->listValues($rawValues);
    }

    private function comboItems(Collection|array $row, array $context): array
    {
        $items = $this->structuredList($this->value($row, 'combo_items'));

        if ($items === []) {
            throw new InvalidArgumentException('Combo products require at least one combo item.');
        }

        return collect($items)->map(function (array $item) use ($context): array {
            $productValue = $this->textFrom($item['child_product'] ?? $item['child_product_id'] ?? $item['product'] ?? null);
            $variationValue = $this->textFrom($item['child_variation'] ?? $item['child_variation_id'] ?? $item['variation'] ?? null);

            return [
                'child_product_id' => $this->resolve($productValue, $context['products'], true),
                'child_variation_id' => $this->resolve($variationValue, $context['variations']),
                'quantity' => $this->requiredDecimal($item['quantity'] ?? null, 'combo quantity'),
            ];
        })->all();
    }

    private function customFields(Collection|array $row, Collection $definitions): array
    {
        $customFields = $this->associativeValue($this->value($row, 'custom_fields'));

        foreach ($definitions as $definition) {
            $columnKey = 'custom_field_'.$definition->field_name;
            $raw = $this->value($row, $columnKey);

            if ($raw === null || $raw === '') {
                continue;
            }

            $customFields[$definition->field_name] = match ($definition->field_type) {
                'checkbox' => $this->boolean($raw, false),
                'number' => $this->decimal($raw),
                default => $this->textFrom($raw),
            };
        }

        return $customFields;
    }

    private function structuredList(mixed $value): array
    {
        $decoded = $this->decodeJson($value);

        if (is_array($decoded) && array_is_list($decoded)) {
            return array_values(array_filter($decoded, 'is_array'));
        }

        return [];
    }

    private function associativeValue(mixed $value): array
    {
        $decoded = $this->decodeJson($value);

        if (is_array($decoded) && ! array_is_list($decoded)) {
            return $decoded;
        }

        $values = [];

        foreach ($this->listValues($value, ';') as $item) {
            [$key, $itemValue] = array_pad(explode('=', $item, 2), 2, null);
            $key = trim((string) $key);

            if ($key !== '' && $itemValue !== null) {
                $values[$key] = trim($itemValue);
            }
        }

        return $values;
    }

    private function listValues(mixed $value, string $separatorPattern = null): array
    {
        if (is_array($value)) {
            return collect($value)
                ->map(fn ($item) => $this->textFrom($item))
                ->filter()
                ->values()
                ->all();
        }

        $text = $this->textFrom($value);

        if ($text === null) {
            return [];
        }

        $pattern = $separatorPattern ?? '/[|,;]/';
        $parts = $separatorPattern === null ? preg_split($pattern, $text) : explode($separatorPattern, $text);

        return collect($parts ?: [])
            ->map(fn ($item) => trim((string) $item))
            ->filter(fn ($item) => $item !== '')
            ->values()
            ->all();
    }

    private function decodeJson(mixed $value): mixed
    {
        $text = $this->textFrom($value);

        if ($text === null || ! Str::startsWith($text, ['[', '{'])) {
            return null;
        }

        $decoded = json_decode($text, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new InvalidArgumentException('Invalid JSON value.');
        }

        return $decoded;
    }

    private function enum(?string $value, array $allowed, string $field, bool $preserveCase = false): string
    {
        $normalized = $preserveCase ? Str::upper(trim((string) $value)) : Str::lower(trim((string) $value));

        if (! in_array($normalized, $allowed, true)) {
            throw new InvalidArgumentException("Invalid {$field} value.");
        }

        return $normalized;
    }

    private function boolean(mixed $value, bool $default): bool
    {
        $text = $this->textFrom($value);

        if ($text === null) {
            return $default;
        }

        return match (Str::lower($text)) {
            '1', 'true', 'yes', 'y', 'active', 'enabled', 'on' => true,
            '0', 'false', 'no', 'n', 'inactive', 'disabled', 'off' => false,
            default => $default,
        };
    }

    private function requiredDecimal(mixed $value, string $field): float
    {
        $decimal = $this->decimal($value);

        if ($decimal === null) {
            throw new InvalidArgumentException("{$field} is required.");
        }

        return $decimal;
    }

    private function decimal(mixed $value): ?float
    {
        $text = $this->textFrom($value);

        if ($text === null) {
            return null;
        }

        $number = str_replace(',', '', $text);

        if (! is_numeric($number)) {
            throw new InvalidArgumentException('Invalid numeric value.');
        }

        return (float) $number;
    }

    private function text(Collection|array $row, string $key): ?string
    {
        return $this->textFrom($this->value($row, $key));
    }

    private function value(Collection|array $row, string $key): mixed
    {
        return $row instanceof Collection ? $row->get($key) : ($row[$key] ?? null);
    }

    private function textFrom(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $text = trim((string) $value);

        return $text === '' ? null : $text;
    }

    private function normalizeKey(string $value): string
    {
        return Str::lower(trim($value));
    }
}
