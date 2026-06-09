<?php

namespace App\Imports;

use App\Models\Business;
use App\Models\Product;
use App\Models\ProductVariation;
use App\Models\User;
use App\Models\Warehouse;
use App\Services\Inventory\StockOpeningBalanceService;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use InvalidArgumentException;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class StockOpeningBalanceImport implements ToCollection, WithHeadingRow, SkipsEmptyRows
{
    private int $imported = 0;
    private int $skipped = 0;
    private array $errors = [];

    public function __construct(
        private readonly Business $business,
        private readonly StockOpeningBalanceService $openingBalances,
        private readonly ?User $actor = null,
    ) {
    }

    public function collection(Collection $rows): void
    {
        $context = $this->buildContext();
        $items = [];
        $warehouseId = null;
        $date = null;
        $notes = null;

        foreach ($rows as $index => $row) {
            try {
                $warehouse = $this->resolve($this->text($row, 'warehouse'), $context['warehouses']);
                $rowDate = $this->text($row, 'date');
                $rowNotes = $this->text($row, 'notes');

                if ($warehouse === null) {
                    throw new InvalidArgumentException('Warehouse is required.');
                }

                if ($rowDate === null) {
                    throw new InvalidArgumentException('Date is required.');
                }

                if ($warehouseId === null) {
                    $warehouseId = $warehouse;
                    $date = $rowDate;
                    $notes = $rowNotes;
                } elseif ($warehouse !== $warehouseId || $rowDate !== $date) {
                    throw new InvalidArgumentException('All rows must use the same warehouse and date.');
                }

                $items[] = $this->itemFromRow($row, $context);
                $this->imported++;
            } catch (\Throwable $e) {
                $this->skipped++;
                $this->errors[] = 'Row '.($index + 2).': '.$e->getMessage();
            }
        }

        if ($items === []) {
            throw new InvalidArgumentException('No valid rows to import.');
        }

        $payload = [
            'warehouse_id' => $warehouseId,
            'date' => $date,
            'notes' => $notes,
            'items' => $items,
        ];

        $this->openingBalances->create((string) $this->business->id, $payload, $this->actor);
    }

    public function getImportedCount(): int
    {
        return $this->imported;
    }

    public function getSkippedCount(): int
    {
        return $this->skipped;
    }

    public function getErrors(): array
    {
        return $this->errors;
    }

    private function buildContext(): array
    {
        $businessId = (string) $this->business->id;

        $products = Product::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->where('track_inventory', true)
            ->get(['id', 'sku', 'name']);

        $productLookup = [];
        $variationLookup = [];

        foreach ($products as $product) {
            $productLookup[$this->normalizeKey($product->sku)] = (string) $product->id;
            $productLookup[$this->normalizeKey($product->name)] = (string) $product->id;

            foreach ($product->variations as $variation) {
                $variationLookup[$this->normalizeKey($variation->sku)] = [
                    'variation_id' => (string) $variation->id,
                    'product_id' => (string) $product->id,
                ];
                $variationLookup[$this->normalizeKey($variation->name)] = [
                    'variation_id' => (string) $variation->id,
                    'product_id' => (string) $product->id,
                ];
            }
        }

        return [
            'warehouses' => $this->lookup(
                Warehouse::withoutGlobalScopes()->where('business_id', $businessId)->whereNull('deleted_at')->get(),
                ['id', 'name', 'code']
            ),
            'products' => $productLookup,
            'variations' => $variationLookup,
        ];
    }

    private function itemFromRow(Collection|array $row, array $context): array
    {
        $productSku = $this->text($row, 'product_sku');
        $productName = $this->text($row, 'product_name');
        $variationSku = $this->text($row, 'variation_sku');
        $variationName = $this->text($row, 'variation_name');
        $quantity = $this->requiredDecimal($this->value($row, 'quantity'), 'quantity');
        $unitCost = $this->decimal($this->value($row, 'unit_cost'));

        [$productId, $variationId] = $this->resolveProduct($productSku, $productName, $variationSku, $variationName, $context);

        return [
            'product_id' => $productId,
            'variation_id' => $variationId,
            'quantity' => $quantity,
            'unit_cost' => $unitCost,
            'lot_number' => $this->text($row, 'lot_number'),
            'manufacture_date' => $this->text($row, 'manufacture_date'),
            'expiry_date' => $this->text($row, 'expiry_date'),
            'serial_number' => $this->text($row, 'serial_number'),
            'warranty_expires' => $this->text($row, 'warranty_expires'),
            'notes' => $this->text($row, 'notes'),
        ];
    }

    private function resolveProduct(?string $sku, ?string $name, ?string $variationSku, ?string $variationName, array $context): array
    {
        $productLookup = $context['products'];
        $variationLookup = $context['variations'];

        if ($variationSku !== null) {
            $match = $variationLookup[$this->normalizeKey($variationSku)] ?? null;

            if ($match !== null) {
                return [$match['product_id'], $match['variation_id']];
            }
        }

        if ($variationName !== null) {
            $match = $variationLookup[$this->normalizeKey($variationName)] ?? null;

            if ($match !== null) {
                return [$match['product_id'], $match['variation_id']];
            }
        }

        $productId = null;

        if ($sku !== null) {
            $productId = $productLookup[$this->normalizeKey($sku)] ?? null;
        }

        if ($productId === null && $name !== null) {
            $productId = $productLookup[$this->normalizeKey($name)] ?? null;
        }

        if ($productId === null) {
            $identifiers = array_filter([$sku ? "SKU: {$sku}" : null, $name ? "name: {$name}" : null]);
            throw new InvalidArgumentException('Product not found: '.implode(', ', $identifiers));
        }

        return [$productId, null];
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

    private function normalizeKey(string $value): string
    {
        return Str::lower(trim($value));
    }
}
