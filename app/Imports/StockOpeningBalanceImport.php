<?php

namespace App\Imports;

use App\Models\Product;
use App\Models\ProductVariation;
use App\Models\StockOpeningBalance;
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
    private array $productLookup = [];
    private array $variationLookup = [];

    public function __construct(
        private readonly string $businessId,
        private readonly StockOpeningBalanceService $openingBalances,
        private readonly string $warehouseId,
        private readonly string $date,
        private readonly ?string $notes = null,
        private readonly ?User $actor = null,
    ) {
    }

    public function collection(Collection $rows): void
    {
        $this->buildLookups();
        $items = [];

        foreach ($rows as $index => $row) {
            try {
                $items[] = $this->itemFromRow($row, $index);
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
            'warehouse_id' => $this->warehouseId,
            'date' => $this->date,
            'notes' => $this->notes,
            'items' => $items,
        ];

        $this->openingBalances->create($this->businessId, $payload, $this->actor);
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

    private function buildLookups(): void
    {
        $products = Product::withoutGlobalScopes()
            ->where('business_id', $this->businessId)
            ->where('track_inventory', true)
            ->get(['id', 'sku', 'name']);

        foreach ($products as $product) {
            $this->productLookup[$this->key($product->sku)] = $product->id;
            $this->productLookup[$this->key($product->name)] = $product->id;

            foreach ($product->variations as $variation) {
                $this->variationLookup[$this->key($variation->sku)] = [
                    'variation_id' => $variation->id,
                    'product_id' => $product->id,
                ];
                $this->variationLookup[$this->key($variation->name)] = [
                    'variation_id' => $variation->id,
                    'product_id' => $product->id,
                ];
            }
        }
    }

    private function itemFromRow(Collection|array $row, int $index): array
    {
        $productSku = $this->text($row, 'product_sku');
        $productName = $this->text($row, 'product_name');
        $variationSku = $this->text($row, 'variation_sku');
        $variationName = $this->text($row, 'variation_name');
        $quantity = $this->requiredDecimal($this->value($row, 'quantity'), 'quantity');
        $unitCost = $this->decimal($this->value($row, 'unit_cost'));

        [$productId, $variationId] = $this->resolveProduct($productSku, $productName, $variationSku, $variationName);

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

    private function resolveProduct(?string $sku, ?string $name, ?string $variationSku, ?string $variationName): array
    {
        $productId = null;
        $variationId = null;

        if ($variationSku !== null) {
            $match = $this->variationLookup[$this->key($variationSku)] ?? null;
            if ($match !== null) {
                return [$match['product_id'], $match['variation_id']];
            }
        }

        if ($variationName !== null) {
            $match = $this->variationLookup[$this->key($variationName)] ?? null;
            if ($match !== null) {
                return [$match['product_id'], $match['variation_id']];
            }
        }

        if ($sku !== null) {
            $productId = $this->productLookup[$this->key($sku)] ?? null;
        }

        if ($productId === null && $name !== null) {
            $productId = $this->productLookup[$this->key($name)] ?? null;
        }

        if ($productId === null) {
            $identifiers = array_filter([$sku ? "SKU: {$sku}" : null, $name ? "name: {$name}" : null]);
            throw new InvalidArgumentException('Product not found: '.implode(', ', $identifiers));
        }

        return [$productId, $variationId];
    }

    private function key(?string $value): string
    {
        return $value === null ? '' : Str::lower(trim($value));
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
}
